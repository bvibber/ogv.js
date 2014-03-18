/**
 * Basic YCbCr->RGB conversion
 *
 * @author Brion Vibber <brion@pobox.com>
 * @copyright 2014
 * @license MIT-style
 */

// Believe it or not these ifs are faster than ?:
// and WAY faster than a function call!
#define CLAMP_FFFF(val) if (val & 0xffff0000) { \
							if (val < 0) { \
								val = 0; \
							} else { \
								val = 0xffff; \
							} \
						}

// This gets repetitive.
#define PIXEL_OUT(ptr) 	r = multY + multCrR; \
						g = multY - multCbCrG; \
						b = multY + multCbB; \
						CLAMP_FFFF(r); \
						CLAMP_FFFF(g); \
						CLAMP_FFFF(b); \
						ptr++; \
						output[ptr++] = r >> 8; \
						output[ptr++] = g >> 8; \
						output[ptr++] = b >> 8;


/**
 * Assumes that the output array already has alpha channel set to opaque.
 */
void convertYCbCr(unsigned char *bytesY, unsigned char *bytesCb, unsigned char *bytesCr,
				  int strideY, int strideCb, int strideCr,
				  int width, int height,
				  int hdec, int vdec,
				  unsigned char *output)
{
	int outStride = 4 * width,
		YPtr = 0, Y0Ptr = 0, Y1Ptr = 0,
		CbPtr = 0, CrPtr = 0,
		outPtr = 0, outPtr0 = 0, outPtr1 = 0,
		colorCb = 0, colorCr = 0,
		multY = 0, multCrR = 0, multCbCrG = 0, multCbB = 0,
		x = 0, y = 0, xdec = 0, ydec = 0,
		r = 0, g = 0, b = 0;

	// Interestingly, the rest of this program after the variable declarations
	// is the same in C and ActionScript. :D
	if (hdec == vdec == 1) {
		// Optimize for 4:2:0, which is most common
		outPtr0 = 0;
		outPtr1 = outStride;
		ydec = 0;
		for (y = 0; y < height; y += 2) {
			Y0Ptr = y * strideY;
			Y1Ptr = Y0Ptr + strideY;
			CbPtr = ydec * strideCb;
			CrPtr = ydec * strideCr;
			for (x = 0; x < width; x += 2) {
				colorCb = bytesCb[CbPtr++];
				colorCr = bytesCr[CrPtr++];

				// Quickie YUV conversion
				// https://en.wikipedia.org/wiki/YCbCr#ITU-R_BT.2020_conversion
				// multiplied by 256 for integer-friendliness
				multCrR   = (409 * colorCr) - 57088;
				multCbCrG = (100 * colorCb) + (208 * colorCr) - 34816;
				multCbB   = (516 * colorCb) - 70912;

				multY = (298 * bytesY[Y0Ptr++]);
				PIXEL_OUT(outPtr0);

				multY = (298 * bytesY[Y0Ptr++]);
				PIXEL_OUT(outPtr0);

				multY = (298 * bytesY[Y1Ptr++]);
				PIXEL_OUT(outPtr1);

				multY = (298 * bytesY[Y1Ptr++]);
				PIXEL_OUT(outPtr1);
			}
			outPtr0 += outStride;
			outPtr1 += outStride;
			ydec++;
		}
	} else {
		outPtr = 0;
		for (y = 0; y < height; y++) {
			xdec = 0;
			ydec = y >> vdec;
			YPtr = y * strideY;
			CbPtr = ydec * strideCb;
			CrPtr = ydec * strideCr;

			for (x = 0; x < width; x++) {
				xdec = x >> hdec;
				colorCb = bytesCb[CbPtr + xdec];
				colorCr = bytesCr[CrPtr + xdec];

				// Quickie YUV conversion
				// https://en.wikipedia.org/wiki/YCbCr#ITU-R_BT.2020_conversion
				// multiplied by 256 for integer-friendliness
				multCrR   = (409 * colorCr) - 57088;
				multCbCrG = (100 * colorCb) + (208 * colorCr) - 34816;
				multCbB   = (516 * colorCb) - 70912;

				multY = 298 * bytesY[YPtr++];
				PIXEL_OUT(outPtr);
			}
		}
	}
}
