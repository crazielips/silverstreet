# specify the node base image with your desired version node:<version>
FROM node:12
# replace this with your application's default port
EXPOSE 8080
WORKDIR /app
COPY package.json /app
RUN npm install
RUN apt-get update && \
  apt-get install -y \
  python \
  python-dev \
  python-pip \
  python-setuptools \
  groff \
  less \
  && apt-get install -y python3-pip \
  && pip3 install awscli \
  && apt-get clean

COPY . /app
CMD node index.js
