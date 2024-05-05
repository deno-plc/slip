# [Deno-PLC](https://github.com/deno-plc) / [SLIP](https://jsr.io/@deno-plc/slip)

TypeScript implementation of
[SLIP (Serial Line Internet Protocol)](https://en.wikipedia.org/wiki/Serial_Line_Internet_Protocol)

## Installation

Use JSR:
[![JSR](https://jsr.io/badges/@deno-plc/slip)](https://jsr.io/@deno-plc/slip)

## Usage

### Encoder

```ts
import { encodeSLIP } from "@deno-plc/slip";

const myData = new Uint8Array(/* ... */);

const myEncodedData = encodeSLIP(myData);
```

### Decoder

```ts
import { SLIPDecoder } from "@deno-plc/slip";

const decoder = new SLIPDecoder();

const recvData = new Uint8Array(/* ... */);

for (const packet of decoder.decode(recvData)) {
    // ...
}
```

Note that the `SLIPDecoder` must be instantiated in order to handle fragmented
packets (which is the purpose of SLIP)

### Streams

You can also pipe your data through the provided transform streams.

```ts
import { SLIPEncoderStream, SLIPDecoderStream } from "@deno-plc/slip";

/* ... */.pipeThrough(new SLIPEncoderStream()).pipeTo(/* ... */);

/* ... */.pipeThrough(new SLIPDecoderStream()).pipeTo(/* ... */);
```

### Encoder options

```ts
const options = {
    // When enabled an 0xc0 (SLIP.END) is inserted at the frame start.
    terminateStart: true,
};
encodeSLIP(myData, options);
// or
new SLIPEncoderStream(options);
```

### Decoder options

```ts
const decoder = new SLIPDecoder();
// if you are using the stream decoder, use `SLIPDecoderStream.decoder`

// Default value should be fine for most use cases.
// In case you have alternating big and small packets you
// might want to set this to the size of the biggest packets
// in order to prevent unnecessary memory allocations
decoder.max_carry_oversize = 200;

// When enabled (default), empty packets are ignored
decoder.ignore_empty_packets = false;
```

### `0xC0` frame start?

If you are using RS232 or a similar transport medium, you should send an empty
packet (only contains the 0xC0 termination code) before doing anything useful in
order to terminate any previously disrupted transmissions. On such raw transport
layers you might also wish to add some kind of validation (for example a CRC8
checksum). Although supported (`SLIPEncoderOptions.terminateStart`), adding a
`0xC0` to the beginning of every frame is not required. If you do so (or the
software at the other end) make sure to not set the
`SLIPDecoder.ignore_empty_packets` to `false` because additional termination
codes effectively emit empty frames.

## License (LGPL-2.1-or-later)

(C) 2023 - 2024 Hans Schallmoser

This library is free software; you can redistribute it and/or modify it under
the terms of the GNU Lesser General Public License as published by the Free
Software Foundation; either version 2.1 of the License, or (at your option) any
later version.

This library is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along
with this library; if not, write to the Free Software Foundation, Inc., 51
Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA or see
https://www.gnu.org/licenses/
