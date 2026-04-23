FROM node:22.12.0
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm install
COPY . .
EXPOSE 8000
CMD npx prisma db push && npm start