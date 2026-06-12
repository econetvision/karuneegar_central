import os
import re
import uuid
from datetime import datetime, timedelta, timezone

_USERNAME_RE = re.compile(r'^[a-z0-9_]{3,30}$')


def _normalize_mobile(raw: str) -> str:
    """Strip spaces, dashes, and dots but keep the leading + and digits."""
    return re.sub(r'[\s\-\.]', '', raw.strip())

def _now():
    return datetime.now(timezone.utc)
from flask import Flask, request, jsonify, send_from_directory
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
from models import db, User, Profile, FamilyMember, ForumCategory, ForumThread, ForumReply, MatrimonyProfile, OtpRequest, BusinessProfile, Scholarship
from sms import generate_otp, send_otp_sms
from email_otp import send_otp_email

limiter = Limiter(key_func=get_remote_address, default_limits=[])

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def _register_cors(app):
    """Manual CORS — works on all responses including 500s, no third-party dependency quirks."""
    # Hard-coded production origins that are ALWAYS allowed regardless of env var.
    _ALWAYS_ALLOWED = {
        'http://localhost:5173',
        'http://localhost:3000',
        'https://karuneegar-central.vercel.app',
    }
    # Merge env var additions (if any) with the always-allowed set.
    extra = os.environ.get('ALLOWED_ORIGINS', '')
    allowed_set = _ALWAYS_ALLOWED | {o.strip().rstrip('/') for o in extra.split(',') if o.strip()}

    def _apply_cors(response):
        origin = request.headers.get('Origin', '').rstrip('/')
        if origin in allowed_set:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers.add('Vary', 'Origin')
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = '600'
        return response

    @app.after_request
    def _add_cors_headers(response):
        return _apply_cors(response)

    @app.route('/api/<path:path>', methods=['OPTIONS'])
    def _preflight(path):           # noqa: F811
        resp = app.make_response(('', 204))
        return _apply_cors(resp)

    @app.errorhandler(Exception)
    def _handle_unhandled(e):
        """Catch-all: convert unhandled exceptions to JSON + CORS.
        after_request does NOT run when an exception escapes, so we do it here."""
        from werkzeug.exceptions import HTTPException
        if isinstance(e, HTTPException):
            return _apply_cors(e.get_response())
        import traceback
        app.logger.error(traceback.format_exc())
        response = jsonify({'error': 'Internal server error'})
        response.status_code = 500
        return _apply_cors(response)


def create_app():
    app = Flask(__name__)
    secret_key = os.environ.get('SECRET_KEY')
    jwt_secret  = os.environ.get('JWT_SECRET_KEY')
    if not secret_key or not jwt_secret:
        raise RuntimeError(
            'SECRET_KEY and JWT_SECRET_KEY environment variables must be set. '
            'Generate them with: python -c "import secrets; print(secrets.token_hex(32))"'
        )
    app.config['SECRET_KEY'] = secret_key
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///karuneegar.db')
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,   # reconnect silently after Neon idle-suspend
        'pool_recycle': 280,     # recycle before Neon's 300 s idle timeout
    }
    app.config['JWT_SECRET_KEY'] = jwt_secret
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5 MB

    db.init_app(app)
    JWTManager(app)
    _register_cors(app)
    limiter.init_app(app)

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    with app.app_context():
        try:
            db.create_all()
            _seed_forum_categories()
            _migrate_scholarship_columns()
            _migrate_member_id()
        except Exception as e:
            app.logger.warning("DB init skipped: %s", e)

    return app


def _seed_forum_categories():
    if ForumCategory.query.count() == 0:
        categories = [
            ForumCategory(name='Business & Trade', description='Discuss business ideas, trade, and entrepreneurship within the community.', icon='briefcase'),
            ForumCategory(name='Jobs & Careers', description='Job postings, career advice, and professional networking.', icon='person-badge'),
            ForumCategory(name='Real Estate', description='Buy, sell, or rent properties with community members.', icon='house'),
            ForumCategory(name='Education', description='Scholarships, colleges, and educational guidance.', icon='book'),
            ForumCategory(name='General Discussion', description='Community events, news, and general conversations.', icon='chat-dots'),
        ]
        db.session.add_all(categories)
        db.session.commit()


