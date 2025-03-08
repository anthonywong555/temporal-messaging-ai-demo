FROM node:22 AS base

# 1. Use Turbo Repo to build out the code.
FROM base AS builder
RUN apt-get update

# Set working directory
WORKDIR /app
RUN npm install -g turbo
ENV TURBO_TELEMETRY_DISABLED=1
COPY . .

# Create a pruned version of worker
RUN turbo prune @temporal-messaging-ai-demo/worker --docker

# 2. Building the project. Not sure why it's called installer. Why not, ¯\_(ツ)_/¯.
FROM base AS installer
RUN apt-get update
RUN npm install -g turbo
WORKDIR /app

# First install dependencies (as they change less often)
COPY --from=builder /app/out/json .
RUN npm ci

# Build the project and its dependencies
COPY --from=builder /app/out/full .

RUN turbo build --filter=@temporal-messaging-ai-demo/worker

    # Running the Worker
FROM base AS runner
WORKDIR /app
EXPOSE 3002
EXPOSE 9464

# Don't run production as root
RUN addgroup --system --gid 1001 worker
RUN adduser --system --uid 1001 worker
USER worker
COPY --from=installer /app .

# Pass in the Workflow Bundle Path and select the env file to pass in.
CMD WORKFLOW_BUNDLE_PATH=apps/worker/dist/workflow-bundle.js node apps/worker/dist/worker.js