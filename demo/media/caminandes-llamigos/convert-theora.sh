function theora {
    width="$1"
    height="$2"
    bitrate="$3"
    start=50
    time=60
    
    ffmpeg \
      -ss "$start" \
      -i caminandes-llamigos.webm \
      -t "$time" \
      -vf "scale=$width:$height" \
      -vcodec libtheora \
      -g 240 \
      -pass 1 \
      -vb "$bitrate" \
      -an \
      -y caminandes-llamigos.webm."$height"p.theora.ogv \
    && ffmpeg \
      -ss "$start" \
      -i caminandes-llamigos.webm \
      -t "$time" \
      -vf "scale=$width:$height" \
      -vcodec libtheora \
      -g 240 \
      -pass 2 \
      -vb "$bitrate" \
      -acodec libvorbis \
      -ab 128k \
      -y caminandes-llamigos.webm."$height"p.theora.ogv \
    || exit 1
}

theora 426 240 500k
theora 640 360 1000k
theora 854 480 2000k
theora 1280 720 4000k
theora 1920 1080 8000k
