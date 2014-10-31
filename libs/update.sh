#!/bin/sh
(cd ogg && svn up)
(cd vorbis && svn up)
(cd theora && svn up)
(cd opus && git pull origin master)
