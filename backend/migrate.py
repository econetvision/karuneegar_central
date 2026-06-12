"""One-time migration: adds columns introduced after initial db.create_all()."""
from sqlalchemy import text, inspect
from main import app
from models import db

with app.app_context():
    insp = inspect(db.engine)
    with db.engine.connect() as conn:

        # ── user table ───────────────────────────────────────────────────────
        user_cols = {c['name'] for c in insp.get_columns('user')}
        if 'mobile' not in user_cols:
            conn.execute(text('ALTER TABLE "user" ADD COLUMN mobile VARCHAR(20)'))
            print('  + user.mobile')
        if 'mobile_verified' not in user_cols:
            conn.execute(text('ALTER TABLE "user" ADD COLUMN mobile_verified BOOLEAN DEFAULT false'))
            print('  + user.mobile_verified')
        if 'mobile_public' not in user_cols:
            conn.execute(text('ALTER TABLE "user" ADD COLUMN mobile_public BOOLEAN DEFAULT false'))
            print('  + user.mobile_public')
        # ── profile table ────────────────────────────────────────────────────
        profile_cols = {c['name'] for c in insp.get_columns('profile')}
        if 'is_public' not in profile_cols:
            conn.execute(text('ALTER TABLE profile ADD COLUMN is_public BOOLEAN'))
            print('  + profile.is_public')
        # ── matrimony_profile table ──────────────────────────────────────────
        matrimony_cols = {c['name'] for c in insp.get_columns('matrimony_profile')}
        if 'phone_public' not in matrimony_cols:
            conn.execute(text('ALTER TABLE matrimony_profile ADD COLUMN phone_public BOOLEAN DEFAULT false'))
            print('  + matrimony_profile.phone_public')
        # ── profile table (prominent figures) ────────────────────────────────
        profile_cols = {c['name'] for c in insp.get_columns('profile')}
        if 'achievements' not in profile_cols:
            conn.execute(text('ALTER TABLE profile ADD COLUMN achievements TEXT'))
            print('  + profile.achievements')
        if 'is_prominent' not in profile_cols:
            conn.execute(text('ALTER TABLE profile ADD COLUMN is_prominent BOOLEAN DEFAULT false'))
            print('  + profile.is_prominent')
        conn.commit()

    # Create any brand-new tables (scholarship, …)
    db.create_all()
    print('Migration complete.')
