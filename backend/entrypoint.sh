#!/bin/sh

# Work from the backend directory regardless of where this script is called from
cd "$(dirname "$0")"

# Activate Nixpacks venv if present (Railway/Nixpacks puts it at /opt/venv)
[ -f /opt/venv/bin/activate ] && . /opt/venv/bin/activate

# Initialize database — non-fatal so gunicorn always starts even if DB is unreachable
python - <<'EOF'
import sys
from main import app, db, _seed_forum_categories
with app.app_context():
    try:
        db.create_all()
        _seed_forum_categories()
        print("Database initialized")
    except Exception as e:
        print("Warning: DB init failed:", e, file=sys.stderr)
EOF

exec gunicorn --workers 4 --bind "0.0.0.0:${PORT:-5000}" --timeout 120 --access-logfile - main:app
