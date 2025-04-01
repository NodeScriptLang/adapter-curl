FROM node:18.9-slim as builder

WORKDIR /builder
COPY . ./

RUN npm ci && npm run build && rm -rf node_modules

##################################################

FROM node:18.9-slim

ENV NODE_ENV production

RUN apt-get update && apt-get install -y wget xz-utils
RUN wget "https://github.com/lexiforest/curl-impersonate/releases/download/v0.9.5/curl-impersonate-v0.9.5.x86_64-linux-gnu.tar.gz" -qO - | tar -xzf -
RUN mv ./curl_safari18_0_ios /usr/local/bin/curl && chmod +x /usr/local/bin/curl
ENV CURL_PATH /usr/local/bin/curl

RUN mkdir /app && chown -R node:node /app
WORKDIR /app
USER node

COPY --from=builder /builder .
RUN npm ci --production

WORKDIR /app
CMD ["node", "out/bin/http.js"]
