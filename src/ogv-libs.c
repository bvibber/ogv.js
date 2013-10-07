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


/* never forget that globals are a one-way ticket to Hell */
/* Ogg and codec state for demux/decode */
ogg_sync_state    oggSyncState;
ogg_page          oggPage;
ogg_stream_state  streamState;
th_info           theoraInfo;
th_comment        theoraComment;
th_setup_info    *theoraSetupInfo;
th_dec_ctx       *theoraDecoderContext;

int              theora_p=0;
int              theora_processing_headers;

/* single frame video buffering */
int          videobuf_ready=0;
ogg_int64_t  videobuf_granulepos=-1;
double       videobuf_time=0;
int          raw=0;
int          crop=0;

int got_sigint=0;
static void sigint_handler (int signal) {
  got_sigint = 1;
}

extern void OgvJsOutputFrame(unsigned char *bufferY, int strideY,
                             unsigned char *bufferCb, int strideCb,
                             unsigned char *bufferCr, int strideCr,
                             int width, int height,
                             int hdec, int vdec);

/*Write out the planar YUV frame, uncropped.*/
static void video_write(void){
    th_ycbcr_buffer ycbcr;
    th_decode_ycbcr_out(theoraDecoderContext,ycbcr);

    int hdec = !(theoraInfo.pixel_fmt & 1);
    int vdec = !(theoraInfo.pixel_fmt & 2);
    
	OgvJsOutputFrame(ycbcr[0].data, ycbcr[0].stride,
	                 ycbcr[1].data, ycbcr[1].stride,
	                 ycbcr[2].data, ycbcr[3].stride,
	                 theoraInfo.frame_width, theoraInfo.frame_height,
	                 hdec, vdec);
}

/* dump the theora comment header */
static int dump_comments(th_comment *_tc){
  int   i;
  int   len;
  printf("Encoded by %s\n",_tc->vendor);
  if(_tc->comments){
    printf("theora comment header:\n");
    for(i=0;i<_tc->comments;i++){
      if(_tc->user_comments[i]){
        len=_tc->comment_lengths[i]<INT_MAX?_tc->comment_lengths[i]:INT_MAX;
        printf("\t%.*s\n",len,_tc->user_comments[i]);
      }
    }
  }
  return 0;
}

/* helper: push a page into the appropriate steam */
/* this can be done blindly; a stream won't accept a page
                that doesn't belong to it */
static int queue_page(ogg_page *page){
  if(theora_p)ogg_stream_pagein(&streamState,page);
  return 0;
}


  ogg_packet oggPacket;

  int frames = 0;

void OgvJsInit() {
  /* start up Ogg stream synchronization layer */
  ogg_sync_init(&oggSyncState);

  /* init supporting Theora structures needed in header parsing */
  th_comment_init(&theoraComment);
  th_info_init(&theoraInfo);
}


enum AppState {
	STATE_BEGIN,
	STATE_HEADERS,
	STATE_DECODING
} appState;

