FROM node:22-alpine

LABEL org.opencontainers.image.source="https://github.com/pyx-industries/pyx-identity-resolver"

# Set environment variables
ENV OBJECT_STORAGE_URL=http://minio:9000
ENV OBJECT_STORAGE_ROOT_USER=minioadmin
ENV OBJECT_STORAGE_ROOT_PASSWORD=minioadmin
ENV OBJECT_STORAGE_PATH_STYLE=true

WORKDIR /home

COPY version.json .

WORKDIR /home/app

COPY app/package*.json .

RUN npm ci

COPY app/ .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]