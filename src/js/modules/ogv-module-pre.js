/* global Module:true */
var options = Module;

if (typeof OGVLoader !== 'undefined') {
	Module['pthreadMainPrefixURL'] = OGVLoader.base + '/';
}
if (Module['memoryLimit']) {
	Module['TOTAL_MEMORY'] = options['memoryLimit'];
}
