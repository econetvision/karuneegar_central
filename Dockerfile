# ── Backend Dockerfile ──────────────────────────────────────────────────────
# Uses the official uv image with Python 3.12 bundled (stable LTS-level release)
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS base

WORKDIR /app

# Copy dependency manifests first for layer-cache efficiency
COPY backend/pyproject.toml backend/uv.lock ./

# Install dependencies into .venv, skip dev extras
RUN uv sync --frozen --no-dev --no-install-project

# Copy application source
COPY backend/main.py backend/models.py backend/sms.py ./

# Ensure uploads directory exists
RUN mkdir -p static/uploads instance

# Add .venv to PATH so gunicorn/python are resolved without uv run
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 5000

# 4 workers, longer timeout for file uploads
# Railway injects $PORT; fall back to 5000 for Docker Compose / local use
CMD ["sh", "-c", "gunicorn --workers 4 --bind 0.0.0.0:${PORT:-5000} --timeout 120 --access-logfile - main:app"]
