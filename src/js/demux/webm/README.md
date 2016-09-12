# Webm Demuxer
A javascript implementation of the Webm Demuxer (matroska).

Building for the OGV.js project.

## Algorithm Overview
The demuxer holds a queue of arrayBuffers which are sent in from the main player controller.
 The difficulty lies in the way the buffers come in. In order to achieve progressive downloading, we must parse the data
as it comes in, but it is not possible to ensure that the elements will be completely contained in one chunk 
ie: the elements can be arbitrarily broken up across one ore more incoming buffers.

__Main goal__ : To parse the incoming buffers without unnecessary rewrites. The only write will be the time the final frame buffer is made which will be sent off to the decoders.

### DataInterface Class
* `receiveInput(data)` receives arrayBuffer chunks of arbitrary length, adds to queue
* `process(data:ArrayBuffer)` is called from main loop
    * Parse as much as possible then exit.
    * Must pick up parsing where it left off.
    * Not possible to know if enough data available to parse.

### Matroska Parsing
The matroska format uses the EBML principal, which is essentially a type of markdown language like xml which can be applied to binary files. The elements come in 2 basic types: container types, which contain sub elements called __Master Elements__, and 7 data type elements. All elements contain a 2 part header, plus their payload. The header contains an id, which can range in length from 1 to 4 bytes, and a size which ranges from 1 to 8 bytes. __Vint__ or variable sized integers, used for the id and size contain the length of their respective integer in the first byte.

The algorithm will then work as follows:
* Read first byte
* Calculate byte width of Vint
* Test if there are enough bytes available in current buffer
    * If yes, read entire Vint
    * If not, use buffered read method saving state at each position (more overhead)
* At each stage check if there are remaining bytes
    * If no, dequeue buffer
        * If no more buffers, return null or false (can't decide yet)
* Upon next call to process, must pick up where it left off
 

__Example of Element spread across 2 buffers__

![Alt](./EBML.png)

__Closeup of Vint or Element ID__

![Alt](./vint.png)

# API

## Properties
`audioCodec` String describing the audio codec

`audioFormat`

`videoCodec` Plain text readable video codec string

`videoFormat`

`videoPackets`

`audioPackets`

`loadedMetadata`

`frameReady`

`audioReady`

`cpuTime`

`duration`

`tracks`

`processing`

`seekable`

## Methods
`onseek`

`init():Promise`

`receiveInput`

`process(data:ArrayBuffer):Promise`

`dequeueAudioPacket(callback)`

`dequeueVideoPacket(callback)`

`flush(callback)`

`getKeypointOffset(timeSeconds, callback)`

`seekToKeypoint(timeSeconds, callback)`

`onpacket: function(event:Event)|null`

`getKeypointOffset(timeSeconds:number):Promise`

`flush():Promise`

`close()`




