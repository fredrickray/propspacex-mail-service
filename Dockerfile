FROM node:22-alpine AS builder

WORKDIR /propspacex-mail-service

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

FROM node:22-alpine AS final

WORKDIR /propspacex-mail-service

# Copy only the necessary files from the build stage (package.json and built code)
COPY --from=0 /propspacex-mail-service/package.json ./
RUN npm ci --only=production

COPY --from=0 /propspacex-mail-service/dist ./dist

ENV NODE_ENV=production
EXPOSE 9092

CMD ["npm", "start"]
