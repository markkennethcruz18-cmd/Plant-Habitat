FROM node:22-alpine
WORKDIR /app
COPY . .
ENV NODE_ENV=production TRUST_PROXY=1 DATA_DIR=/data PORT=3000
VOLUME /data
EXPOSE 3000
CMD ["node","server.js"]
