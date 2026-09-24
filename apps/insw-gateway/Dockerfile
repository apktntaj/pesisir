FROM oven/bun:1.3-alpine AS production

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

COPY . .

EXPOSE 3001

USER bun

CMD ["bun", "src/server.ts"]
