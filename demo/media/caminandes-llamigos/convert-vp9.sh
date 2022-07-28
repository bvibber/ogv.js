function vp9 {
    width="$1"
    height="$2"
    bitrate="$3"
    speed="$4"
    start=50
    time=60
    
    ffmpeg \
      -ss "$start" \
      -i caminandes-llamigos.webm \
      -t "$time" \
      -vf "scale=$width:$height" \
      -vcodec libvpx-vp9 \
      -g 240 \
      -pass 1 \
      -speed 4 \
      -vb "$bitrate" \
      -row-mt 1 \
      -tile-columns 3 \
      -an \
      -y caminandes-llamigos.webm."$height"p.vp9.webm \
    && ffmpeg \
      -ss "$start" \
      -i caminandes-llamigos.webm \
      -t "$time" \
      -vf "scale=$width:$height" \
      -vcodec libvpx-vp9 \
      -g 240 \
      -pass 2 \
      -speed "$speed" \
      -vb "$bitrate" \
      -auto-alt-ref 1 \
      -lag-in-frames 24 \
      -row-mt 1 \
      -tile-columns 3 \
      -acodec libvorbis \
      -ab 128k \
      -y caminandes-llamigos.webm."$height"p.vp9.webm \
    || exit 1
}

vp9 426 240 250k 1
vp9 640 360 500k 1
vp9 854 480 1000k 1
vp9 1280 720 2000k 2
vp9 1920 1080 4000k 2
