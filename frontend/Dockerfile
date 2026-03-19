# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Build args for env vars injected at build time
ARG REACT_APP_API_URL
ARG REACT_APP_MEZON_REDIRECT_URI
ARG REACT_APP_MEZON_CLIENT_ID
ARG REACT_APP_MEZON_AUTHORIZE_URL
ARG REACT_APP_MEZON_SCOPE
ARG REACT_APP_BUILD=production

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_MEZON_REDIRECT_URI=$REACT_APP_MEZON_REDIRECT_URI
ENV REACT_APP_MEZON_CLIENT_ID=$REACT_APP_MEZON_CLIENT_ID
ENV REACT_APP_MEZON_AUTHORIZE_URL=$REACT_APP_MEZON_AUTHORIZE_URL
ENV REACT_APP_MEZON_SCOPE=$REACT_APP_MEZON_SCOPE
ENV REACT_APP_BUILD=$REACT_APP_BUILD

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
