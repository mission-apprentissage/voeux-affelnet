FROM node:16-stretch

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock /app/
RUN yarn install --frozen-lockfile && \
    yarn global add local-web-server

# Build site
COPY . ./
ARG VOEUX_AFFELNET_SENTRY_DSN
ARG VOEUX_AFFELNET_ENV
ENV REACT_APP_VOEUX_AFFELNET_ENV=$VOEUX_AFFELNET_ENV
ENV REACT_APP_VOEUX_AFFELNET_SENTRY_DSN=$VOEUX_AFFELNET_SENTRY_DSN
RUN INLINE_RUNTIME_CHUNK=false yarn build && \
    mv /app/build /site

EXPOSE 3000
CMD ws --port 3000 -d /site --log.format dev --spa index.html
