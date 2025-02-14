## BASE IMAGE
FROM node:20-alpine AS base

ARG VOEUX_AFFELNET_SENTRY_DSN
ARG VOEUX_AFFELNET_ENV
ARG VOEUX_AFFELNET_EMAIL
ENV REACT_APP_VOEUX_AFFELNET_ENV=$VOEUX_AFFELNET_ENV
ENV REACT_APP_VOEUX_AFFELNET_SENTRY_DSN=$VOEUX_AFFELNET_SENTRY_DSN
ENV REACT_APP_VOEUX_AFFELNET_EMAIL=$VOEUX_AFFELNET_EMAIL

WORKDIR /app

RUN corepack enable &&\
    corepack prepare yarn@stable --activate && \
    yarn set version 4.5.0 && \
    yarn config set nodeLinker node-modules && \
    yarn config set defaultSemverRangePrefix '' && \
    yarn config set --home enableTelemetry 0 && \
    yarn config set compressionLevel mixed

COPY package.json yarn.lock*  ./

## DEPS
FROM base AS deps
RUN yarn install --immutable

## BUILD
FROM base AS builder
COPY --from=deps /app/node_modules/  ./node_modules/
COPY .  ./
RUN yarn build

## RUN
FROM base AS runner
COPY --from=deps /app/node_modules/  ./node_modules/
COPY --from=builder /app/build  ./build/
EXPOSE 3000
CMD yarn serve

