# refer to https://mianao.info/78fa4316/ and https://blog.csdn.net/wbsu2004/article/details/121154470
FROM node:lts-alpine as builder

WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
