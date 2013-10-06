#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/timeb.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <limits.h>

#include <ogg/ogg.h>
#include <vorbis/codec.h>
#include <theora/codec.h>
#include <theora/theoradec.h>

/* Helper; just grab some more compressed bitstream and sync it for
   page extraction */
int buffer_data(FILE *in,ogg_sync_state *oy){
  char *buffer=ogg_sync_buffer(oy,4096);
  int bytes=fread(buffer,1,4096,in);
  ogg_sync_wrote(oy,bytes);
  return(bytes);
}

/* never forget that globals are a one-way ticket to Hell */
/* Ogg and codec state for demux/decode */
ogg_sync_state    oy;
ogg_page          og;
ogg_stream_state  vo;
ogg_stream_state  to;
th_info           ti;
th_comment        tc;
th_setup_info    *ts;
th_dec_ctx       *td;

int              theora_p=0;
int              theora_processing_headers;
int              stateflag=0;

/* single frame video buffering */
int          videobuf_ready=0;
ogg_int64_t  videobuf_granulepos=-1;
double       videobuf_time=0;
int          raw=0;
int          crop=0;

FILE* outfile = NULL;

int got_sigint=0;
static void sigint_handler (int signal) {
  got_sigint = 1;
}

static th_ycbcr_buffer ycbcr;

static void stripe_decoded(th_ycbcr_buffer _dst,th_ycbcr_buffer _src,
 int _fragy0,int _fragy_end){
  int pli;
  for(pli=0;pli<3;pli++){
    int yshift;
    int y_end;
    int y;
    yshift=pli!=0&&!(ti.pixel_fmt&2);
    y_end=_fragy_end<<3-yshift;
    /*An implemention intending to display this data would need to check the
       crop rectangle before proceeding.*/
    for(y=_fragy0<<3-yshift;y<y_end;y++){
      memcpy(_dst[pli].data+y*_dst[pli].stride,
       _src[pli].data+y*_src[pli].stride,_src[pli].width);
    }
  }
}

static void open_video(void){
  th_stripe_callback cb;
  int                pli;
  /*Here we allocate a buffer so we can use the striped decode feature.
    There's no real reason to do this in this application, because we want to
     write to the file top-down, but the frame gets decoded bottom up, so we
     have to buffer it all anyway.
    But this illustrates how the API works.*/
  for(pli=0;pli<3;pli++){
    int xshift;
    int yshift;
    xshift=pli!=0&&!(ti.pixel_fmt&1);
    yshift=pli!=0&&!(ti.pixel_fmt&2);
    ycbcr[pli].data=(unsigned char *)malloc(
     (ti.frame_width>>xshift)*(ti.frame_height>>yshift)*sizeof(char));
    ycbcr[pli].stride=ti.frame_width>>xshift;
    ycbcr[pli].width=ti.frame_width>>xshift;
    ycbcr[pli].height=ti.frame_height>>yshift;
  }
  /*Similarly, since ycbcr is a global, there's no real reason to pass it as
     the context.
    In a more object-oriented decoder, we could pass the "this" pointer
     instead (though in C++, platform-dependent calling convention differences
     prevent us from using a real member function pointer).*/
  cb.ctx=ycbcr;
  cb.stripe_decoded=(th_stripe_decoded_func)stripe_decoded;
  th_decode_ctl(td,TH_DECCTL_SET_STRIPE_CB,&cb,sizeof(cb));
}

/*Write out the planar YUV frame, uncropped.*/
static void video_write(void){
  int pli;
  int i;
  /*Uncomment the following to do normal, non-striped decoding.
  th_ycbcr_buffer ycbcr;
  th_decode_ycbcr_out(td,ycbcr);*/
  if(outfile){
    int x0;
    int y0;
    int xend;
    int yend;
    int hdec;
    int vdec;
    if(crop){
      x0=ti.pic_x;
      y0=ti.pic_y;
      xend=x0+ti.pic_width;
      yend=y0+ti.pic_height;
    }
    else{
      x0=y0=0;
      xend=ti.frame_width;
      yend=ti.frame_height;
    }
    hdec=vdec=0;
    if(!raw)fprintf(outfile, "FRAME\n");
    for(pli=0;pli<3;pli++){
      for(i=y0>>vdec;i<(yend+vdec>>vdec);i++){
        fwrite(ycbcr[pli].data+ycbcr[pli].stride*i+(x0>>hdec), 1,
         (xend+hdec>>hdec)-(x0>>hdec), outfile);
      }
      hdec=!(ti.pixel_fmt&1);
      vdec=!(ti.pixel_fmt&2);
    }
  }
}

