# Stage 1: Build with Babel + generate SSL certs
FROM node:20 AS builder

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Compile ES6+ source with Babel (--copy-files copies non-JS assets too)
RUN npm run build:babel

# Generate self-signed SSL certificate (valid 10 years)
RUN mkdir -p certs && \
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout certs/key.pem \
      -out certs/cert.pem \
      -subj "/C=VN/ST=HCM/L=HoChiMinh/O=DriveHub/CN=drivehub.local"

# Stage 2: Production runtime (slim for smaller image)
FROM node:20-slim AS runtime

WORKDIR /app

# Install chromium for puppeteer + ca-certificates
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
      chromium \
      ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Tell puppeteer to skip downloading Chromium and use system one
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/build ./build
COPY --from=builder /app/certs ./certs
COPY --from=builder /app/.sequelizerc ./.sequelizerc

EXPOSE 8080

CMD ["node", "build/server.js"]
