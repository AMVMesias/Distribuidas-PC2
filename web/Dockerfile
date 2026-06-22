FROM node:22-alpine

WORKDIR /app
COPY --chown=node:node . .

USER node
EXPOSE 9000

CMD ["node", "serve.js", "9000"]
