FROM node:22-bookworm-slim AS builder

WORKDIR /propspacex-mail-service

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

FROM node:22-bookworm-slim AS final

WORKDIR /propspacex-mail-service

# Copy only the necessary files from the build stage (package.json and built code)
COPY --from=0 /propspacex-mail-service/package.json ./
COPY --from=0 /propspacex-mail-service/package-lock.json ./

RUN npm ci --omit=dev

COPY --from=0 /propspacex-mail-service/dist ./dist

ENV NODE_ENV=production
EXPOSE 9092
EXPOSE 50052

# CMD ["npm", "start"]
CMD ["node", "-r", "tsconfig-paths/register", "dist/index.js"]
