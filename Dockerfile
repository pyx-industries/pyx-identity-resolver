FROM node:22-alpine

LABEL org.opencontainers.image.source="https://github.com/pyx-industries/pyx-identity-resolver"

# Set environment variables
ENV OBJECT_STORAGE_PATH_STYLE=true

WORKDIR /home

COPY version.json .

WORKDIR /home/app

COPY app/package*.json .

RUN npm ci

COPY app/ .

RUN npm run build

EXPOSE 3000

# The service writes nothing to disk, so the root-owned, world-readable files
# need no change of ownership. Do not set NODE_ENV=production in this image:
# main.ts treats it as Lambda mode and never starts the HTTP listener.
USER node

# The route prefix (/api/v<major>) comes from the app's own derivation of
# apiVersion in version.json, so the check follows the next major without an
# edit here. Run from WORKDIR, which the prefix lookup relies on. It uses
# http.get rather than fetch, because fetch refuses some ports (6000, 10080 and
# others) that PORT may legitimately be set to.
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD node -e "const { APP_ROUTE_PREFIX } = require('./dist/common/utils/config.utils'); require('http').get({ host: '127.0.0.1', port: process.env.PORT || 3000, path: APP_ROUTE_PREFIX + '/health-check', timeout: 5000 }, (r) => { r.resume(); process.exit(r.statusCode >= 200 && r.statusCode < 300 ? 0 : 1); }).on('timeout', function () { this.destroy(); }).on('error', () => process.exit(1))"

CMD ["node", "dist/main"]