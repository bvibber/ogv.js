// inspired by https://github.com/mbebenita/Broadway/blob/master/Player/canvas.js
// extra 'stripe' texture fiddling to work around IE 11's poor performance on gl.LUMINANCE and gl.ALPHA textures

precision mediump float;
uniform sampler2D uStripeLuma;
uniform sampler2D uStripeChroma;
uniform sampler2D uTextureY;
uniform sampler2D uTextureCb;
uniform sampler2D uTextureCr;
varying vec2 vLumaPosition;
varying vec2 vChromaPosition;
void main() {
   // Y, Cb, and Cr planes are mapped into a pseudo-RGBA texture
   // so we can upload them without expanding the bytes on IE 11
   // which doesn\'t allow LUMINANCE or ALPHA textures.
   // The stripe textures mark which channel to keep for each pixel.
   vec4 vStripeLuma = texture2D(uStripeLuma, vLumaPosition);
   vec4 vStripeChroma = texture2D(uStripeChroma, vChromaPosition);

   // Each texture extraction will contain the relevant value in one
   // channel only.
   vec4 vY = texture2D(uTextureY, vLumaPosition) * vStripeLuma;
   vec4 vCb = texture2D(uTextureCb, vChromaPosition) * vStripeChroma;
   vec4 vCr = texture2D(uTextureCr, vChromaPosition) * vStripeChroma;

   // Now assemble that into a YUV vector, and premultipy the Y...
   vec3 YUV = vec3(
     (vY.x  + vY.y  + vY.z  + vY.w) * 1.1643828125,
     (vCb.x + vCb.y + vCb.z + vCb.w),
     (vCr.x + vCr.y + vCr.z + vCr.w)
   );
   // And convert that to RGB!
   gl_FragColor = vec4(
     YUV.x + 1.59602734375 * YUV.z - 0.87078515625,
     YUV.x - 0.39176171875 * YUV.y - 0.81296875 * YUV.z + 0.52959375,
     YUV.x + 2.017234375   * YUV.y - 1.081390625,
     1
   );
}
