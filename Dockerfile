FROM node:10 as builder

WORKDIR /rest-on-couch-source
COPY ./  ./

RUN npm ci && npm run build && rm -rf node_modules

FROM node:10

ENV NODE_ENV production
ENV REST_ON_COUCH_HOME_DIR /rest-on-couch

WORKDIR /rest-on-couch-source
COPY --from=builder /rest-on-couch-source /rest-on-couch-source
RUN npm install -g pm2 && npm ci && rm -rf /root/.npm

CMD ["node", "bin/rest-on-couch-server.js"]
