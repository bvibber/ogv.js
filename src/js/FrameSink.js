/**
 * @param HTMLCanvasElement canvas
 * @constructor
 */
var YCbCr = require("./YCbCr.js");

function FrameSink(canvas, videoInfo) {
	var self = this,
		ctx = canvas.getContext('2d'),
		imageData = null,
		resampleCanvas = null,
		resampleContext = null;



	function initImageData(width, height) {
		imageData = ctx.createImageData(width, height);

		// Prefill the alpha to opaque
		var data = imageData.data,
			pixelCount = width * height * 4;
		for (var i = 0; i < pixelCount; i += 4) {
			data[i + 3] = 255;
		}
	}

	function initResampleCanvas() {
		resampleCanvas = document.createElement('canvas');
		resampleCanvas.width = videoInfo.picWidth;
		resampleCanvas.height = videoInfo.picHeight;
		resampleContext = resampleCanvas.getContext('2d');
	}

	/**
	 * Actually draw a frame into the canvas.
	 */
	self.drawFrame = function drawFrame(yCbCrBuffer) {
		if (imageData === null ||
				imageData.width != yCbCrBuffer.width ||
				imageData.height != yCbCrBuffer.height) {
			initImageData(yCbCrBuffer.width, yCbCrBuffer.height);
		}
		YCbCr.convertYCbCr(yCbCrBuffer, imageData.data);

		var resample = (videoInfo.picWidth != videoInfo.displayWidth || videoInfo.picHeight != videoInfo.displayHeight);
		var drawContext;
		if (resample) {
			// hack for non-square aspect-ratio
			// putImageData doesn't resample, so we have to draw in two steps.
			if (!resampleCanvas) {
				initResampleCanvas();
			}
			drawContext = resampleContext;
		} else {
			drawContext = ctx;
		}

		drawContext.putImageData(imageData,
						         0, 0,
						         videoInfo.picX, videoInfo.picY,
						         videoInfo.picWidth, videoInfo.picHeight);

		if (resample) {
			ctx.drawImage(resampleCanvas, 0, 0, videoInfo.displayWidth, videoInfo.displayHeight);
		}
	};

	self.clear = function() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	};

	return self;
}

module.exports = FrameSink;
