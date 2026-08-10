# =============================================================================
# Stage 1: Builder
# Install dependencies in an isolated layer so the final image stays lean.
# =============================================================================
FROM python:3.12-slim AS builder

WORKDIR /app

# Install system build deps needed to compile psycopg2 / other C extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements first to leverage Docker layer caching.
# Dependencies are only re-installed when requirements.txt changes.
COPY requirements.txt .

# Install into a local prefix so we can copy them cleanly to the final stage
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# =============================================================================
# Stage 2: Runtime
# A clean, minimal image that only contains what is needed to run the app.
# =============================================================================
FROM python:3.12-slim AS runtime

# Runtime system library for psycopg2 (no gcc needed at runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create a non-root user for security best practices
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy installed Python packages from the builder stage
COPY --from=builder /install /usr/local

# Copy application source code
COPY ./app ./app

# Switch to the non-root user before running the process
USER appuser

# Expose the application port
EXPOSE 8000

# Add a HEALTHCHECK so Docker knows the app is alive
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# Use exec form for proper signal handling (graceful shutdown)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