def _migrate_member_id():
    """Add member_id column and backfill all existing users idempotently."""
    from sqlalchemy import text
    with db.engine.connect() as conn:
        # Add column if missing
        try:
            conn.execute(text('ALTER TABLE "user" ADD COLUMN member_id VARCHAR(20)'))
            conn.commit()
        except Exception:
            conn.rollback()
        # Backfill users that have no member_id yet
        try:
            rows = conn.execute(text('SELECT id FROM "user" WHERE member_id IS NULL ORDER BY id')).fetchall()
            for (uid,) in rows:
                mid = f'KAR-{uid:05d}'
                conn.execute(text('UPDATE "user" SET member_id = :mid WHERE id = :uid'), {'mid': mid, 'uid': uid})
            conn.commit()
        except Exception as exc:
            conn.rollback()
            import logging
            logging.getLogger(__name__).warning('member_id backfill failed: %s', exc)


def _migrate_scholarship_columns():
    """Idempotently add new columns to the scholarship table."""
    from sqlalchemy import text
    new_cols = [
        ('applicant_name', 'VARCHAR(200)'),
        ('parent_name', 'VARCHAR(200)'),
        ('parent_occupation', 'VARCHAR(200)'),
        ('parent_income', 'VARCHAR(100)'),
        ('id_proof_filename', 'VARCHAR(200)'),
        ('certificate_filename', 'VARCHAR(200)'),
        ('admission_letter_filename', 'VARCHAR(200)'),
        ('trust_name', 'VARCHAR(200)'),
        ('member_id', 'VARCHAR(100)'),
    ]
    with db.engine.connect() as conn:
        for col, dtype in new_cols:
            try:
                conn.execute(text(f'ALTER TABLE scholarship ADD COLUMN {col} {dtype}'))
                conn.commit()
            except Exception:
                conn.rollback()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


app = create_app()


# ─── Auth ────────────────────────────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
@limiter.limit("10 per 10 minutes")
def register():
    data = request.get_json()
    username = (data.get('username') or '').strip().lower()
    email    = (data.get('email')    or '').strip().lower()
    password = (data.get('password') or '')
    mobile   = _normalize_mobile(data.get('mobile') or '')
    otp_code = (data.get('otp_code') or '').strip()

    if not username or not email or not password or not mobile or not otp_code:
        return jsonify({'error': 'All fields including mobile OTP are required'}), 400
    if not _USERNAME_RE.match(username):
        return jsonify({'error': 'Username must be 3–30 characters: lowercase letters, numbers, and underscore only'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if not mobile.startswith('+') or len(mobile) < 10:
        return jsonify({'error': 'Invalid mobile number'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409
    if User.query.filter_by(mobile=mobile).first():
        return jsonify({'error': 'This mobile number already has an account'}), 409

    otp_req = (OtpRequest.query
               .filter_by(mobile=mobile, code=otp_code, used=False)
               .filter(OtpRequest.expires_at >= _now())
               .order_by(OtpRequest.created_at.desc())
               .first())
    if not otp_req:
        return jsonify({'error': 'Invalid or expired OTP. Please request a new one.'}), 400

    otp_req.used = True
    mobile_public = bool(data.get('mobile_public', False))
    user = User(username=username, email=email, mobile=mobile, mobile_verified=True, mobile_public=mobile_public)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()  # populates user.id

    user.member_id = f'KAR-{user.id:05d}'
    profile = Profile(user_id=user.id, full_name=data.get('full_name', ''))
    db.session.add(profile)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict(full=True)}), 201


@app.route('/api/auth/send-otp', methods=['POST'])
@limiter.limit("5 per 5 minutes")
def send_otp_route():
    data   = request.get_json()
    mobile = _normalize_mobile(data.get('mobile') or '')

    if not mobile:
        return jsonify({'error': 'Mobile number is required'}), 400
    if not mobile.startswith('+') or len(mobile) < 10:
        return jsonify({'error': 'Enter number with country code, e.g. +919876543210'}), 400
    if User.query.filter_by(mobile=mobile).first():
        return jsonify({'error': 'This mobile number already has an account. Please login instead.'}), 409

    is_indian = mobile.startswith('+91')

    # International numbers require email delivery
    if not is_indian:
        email = (data.get('email') or '').strip().lower()
        if not email:
            return jsonify({'error': 'Email is required for international numbers'}), 400

    cutoff = _now() - timedelta(minutes=10)
    recent = OtpRequest.query.filter(
        OtpRequest.mobile == mobile,
        OtpRequest.created_at >= cutoff
    ).count()
    if recent >= 3:
        return jsonify({'error': 'Too many requests. Please wait 10 minutes.'}), 429

    otp     = generate_otp()
    expires = _now() + timedelta(minutes=10)
    req     = OtpRequest(mobile=mobile, code=otp, expires_at=expires)
    db.session.add(req)
    db.session.commit()

    if is_indian:
        ok = send_otp_sms(mobile, otp)
        channel = 'mobile number'
    else:
        ok = send_otp_email(email, otp)
        channel = f'email {email}'

    if not ok:
        db.session.delete(req)
        db.session.commit()
        return jsonify({'error': f'Failed to send OTP to {channel}. Please try again.'}), 500

    resp = {'message': f'OTP sent to your {channel}', 'via': 'sms' if is_indian else 'email'}
    return jsonify(resp)


@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    data = request.get_json()
    identifier = (data.get('email') or data.get('username') or '').strip()
    password = data.get('password') or ''

    user = User.query.filter(
        (User.email == identifier.lower()) | (User.username == identifier)
    ).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict(full=True)})


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict(full=True)})


