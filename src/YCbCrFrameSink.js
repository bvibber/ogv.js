/**
 * Warning: canvas must not have been used for 2d drawing prior!
 *
 * @todo allow for cropping the picture area
 * @todo allow for stride not being actual width
 *
 * @todo make it not horribly slow on IE 11
 *
 * @param HTMLCanvasElement canvas
 * @constructor
 */
function YCbCrFrameSink(canvas) {
	var self = this,
		gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl'),
		debug = false; // swap this to enable more error checks, which can slow down rendering
	
	if (gl == null) {
		throw new Error('WebGL unavailable; falling back to 2d canvas');
	}
	console.log('Using WebGL canvas for video drawing');

	// GL!
	function checkError() {
		if (debug) {
			err = gl.getError();
			if (err != 0) {
				throw new Error("GL error " + err);
			}
		}
	}
	
	function compileShader(type, source) {
		var shader = gl.createShader(type);
		console.log(shader);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			var err = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			throw new Error('GL shader compilation for ' + type + ' failed: ' + err);
		}
	
		return shader;
	}


	var vertexShader,
		fragmentShader,
		program,
		buffer,
		err;
	
	// In the world of GL there are no rectangles.
	// There are only triangles.
	// THERE IS NO SPOON.
	var rectangle = new Float32Array([
		// First triangle (top left, clockwise)
		-1.0, -1.0,
		+1.0, -1.0,
		-1.0, +1.0,

		// Second triangle (bottom right, clockwise)
		-1.0, +1.0,
		+1.0, -1.0,
		+1.0, +1.0
	]);

	var textureRectangle = new Float32Array([
		0, 0,
		1, 0,
		0, 1,
		0, 1,
		1, 0,
		1, 1
	]);

	var textures = {};
	function attachTexture(name, register, index, width, height, data) {
		var texture;
		if (textures[name]) {
			// Reuse & update the existing texture
			texture = textures[name];
		} else {
			textures[name] = texture = gl.createTexture();
		}
		checkError();
		gl.activeTexture(register);
		checkError();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		checkError();
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
		checkError();
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		checkError();
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		checkError();
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		checkError();
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		checkError();
		
		gl.texImage2D(
			gl.TEXTURE_2D,
			0, // mip level
			gl.RGBA, // internal format
			width, height,
			0, // border
			gl.RGBA, // format
			gl.UNSIGNED_BYTE, //type
			data // data!
		);
		checkError();
	
		gl.uniform1i(gl.getUniformLocation(program, name), index);
		checkError();
		
		return texture;
	}

	function init(yCbCrBuffer) {
		vertexShader = compileShader(gl.VERTEX_SHADER,
			'attribute vec2 aPosition;\n' +
			'attribute vec2 aTexturePosition;\n' +
			'varying vec2 vTexturePosition;\n' +
			'void main() {\n' +
			'    gl_Position = vec4(aPosition, 0, 1);\n' +
			'    vTexturePosition = aTexturePosition;\n' +
			'}'
		);
		// inspired by https://github.com/mbebenita/Broadway/blob/master/Player/canvas.js
		// extra 'stripe' texture fiddling to work around IE 11's lack of gl.LUMINANCE or gl.ALPHA textures
		fragmentShader = compileShader(gl.FRAGMENT_SHADER,
			'precision mediump float;\n' +
			'uniform sampler2D uStripeLuma;\n' +
			'uniform sampler2D uStripeChroma;\n' +
			'uniform sampler2D uTextureY;\n' +
			'uniform sampler2D uTextureCb;\n' +
			'uniform sampler2D uTextureCr;\n' +
			'varying vec2 vTexturePosition;\n' +
			'void main() {\n' +
			'   // Y, Cb, and Cr planes are mapped into a pseudo-RGBA texture\n' +
			'   // so we can upload them without expanding the bytes on IE 11\n' +
			'   // which doesn\'t allow LUMINANCE or ALPHA textures.\n' +
			'   // The stripe textures mark which channel to keep for each pixel.\n' +
			'   vec4 vStripeLuma = texture2D(uStripeLuma, vTexturePosition);\n' +
			'   vec4 vStripeChroma = texture2D(uStripeChroma, vTexturePosition);\n' +
			'\n' +
			'   // Each texture extraction will contain the relevant value in one\n' +
			'   // channel only.\n' +
			'   vec4 vY = texture2D(uTextureY, vTexturePosition) * vStripeLuma;\n' +
			'   vec4 vCb = texture2D(uTextureCb, vTexturePosition) * vStripeChroma;\n' +
			'   vec4 vCr = texture2D(uTextureCr, vTexturePosition) * vStripeChroma;\n' +
			'\n' +
			'   // Now assemble that into a YUV vector, and premultipy the Y...\n' +
			'   vec3 YUV = vec3(\n' +
			'     (vY.x  + vY.y  + vY.z  + vY.w) * 1.1643828125,\n' +
			'     (vCb.x + vCb.y + vCb.z + vCb.w),\n' +
			'     (vCr.x + vCr.y + vCr.z + vCr.w)\n' +
			'   );\n' +
			'   // And convert that to RGB!\n' +
			'   gl_FragColor = vec4(\n' +
			'     YUV.x + 1.59602734375 * YUV.z - 0.87078515625,\n' +
			'     YUV.x - 0.39176171875 * YUV.y - 0.81296875 * YUV.z + 0.52959375,\n' +
			'     YUV.x + 2.017234375   * YUV.y - 1.081390625,\n' +
			'     1\n' +
			'   );\n' +
			'}'
		);
	
		program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		checkError();

		gl.attachShader(program, fragmentShader);
		checkError();

		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			var err = gl.getProgramInfoLog(program);
			gl.deleteProgram(program);
			throw new Error('GL program linking failed: ' + err);
		}

		gl.useProgram(program);
		checkError();
		
		function buildStripe(width, height) {
			var len = width * height,
				out = new Uint32Array(len);
			for (var i = 0; i < len; i += 4) {
				out[i    ] = 0x000000ff;
				out[i + 1] = 0x0000ff00;
				out[i + 2] = 0x00ff0000;
				out[i + 3] = 0xff000000;
			}
			return new Uint8Array(out.buffer);
		}
		
		var textureY = attachTexture(
			'uStripeLuma',
			gl.TEXTURE0,
			0,
			yCbCrBuffer.strideY,
			yCbCrBuffer.height,
			buildStripe(yCbCrBuffer.strideY, yCbCrBuffer.height)
		);
		var textureY = attachTexture(
			'uStripeChroma',
			gl.TEXTURE1,
			1,
			yCbCrBuffer.strideCb,
			yCbCrBuffer.height >> yCbCrBuffer.vdec,
			buildStripe(yCbCrBuffer.strideCb, yCbCrBuffer.height >> yCbCrBuffer.vdec)
		);
	}
	
	self.drawFrame = function(yCbCrBuffer) {
		if (!program) {
			console.log('initializing gl program');
			init(yCbCrBuffer);
		}

		// Set up the rectangle and draw it

		//
		// Set up geometry
		//
		
		buffer = gl.createBuffer();
		checkError();

		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		checkError();

		gl.bufferData(gl.ARRAY_BUFFER, rectangle, gl.STATIC_DRAW);
		checkError();

		var positionLocation = gl.getAttribLocation(program, 'aPosition');
		checkError();

		gl.enableVertexAttribArray(positionLocation);
		checkError();

		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
		checkError();





		// Set up the texture geometry...

		var texturePositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, texturePositionBuffer);
		checkError();
		
		gl.bufferData(gl.ARRAY_BUFFER, textureRectangle, gl.STATIC_DRAW);
		checkError();
		
		var texturePositionLocation = gl.getAttribLocation(program, 'aTexturePosition');
		checkError();
		
		gl.enableVertexAttribArray(texturePositionLocation);
		checkError();
		
		gl.vertexAttribPointer(texturePositionLocation, 2, gl.FLOAT, false, 0, 0);
		checkError();
		
		// Create the textures...
		var textureY = attachTexture(
			'uTextureY',
			gl.TEXTURE2,
			2,
			yCbCrBuffer.strideY / 4,
			yCbCrBuffer.height,
			yCbCrBuffer.bytesY
		);
		var textureCb = attachTexture(
			'uTextureCb',
			gl.TEXTURE3,
			3,
			yCbCrBuffer.strideCb / 4,
			yCbCrBuffer.height >> yCbCrBuffer.vdec,
			yCbCrBuffer.bytesCb
		);
		var textureCr = attachTexture(
			'uTextureCr',
			gl.TEXTURE4,
			4,
			yCbCrBuffer.strideCr / 4,
			yCbCrBuffer.height >> yCbCrBuffer.vdec,
			yCbCrBuffer.bytesCr
		);

		// Aaaaand draw stuff.
		gl.drawArrays(gl.TRIANGLES, 0, rectangle.length / 2);
		checkError();
	};

	return self;
}

