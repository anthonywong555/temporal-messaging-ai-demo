FROM node:22 AS base

# 1. Use Turbo Repo to build out the code.
FROM base AS builder
RUN apt-get update

# Set working directory
WORKDIR /app
RUN npm install -g turbo
COPY . .

# Create a pruned version of web
RUN turbo prune @boilerplate/codec-server --docker

# 2. Building out the project. Not sure why it's called installer. Why not, ¯\_(ツ)_/¯.
FROM base as installer
RUN apt-get update
RUN npm install -g turbo
WORKDIR /app

# First install dependencies (as they cahnge less often)
COPY --from=builder /app/out/json .
RUN npm ci

# Build the project and its dependencies
COPY --from=builder /app/out/full .

# When running this build, it will also push the sourcemaps into Sentry.
# This is because of the apps/web/vite.config.ts
RUN turbo build --filter=@boilerplate/codec-server

# Running the web
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# ENV TEMPORAL_ADDRESS=temporal:7233
EXPOSE 8888

# Don't run production as root
RUN addgroup --system --gid 1001 web
RUN adduser --system --uid 1001 web
USER web
COPY --from=installer /app .

CMD node apps/codec-server/dist/index.js