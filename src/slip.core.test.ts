/**
 * @license LGPL-2.1-or-later
 *
 * @Deno-PLC / SLIP
 *
 * Copyright (C) 2023 - 2024 Hans Schallmoser
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301
 * USA or see <https://www.gnu.org/licenses/>.
 */

import { assertEquals } from "@std/assert";
import { encodeSLIP, SLIP, SLIPDecoder } from "./slip.core.ts";

function assertEncode(
    input: Uint8Array,
    encoded: Uint8Array,
    terminateStart = false,
) {
    assertEquals(encodeSLIP(input, { terminateStart }), encoded);
}

Deno.test("encodeSLIP", () => {
    // basic packet
    assertEncode(
        new Uint8Array([1, 2, 3]),
        new Uint8Array([1, 2, 3, SLIP.END]),
    );

    // basic packet with terminateStart
    assertEncode(
        new Uint8Array([1, 2, 3]),
        new Uint8Array([SLIP.END, 1, 2, 3, SLIP.END]),
        true,
    );

    // empty packet
    assertEncode(
        new Uint8Array([]),
        new Uint8Array([SLIP.END]),
    );

    // empty packet with terminateStart
    // same as `empty packet` as we don't need two END
    assertEncode(
        new Uint8Array([]),
        new Uint8Array([SLIP.END]),
        true,
    );

    // escape END
    assertEncode(
        new Uint8Array([1, SLIP.END]),
        new Uint8Array([1, SLIP.ESC, SLIP.ESC_END, SLIP.END]),
    );
    assertEncode(
        new Uint8Array([SLIP.END]),
        new Uint8Array([SLIP.ESC, SLIP.ESC_END, SLIP.END]),
    );

    // escape ESC
    assertEncode(
        new Uint8Array([1, SLIP.ESC]),
        new Uint8Array([1, SLIP.ESC, SLIP.ESC_ESC, SLIP.END]),
    );
    assertEncode(
        new Uint8Array([SLIP.ESC]),
        new Uint8Array([SLIP.ESC, SLIP.ESC_ESC, SLIP.END]),
    );

    // don't escape ESC_END
    assertEncode(
        new Uint8Array([1, SLIP.ESC_END]),
        new Uint8Array([1, SLIP.ESC_END, SLIP.END]),
    );

    // don't escape ESC_ESC
    assertEncode(
        new Uint8Array([1, SLIP.ESC_ESC]),
        new Uint8Array([1, SLIP.ESC_ESC, SLIP.END]),
    );

    // escape multi
    assertEncode(
        new Uint8Array([1, SLIP.ESC, 5, SLIP.END]),
        new Uint8Array([
            1,
            SLIP.ESC,
            SLIP.ESC_ESC,
            5,
            SLIP.ESC,
            SLIP.ESC_END,
            SLIP.END,
        ]),
    );
    assertEncode(
        new Uint8Array([1, SLIP.ESC, SLIP.END]),
        new Uint8Array([
            1,
            SLIP.ESC,
            SLIP.ESC_ESC,
            SLIP.ESC,
            SLIP.ESC_END,
            SLIP.END,
        ]),
    );
    assertEncode(
        new Uint8Array([SLIP.ESC, SLIP.END]),
        new Uint8Array([
            SLIP.ESC,
            SLIP.ESC_ESC,
            SLIP.ESC,
            SLIP.ESC_END,
            SLIP.END,
        ]),
    );
    assertEncode(
        new Uint8Array([1, SLIP.END, SLIP.END]),
        new Uint8Array([
            1,
            SLIP.ESC,
            SLIP.ESC_END,
            SLIP.ESC,
            SLIP.ESC_END,
            SLIP.END,
        ]),
    );
    assertEncode(
        new Uint8Array([SLIP.END, SLIP.END]),
        new Uint8Array([
            SLIP.ESC,
            SLIP.ESC_END,
            SLIP.ESC,
            SLIP.ESC_END,
            SLIP.END,
        ]),
    );
    assertEncode(
        new Uint8Array([1, SLIP.END, SLIP.ESC]),
        new Uint8Array([
            1,
            SLIP.ESC,
            SLIP.ESC_END,
            SLIP.ESC,
            SLIP.ESC_ESC,
            SLIP.END,
        ]),
    );
    assertEncode(
        new Uint8Array([SLIP.END, SLIP.ESC]),
        new Uint8Array([
            SLIP.ESC,
            SLIP.ESC_END,
            SLIP.ESC,
            SLIP.ESC_ESC,
            SLIP.END,
        ]),
    );
    assertEncode(
        new Uint8Array([1, SLIP.ESC, SLIP.ESC]),
        new Uint8Array([
            1,
            SLIP.ESC,
            SLIP.ESC_ESC,
            SLIP.ESC,
            SLIP.ESC_ESC,
            SLIP.END,
        ]),
    );
    assertEncode(
        new Uint8Array([SLIP.ESC, SLIP.ESC]),
        new Uint8Array([
            SLIP.ESC,
            SLIP.ESC_ESC,
            SLIP.ESC,
            SLIP.ESC_ESC,
            SLIP.END,
        ]),
    );
});

