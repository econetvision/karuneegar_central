from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


def _mask_mobile(mobile: str):
    """Show country code + first few digits, mask the rest with *."""
    if not mobile:
        return None
    visible = min(8, max(4, len(mobile) - 5))
    return mobile[:visible] + '*' * (len(mobile) - visible)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    mobile = db.Column(db.String(20), unique=True, nullable=True)
    mobile_verified = db.Column(db.Boolean, default=False)
    mobile_public = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_admin = db.Column(db.Boolean, default=False)

    profile = db.relationship('Profile', backref='user', uselist=False, cascade='all, delete-orphan')
    family_members = db.relationship('FamilyMember', backref='owner', lazy=True, cascade='all, delete-orphan')
    forum_threads = db.relationship('ForumThread', backref='author', lazy=True)
    forum_replies = db.relationship('ForumReply', backref='author', lazy=True)
    matrimony_profile = db.relationship('MatrimonyProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    business_profile = db.relationship('BusinessProfile', backref='owner', uselist=False, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self, full: bool = False):
        show = full or self.mobile_public
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'mobile': self.mobile if show else _mask_mobile(self.mobile),
            'mobile_public': self.mobile_public,
            'mobile_verified': self.mobile_verified,
            'created_at': self.created_at.isoformat(),
            'is_admin': self.is_admin,
        }


class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    full_name = db.Column(db.String(150))
    bio = db.Column(db.Text)
    phone = db.Column(db.String(20))
    location = db.Column(db.String(150))
    occupation = db.Column(db.String(150))
    dob = db.Column(db.String(20))
    native_place = db.Column(db.String(150))
    gothram = db.Column(db.String(100))
    photo_filename = db.Column(db.String(300))
    linkedin = db.Column(db.String(300))
    website = db.Column(db.String(300))
    is_public = db.Column(db.Boolean, nullable=True)  # None=not asked, True=public, False=private

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'full_name': self.full_name,
            'bio': self.bio,
            'phone': self.phone,
            'location': self.location,
            'occupation': self.occupation,
            'dob': self.dob,
            'native_place': self.native_place,
            'gothram': self.gothram,
            'photo_filename': self.photo_filename,
            'linkedin': self.linkedin,
            'website': self.website,
            'is_public': self.is_public,
        }


class FamilyMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    relation = db.Column(db.String(50))
    gender = db.Column(db.String(10))
    birth_year = db.Column(db.Integer)
    death_year = db.Column(db.Integer)
    notes = db.Column(db.Text)
    parent_id = db.Column(db.Integer, db.ForeignKey('family_member.id'), nullable=True)

    children = db.relationship('FamilyMember', backref=db.backref('parent', remote_side=[id]), lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'relation': self.relation,
            'gender': self.gender,
            'birth_year': self.birth_year,
            'death_year': self.death_year,
            'notes': self.notes,
            'parent_id': self.parent_id,
        }


class ForumCategory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(50), default='chat-dots')
    threads = db.relationship('ForumThread', backref='category', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'thread_count': len(self.threads),
            'reply_count': sum(len(t.replies) for t in self.threads),
        }


class ForumThread(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('forum_category.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(300), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    views = db.Column(db.Integer, default=0)
    replies = db.relationship('ForumReply', backref='thread', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_replies=False):
        data = {
            'id': self.id,
            'category_id': self.category_id,
            'user_id': self.user_id,
            'author_username': self.author.username if self.author else None,
            'author_name': self.author.profile.full_name if self.author and self.author.profile else None,
            'title': self.title,
            'body': self.body,
            'created_at': self.created_at.isoformat(),
            'views': self.views,
            'reply_count': len(self.replies),
        }
        if include_replies:
            data['replies'] = [r.to_dict() for r in self.replies]
        return data


class ForumReply(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(db.Integer, db.ForeignKey('forum_thread.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'thread_id': self.thread_id,
            'user_id': self.user_id,
            'author_username': self.author.username if self.author else None,
            'author_name': self.author.profile.full_name if self.author and self.author.profile else None,
            'body': self.body,
            'created_at': self.created_at.isoformat(),
        }


class MatrimonyProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    full_name = db.Column(db.String(150))
    gender = db.Column(db.String(10))
    seeking = db.Column(db.String(10))
    age = db.Column(db.Integer)
    height = db.Column(db.String(20))
    education = db.Column(db.String(200))
    occupation = db.Column(db.String(200))
    salary_range = db.Column(db.String(100))
    gothram = db.Column(db.String(100))
    native_place = db.Column(db.String(150))
    star = db.Column(db.String(50))
    raasi = db.Column(db.String(50))
    about = db.Column(db.Text)
    photo_filename = db.Column(db.String(300))
    contact_email = db.Column(db.String(120))
    contact_phone = db.Column(db.String(20))
    phone_public = db.Column(db.Boolean, default=False)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self, full: bool = False):
        show_phone = full or self.phone_public
        return {
            'id': self.id,
            'user_id': self.user_id,
            'full_name': self.full_name,
            'gender': self.gender,
            'seeking': self.seeking,
            'age': self.age,
            'height': self.height,
            'education': self.education,
            'occupation': self.occupation,
            'salary_range': self.salary_range,
            'gothram': self.gothram,
            'native_place': self.native_place,
            'star': self.star,
            'raasi': self.raasi,
            'about': self.about,
            'photo_filename': self.photo_filename,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone if show_phone else _mask_mobile(self.contact_phone),
            'phone_public': self.phone_public,
            'active': self.active,
            'created_at': self.created_at.isoformat(),
        }


class BusinessProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    company_name = db.Column(db.String(200), nullable=False)
    tagline = db.Column(db.String(300))
    category = db.Column(db.String(100))
    description = db.Column(db.Text)
    logo_filename = db.Column(db.String(300))
    cover_filename = db.Column(db.String(300))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    pincode = db.Column(db.String(10))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    website = db.Column(db.String(300))
    established_year = db.Column(db.Integer)
    employees = db.Column(db.String(50))
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'company_name': self.company_name,
            'tagline': self.tagline,
            'category': self.category,
            'description': self.description,
            'logo_filename': self.logo_filename,
            'cover_filename': self.cover_filename,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'pincode': self.pincode,
            'phone': self.phone,
            'email': self.email,
            'website': self.website,
            'established_year': self.established_year,
            'employees': self.employees,
            'active': self.active,
            'created_at': self.created_at.isoformat(),
            'owner_username': self.owner.username if self.owner else None,
            'owner_name': self.owner.profile.full_name if self.owner and self.owner.profile else None,
        }


class OtpRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mobile = db.Column(db.String(20), nullable=False, index=True)
    code = db.Column(db.String(5), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
