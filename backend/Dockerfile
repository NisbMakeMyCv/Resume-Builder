# =============================================================================
# Stage 1: Builder
# =============================================================================

FROM python:3.12-slim AS builder

WORKDIR /app

# Python build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# =============================================================================
# Stage 2: Runtime
# =============================================================================

FROM python:3.12-slim AS runtime

# -----------------------------------------------------------------------------
# System dependencies
# -----------------------------------------------------------------------------

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    perl \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-fonts-recommended \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# -----------------------------------------------------------------------------
# Create non-root user
# -----------------------------------------------------------------------------

RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser

# -----------------------------------------------------------------------------
# Python dependencies
# -----------------------------------------------------------------------------

COPY --from=builder /install /usr/local

# -----------------------------------------------------------------------------
# Application
# -----------------------------------------------------------------------------

COPY ./app ./app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]