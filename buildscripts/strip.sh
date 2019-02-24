#!/bin/sh

if [ "x$1" == "x--strip-debug" ]
then
    shift
fi
if [ "x$1" == "x-o" ]
then
    OUTPUT="$2"
    shift
    shift
fi
INPUT="$1"

< "$INPUT" > "$OUTPUT"