void OgvJsProcessInput(char *buffer, int bufsize) {
  printf("Hello OgvJsProcessInput! appState is: %d\n", (int)appState);

  if (bufsize > 0) {
	  for (int q = 0; q < 128; q++) {
	  	printf("%d ", (int)buffer[q]);
	  }
	  char *dest = ogg_sync_buffer(&oggSyncState, bufsize);
	  memcpy(dest, buffer, bufsize);
	  ogg_sync_wrote(&oggSyncState, bufsize);
	  for (int q = 0; q < 128; q++) {
	  	printf("%d ", (int)dest[q]);
	  }
	  printf("Just wrote input for %d bytes\n", bufsize);
  }

  if (appState == STATE_BEGIN) {
  	printf("STATE_BEGIN {{{\n");
    /*Ogg file open; parse the headers.
      Theora (like Vorbis) depends on some initial header packets for decoder
       setup and initialization.
      We retrieve these first before entering the main decode loop.*/

	int po = ogg_sync_pageout(&oggSyncState,&oggPage);
	printf("ogg_sync_pageout %d\n", po);
	
	

    /* Only interested in Theora streams */
    while(ogg_sync_pageout(&oggSyncState,&oggPage)>0){
       printf("in the loop\n");
      int got_packet;
      ogg_stream_state test;

      /* is this a mandated initial header? If not, stop parsing */
      if(!ogg_page_bos(&oggPage)){
       printf("!ogg_page_bos()\n");
        /* don't leak the page; get it into the appropriate stream */
        queue_page(&oggPage);
        appState = STATE_HEADERS;
        break;
      }

      ogg_stream_init(&test,ogg_page_serialno(&oggPage));
      ogg_stream_pagein(&test,&oggPage);
      got_packet = ogg_stream_packetpeek(&test,&oggPacket);

      /* identify the codec: try theora */
      if((got_packet==1) && !theora_p && (theora_processing_headers=
       th_decode_headerin(&theoraInfo,&theoraComment,&theoraSetupInfo,&oggPacket))>=0){
       printf("is theora packet\n");
        /* it is theora -- save this stream state */
        memcpy(&streamState,&test,sizeof(test));
        theora_p=1;
        /*Advance past the successfully processed header.*/
        if(theora_processing_headers)ogg_stream_packetout(&streamState,NULL);
      }else{
       printf("not theora packet\n");
        /* whatever it is, we don't care about it */
        ogg_stream_clear(&test);
      }
    }
    /* fall through to non-bos page parsing */
  	printf("STATE_BEGIN }}}\n");
  } else if (appState == STATE_HEADERS) {
  	printf("STATE_HEADERS {{{\n");

	  /* we're expecting more header packets. */
	  while(theora_p && theora_processing_headers){
		int ret;

		/* look for further theora headers */
		while(theora_processing_headers&&(ret=ogg_stream_packetpeek(&streamState,&oggPacket))){
		  if(ret<0)continue;
		  theora_processing_headers=th_decode_headerin(&theoraInfo,&theoraComment,&theoraSetupInfo,&oggPacket);
		  if(theora_processing_headers<0){
			printf("Error parsing Theora stream headers; "
			 "corrupt stream?\n");
			exit(1);
		  }
		  else if(theora_processing_headers>0){
			/*Advance past the successfully processed header.*/
			ogg_stream_packetout(&streamState,NULL);
		  }
		  theora_p++;
		}

		/*Stop now so we don't fail if there aren't enough pages in a short
		   stream.*/
		if(!(theora_p && theora_processing_headers)) {
			break;
		}

		/* The header pages/packets will arrive before anything else we
		   care about, or the stream is not obeying spec */

		if(ogg_sync_pageout(&oggSyncState,&oggPage)>0){
		  queue_page(&oggPage); /* demux into the appropriate stream */
		}else{
			// fixme we might run out of data here
			// if so we need to be able to halt here and save state.
			printf("Ran out of input while searching for codec headers.\n");
			exit(1);
		}
	  }

	  /* and now we have it all.  initialize decoders */
	  if(theora_p){
		dump_comments(&theoraComment);
		theoraDecoderContext=th_decode_alloc(&theoraInfo,theoraSetupInfo);
		printf("Ogg logical stream %lx is Theora %dx%d %.02f fps video\n"
		 "Encoded frame content is %dx%d with %dx%d offset\n",
		 streamState.serialno,theoraInfo.frame_width,theoraInfo.frame_height,
		 (double)theoraInfo.fps_numerator/theoraInfo.fps_denominator,
		 theoraInfo.pic_width,theoraInfo.pic_height,theoraInfo.pic_x,theoraInfo.pic_y);

	  }else{
		/* tear down the partial theora setup */
		th_info_clear(&theoraInfo);
		th_comment_clear(&theoraComment);
	  }
	  /*Either way, we're done with the codec setup data.*/
	  th_setup_free(theoraSetupInfo);

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

	  /* queue any remaining pages from data we buffered but that did not
		  contain headers */
	  while(ogg_sync_pageout(&oggSyncState,&oggPage)>0){
		queue_page(&oggPage);
	  }
  	printf("STATE_HEADERS {{{\n");
  } else if (appState == STATE_DECODING) {
  	printf("STATE_DECODING {{{\n");

    while(theora_p && !videobuf_ready){
      /* theora is one in, one out... */
      if(ogg_stream_packetout(&streamState,&oggPacket)>0){

        if(th_decode_packetin(theoraDecoderContext,&oggPacket,&videobuf_granulepos)>=0){
          videobuf_time=th_granule_time(theoraDecoderContext,videobuf_granulepos);
          videobuf_ready=1;
          frames++;
        }

      }
    }

    if(videobuf_ready){
	    /* dumpvideo frame, and get new one */
    	video_write();
	    videobuf_ready=0;
    }

  	printf("STATE_DECODING }}}\n");
  }
  printf("end processInput.\n");
}

void OgvJsDestroy() {
  if(theora_p){
    ogg_stream_clear(&streamState);
    th_decode_free(theoraDecoderContext);
    th_comment_clear(&theoraComment);
    th_info_clear(&theoraInfo);
  }
  ogg_sync_clear(&oggSyncState);
}

void OgvJsFlush() {
  printf("Hello OgvJsFlush!\n");
  OgvJsProcessInput(NULL, 0);
}