# ─── Upload ───────────────────────────────────────────────────────────────────

def _upload_to_cloudinary(buf) -> str:
    """Upload image bytes to Cloudinary; returns secure_url. Raises on failure."""
    import cloudinary
    import cloudinary.uploader
    # cloudinary auto-reads CLOUDINARY_URL env var — no manual config needed
    result = cloudinary.uploader.upload(
        buf,
        folder='karuneegar',
        resource_type='image',
        format='jpg',
    )
    return result['secure_url']


@app.route('/api/upload', methods=['POST'])
@jwt_required()
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    try:
        import io
        from PIL import Image
        img = Image.open(file.stream).convert('RGB')
        img.thumbnail((900, 1200), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, 'JPEG', quality=85, optimize=True)
        buf.seek(0)
    except Exception:
        return jsonify({'error': 'Invalid or unreadable image file'}), 400

    if os.environ.get('CLOUDINARY_URL'):
        try:
            url = _upload_to_cloudinary(buf)
            return jsonify({'filename': url}), 201
        except Exception as exc:
            app.logger.error('Cloudinary upload error: %s', exc)
            return jsonify({'error': 'Image upload failed'}), 500

    # Local fallback (development / no Cloudinary configured)
    filename = f"{uuid.uuid4().hex}.jpg"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    with open(filepath, 'wb') as f:
        f.write(buf.read())
    return jsonify({'filename': filename}), 201


@app.route('/api/uploads/<filename>')
def serve_upload(filename):
    # Cloudinary uploads are served directly via CDN — this route only handles
    # locally stored files (development or pre-Cloudinary uploads).
    response = send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    response.headers['Cache-Control'] = 'private, no-transform, max-age=3600'
    response.headers['Content-Disposition'] = 'inline'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response


# ─── Profiles ─────────────────────────────────────────────────────────────────

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_own_profile():
    user = User.query.get(int(get_jwt_identity()))
    profile = user.profile or Profile(user_id=user.id)
    return jsonify({'user': user.to_dict(full=True), 'profile': profile.to_dict()})


@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user = User.query.get(int(get_jwt_identity()))
    data = request.get_json()

    if not user.profile:
        user.profile = Profile(user_id=user.id)
        db.session.add(user.profile)

    fields = ['full_name', 'bio', 'phone', 'location', 'occupation', 'dob',
              'native_place', 'gothram', 'photo_filename', 'linkedin', 'website',
              'is_public', 'achievements', 'is_prominent']
    for f in fields:
        if f in data:
            setattr(user.profile, f, data[f])

    if 'mobile_public' in data:
        user.mobile_public = bool(data['mobile_public'])

    db.session.commit()
    return jsonify({'user': user.to_dict(full=True), 'profile': user.profile.to_dict()})


