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
import { encodeSLIP, SLIPDecoder } from "./slip.core.ts";

enum TestMode {
    Full,
    Encode,
    Unescape,
}

function benchRandomData(
    group: string,
    sizeLabel: string,
    size: number,
    mode: TestMode,
) {
    Deno.bench({
        name: `${group} ${sizeLabel} random data`,
        // group,
        fn: (ctx: Deno.BenchContext) => {
            const decoder = new SLIPDecoder();
            const data = new Uint8Array(size);
            crypto.getRandomValues(data);
            if (mode !== TestMode.Unescape) {
                ctx.start();
            }
            const encoded = encodeSLIP(data);
            if (mode === TestMode.Unescape) {
                ctx.start();
            }
            if (mode === TestMode.Encode) {
                ctx.end();
            }
            const decoded = [...decoder.decode(encoded)];
            if (mode !== TestMode.Encode) {
                ctx.end();
            }
            assertEquals(decoded, [data]);
        },
    });
}

benchRandomData("ENC    ", " 20B", 20, TestMode.Encode);
benchRandomData("ENC    ", "200B", 200, TestMode.Encode);
benchRandomData("ENC    ", " 2kB", 2000, TestMode.Encode);
benchRandomData("DEC    ", " 20B", 20, TestMode.Unescape);
benchRandomData("DEC    ", "200B", 200, TestMode.Unescape);
benchRandomData("DEC    ", " 2kB", 2000, TestMode.Unescape);
benchRandomData("ENC+DEC", " 20B", 20, TestMode.Full);
benchRandomData("ENC+DEC", "200B", 200, TestMode.Full);
benchRandomData("ENC+DEC", " 2kB", 2000, TestMode.Full);
