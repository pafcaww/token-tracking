FROM alpine:3.12

WORKDIR "/truffle"

RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools
RUN apk add npm
RUN apk add -t .gyp --no-cache git g++ make && npm install -g truffle@5.1.44 && apk del .gyp
RUN npm install --save-dev @truffle/hdwallet-provider 
