# Deno-PLC / SLIP

[![JSR Scope](https://jsr.io/badges/@deno-plc)](https://jsr.io/@deno-plc)

TypeScript implementation of
[SLIP (Serial Line Internet Protocol)](https://en.wikipedia.org/wiki/Serial_Line_Internet_Protocol)

## Installation

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
