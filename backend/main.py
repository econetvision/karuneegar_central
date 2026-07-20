import os
import re
import uuid
import json
from datetime import datetime, timedelta, timezone

_USERNAME_RE = re.compile(r'^[a-z0-9_]{3,30}$')


def _normalize_mobile(raw: str) -> str:
    """Strip spaces, dashes, and dots but keep the leading + and digits."""
    return re.sub(r'[\s\-\.]', '', raw.strip())

def _now():
    return datetime.utcnow()
from flask import Flask, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
from models import db, User, Profile, FamilyMember, ForumCategory, ForumThread, ForumReply, MatrimonyProfile, OtpRequest, BusinessProfile, BusinessAd, Scholarship, Pilgrimage, Event, EventSubscription, Notification
from sms import generate_otp, send_otp_sms
from email_otp import send_otp_email

limiter = Limiter(key_func=get_remote_address, default_limits=[])

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'mov', 'webm', 'avi'}
VIDEO_EXTENSIONS = {'mp4', 'mov', 'webm', 'avi'}


def _register_cors(app):
    """Manual CORS — works on all responses including 500s, no third-party dependency quirks."""
    # Hard-coded production origins that are ALWAYS allowed regardless of env var.
    _ALWAYS_ALLOWED = {
        'http://localhost:5173',
        'http://localhost:3000',
        'https://karuneegar-central.vercel.app',
        'https://karuneegar-central.org',
        'https://www.karuneegar-central.org',
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
            _migrate_otp_code_length()
            _seed_forum_categories()
            _migrate_scholarship_columns()
            _migrate_member_id()
            _migrate_matrimony_columns()
            _migrate_business_ad_columns()
            _migrate_event_columns()
            _seed_admin()
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


def _seed_admin():
    """Ensure sathya20075@gmail.com is marked as admin."""
    u = User.query.filter_by(email='sathya20075@gmail.com').first()
    if u and not u.is_admin:
        u.is_admin = True
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


def _migrate_business_ad_columns():
    """Idempotently add show_on_home column to business_ad table."""
    from sqlalchemy import text
    with db.engine.connect() as conn:
        try:
            conn.execute(text('ALTER TABLE business_ad ADD COLUMN show_on_home BOOLEAN DEFAULT FALSE'))
            conn.commit()
        except Exception:
            conn.rollback()


def _migrate_event_columns():
    """Idempotently add organizer_name column to event table."""
    from sqlalchemy import text
    with db.engine.connect() as conn:
        try:
            conn.execute(text('ALTER TABLE event ADD COLUMN organizer_name VARCHAR(200)'))
            conn.commit()
        except Exception:
            conn.rollback()


def _migrate_matrimony_columns():
    """Idempotently add horoscope and multi-photo columns to matrimony_profile."""
    from sqlalchemy import text
    new_cols = [
        ('photos_json', 'TEXT'),
        ('birth_time', 'VARCHAR(20)'),
        ('birth_place', 'VARCHAR(150)'),
        ('horoscope_en', 'TEXT'),
        ('horoscope_ta', 'TEXT'),
        ('horoscope_te', 'TEXT'),
        ('horoscope_kn', 'TEXT'),
    ]
    with db.engine.connect() as conn:
        for col, dtype in new_cols:
            try:
                conn.execute(text(f'ALTER TABLE matrimony_profile ADD COLUMN {col} {dtype}'))
                conn.commit()
            except Exception:
                conn.rollback()


def _migrate_otp_code_length():
    """Widen otp_request.code to TEXT so 6-digit 2Factor AUTOGEN codes are never truncated."""
    import logging as _log
    from sqlalchemy import text
    _logger = _log.getLogger(__name__)
    with db.engine.connect() as conn:
        try:
            conn.execute(text('ALTER TABLE otp_request ALTER COLUMN code TYPE TEXT'))
            conn.commit()
            _logger.info('_migrate_otp_code_length: otp_request.code widened to TEXT')
        except Exception as exc:
            conn.rollback()
            _logger.warning('_migrate_otp_code_length skipped (already TEXT or SQLite): %s', exc)


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

    if is_indian:
        otp = generate_otp()
        ok = send_otp_sms(mobile, otp)
        if not ok:
            return jsonify({'error': 'Failed to send OTP to mobile number. Please try again.'}), 500
        channel = 'mobile number'
    else:
        otp = generate_otp()
        ok  = send_otp_email(email, otp)
        if not ok:
            return jsonify({'error': f'Failed to send OTP to email {email}. Please try again.'}), 500
        channel = f'email {email}'

    expires = _now() + timedelta(minutes=10)
    try:
        db.session.add(OtpRequest(mobile=mobile, code=otp, expires_at=expires))
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        current_app.logger.error('send_otp_route: DB save failed: %s', exc)
        return jsonify({'error': 'Failed to save OTP. Please try again.'}), 500

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


@app.route('/api/auth/forgot-password', methods=['POST'])
@limiter.limit("5 per 10 minutes")
def forgot_password():
    data   = request.get_json()
    mobile = _normalize_mobile(data.get('mobile') or '')

    if not mobile:
        return jsonify({'error': 'Mobile number is required'}), 400
    if not mobile.startswith('+') or len(mobile) < 10:
        return jsonify({'error': 'Enter number with country code, e.g. +919876543210'}), 400

    user = User.query.filter_by(mobile=mobile).first()
    if not user:
        return jsonify({'error': 'No account found with this mobile number'}), 404

    is_indian = mobile.startswith('+91')

    if not is_indian:
        email = (data.get('email') or user.email or '').strip().lower()
        if not email:
            return jsonify({'error': 'Email is required for international numbers'}), 400

    cutoff = _now() - timedelta(minutes=10)
    recent = OtpRequest.query.filter(
        OtpRequest.mobile == mobile,
        OtpRequest.created_at >= cutoff
    ).count()
    if recent >= 3:
        return jsonify({'error': 'Too many requests. Please wait 10 minutes.'}), 429

    if is_indian:
        otp = generate_otp()
        ok = send_otp_sms(mobile, otp)
        if not ok:
            return jsonify({'error': 'Failed to send OTP. Please try again.'}), 500
        channel = 'mobile number'
    else:
        otp = generate_otp()
        ok  = send_otp_email(email, otp)
        if not ok:
            return jsonify({'error': f'Failed to send OTP to {email}. Please try again.'}), 500
        channel = f'email {email}'

    expires = _now() + timedelta(minutes=10)
    try:
        db.session.add(OtpRequest(mobile=mobile, code=otp, expires_at=expires))
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        current_app.logger.error('forgot_password: DB save failed: %s', exc)
        return jsonify({'error': 'Failed to save OTP. Please try again.'}), 500

    return jsonify({'message': f'OTP sent to your {channel}', 'via': 'sms' if is_indian else 'email'})


@app.route('/api/auth/reset-password', methods=['POST'])
@limiter.limit("10 per 10 minutes")
def reset_password():
    data     = request.get_json()
    mobile   = _normalize_mobile(data.get('mobile') or '')
    otp_code = (data.get('otp_code') or '').strip()
    new_pass = data.get('new_password') or ''

    if not mobile or not otp_code or not new_pass:
        return jsonify({'error': 'Mobile, OTP, and new password are required'}), 400
    if len(new_pass) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    user = User.query.filter_by(mobile=mobile).first()
    if not user:
        return jsonify({'error': 'No account found with this mobile number'}), 404

    now = _now()
    otp_req = OtpRequest.query.filter(
        OtpRequest.mobile   == mobile,
        OtpRequest.code     == otp_code,
        OtpRequest.expires_at > now,
    ).order_by(OtpRequest.created_at.desc()).first()

    if not otp_req:
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    user.set_password(new_pass)
    db.session.delete(otp_req)
    db.session.commit()

    return jsonify({'message': 'Password reset successfully'})


# ─── Upload ───────────────────────────────────────────────────────────────────

def _upload_to_cloudinary(buf) -> str:
    """Upload image bytes to Cloudinary; returns secure_url. Raises on failure."""
    import cloudinary
    import cloudinary.uploader
    result = cloudinary.uploader.upload(
        buf,
        folder='karuneegar',
        resource_type='image',
        format='jpg',
    )
    return result['secure_url']


def _upload_video_to_cloudinary(stream, ext: str) -> str:
    """Upload video stream to Cloudinary; returns secure_url. Raises on failure."""
    import cloudinary
    import cloudinary.uploader
    result = cloudinary.uploader.upload(
        stream,
        folder='karuneegar',
        resource_type='video',
        format=ext,
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

    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''

    # ── Video upload ──────────────────────────────────────────────────────────
    if ext in VIDEO_EXTENSIONS:
        if os.environ.get('CLOUDINARY_URL'):
            try:
                url = _upload_video_to_cloudinary(file.stream, ext)
                return jsonify({'filename': url, 'media_type': 'video'}), 201
            except Exception as exc:
                app.logger.error('Cloudinary video upload error: %s', exc)
                return jsonify({'error': 'Video upload failed'}), 500
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return jsonify({'filename': filename, 'media_type': 'video'}), 201

    # ── Image upload ──────────────────────────────────────────────────────────
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


@app.route('/api/profile/request-mobile-change', methods=['POST'])
@jwt_required()
@limiter.limit("5 per 10 minutes")
def request_mobile_change():
    user       = User.query.get(int(get_jwt_identity()))
    data       = request.get_json()
    new_mobile = _normalize_mobile(data.get('new_mobile') or '')

    if not new_mobile:
        return jsonify({'error': 'New mobile number is required'}), 400
    if not new_mobile.startswith('+') or len(new_mobile) < 10:
        return jsonify({'error': 'Enter number with country code, e.g. +919876543210'}), 400
    if new_mobile == user.mobile:
        return jsonify({'error': 'That is already your current mobile number'}), 400
    if User.query.filter(User.mobile == new_mobile, User.id != user.id).first():
        return jsonify({'error': 'This mobile number is already registered to another account'}), 409

    is_indian = new_mobile.startswith('+91')

    if not is_indian:
        email = (data.get('email') or user.email or '').strip().lower()
        if not email:
            return jsonify({'error': 'Email is required for international numbers'}), 400

    cutoff = _now() - timedelta(minutes=10)
    recent = OtpRequest.query.filter(
        OtpRequest.mobile == new_mobile,
        OtpRequest.created_at >= cutoff
    ).count()
    if recent >= 3:
        return jsonify({'error': 'Too many requests. Please wait 10 minutes.'}), 429

    if is_indian:
        otp = generate_otp()
        ok = send_otp_sms(new_mobile, otp)
        if not ok:
            return jsonify({'error': 'Failed to send OTP. Please try again.'}), 500
        channel = 'new mobile number'
    else:
        otp = generate_otp()
        ok  = send_otp_email(email, otp)
        if not ok:
            return jsonify({'error': f'Failed to send OTP to {email}. Please try again.'}), 500
        channel = f'email {email}'

    expires = _now() + timedelta(minutes=10)
    try:
        db.session.add(OtpRequest(mobile=new_mobile, code=otp, expires_at=expires))
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        current_app.logger.error('request_mobile_change: DB save failed: %s', exc)
        return jsonify({'error': 'Failed to save OTP. Please try again.'}), 500

    return jsonify({'message': f'OTP sent to your {channel}', 'via': 'sms' if is_indian else 'email'})


@app.route('/api/profile/confirm-mobile-change', methods=['POST'])
@jwt_required()
def confirm_mobile_change():
    user       = User.query.get(int(get_jwt_identity()))
    data       = request.get_json()
    new_mobile = _normalize_mobile(data.get('new_mobile') or '')
    otp_code   = (data.get('otp_code') or '').strip()

    if not new_mobile or not otp_code:
        return jsonify({'error': 'New mobile and OTP are required'}), 400
    if User.query.filter(User.mobile == new_mobile, User.id != user.id).first():
        return jsonify({'error': 'This mobile number is already registered to another account'}), 409

    otp_req = OtpRequest.query.filter(
        OtpRequest.mobile    == new_mobile,
        OtpRequest.code      == otp_code,
        OtpRequest.expires_at > _now(),
    ).order_by(OtpRequest.created_at.desc()).first()

    if not otp_req:
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    user.mobile          = new_mobile
    user.mobile_verified = True
    db.session.delete(otp_req)
    db.session.commit()

    return jsonify({'message': 'Mobile number updated successfully', 'user': user.to_dict(full=True)})


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


# ─── Admin: Member Management ─────────────────────────────────────────────────

@app.route('/api/admin/members', methods=['GET'])
@jwt_required()
def admin_list_members():
    user_id = int(get_jwt_identity())
    admin = User.query.get(user_id)
    if not (admin and admin.is_admin):
        return jsonify({'error': 'Forbidden'}), 403
    page = request.args.get('page', 1, type=int)
    q = request.args.get('q', '')
    query = User.query
    if q:
        query = query.filter(
            User.username.ilike(f'%{q}%') |
            User.email.ilike(f'%{q}%') |
            User.member_id.ilike(f'%{q}%')
        )
    pg = query.order_by(User.created_at.desc()).paginate(page=page, per_page=30, error_out=False)
    members = []
    for u in pg.items:
        d = u.to_dict(full=True)
        if u.profile:
            d['profile'] = u.profile.to_dict()
        members.append(d)
    return jsonify({'members': members, 'total': pg.total, 'pages': pg.pages, 'page': pg.page})


@app.route('/api/admin/members', methods=['POST'])
@jwt_required()
def admin_create_member():
    user_id = int(get_jwt_identity())
    admin = User.query.get(user_id)
    if not (admin and admin.is_admin):
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json()
    username = (data.get('username') or '').strip().lower()
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()
    full_name = (data.get('full_name') or '').strip()
    member_id_val = (data.get('member_id') or '').strip() or None
    if not username or not email or not password:
        return jsonify({'error': 'username, email and password are required'}), 400
    if not _USERNAME_RE.match(username):
        return jsonify({'error': 'Username must be 3-30 lowercase letters, digits, or underscores'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409
    if member_id_val and User.query.filter_by(member_id=member_id_val).first():
        return jsonify({'error': 'Member ID already exists'}), 409
    u = User(username=username, email=email, member_id=member_id_val)
    u.set_password(password)
    db.session.add(u)
    db.session.flush()
    if full_name:
        db.session.add(Profile(user_id=u.id, full_name=full_name, is_public=True))
    db.session.commit()
    d = u.to_dict(full=True)
    if u.profile:
        d['profile'] = u.profile.to_dict()
    return jsonify({'member': d}), 201


@app.route('/api/admin/members/<int:uid>', methods=['DELETE'])
@jwt_required()
def admin_delete_member(uid):
    user_id = int(get_jwt_identity())
    admin = User.query.get(user_id)
    if not (admin and admin.is_admin):
        return jsonify({'error': 'Forbidden'}), 403
    if uid == user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    target = User.query.get_or_404(uid)
    # Collect IDs of records owned by this user that others may reference
    event_ids = [r.id for r in Event.query.filter_by(user_id=uid).with_entities(Event.id).all()]
    thread_ids = [r.id for r in ForumThread.query.filter_by(user_id=uid).with_entities(ForumThread.id).all()]
    # Delete other users' notifications referencing this user's events
    if event_ids:
        Notification.query.filter(Notification.event_id.in_(event_ids)).delete(synchronize_session=False)
    # Delete other users' replies in this user's threads
    if thread_ids:
        ForumReply.query.filter(ForumReply.thread_id.in_(thread_ids)).delete(synchronize_session=False)
    # Delete all remaining records with direct user_id FK
    Notification.query.filter_by(user_id=uid).delete(synchronize_session=False)
    EventSubscription.query.filter_by(user_id=uid).delete(synchronize_session=False)
    Event.query.filter_by(user_id=uid).delete(synchronize_session=False)
    Scholarship.query.filter_by(user_id=uid).delete(synchronize_session=False)
    Pilgrimage.query.filter_by(user_id=uid).delete(synchronize_session=False)
    ForumReply.query.filter_by(user_id=uid).delete(synchronize_session=False)
    ForumThread.query.filter_by(user_id=uid).delete(synchronize_session=False)
    db.session.expire_all()
    db.session.delete(target)
    db.session.commit()
    return jsonify({'ok': True})


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


_MATRIMONY_SCALAR_FIELDS = [
    'full_name', 'gender', 'seeking', 'age', 'height',
    'education', 'occupation', 'salary_range', 'gothram',
    'native_place', 'star', 'raasi', 'about',
    'photo_filename', 'birth_time', 'birth_place',
    'horoscope_en', 'horoscope_ta', 'horoscope_te', 'horoscope_kn',
    'contact_email', 'contact_phone', 'phone_public',
]


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
        k: data.get(k) for k in _MATRIMONY_SCALAR_FIELDS
    })
    photos = data.get('photos', [])
    if isinstance(photos, list):
        profile.photos_json = json.dumps(photos[:5])
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

    for f in _MATRIMONY_SCALAR_FIELDS + ['active']:
        if f in data:
            setattr(profile, f, data[f])
    if 'phone_public' in data:
        profile.phone_public = bool(data['phone_public'])
    if 'photos' in data and isinstance(data['photos'], list):
        profile.photos_json = json.dumps(data['photos'][:5])

    db.session.commit()
    return jsonify({'profile': profile.to_dict(full=True)})


@app.route('/api/matrimony/<int:profile_id>/generate-horoscope', methods=['POST'])
@jwt_required()
def generate_matrimony_horoscope(profile_id):
    user_id = int(get_jwt_identity())
    profile = MatrimonyProfile.query.filter_by(id=profile_id, user_id=user_id).first_or_404()

    lang = request.args.get('lang', 'en').lower()
    if lang not in ('en', 'ta', 'te', 'kn'):
        return jsonify({'error': 'lang must be en, ta, te, or kn'}), 400

    lang_names = {'en': 'English', 'ta': 'Tamil', 'te': 'Telugu', 'kn': 'Kannada'}

    api_key = os.environ.get('ANTHROPIC_API_KEY', '').strip()
    if not api_key:
        return jsonify({'error': 'AI horoscope generation is not configured on this server.'}), 503

    try:
        import anthropic as _anthropic
        client = _anthropic.Anthropic(api_key=api_key)

        details = []
        if profile.full_name:  details.append(f"Name: {profile.full_name}")
        if profile.gender:     details.append(f"Gender: {profile.gender}")
        if profile.age:        details.append(f"Age: {profile.age}")
        if profile.star:       details.append(f"Star (Nakshatra): {profile.star}")
        if profile.raasi:      details.append(f"Raasi (Moon Sign): {profile.raasi}")
        if profile.birth_time: details.append(f"Birth Time: {profile.birth_time}")
        if profile.birth_place: details.append(f"Birth Place: {profile.birth_place}")
        if profile.gothram:    details.append(f"Gothram: {profile.gothram}")
        if profile.native_place: details.append(f"Native Place: {profile.native_place}")

        profile_text = '\n'.join(details) if details else "No birth details provided."
        target_lang = lang_names[lang]

        prompt = f"""You are an expert Vedic astrologer and horoscope writer for the Karuneegar community matrimony portal.

Generate a detailed jathakam/horoscope for this individual based on their birth details:

{profile_text}

Write a comprehensive horoscope in {target_lang} covering:
1. Personality traits and character (based on star and raasi)
2. Career and financial prospects
3. Marriage compatibility — what kind of partner is ideal, best matching stars/raasis
4. Health and general well-being
5. Lucky numbers, colours, and days
6. Overall life prediction and auspicious periods

Important:
- Write entirely in {target_lang} (use the {target_lang} script)
- Make it positive, respectful, and suitable for a matrimony profile
- Keep it around 300-400 words
- Format with clear section headings
- If birth time and place are missing, give a general reading based on star and raasi only"""

        message = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=1024,
            messages=[{'role': 'user', 'content': prompt}],
        )
        horoscope_text = message.content[0].text

        setattr(profile, f'horoscope_{lang}', horoscope_text)
        db.session.commit()

        return jsonify({'horoscope': horoscope_text, 'lang': lang})
    except Exception as exc:
        app.logger.error('Horoscope generation error: %s', exc)
        return jsonify({'error': 'Failed to generate horoscope. Please try again.'}), 500


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


@app.route('/api/business/<int:bp_id>/ads', methods=['GET'])
@jwt_required()
def list_business_ads(bp_id):
    ads = BusinessAd.query.filter_by(business_id=bp_id, active=True).order_by(BusinessAd.created_at.desc()).all()
    return jsonify({'ads': [a.to_dict() for a in ads]})


@app.route('/api/business/<int:bp_id>/ads', methods=['POST'])
@jwt_required()
def create_business_ad(bp_id):
    user_id = int(get_jwt_identity())
    bp = BusinessProfile.query.filter_by(id=bp_id, user_id=user_id).first_or_404()
    data = request.get_json()
    if not data.get('photo_filename'):
        return jsonify({'error': 'photo_filename is required'}), 400
    ad = BusinessAd(
        business_id=bp.id,
        photo_filename=data['photo_filename'],
        title=data.get('title', '').strip() or None,
        caption=data.get('caption', '').strip() or None,
        show_on_home=bool(data.get('show_on_home', False)),
    )
    db.session.add(ad)
    db.session.commit()
    return jsonify({'ad': ad.to_dict()}), 201


@app.route('/api/business/<int:bp_id>/ads/<int:ad_id>', methods=['PUT'])
@jwt_required()
def update_business_ad(bp_id, ad_id):
    user_id = int(get_jwt_identity())
    bp = BusinessProfile.query.filter_by(id=bp_id, user_id=user_id).first_or_404()
    ad = BusinessAd.query.filter_by(id=ad_id, business_id=bp.id).first_or_404()
    data = request.get_json()
    for f in ('title', 'caption', 'active', 'show_on_home'):
        if f in data:
            setattr(ad, f, data[f])
    db.session.commit()
    return jsonify({'ad': ad.to_dict()})


@app.route('/api/business/<int:bp_id>/ads/<int:ad_id>', methods=['DELETE'])
@jwt_required()
def delete_business_ad(bp_id, ad_id):
    user_id = int(get_jwt_identity())
    bp = BusinessProfile.query.filter_by(id=bp_id, user_id=user_id).first_or_404()
    ad = BusinessAd.query.filter_by(id=ad_id, business_id=bp.id).first_or_404()
    db.session.delete(ad)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


@app.route('/api/ads/home', methods=['GET'])
def get_home_ads():
    ads = (BusinessAd.query
           .filter_by(show_on_home=True, active=True)
           .order_by(BusinessAd.created_at.desc())
           .limit(10)
           .all())
    return jsonify({'ads': [a.to_dict() for a in ads]})


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


# ─── Pilgrimages ──────────────────────────────────────────────────────────────

@app.route('/api/pilgrimages', methods=['GET'])
def get_pilgrimages():
    page = request.args.get('page', 1, type=int)
    pagination = (Pilgrimage.query
                  .filter_by(active=True)
                  .order_by(Pilgrimage.created_at.desc())
                  .paginate(page=page, per_page=12, error_out=False))
    return jsonify({
        'pilgrimages': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
    })


@app.route('/api/pilgrimages', methods=['POST'])
@jwt_required()
def create_pilgrimage():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data.get('title', '').strip():
        return jsonify({'error': 'title is required'}), 400
    if not data.get('destination', '').strip():
        return jsonify({'error': 'destination is required'}), 400
    p = Pilgrimage(
        user_id=user_id,
        title=data['title'].strip(),
        destination=data['destination'].strip(),
        description=data.get('description', ''),
        itinerary=data.get('itinerary', ''),
        start_date=data.get('start_date', ''),
        end_date=data.get('end_date', ''),
        cost=data.get('cost', ''),
        capacity=data.get('capacity') or None,
        organizer_name=data.get('organizer_name', ''),
        organizer_mobile=data.get('organizer_mobile', ''),
        photo_filename=data.get('photo_filename', ''),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify({'pilgrimage': p.to_dict()}), 201


@app.route('/api/pilgrimages/<int:pid>', methods=['GET'])
def get_pilgrimage(pid):
    p = Pilgrimage.query.get_or_404(pid)
    return jsonify({'pilgrimage': p.to_dict()})


@app.route('/api/pilgrimages/<int:pid>', methods=['PUT'])
@jwt_required()
def update_pilgrimage(pid):
    user_id = int(get_jwt_identity())
    p = Pilgrimage.query.get_or_404(pid)
    if p.user_id != user_id:
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json()
    for field in ('title', 'destination', 'description', 'itinerary',
                  'start_date', 'end_date', 'cost', 'capacity',
                  'organizer_name', 'organizer_mobile', 'photo_filename'):
        if field in data:
            setattr(p, field, data[field])
    db.session.commit()
    return jsonify({'pilgrimage': p.to_dict()})


@app.route('/api/pilgrimages/<int:pid>', methods=['DELETE'])
@jwt_required()
def delete_pilgrimage(pid):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    p = Pilgrimage.query.get_or_404(pid)
    if p.user_id != user_id and not (user and user.is_admin):
        return jsonify({'error': 'Forbidden'}), 403
    p.active = False
    db.session.commit()
    return jsonify({'ok': True})


# ─── Events ───────────────────────────────────────────────────────────────────

@app.route('/api/events', methods=['GET'])
@jwt_required()
def list_events():
    page = request.args.get('page', 1, type=int)
    q = request.args.get('q', '')
    query = Event.query.filter_by(active=True)
    if q:
        query = query.filter(Event.title.ilike(f'%{q}%'))
    pg = query.order_by(Event.created_at.desc()).paginate(page=page, per_page=20, error_out=False)
    return jsonify({'events': [e.to_dict() for e in pg.items], 'page': pg.page, 'pages': pg.pages, 'total': pg.total})


@app.route('/api/events/home', methods=['GET'])
def events_home():
    """Public endpoint — top 10 home-featured events for carousel."""
    events = (Event.query
              .filter_by(active=True, show_on_home=True)
              .order_by(Event.created_at.desc())
              .limit(10).all())
    return jsonify({'events': [e.to_dict() for e in events]})


@app.route('/api/events', methods=['POST'])
@jwt_required()
def create_event():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data.get('title', '').strip():
        return jsonify({'error': 'title is required'}), 400
    ev = Event(
        user_id=user_id,
        title=data['title'].strip(),
        description=data.get('description', ''),
        event_date=data.get('event_date', ''),
        contact_no=data.get('contact_no', ''),
        organizer_name=data.get('organizer_name', ''),
        donate_url=data.get('donate_url', ''),
        register_url=data.get('register_url', ''),
        media_filename=data.get('media_filename', ''),
        media_type=data.get('media_type', 'photo'),
        show_on_home=bool(data.get('show_on_home', False)),
    )
    db.session.add(ev)
    db.session.commit()

    # fan out in-app notifications to all subscribers
    try:
        subs = EventSubscription.query.all()
        notes = [
            Notification(
                user_id=s.user_id,
                title=f'New Event: {ev.title}',
                body=(ev.description or '')[:120] or None,
                event_id=ev.id,
            )
            for s in subs if s.user_id != user_id
        ]
        if notes:
            db.session.add_all(notes)
            db.session.commit()
    except Exception:
        pass

    return jsonify({'event': ev.to_dict()}), 201


@app.route('/api/events/<int:eid>', methods=['GET'])
@jwt_required()
def get_event(eid):
    ev = Event.query.filter_by(id=eid, active=True).first_or_404()
    return jsonify({'event': ev.to_dict()})


@app.route('/api/events/<int:eid>', methods=['DELETE'])
@jwt_required()
def delete_event(eid):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    ev = Event.query.filter_by(id=eid, active=True).first_or_404()
    if ev.user_id != user_id and not (user and user.is_admin):
        return jsonify({'error': 'Forbidden'}), 403
    ev.active = False
    db.session.commit()
    return jsonify({'ok': True})


# ─── Event Subscriptions ──────────────────────────────────────────────────────

@app.route('/api/events/subscription', methods=['GET'])
@jwt_required()
def get_event_subscription():
    user_id = int(get_jwt_identity())
    sub = EventSubscription.query.filter_by(user_id=user_id).first()
    return jsonify({'subscribed': sub is not None})


@app.route('/api/events/subscribe', methods=['POST'])
@jwt_required()
def subscribe_events():
    user_id = int(get_jwt_identity())
    if not EventSubscription.query.filter_by(user_id=user_id).first():
        db.session.add(EventSubscription(user_id=user_id))
        db.session.commit()
    return jsonify({'subscribed': True})


@app.route('/api/events/subscribe', methods=['DELETE'])
@jwt_required()
def unsubscribe_events():
    user_id = int(get_jwt_identity())
    sub = EventSubscription.query.filter_by(user_id=user_id).first()
    if sub:
        db.session.delete(sub)
        db.session.commit()
    return jsonify({'subscribed': False})


# ─── Notifications ─────────────────────────────────────────────────────────────

@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def list_notifications():
    user_id = int(get_jwt_identity())
    notes = (Notification.query
             .filter_by(user_id=user_id)
             .order_by(Notification.created_at.desc())
             .limit(50).all())
    return jsonify({'notifications': [{
        'id': n.id,
        'title': n.title,
        'body': n.body,
        'event_id': n.event_id,
        'read': n.read,
        'created_at': n.created_at.isoformat(),
    } for n in notes]})


@app.route('/api/notifications/unread-count', methods=['GET'])
@jwt_required()
def notifications_unread_count():
    user_id = int(get_jwt_identity())
    count = Notification.query.filter_by(user_id=user_id, read=False).count()
    return jsonify({'count': count})


@app.route('/api/notifications/read-all', methods=['PUT'])
@jwt_required()
def mark_notifications_read():
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, read=False).update({'read': True})
    db.session.commit()
    return jsonify({'ok': True})


# ─── Bhakti ───────────────────────────────────────────────────────────────────

_bhakti_cache: dict = {'data': None, 'ts': 0.0}
_BHAKTI_TTL = 86400  # 24 hours
_BHAKTI_PLAYLIST = 'UU__dvO3Cf7elH9T8ygzz7Tg'  # uploads playlist for channel UC__dvO3Cf7elH9T8ygzz7Tg

@app.route('/api/bhakti', methods=['GET'])
def get_bhakti():
    import time
    import urllib.request
    import urllib.parse
    import json as _json

    api_key = os.environ.get('YOUTUBE_API_KEY', '')
    now = time.time()
    if _bhakti_cache['data'] and now - _bhakti_cache['ts'] < _BHAKTI_TTL:
        return jsonify(_bhakti_cache['data'])
    if not api_key:
        return jsonify({'videos': [], 'configured': False})

    params = urllib.parse.urlencode({
        'playlistId': _BHAKTI_PLAYLIST,
        'part': 'snippet',
        'maxResults': '20',
        'key': api_key,
    })
    url = f'https://www.googleapis.com/youtube/v3/playlistItems?{params}'
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            raw = _json.loads(resp.read().decode())
    except Exception:
        if _bhakti_cache['data']:
            return jsonify(_bhakti_cache['data'])
        return jsonify({'videos': [], 'configured': True, 'error': True})

    videos = []
    for item in raw.get('items', []):
        s = item.get('snippet', {})
        vid_id = s.get('resourceId', {}).get('videoId', '')
        if not vid_id:
            continue
        thumbs = s.get('thumbnails', {})
        thumb = (thumbs.get('high') or thumbs.get('medium') or thumbs.get('default') or {}).get('url', '')
        videos.append({
            'id': vid_id,
            'title': s.get('title', ''),
            'description': s.get('description', ''),
            'thumbnail': thumb,
            'published_at': s.get('publishedAt', ''),
        })

    result = {'videos': videos, 'configured': True}
    _bhakti_cache['data'] = result
    _bhakti_cache['ts'] = now
    return jsonify(result)


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


@app.route('/privacy-policy')
def privacy_policy():
    from flask import make_response
    html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Privacy Policy — Karuneegar Central</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 24px 20px 60px; color: #111827; background: #fafaf9; line-height: 1.7; }
  h1 { color: #f97316; font-size: 2rem; margin-bottom: 4px; }
  h2 { color: #111827; font-size: 1.2rem; margin-top: 2rem; }
  p, li { color: #374151; font-size: 0.97rem; }
  ul { padding-left: 20px; }
  a { color: #f97316; }
  .updated { color: #6b7280; font-size: 0.9rem; margin-bottom: 2rem; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
</style>
</head>
<body>
<h1>Privacy Policy</h1>
<p class="updated">Last updated: July 2026</p>
<p>Karuneegar Central ("we", "our", or "us") operates the Karuneegar Central mobile application. This Privacy Policy explains how we collect, use, and protect your information when you use our app.</p>

<h2>1. Information We Collect</h2>
<ul>
  <li><strong>Account Information:</strong> Name, email address, phone number, and password when you register.</li>
  <li><strong>Profile Information:</strong> Location, occupation, gothram, native place, and profile photo that you voluntarily provide.</li>
  <li><strong>Matrimony Information:</strong> Star (nakshatra), raasi, gothram, and horoscope details if you create a matrimony profile.</li>
  <li><strong>Business Information:</strong> Business name, description, photos, and contact details if you list a business.</li>
  <li><strong>User Content:</strong> Posts, replies, and images you share in forums and events.</li>
  <li><strong>Usage Data:</strong> App activity logs for improving the service and ensuring security.</li>
</ul>

<h2>2. How We Use Your Information</h2>
<ul>
  <li>To create and manage your account and community profile.</li>
  <li>To display your profile to other verified community members.</li>
  <li>To enable matrimony matching within the community.</li>
  <li>To facilitate communication via forums, events, and notifications.</li>
  <li>To send OTP messages for login verification.</li>
  <li>To improve app features and ensure security.</li>
</ul>

<h2>3. Information Sharing</h2>
<p>We do not sell, rent, or trade your personal information to third parties. Your profile information is visible only to verified members of the Karuneegar community who are registered in the app. We do not share data with advertisers.</p>

<h2>4. Data Storage and Security</h2>
<p>Your data is stored securely on our servers. We use industry-standard encryption and authentication (JWT) to protect your account. Profile photos and uploads are stored securely and served only within the app.</p>

<h2>5. Your Rights</h2>
<ul>
  <li>You can update or delete your profile information at any time from the app.</li>
  <li>You can delete your matrimony or business listing at any time.</li>
  <li>To request full account deletion, contact us at the email below.</li>
</ul>

<h2>6. Children's Privacy</h2>
<p>Our app is not intended for children under 13. We do not knowingly collect information from children.</p>

<h2>7. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. We will notify users of significant changes through the app. Continued use of the app after changes constitutes acceptance of the updated policy.</p>

<h2>8. Contact Us</h2>
<p>If you have any questions about this Privacy Policy or wish to request data deletion, please contact us at:<br>
<a href="mailto:econetvision@gmail.com">econetvision@gmail.com</a></p>

<hr>
<p style="color:#6b7280;font-size:0.85rem;">© 2026 Karuneegar Central. All rights reserved.</p>
</body>
</html>"""
    response = make_response(html, 200)
    response.headers['Content-Type'] = 'text/html; charset=utf-8'
    return response


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=os.environ.get('FLASK_ENV') != 'production', host='0.0.0.0', port=port)
