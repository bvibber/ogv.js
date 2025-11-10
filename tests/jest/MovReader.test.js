import {BufferQueueReader} from '../../src/js/BytestreamReader.js';

import {Box, MovReader} from '../../src/js/MovReader.js';

function reader(...byteArrays) {
    const input = new BufferQueueReader();
    for (let arr of byteArrays) {
        if (typeof arr === 'string') {
            arr = Array.from(arr).map((char) => char.charCodeAt(0));
        }
        const data = new Uint8Array(arr);
        input.appendData(data, [data.buffer]);
    }
    return input;
}

const ftyp = [
    // size
    [0x00, 0x00, 0x00, 0x20],
    // type
    'ftyp',
    // major
    'isom',
    // minor
    [0x00, 0x00, 0x02, 0x00],
    // compatibleBrands
    'isom', 'iso2', 'avc1', 'mp41'
];

test('box initializes size and type', () => {
    const input = reader(...ftyp);
    const size = 0x20;

    const box = new Box(input);
    expect(box.size).toBe(size);
    expect(box.type).toBe('ftyp');

    const remaining = size - 8;
    expect(box.remaining).toBe(remaining);
    expect(box.available(remaining - 1)).toBe(true);
    expect(box.available(remaining)).toBe(true);
    expect(box.available(remaining + 1)).toBe(false);
});
