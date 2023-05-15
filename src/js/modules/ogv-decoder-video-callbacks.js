/* global LibraryManager */
/* global mergeInto */
/* global Module */
/* global wasmMemory */

mergeInto(LibraryManager.library, {

	ogvjs_callback_init_video: function(frameWidth, frameHeight,
	                                    chromaWidth, chromaHeight,
                                        fps,
                                        picWidth, picHeight,
                                        picX, picY,
                                        displayWidth, displayHeight) {
		Module['videoFormat'] = {
			'width': frameWidth,
			'height': frameHeight,
			'chromaWidth': chromaWidth,
			'chromaHeight': chromaHeight,
			'cropLeft': picX,
			'cropTop': picY,
			'cropWidth': picWidth,
			'cropHeight': picHeight,
			'displayWidth': displayWidth,
			'displayHeight': displayHeight,
			'fps': fps
		};
		Module['loadedMetadata'] = true;
	},

	ogvjs_callback_frame: function(bufferY, strideY,
	                               bufferCb, strideCb,
	                               bufferCr, strideCr,
	                               width, height,
								   chromaWidth, chromaHeight,
								   picWidth, picHeight,
								   picX, picY,
								   displayWidth, displayHeight) {

		// Create typed array copies of the source buffers from the emscripten heap:
		var heap = wasmMemory.buffer;
		var format = Module['videoFormat'];

		function copyAndTrim(arr, buffer, stride, width, height, picX, picY, picWidth, picHeight, fill) {
			// Trim out anything outside the visible area
			// Protected against green stripes in some codecs (VP9)
			var inbuf = new Uint8Array(heap, buffer, stride * height);
			var x, y, ptr, inptr;
			for (ptr = 0, y = 0; y < picY; y++, ptr += stride) {
				for (x = 0; x < stride; x++) {
					arr[ptr + x] = fill;
				}
			}
			for (inptr = stride * picY; y < picY + picHeight; y++, ptr += width, inptr += stride) {
				for (x = 0; x < picX; x++) {
					arr[ptr + x] = fill;
				}
				for (; x < picWidth; x++) {
					arr[ptr + x] = inbuf[inptr + x];
				}
				for (; x < width; x++) {
					arr[ptr + x] = fill;
				}
			}
			for (; y < height; y++, ptr += stride) {
				for (x = 0; x < stride; x++) {
					arr[ptr + x] = fill;
				}
			}
			return arr;
		}

		// round down to divisible by 2
		function evenDown(x) {
			return x & ~1;
		}

		function evenUp(x) {
			return evenDown( x + 1 );
		}


		// Hackety hack! We don't need to keep anything in the coded area outside the picture.
		// Reorganize so the origin is as close as possible to the picture area
		var outPicX = picX - evenDown(picX);
		var outPicY = picY - evenDown(picY);
		var horizRatio = width / chromaWidth;
		var vertRatio = height / chromaHeight;
		width = evenUp( outPicX + picWidth );
		height = evenUp( outPicY + picHeight );
		chromaWidth = width / horizRatio;
		chromaHeight = height / vertRatio;

		var offsetX = picX - outPicY;
		var offsetY = picY - outPicY;

		bufferY  += strideY  * offsetY             + offsetX;
		bufferCb += strideCb * offsetY / vertRatio + offsetX / horizRatio;
		bufferCr += strideCr * offsetY / vertRatio + offsetX / horizRatio;
		picY = outPicY;
		picX = outPicX;

		var chromaPicX = outPicX * chromaWidth / width;
		var chromaPicY = outPicY * chromaHeight / height;
		var chromaPicWidth = picWidth * chromaWidth / width;
		var chromaPicHeight = picHeight * chromaHeight / height;

		var isOriginal = (picWidth === format['cropWidth'])
					  && (picHeight === format['cropHeight']);
		if (isOriginal) {
			// This feels wrong, but in practice the WebM VP8 files I've found
			// with non-square pixels list 1920x1080 in the WebM header for
			// display size but 1440x1080 in the VP8 frame.
			//
			// Using the container-derived info to override for the original
			// resolution gets these files working, while allowing VP8 and VP9
			// files that change resolution and specify their pixels properly
			// to keep working.
			displayWidth = format['displayWidth'];
			displayHeight = format['displayHeight'];
		}

		// Try to recycle existing frame buffers.
		// This will keep from ballooning memory usage
		// between garbage collection cycles.
		var recycled = Module['recycledFrames'],
			frame,
			lenY = height * width,
			lenCb = chromaHeight * chromaWidth,
			lenCr = chromaHeight * chromaWidth,
			lenBuffer = lenY + lenCb + lenCr,
			offsetY = 0,
			offsetCb = offsetY + lenY,
			offsetCr = offsetCb + lenCb;
		while (recycled.length > 0) {
			var next = recycled.shift(),
				format = next['format'];
			if (format['width'] === width &&
				format['height'] === height &&
				format['chromaWidth'] === chromaWidth &&
				format['chromaHeight'] === chromaHeight &&
				format['cropLeft'] === picX &&
				format['cropTop'] === picY &&
				format['cropWidth'] === picWidth &&
				format['cropHeight'] === picHeight &&
				format['displayWidth'] === displayWidth &&
				format['displayHeight'] === displayHeight &&
				next['buffer'].byteLength === lenBuffer &&
				next['y']['bytes'].length === lenY &&
				next['u']['bytes'].length === lenCb &&
				next['v']['bytes'].length === lenCr
			) {
				frame = next;
				break;
			}
		}
		if (!frame) {
			var buffer = new ArrayBuffer(lenBuffer);
			frame = {
				'format': {
					'width': width,
					'height': height,
					'chromaWidth': chromaWidth,
					'chromaHeight': chromaHeight,
					'cropLeft': picX,
					'cropTop': picY,
					'cropWidth': picWidth,
					'cropHeight': picHeight,
					'displayWidth': displayWidth,
					'displayHeight': displayHeight
				},
				'buffer': buffer,
				'y': {
					'bytes': new Uint8Array(buffer, offsetY, lenY),
					'stride': width
				},
				'u': {
					'bytes': new Uint8Array(buffer, offsetCb, lenCb),
					'stride': chromaWidth
				},
				'v': {
					'bytes': new Uint8Array(buffer, offsetCr, lenCr),
					'stride': chromaWidth
				}
			};
		}
		copyAndTrim(frame['y']['bytes'], bufferY, strideY, width, height, picX, picY, picWidth, picHeight, 0);
		copyAndTrim(frame['u']['bytes'], bufferCb, strideCb, chromaWidth, chromaHeight, chromaPicX, chromaPicY, chromaPicWidth, chromaPicHeight, 128);
		copyAndTrim(frame['v']['bytes'], bufferCr, strideCr, chromaWidth, chromaHeight, chromaPicX, chromaPicY, chromaPicWidth, chromaPicHeight, 128);

		// And queue up the output buffer!
		Module['frameBuffer'] = frame;
	},
	
	ogvjs_callback_async_complete: function(ret, cpuTime) {
		var callback = Module.callbacks.shift();
		Module['cpuTime'] += cpuTime;
		callback(ret);
		return;
	}

});
