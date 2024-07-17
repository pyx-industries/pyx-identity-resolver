FROM node:22-alpine

ENV NODE_ENV build
ENV OBJECT_STORAGE_URL http://minio:9000
ENV OBJECT_STORAGE_ROOT_USER minioadmin
ENV OBJECT_STORAGE_ROOT_PASSWORD minioadmin
ENV OBJECT_STORAGE_PATH_STYLE true

WORKDIR /home/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]