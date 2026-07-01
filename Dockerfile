# Shared image for all Node backend services (api, engine, ws, mm, db).
# The monorepo ships @repo/database as raw TypeScript and every app runs via
# tsx in dev, so we run the same way in prod — no cross-package tsc build.
FROM node:20-slim

# openssl is required by Prisma; tsx is the TS runner used by every service.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g tsx@4

WORKDIR /app

# Install the whole workspace (dashboard is excluded via .dockerignore).
COPY . .
RUN npm install

# Generate the Prisma client into packages/database/prisma/generated.
# DATABASE_URL is not available at build time so pass a dummy — prisma generate
# only needs the schema, not a live connection.
RUN cd packages/database && DATABASE_URL=postgresql://x:x@localhost:5432/x npx prisma generate

# Default workdir/command are overridden per-service in docker-compose.yml.
CMD ["tsx", "apps/api/src/index.ts"]