@app.route('/api/profile/mobile-visibility', methods=['PATCH'])
@jwt_required()
def update_mobile_visibility():
    user = User.query.get(int(get_jwt_identity()))
    data = request.get_json()
    user.mobile_public = bool(data.get('mobile_public', False))
    db.session.commit()
    return jsonify({'mobile_public': user.mobile_public})


@app.route('/api/users/<username>', methods=['GET'])
def get_user_profile(username):
    user = User.query.filter_by(username=username).first_or_404()
    profile = user.profile
    # Respect privacy: only serve full profile if the user made it public
    if profile and profile.is_public is False:
        return jsonify({'user': user.to_dict(), 'profile': {'is_public': False}})
    return jsonify({'user': user.to_dict(), 'profile': profile.to_dict() if profile else {}})


@app.route('/api/members', methods=['GET'])
def get_members():
    page      = request.args.get('page', 1, type=int)
    search    = request.args.get('q', '')
    prominent = request.args.get('prominent', '0') == '1'

    query = User.query.join(Profile).filter(Profile.is_public == True)  # noqa: E712
    if prominent:
        query = query.filter(Profile.is_prominent == True)  # noqa: E712
    if search:
        query = query.filter(
            Profile.full_name.ilike(f'%{search}%') |
            User.username.ilike(f'%{search}%') |
            Profile.native_place.ilike(f'%{search}%') |
            Profile.occupation.ilike(f'%{search}%')
        )
    pagination = query.paginate(page=page, per_page=20, error_out=False)
    members = [{**u.to_dict(), 'profile': u.profile.to_dict()} for u in pagination.items]
    return jsonify({'members': members, 'total': pagination.total, 'pages': pagination.pages, 'page': page})


# ─── Family Tree ──────────────────────────────────────────────────────────────

@app.route('/api/family-tree', methods=['GET'])
@jwt_required()
def get_family_tree():
    user_id = int(get_jwt_identity())
    members = FamilyMember.query.filter_by(user_id=user_id).all()
    return jsonify({'members': [m.to_dict() for m in members]})


@app.route('/api/family-tree', methods=['POST'])
@jwt_required()
def add_family_member():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400

    member = FamilyMember(
        user_id=user_id,
        name=data['name'],
        relation=data.get('relation'),
        gender=data.get('gender'),
        birth_year=data.get('birth_year'),
        death_year=data.get('death_year'),
        notes=data.get('notes'),
        parent_id=data.get('parent_id'),
    )
    db.session.add(member)
    db.session.commit()
    return jsonify({'member': member.to_dict()}), 201


@app.route('/api/family-tree/<int:member_id>', methods=['PUT'])
@jwt_required()
def update_family_member(member_id):
    user_id = int(get_jwt_identity())
    member = FamilyMember.query.filter_by(id=member_id, user_id=user_id).first_or_404()
    data = request.get_json()

    for f in ['name', 'relation', 'gender', 'birth_year', 'death_year', 'notes', 'parent_id']:
        if f in data:
            setattr(member, f, data[f])

    db.session.commit()
    return jsonify({'member': member.to_dict()})


@app.route('/api/family-tree/<int:member_id>', methods=['DELETE'])
@jwt_required()
def delete_family_member(member_id):
    user_id = int(get_jwt_identity())
    member = FamilyMember.query.filter_by(id=member_id, user_id=user_id).first_or_404()
    db.session.delete(member)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


# ─── Forums ───────────────────────────────────────────────────────────────────

@app.route('/api/forums/categories', methods=['GET'])
def get_forum_categories():
    categories = ForumCategory.query.all()
    return jsonify({'categories': [c.to_dict() for c in categories]})


