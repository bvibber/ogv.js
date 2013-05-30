var callbacks = [];
function AVMakeCallback(fn) {
    callbacks.push(fn);
    return callbacks.length - 1;
}

function AVRemoveCallback(callback) {
    callbacks.splice(callback, 1);
}