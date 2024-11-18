ARG NODE_VERSION=20.12.2

FROM node:${NODE_VERSION}-alpine
WORKDIR /usr/src/app
COPY . .
RUN npm ci
EXPOSE 80
CMD ["node", "index.js", "80"]