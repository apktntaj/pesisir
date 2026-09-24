FROM oven/bun:1.4.2-alpine AS production

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

COPY src ./src
COPY migrations ./migrations

ENV HOST=0.0.0.0
EXPOSE 3001
USER bun
CMD ["sh", "-c", "bun src/db/migrate.ts && exec bun src/server.ts"]
