FROM --platform=linux/amd64 node:20-slim

RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Ensure runtime work directories exist for uploads/renders/previews
RUN mkdir -p work/uploads work/renders work/previews database

VOLUME ["/app/work", "/app/database"]

EXPOSE 3000

CMD ["npm", "run", "web"]
