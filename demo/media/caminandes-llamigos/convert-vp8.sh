function vp8 {
    width="$1"
    height="$2"
    bitrate="$3"
    speed="$4"
    slices="$5"
    start=50
    time=60
    
    ffmpeg \
      -ss "$start" \
      -i caminandes-llamigos.webm \
      -t "$time" \
      -vf "scale=$width:$height" \
      -vcodec libvpx \
      -g 240 \
      -slices "$slices" \
      -pass 1 \
      -speed 4 \
      -vb "$bitrate" \
      -an \
      -y caminandes-llamigos.webm."$height"p.vp8.webm \
    && ffmpeg \
      -ss "$start" \
      -i caminandes-llamigos.webm \
      -t "$time" \
      -vf "scale=$width:$height" \
      -vcodec libvpx \
      -g 240 \
      -slices "$slices" \
      -pass 2 \
      -speed "$speed" \
      -vb "$bitrate" \
      -auto-alt-ref 1 \
      -lag-in-frames 24 \
      -acodec libvorbis \
      -ab 128k \
      -y caminandes-llamigos.webm."$height"p.vp8.webm \
    || exit 1
}

vp8 426 240 375k 1 1
vp8 640 360 750k 1 1
vp8 854 480 1500k 1 2
vp8 1280 720 3000k 2 4
vp8 1920 1080 6000k 2 4
