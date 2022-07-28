function av1 {
    width="$1"
    height="$2"
    bitrate="$3"
    speed="$4"
    cols="$5"
    start=50
    time=60
    
    ffmpeg \
      -ss "$start" \
      -i caminandes-llamigos.webm \
      -t "$time" \
      -vf "scale=$width:$height" \
      -vcodec libaom-av1 \
      -g 240 \
      -pass 1 \
      -cpu-used 4 \
      -vb "$bitrate" \
      -row-mt 1 \
      -tile-columns "$cols" \
      -an \
      -y caminandes-llamigos.webm."$height"p.av1.webm \
    && ffmpeg \
      -ss "$start" \
      -i caminandes-llamigos.webm \
      -t "$time" \
      -vf "scale=$width:$height" \
      -vcodec libaom-av1 \
      -g 240 \
      -pass 2 \
      -cpu-used "$speed" \
      -vb "$bitrate" \
      -auto-alt-ref 1 \
      -lag-in-frames 24 \
      -row-mt 1 \
      -tile-columns "$cols" \
      -acodec libvorbis \
      -ab 128k \
      -y caminandes-llamigos.webm."$height"p.av1.webm \
    || exit 1
}

av1 426 240 156k 0 1
av1 640 360 312k 1 1
av1 854 480 625k 1 2
av1 1280 720 1250k 2 4
av1 1920 1080 2500k 2 4
