FROM node:22-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@10.4.1

# Copy dependency files first (better layer caching)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source
COPY . .
RUN echo "Build cache busted $(date)"

# Build frontend + bundle server
RUN pnpm build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.cjs"]