function assertDecode(
    encoded: Uint8Array,
    decoded: Uint8Array | null,
    ignoreEmptyPackets = false,
) {
    const decoder = new SLIPDecoder();
    decoder.ignore_empty_packets = ignoreEmptyPackets;
    assertEquals(
        [...decoder.decode(encoded)],
        [
            decoded,
        ].filter(($) => !!$),
    );
}

Deno.test("decodeSLIP", () => {
    // basic packet
    assertDecode(
        new Uint8Array([1, 2, 3, SLIP.END]),
        new Uint8Array([1, 2, 3]),
    );

    // empty packet
    assertDecode(
        new Uint8Array([SLIP.END]),
        new Uint8Array([]),
    );

    // empty packet ignore
    assertDecode(
        new Uint8Array([SLIP.END]),
        null,
        true,
    );

    // unescape END
    assertDecode(
        new Uint8Array([1, SLIP.ESC, SLIP.ESC_END, 5, SLIP.END]),
        new Uint8Array([1, SLIP.END, 5]),
    );

    // unescape ESC
    assertDecode(
        new Uint8Array([1, SLIP.ESC, SLIP.ESC_ESC, 5, SLIP.END]),
        new Uint8Array([1, SLIP.ESC, 5]),
    );

    // don't unescape ESC_END
    assertDecode(
        new Uint8Array([1, SLIP.ESC_END, 5, SLIP.END]),
        new Uint8Array([1, SLIP.ESC_END, 5]),
    );

    // don't unescape ESC_ESC
    assertDecode(
        new Uint8Array([1, SLIP.ESC_ESC, 5, SLIP.END]),
        new Uint8Array([1, SLIP.ESC_ESC, 5]),
    );

    // escape multi
    assertDecode(
        new Uint8Array([
            1,
            SLIP.ESC,
            SLIP.ESC_ESC,
            5,
            SLIP.ESC,
            SLIP.ESC_END,
            5,
            SLIP.END,
        ]),
        new Uint8Array([1, SLIP.ESC, 5, SLIP.END, 5]),
    );
});

function test_fragmented(packets: Uint8Array[]) {
    const transmitted = new Uint8Array(
        packets.map(($) => [...encodeSLIP($)]).flat(),
    );
    for (let split = 0; split < transmitted.length; split++) {
        const decoder = new SLIPDecoder();

        const $1 = decoder.decode(transmitted.slice(0, split));
        const $2 = decoder.decode(transmitted.slice(split));
        assertEquals([...$1, ...$2], packets);
    }
}

Deno.test("decode fragmented packet", () => {
    test_fragmented([
        new Uint8Array([1, SLIP.ESC, 3]),
        new Uint8Array([4, 5, 6]),
    ]);
    test_fragmented([
        new Uint8Array([1, SLIP.ESC, SLIP.END]),
        new Uint8Array(crypto.getRandomValues(new Uint8Array(200))),
    ]);
});

Deno.test("encode/decode 50x10kB random data", () => {
    const data = new Uint8Array(10_000);
    for (let i = 0; i < 50; i++) {
        crypto.getRandomValues(data);
        const decoder = new SLIPDecoder();
        assertEquals([...decoder.decode(encodeSLIP(data))], [data]);
    }
});
