# syntax=docker/dockerfile:1

# TankKoll – statisk Next.js-export bakom nginx. Ingen backend: all data
# stannar i besökarens localStorage, så körbilden är bara filer.

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
# npm install, inte npm ci: lockfilen skapas på Windows och saknar då
# @emnapi/*-paketen som Linux-bygget behöver.
RUN npm install --no-audit --no-fund

COPY . .

# Bakas in i next.config.ts (basePath), asset()-helpern och src/lib/site.ts
# (canonical/OG/sitemap/robots) – en variabel styr alla tre, så de kan inte
# hamna ur synk. Standardvärdet är den riktiga adressen, så en ren klon
# bygger rätt sajt utan att någon kommer ihåg att sätta en variabel.
ARG NEXT_PUBLIC_BASE_PATH=/app/tankkoll
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NODE_ENV=production

# next build + postbuild-utplattning av RSC-segmentfiler (scripts/flatten-rsc-payloads.mjs).
RUN npm run build


FROM nginx:1.27-alpine AS runtime

# Ingen apk-installation med flit: busybox wget räcker för healthchecken.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
