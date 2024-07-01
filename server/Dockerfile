# STAGE 1 : BUILDER
FROM node:18-alpine as builder

COPY .yarnrc.yml* /tmp/
RUN echo -e "yarnPath: .yarn/releases/yarn-3.3.1.cjs\n\
nodeLinker: node-modules\n\
defaultSemverRangePrefix: ''\n\
" > /tmp/.yarnrc.yml ;

#Install and cache node_modules
COPY package.json yarn.lock /tmp/
COPY .yarn/ /tmp/.yarn/
RUN cd /tmp && \
  yarn install --immutable && \
  rm -f .yarnrc.yml

# STAGE 2 : RUNNER
FROM node:18-alpine as runner

WORKDIR /app
VOLUME /data
EXPOSE 5000

RUN echo -e "yarnPath: .yarn/releases/yarn-3.3.1.cjs\n\
nodeLinker: node-modules\n\
defaultSemverRangePrefix: ''\n\
" > /app/.yarnrc.yml ;

COPY ./ /app
COPY --from=builder /tmp/node_modules /app/node_modules

CMD ["yarn", "start-prod"]
