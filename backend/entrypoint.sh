#!/bin/sh
set -e

python - <<'EOF'
from main import app, db, _seed_forum_categories
with app.app_context():
    db.create_all()
    _seed_forum_categories()
    print("Database initialized")
EOF

exec gunicorn --workers 4 --bind "0.0.0.0:${PORT:-5000}" --timeout 120 --access-logfile - main:app