/* dump the theora comment header */
static int dump_comments(th_comment *_tc){
  int   i;
  int   len;
  FILE *out;
  out=stderr;
  fprintf(out,"Encoded by %s\n",_tc->vendor);
  if(_tc->comments){
    fprintf(out,"theora comment header:\n");
    for(i=0;i<_tc->comments;i++){
      if(_tc->user_comments[i]){
        len=_tc->comment_lengths[i]<INT_MAX?_tc->comment_lengths[i]:INT_MAX;
        fprintf(out,"\t%.*s\n",len,_tc->user_comments[i]);
      }
    }
  }
  return 0;
}

/* helper: push a page into the appropriate steam */
/* this can be done blindly; a stream won't accept a page
                that doesn't belong to it */
static int queue_page(ogg_page *page){
  if(theora_p)ogg_stream_pagein(&to,page);
  return 0;
}



int OgvJsInit() {
  ogg_packet op;

  struct timeb start;
  struct timeb after;
  struct timeb last;
  int fps_only=0;
  int frames = 0;

  FILE *infile = stdin;

  /* start up Ogg stream synchronization layer */
  ogg_sync_init(&oy);

  /* init supporting Theora structures needed in header parsing */
  th_comment_init(&tc);
  th_info_init(&ti);

  /*Ogg file open; parse the headers.
    Theora (like Vorbis) depends on some initial header packets for decoder
     setup and initialization.
    We retrieve these first before entering the main decode loop.*/

  /* Only interested in Theora streams */
  while(!stateflag){
    int ret=buffer_data(infile,&oy);
    if(ret==0)break;
    while(ogg_sync_pageout(&oy,&og)>0){
      int got_packet;
      ogg_stream_state test;

      /* is this a mandated initial header? If not, stop parsing */
      if(!ogg_page_bos(&og)){
        /* don't leak the page; get it into the appropriate stream */
        queue_page(&og);
        stateflag=1;
        break;
      }

      ogg_stream_init(&test,ogg_page_serialno(&og));
      ogg_stream_pagein(&test,&og);
      got_packet = ogg_stream_packetpeek(&test,&op);

      /* identify the codec: try theora */
      if((got_packet==1) && !theora_p && (theora_processing_headers=
       th_decode_headerin(&ti,&tc,&ts,&op))>=0){
        /* it is theora -- save this stream state */
        memcpy(&to,&test,sizeof(test));
        theora_p=1;
        /*Advance past the successfully processed header.*/
        if(theora_processing_headers)ogg_stream_packetout(&to,NULL);
      }else{
        /* whatever it is, we don't care about it */
        ogg_stream_clear(&test);
      }
    }
    /* fall through to non-bos page parsing */
  }

  /* we're expecting more header packets. */
  while(theora_p && theora_processing_headers){
    int ret;

    /* look for further theora headers */
    while(theora_processing_headers&&(ret=ogg_stream_packetpeek(&to,&op))){
      if(ret<0)continue;
      theora_processing_headers=th_decode_headerin(&ti,&tc,&ts,&op);
      if(theora_processing_headers<0){
        fprintf(stderr,"Error parsing Theora stream headers; "
         "corrupt stream?\n");
        exit(1);
      }
      else if(theora_processing_headers>0){
        /*Advance past the successfully processed header.*/
        ogg_stream_packetout(&to,NULL);
      }
      theora_p++;
    }

    /*Stop now so we don't fail if there aren't enough pages in a short
       stream.*/
    if(!(theora_p && theora_processing_headers))break;

    /* The header pages/packets will arrive before anything else we
       care about, or the stream is not obeying spec */

    if(ogg_sync_pageout(&oy,&og)>0){
      queue_page(&og); /* demux into the appropriate stream */
    }else{
      int ret=buffer_data(infile,&oy); /* someone needs more data */
      if(ret==0){
        fprintf(stderr,"End of file while searching for codec headers.\n");
        exit(1);
      }
    }
  }

  /* and now we have it all.  initialize decoders */
  if(theora_p){
    dump_comments(&tc);
    td=th_decode_alloc(&ti,ts);
    fprintf(stderr,"Ogg logical stream %lx is Theora %dx%d %.02f fps video\n"
     "Encoded frame content is %dx%d with %dx%d offset\n",
     to.serialno,ti.frame_width,ti.frame_height,
     (double)ti.fps_numerator/ti.fps_denominator,
     ti.pic_width,ti.pic_height,ti.pic_x,ti.pic_y);

    /*{
      int arg = 0xffff;
      th_decode_ctl(td,TH_DECCTL_SET_TELEMETRY_MBMODE,&arg,sizeof(arg));
      th_decode_ctl(td,TH_DECCTL_SET_TELEMETRY_MV,&arg,sizeof(arg));
      th_decode_ctl(td,TH_DECCTL_SET_TELEMETRY_QI,&arg,sizeof(arg));
      arg=10;
      th_decode_ctl(td,TH_DECCTL_SET_TELEMETRY_BITS,&arg,sizeof(arg));
    }*/
  }else{
    /* tear down the partial theora setup */
    th_info_clear(&ti);
    th_comment_clear(&tc);
  }
  /*Either way, we're done with the codec setup data.*/
  th_setup_free(ts);

  /* open video */
  if(theora_p)open_video();

  if(!raw && outfile){
    static const char *CHROMA_TYPES[4]={"420jpeg",NULL,"422jpeg","444"};
    int width;
    int height;
    if(ti.pixel_fmt>=4||ti.pixel_fmt==TH_PF_RSVD){
      fprintf(stderr,"Unknown pixel format: %i\n",ti.pixel_fmt);
      exit(1);
    }
    if(crop){
      int hdec;
      int vdec;
      hdec=!(ti.pixel_fmt&1);
      vdec=!(ti.pixel_fmt&2);
      if((ti.pic_x&hdec)||(ti.pic_width&hdec)
       ||(ti.pic_y&vdec)||(ti.pic_height&vdec)){
        fprintf(stderr,
         "Error: Cropped images with odd offsets/sizes and chroma subsampling\n"
         "cannot be output to YUV4MPEG2. Remove the --crop flag or add the\n"
         "--raw flag.\n");
        exit(1);
      }
      width=ti.pic_width;
      height=ti.pic_height;
    }
    else{
      width=ti.frame_width;
      height=ti.frame_height;
    }
    fprintf(outfile,"YUV4MPEG2 C%s W%d H%d F%d:%d I%c A%d:%d\n",
     CHROMA_TYPES[ti.pixel_fmt],width,height,
     ti.fps_numerator,ti.fps_denominator,'p',
     ti.aspect_numerator,ti.aspect_denominator);
  }

  /*Finally the main decode loop.

    It's one Theora packet per frame, so this is pretty straightforward if
     we're not trying to maintain sync with other multiplexed streams.

    The videobuf_ready flag is used to maintain the input buffer in the libogg
     stream state.
    If there's no output frame available at the end of the decode step, we must
     need more input data.
    We could simplify this by just using the return code on
     ogg_page_packetout(), but the flag system extends easily to the case where
     you care about more than one multiplexed stream (like with audio
     playback).
    In that case, just maintain a flag for each decoder you care about, and
     pull data when any one of them stalls.

    videobuf_time holds the presentation time of the currently buffered video
     frame.
    We ignore this value.*/

  stateflag=0; /* playback has not begun */
  /* queue any remaining pages from data we buffered but that did not
      contain headers */
  while(ogg_sync_pageout(&oy,&og)>0){
    queue_page(&og);
  }

  if(fps_only){
    ftime(&start);
    ftime(&last);
  }

  while(!got_sigint){

    while(theora_p && !videobuf_ready){
      /* theora is one in, one out... */
      if(ogg_stream_packetout(&to,&op)>0){

        if(th_decode_packetin(td,&op,&videobuf_granulepos)>=0){
          videobuf_time=th_granule_time(td,videobuf_granulepos);
          videobuf_ready=1;
          frames++;
          if(fps_only)
            ftime(&after);
        }

      }else
        break;
    }

    if(fps_only && (videobuf_ready || fps_only==2)){
      long ms =
        after.time*1000.+after.millitm-
        (last.time*1000.+last.millitm);

      if(ms>500 || fps_only==1 ||
         (feof(infile) && !videobuf_ready)){
        float file_fps = (float)ti.fps_numerator/ti.fps_denominator;
        fps_only=2;

        ms = after.time*1000.+after.millitm-
          (start.time*1000.+start.millitm);

        fprintf(stderr,"\rframe:%d rate:%.2fx           ",
                frames,
                frames*1000./(ms*file_fps));
        memcpy(&last,&after,sizeof(last));
      }
    }

    if(!videobuf_ready && feof(infile))break;

    if(!videobuf_ready){
      /* no data yet for somebody.  Grab another page */
      buffer_data(infile,&oy);
      while(ogg_sync_pageout(&oy,&og)>0){
        queue_page(&og);
      }
    }
    /* dumpvideo frame, and get new one */
    else if(outfile)video_write();

    videobuf_ready=0;
  }

	return 1;
}

void OgvJsDestroy() {
  if(theora_p){
    ogg_stream_clear(&to);
    th_decode_free(td);
    th_comment_clear(&tc);
    th_info_clear(&ti);
  }
  ogg_sync_clear(&oy);
}
