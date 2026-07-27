FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

RUN npm ci

COPY . .

RUN npm run build:frontend
RUN npm run build:backend

RUN mkdir -p apps/backend/public \
    && cp -r apps/frontend/dist/. apps/backend/public/


FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/public ./apps/backend/public

EXPOSE 3000

CMD ["node", "apps/backend/dist/main.js"]