FROM node:22-alpine

ENV NODE_ENV build
ENV MINIO_URL http://minio:9000
ENV MINIO_ROOT_USER minioadmin
ENV MINIO_ROOT_PASSWORD minioadmin

WORKDIR /home/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]