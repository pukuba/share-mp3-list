FROM ubuntu:18.04
RUN apt-get update -y &&\
    apt-get install curl -y &&\
    curl -sL https://deb.nodesource.com/setup_14.x | bash && \
    apt-get install nodejs software-properties-common -y &&\
    add-apt-repository ppa:jonathonf/ffmpeg-4 -y&&\
    apt-get update -y &&\
    apt-get install ffmpeg -y &&\ 
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp &&\
    chmod a+rx /usr/local/bin/yt-dlp

# install yt-dlp

RUN mkdir -p /server

WORKDIR /server

ADD ./ /server

RUN npm install -g yarn;\
    yarn install;

EXPOSE 4000

CMD ["yarn", "start" ]