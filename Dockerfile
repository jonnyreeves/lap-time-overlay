FROM --platform=linux/amd64 node:20-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    intel-media-va-driver \
    va-driver-all \
    vainfo \
    intel-gpu-tools \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Ensure runtime work directories exist for uploads/renders/previews
RUN mkdir -p database media  temp

ARG BUILD_TIMESTAMP
ENV BUILD_TIMESTAMP=$BUILD_TIMESTAMP
ENV WEATHER_API_KEY=""

VOLUME ["/app/database", "/app/media", "/app/temp"]

EXPOSE 3000

CMD ["npm", "run", "web"]
