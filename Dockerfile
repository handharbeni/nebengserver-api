# specify the node base image with your desired version node:<version>
FROM node:8
WORKDIR /home/mhandharbeni/Documents/NebengServer/REST_API/nebengserver-api
COPY package*.json ./
RUN npm install
COPY . .
# replace this with your application's default port
EXPOSE 8888
CMD [ "npm", "start" ]

