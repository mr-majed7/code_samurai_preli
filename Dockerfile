FROM node:20.11.0

ENV PORT=8000
ENV MONGODB_URI=mongodb+srv://hackathon:uHuMMOUhvIdOnDS2@cluster0.eirekhp.mongodb.net/?retryWrites=true&w=majority

WORKDIR /app

COPY ./package.json ./

RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "run", "prod"]
