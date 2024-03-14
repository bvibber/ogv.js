
// Define an allocator and blit function for float arrays
// Can be used to achieve backwards compatibility down to dark ages pre IE 10 if needed
// Also reduces code size a little with closure.

export var VH = { 
	float_array: function(len) { return new Float32Array(len); },
	blit: function(src, spos, dest, dpos, len) { dest.set(src.subarray(spos,spos+len),dpos); }
};

// Pre-IE10 versions:
/*VH.prototype.float_array = function(len) { return new Array(len); }
VH.prototype.blit = function(src, spos, dest, dpos, len) { for(var i=0;i<len;i++) dest[dpos+i] = src[spos+i]; };*/
