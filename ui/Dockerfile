FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock /app/
RUN yarn install --frozen-lockfile && \
    yarn global add local-web-server

# Build site
COPY . ./

ARG VOEUX_AFFELNET_SENTRY_DSN
ARG VOEUX_AFFELNET_ENV
ARG VOEUX_AFFELNET_EMAIL
ENV REACT_APP_VOEUX_AFFELNET_ENV=$VOEUX_AFFELNET_ENV
ENV REACT_APP_VOEUX_AFFELNET_SENTRY_DSN=$VOEUX_AFFELNET_SENTRY_DSN
ENV REACT_APP_VOEUX_AFFELNET_EMAIL=$VOEUX_AFFELNET_EMAIL

RUN INLINE_RUNTIME_CHUNK=false yarn build && \
    mv /app/build /site

EXPOSE 3000
CMD ws --port 3000 -d /site --log.format dev --spa index.html
