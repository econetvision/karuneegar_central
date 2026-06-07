# ── Backend Dockerfile ──────────────────────────────────────────────────────
# Uses the official uv image with Python 3.12 bundled (stable LTS-level release)
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS base

WORKDIR /app

# Copy dependency manifests first for layer-cache efficiency
COPY backend/pyproject.toml backend/uv.lock ./

# Install dependencies into .venv, skip dev extras
RUN uv sync --frozen --no-dev --no-install-project

# Copy application source
COPY backend/main.py backend/models.py backend/sms.py backend/entrypoint.sh ./

# Ensure uploads directory exists and entrypoint is executable
RUN mkdir -p static/uploads && chmod +x entrypoint.sh

# Add .venv to PATH so gunicorn/python are resolved without uv run
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 5000

CMD ["sh", "entrypoint.sh"]
