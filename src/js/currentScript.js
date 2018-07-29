//
// Simplified partial polyfill for document.currentScript for IE 11.
// Inspired by https://github.com/JamesMGreene/currentExecutingScript
// but trying to actually polyfill currentScript more or less correctly
// instead of doing something different.
//
// Won't work in some cases, such as inline scripts, but seems enough
// for patching up emscripten 1.38.10's usage in initialization.
//
// (c) 2018 Brion Vibber
// MIT license, see bundled COPYING file.
//

(function() {

    var global = this;

    function currentScript() {
        // Get a stack trace
        var stack = '';
        try {
            throw new Error();
        } catch (e) {
            stack = e.stack;
        }
        var lines = stack.split("\n");

        // The last line should be "Global code" if we're in immediate
        // script execution; otherwise we'd return null.
        var last = lines[lines.length - 1];
        var matches = last.match(/^ *at Global code \((.*):\d+:\d+\)/);
        if (matches) {
            var url = matches[1];

            // Look for the script with matching src.
            // Can't use an attribute selector, as that'll match against
            // the attribute value which may be a relative path.
            var scripts = document.querySelectorAll('script');
            for (var i = 0; i < scripts.length; i++) {
                var el = scripts[i];
                if (el.src === url) {
                    return el;
                }
            }
        }
        return null;
    }

    function polyfill() {
        if (typeof document === 'object' && !('currentScript' in document)) {
            Object.defineProperty(document, 'currentScript', {
                get: currentScript
            });
        }
    }

    module.exports = {
        currentScript: currentScript,
        polyfill: polyfill
    };
})();

