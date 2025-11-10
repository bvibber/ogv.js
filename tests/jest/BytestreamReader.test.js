import {
    BytestreamReader,
    BufferQueueReader
} from '../../src/js/BytestreamReader.js';

function reader(...byteArrays) {
    const input = new BufferQueueReader();
    for (const arr of byteArrays) {
        const data = new Uint8Array(arr);
        input.appendData(data, [data.buffer]);
    }
    return input;
}

test('available() reports expected read availability', () => {
    const zero = [];
    expect(reader(zero).available(0)).toBe(true);
    expect(reader(zero).available(1)).toBe(false);

    const one = [1];
    expect(reader(one).available(0)).toBe(true);
    expect(reader(one).available(1)).toBe(true);
    expect(reader(one).available(2)).toBe(false);

    const two = [1, 2];
    expect(reader(two).available(0)).toBe(true);
    expect(reader(two).available(1)).toBe(true);
    expect(reader(two).available(2)).toBe(true);
    expect(reader(two).available(3)).toBe(false);

    expect(reader(one, two).available(0)).toBe(true);
    expect(reader(one, two).available(1)).toBe(true);
    expect(reader(one, two).available(2)).toBe(true);
    expect(reader(one, two).available(3)).toBe(true);
    expect(reader(one, two).available(4)).toBe(false);
});

test('reserveRead() throws beyond expected read availability', () => {
    const zero = [];
    reader(zero).available(0);
    expect(() => reader(zero).reserveRead(1)).toThrow();

    const one = [1];
    reader(one).reserveRead(0);
    reader(one).reserveRead(1);
    expect(() => reader(one).reserveRead(2)).toThrow();

    const two = [1, 2];
    reader(two).reserveRead(0);
    reader(two).reserveRead(1);
    reader(two).reserveRead(2);
    expect(() => reader(two).reserveRead(3)).toThrow();

    reader(one, two).reserveRead(0);
    reader(one, two).reserveRead(1);
    reader(one, two).reserveRead(2);
    reader(one, two).reserveRead(3);
    expect(() => reader(one, two).reserveRead(4)).toThrow();
});

const bytes = [
    0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77,
    0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff
];
const sliced = [bytes.slice(0, 5), bytes.slice(5)];

function derive(nbytes, method, littleEndian=false) {
    let source = new DataView(new Uint8Array(bytes).buffer);
    let dest = [];
    for (let i = 0; i < bytes.length / nbytes; i++) {
        dest[i] = source[method](i * nbytes, littleEndian);
    }
    return dest;
}

const uint8s = derive(1, 'getUint8');
const int8s = derive(1, 'getInt8');
const uint16bes = derive(2, 'getUint16');
const uint16les = derive(2, 'getUint16', true);
const int16bes = derive(2, 'getInt16');
const int16les = derive(2, 'getInt16', true);
const uint32bes = derive(4, 'getUint32');
const uint32les = derive(4, 'getUint32', true);
const int32bes = derive(4, 'getInt32');
const int32les = derive(4, 'getInt32', true);
const biguint64bes = derive(8, 'getBigUint64');
const biguint64les = derive(8, 'getBigUint64', true);
const bigint64bes = derive(8, 'getBigInt64');
const bigint64les = derive(8, 'getBigInt64', true);

function readTest(method, expected, expectedLittleEndian=false) {
    const run = (expectedResults, littleEndian=false) => {
        test(`${method}(${littleEndian}) works on single buffer`, () => {
            const input = reader(bytes);
            for (let val of expectedResults) {
                expect(input[method](littleEndian)).toBe(val);
            }
            expect(input.available(1)).toBe(false);
        });

        test(`${method}(${littleEndian}) works on a split buffer`, () => {
            const input = reader(...sliced);
            for (let val of expectedResults) {
                expect(input[method](littleEndian)).toBe(val);
            }
            expect(input.available(1)).toBe(false);
        });
    };

    run(expected);
    if (expectedLittleEndian) {
        run(expectedLittleEndian, true);
    }
}

readTest('readByte', bytes);
readTest('readUint8', uint8s);
readTest('readInt8', int8s);
readTest('readUint16', uint16bes, uint16les);
readTest('readInt16', int16bes, int16les);
readTest('readUint32', uint32bes, uint32les);
readTest('readInt32', int32bes, int32les);
readTest('readBigUint64', biguint64bes, biguint64les);
readTest('readBigInt64', bigint64bes, bigint64les);

test(`readBytes() works on single buffer`, () => {
    const input = reader(bytes);
    let result = input.readBytes(bytes.length);
    expect(result.length).toBe(bytes.length);
    for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBe(bytes[i]);
    }
    expect(input.available(1)).toBe(false);
});

test(`readBytes() works on a split buffer`, () => {
    const input = reader(...sliced);
    let result = input.readBytes(bytes.length);
    expect(result.length).toBe(bytes.length);
    for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBe(bytes[i]);
    }
    expect(input.available(1)).toBe(false);
});