@app.route('/api/forums/categories/<int:cat_id>/threads', methods=['GET'])
def get_threads(cat_id):
    cat = ForumCategory.query.get_or_404(cat_id)
    page = request.args.get('page', 1, type=int)
    pagination = ForumThread.query.filter_by(category_id=cat_id)\
        .order_by(ForumThread.created_at.desc())\
        .paginate(page=page, per_page=20, error_out=False)
    return jsonify({
        'category': cat.to_dict(),
        'threads': [t.to_dict() for t in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
    })


@app.route('/api/forums/categories/<int:cat_id>/threads', methods=['POST'])
@jwt_required()
def create_thread(cat_id):
    ForumCategory.query.get_or_404(cat_id)
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data.get('title') or not data.get('body'):
        return jsonify({'error': 'Title and body are required'}), 400

    thread = ForumThread(
        category_id=cat_id,
        user_id=user_id,
        title=data['title'],
        body=data['body'],
    )
    db.session.add(thread)
    db.session.commit()
    return jsonify({'thread': thread.to_dict()}), 201


@app.route('/api/forums/threads/<int:thread_id>', methods=['GET'])
def get_thread(thread_id):
    thread = ForumThread.query.get_or_404(thread_id)
    thread.views += 1
    db.session.commit()
    return jsonify({'thread': thread.to_dict(include_replies=True)})


@app.route('/api/forums/threads/<int:thread_id>/replies', methods=['POST'])
@jwt_required()
def post_reply(thread_id):
    ForumThread.query.get_or_404(thread_id)
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data.get('body'):
        return jsonify({'error': 'Reply body is required'}), 400

    reply = ForumReply(thread_id=thread_id, user_id=user_id, body=data['body'])
    db.session.add(reply)
    db.session.commit()
    return jsonify({'reply': reply.to_dict()}), 201


@app.route('/api/forums/threads/<int:thread_id>', methods=['DELETE'])
@jwt_required()
def delete_thread(thread_id):
    user_id = int(get_jwt_identity())
    thread = ForumThread.query.get_or_404(thread_id)
    user = User.query.get(user_id)
    if thread.user_id != user_id and not user.is_admin:
        return jsonify({'error': 'Forbidden'}), 403
    db.session.delete(thread)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


# ─── Matrimony ────────────────────────────────────────────────────────────────

@app.route('/api/matrimony', methods=['GET'])
def get_matrimony_profiles():
    page = request.args.get('page', 1, type=int)
    gender = request.args.get('gender')
    native = request.args.get('native_place')
    gothram = request.args.get('gothram')

    query = MatrimonyProfile.query.filter_by(active=True)
    if gender:
        query = query.filter_by(gender=gender)
    if native:
        query = query.filter(MatrimonyProfile.native_place.ilike(f'%{native}%'))
    if gothram:
        query = query.filter(MatrimonyProfile.gothram.ilike(f'%{gothram}%'))

    pagination = query.order_by(MatrimonyProfile.created_at.desc())\
        .paginate(page=page, per_page=12, error_out=False)

    return jsonify({
        'profiles': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
    })


@app.route('/api/matrimony', methods=['POST'])
@jwt_required()
def create_matrimony_profile():
    user_id = int(get_jwt_identity())

    if MatrimonyProfile.query.filter_by(user_id=user_id).first():
        return jsonify({'error': 'You already have a matrimony profile. Please edit it instead.'}), 409

    data = request.get_json()
    if not data.get('full_name') or not data.get('gender'):
        return jsonify({'error': 'Full name and gender are required'}), 400

    profile = MatrimonyProfile(user_id=user_id, **{
        k: data.get(k) for k in [
            'full_name', 'gender', 'seeking', 'age', 'height',
            'education', 'occupation', 'salary_range', 'gothram',
            'native_place', 'star', 'raasi', 'about',
            'photo_filename', 'contact_email', 'contact_phone', 'phone_public',
        ]
    })
    db.session.add(profile)
    db.session.commit()
    return jsonify({'profile': profile.to_dict(full=True)}), 201


@app.route('/api/matrimony/<int:profile_id>', methods=['GET'])
@jwt_required(optional=True)
def get_matrimony_profile(profile_id):
    profile = MatrimonyProfile.query.get_or_404(profile_id)
    logged_in = get_jwt_identity() is not None
    return jsonify({'profile': profile.to_dict(show_contact=logged_in)})


@app.route('/api/matrimony/<int:profile_id>', methods=['PUT'])
@jwt_required()
def update_matrimony_profile(profile_id):
    user_id = int(get_jwt_identity())
    profile = MatrimonyProfile.query.filter_by(id=profile_id, user_id=user_id).first_or_404()
    data = request.get_json()

    for f in ['full_name', 'gender', 'seeking', 'age', 'height', 'education',
              'occupation', 'salary_range', 'gothram', 'native_place', 'star',
              'raasi', 'about', 'photo_filename', 'contact_email', 'contact_phone',
              'active']:
        if f in data:
            setattr(profile, f, data[f])
    if 'phone_public' in data:
        profile.phone_public = bool(data['phone_public'])

    db.session.commit()
    return jsonify({'profile': profile.to_dict(full=True)})


@app.route('/api/matrimony/<int:profile_id>', methods=['DELETE'])
@jwt_required()
def delete_matrimony_profile(profile_id):
    user_id = int(get_jwt_identity())
    profile = MatrimonyProfile.query.filter_by(id=profile_id, user_id=user_id).first_or_404()
    db.session.delete(profile)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


@app.route('/api/matrimony/mine', methods=['GET'])
@jwt_required()
def get_my_matrimony():
    user_id = int(get_jwt_identity())
    profile = MatrimonyProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify({'profile': None})
    return jsonify({'profile': profile.to_dict(full=True)})


# ─── Business Profiles ────────────────────────────────────────────────────────

@app.route('/api/business', methods=['GET'])
def list_businesses():
    page     = request.args.get('page', 1, type=int)
    search   = request.args.get('q', '')
    category = request.args.get('category', '')

    query = BusinessProfile.query.filter_by(active=True)
    if search:
        query = query.filter(
            BusinessProfile.company_name.ilike(f'%{search}%') |
            BusinessProfile.description.ilike(f'%{search}%') |
            BusinessProfile.city.ilike(f'%{search}%')
        )
    if category:
        query = query.filter_by(category=category)

    pagination = query.order_by(BusinessProfile.created_at.desc()) \
                      .paginate(page=page, per_page=12, error_out=False)
    return jsonify({
        'businesses': [b.to_dict() for b in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
    })


@app.route('/api/business/mine', methods=['GET'])
@jwt_required()
def get_my_business():
    user_id = int(get_jwt_identity())
    bp = BusinessProfile.query.filter_by(user_id=user_id).first()
    return jsonify({'business': bp.to_dict() if bp else None})


@app.route('/api/business', methods=['POST'])
@jwt_required()
def create_business():
    user_id = int(get_jwt_identity())
    if BusinessProfile.query.filter_by(user_id=user_id).first():
        return jsonify({'error': 'You already have a business profile. Edit it instead.'}), 409

    data = request.get_json()
    if not data.get('company_name'):
        return jsonify({'error': 'Company name is required'}), 400

    bp = BusinessProfile(user_id=user_id, **{
        k: data.get(k) for k in [
            'company_name', 'tagline', 'category', 'description',
            'logo_filename', 'cover_filename', 'address', 'city',
            'state', 'pincode', 'phone', 'email', 'website',
            'established_year', 'employees',
        ]
    })
    db.session.add(bp)
    db.session.commit()
    return jsonify({'business': bp.to_dict()}), 201


@app.route('/api/business/<int:bp_id>', methods=['GET'])
def get_business(bp_id):
    bp = BusinessProfile.query.get_or_404(bp_id)
    return jsonify({'business': bp.to_dict()})


@app.route('/api/business/<int:bp_id>', methods=['PUT'])
@jwt_required()
def update_business(bp_id):
    user_id = int(get_jwt_identity())
    bp = BusinessProfile.query.filter_by(id=bp_id, user_id=user_id).first_or_404()
    data = request.get_json()
    for f in ['company_name', 'tagline', 'category', 'description',
              'logo_filename', 'cover_filename', 'address', 'city',
              'state', 'pincode', 'phone', 'email', 'website',
              'established_year', 'employees', 'active']:
        if f in data:
            setattr(bp, f, data[f])
    db.session.commit()
    return jsonify({'business': bp.to_dict()})


@app.route('/api/business/<int:bp_id>', methods=['DELETE'])
@jwt_required()
def delete_business(bp_id):
    user_id = int(get_jwt_identity())
    bp = BusinessProfile.query.filter_by(id=bp_id, user_id=user_id).first_or_404()
    db.session.delete(bp)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


@app.route('/api/users/<username>/business', methods=['GET'])
def get_user_business(username):
    user = User.query.filter_by(username=username).first_or_404()
    bp = BusinessProfile.query.filter_by(user_id=user.id, active=True).first()
    return jsonify({'business': bp.to_dict() if bp else None})


# ─── Scholarships ─────────────────────────────────────────────────────────────

@app.route('/api/scholarships', methods=['GET'])
def get_scholarships():
    page  = request.args.get('page', 1, type=int)
    stype = request.args.get('type', '')  # 'request' | 'provide' | '' (all)
    query = Scholarship.query.filter_by(active=True).order_by(Scholarship.created_at.desc())
    if stype in ('request', 'provide'):
        query = query.filter_by(type=stype)
    pagination = query.paginate(page=page, per_page=12, error_out=False)
    return jsonify({
        'scholarships': [s.to_dict() for s in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
    })


@app.route('/api/scholarships', methods=['POST'])
@jwt_required()
def create_scholarship():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    stype = data.get('type', '')
    if stype not in ('request', 'provide'):
        return jsonify({'error': 'type must be request or provide'}), 400
    if not data.get('title', '').strip():
        return jsonify({'error': 'title is required'}), 400
    s = Scholarship(
        user_id=user_id,
        type=stype,
        title=data['title'].strip(),
        description=data.get('description', ''),
        amount=data.get('amount', ''),
        field_of_study=data.get('field_of_study', ''),
        institution=data.get('institution', ''),
        eligibility=data.get('eligibility', ''),
        deadline=data.get('deadline', ''),
        contact_email=data.get('contact_email', ''),
        applicant_name=data.get('applicant_name', ''),
        parent_name=data.get('parent_name', ''),
        parent_occupation=data.get('parent_occupation', ''),
        parent_income=data.get('parent_income', ''),
        id_proof_filename=data.get('id_proof_filename', ''),
        certificate_filename=data.get('certificate_filename', ''),
        admission_letter_filename=data.get('admission_letter_filename', ''),
        trust_name=data.get('trust_name', ''),
        member_id=data.get('member_id', ''),
    )
    db.session.add(s)
    db.session.commit()
    return jsonify({'scholarship': s.to_dict()}), 201


@app.route('/api/scholarships/<int:sch_id>', methods=['GET'])
def get_scholarship(sch_id):
    s = Scholarship.query.get_or_404(sch_id)
    return jsonify({'scholarship': s.to_dict()})


@app.route('/api/scholarships/<int:sch_id>', methods=['PUT'])
@jwt_required()
def update_scholarship(sch_id):
    user_id = int(get_jwt_identity())
    s = Scholarship.query.get_or_404(sch_id)
    if s.user_id != user_id:
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json()
    for field in ('title', 'description', 'amount', 'field_of_study',
                  'institution', 'eligibility', 'deadline', 'contact_email',
                  'applicant_name', 'parent_name', 'parent_occupation', 'parent_income',
                  'id_proof_filename', 'certificate_filename', 'admission_letter_filename',
                  'trust_name', 'member_id'):
        if field in data:
            setattr(s, field, data[field])
    db.session.commit()
    return jsonify({'scholarship': s.to_dict()})


@app.route('/api/scholarships/<int:sch_id>', methods=['DELETE'])
@jwt_required()
def delete_scholarship(sch_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    s = Scholarship.query.get_or_404(sch_id)
    if s.user_id != user_id and not (user and user.is_admin):
        return jsonify({'error': 'Forbidden'}), 403
    s.active = False
    db.session.commit()
    return jsonify({'ok': True})


# ─── Stats ────────────────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})


@app.route('/api/stats', methods=['GET'])
def get_stats():
    from sqlalchemy import func, distinct as sa_distinct
    try:
        families = db.session.query(
            func.count(sa_distinct(FamilyMember.user_id))
        ).scalar() or 0
        return jsonify({
            'members': User.query.count(),
            'families': families,
            'forum_threads': ForumThread.query.count(),
            'matrimony_profiles': MatrimonyProfile.query.filter_by(active=True).count(),
        })
    except Exception:
        import traceback
        app.logger.error('stats error: %s', traceback.format_exc())
        return jsonify({'members': 0, 'families': 0, 'forum_threads': 0, 'matrimony_profiles': 0})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=os.environ.get('FLASK_ENV') != 'production', host='0.0.0.0', port=port)
