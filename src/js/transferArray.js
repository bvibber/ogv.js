/**
 * Copy or transfer a byte array and its underlying ArrayBuffer.
 * @param {Uint8Array} data array to copy or move
 * @param {ArrayBuffer[]} transfer optional list of ArrayBuffers to transfer
 */
export function transferArray(data, transfer=[]) {
    if (data.buffer in transfer) {
        return new Uint8Array(data.buffer.transfer(data.byteLength), data.byteOffset);
    }
    return new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
}
