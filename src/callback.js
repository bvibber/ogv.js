mergeInto(LibraryManager.library, {
	AVCallback: function AVCallback(callbackId, packet, bytes) {
    callbacks[callbackId](packet, bytes);
	}
});