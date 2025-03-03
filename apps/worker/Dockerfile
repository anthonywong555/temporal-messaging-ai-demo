FROM node:22 AS base

# 1. Use Turbo Repo to build out the code.
FROM base AS builder
RUN apt-get update

# Set working directory
WORKDIR /app
RUN npm install -g turbo
RUN echo $TEMPORAL_ADDRESS
ENV TURBO_TELEMETRY_DISABLED=1
COPY . .

# Create a pruned version of worker
RUN turbo prune @boilerplate/worker --docker

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

# When running this build, it will also push the sourcemaps into Sentry.
# This is because of the apps/worker/turbo.json
RUN ls -ial
RUN turbo build --filter=@boilerplate/worker

# Running the Worker
FROM base AS runner
WORKDIR /app
EXPOSE 3001

# Don't run production as root
RUN addgroup --system --gid 1001 worker
RUN adduser --system --uid 1001 worker
USER worker
COPY --from=installer /app .

# Pass in the Workflow Bundle Path and select the env file to pass in.
CMD WORKFLOW_BUNDLE_PATH=apps/worker/dist/workflow-bundle.js node --env-file=apps/worker/.env.production.local apps/worker/dist/worker.js