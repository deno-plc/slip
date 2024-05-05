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

/**
 * Definition of the escape codes
 */
export enum SLIP {
    END = 192,
    ESC = 219,
    ESC_END = 220,
    ESC_ESC = 221,
}

export interface SLIPEncoderOptions {
    /**
     * When enabled an 0xc0 (SLIP.END) is inserted at the frame start.
     * (default false)
     */
    terminateStart?: boolean;
}

/**
 * SLIP encoder
 */
export function encodeSLIP(
    chunk: Uint8Array,
    options: SLIPEncoderOptions = {},
): Uint8Array {
    if (chunk.length === 0) {
        // ultra fast forward
        return new Uint8Array([SLIP.END]);
    }
    const terminateStart = options.terminateStart ?? false;
    if (chunk.indexOf(SLIP.END) === -1 && chunk.indexOf(SLIP.ESC) === -1) {
        // fast forward
        if (terminateStart) {
            const res = new Uint8Array(chunk.length + 2);
            res[0] = SLIP.END;
            res.set(chunk, 1);
            res[chunk.length + 1] = SLIP.END;
            return res;
        } else {
            const res = new Uint8Array(chunk.length + 1);
            res.set(chunk, 0);
            res[chunk.length] = SLIP.END;
            return res;
        }
    } else {
        // this relatively simple approach has been shown to be 1.5 to 10 times faster than slicing buffers (depending on the data)
        const result = new Uint8Array(
            chunk.length * 2 + (terminateStart ? 2 : 1),
        );
        let result_offset = 0;

        if (terminateStart) {
            result[result_offset] = SLIP.END;
            result_offset++;
        }

        for (let i = 0; i < chunk.length; i++) {
            const byte = chunk[i];
            if (byte === SLIP.END) {
                result[result_offset] = SLIP.ESC;
                result_offset++;
                result[result_offset] = SLIP.ESC_END;
                result_offset++;
            } else if (byte === SLIP.ESC) {
                result[result_offset] = SLIP.ESC;
                result_offset++;
                result[result_offset] = SLIP.ESC_ESC;
                result_offset++;
            } else {
                result[result_offset] = byte;
                result_offset++;
            }
        }
        result[result_offset] = SLIP.END;
        result_offset++;
        return result.slice(0, result_offset);
    }
}

/**
 * SLIP decoder (needs to be instantiated to handle fragmented packets)
 */
export class SLIPDecoder {
    /**
     * Default value should be fine for most use cases.
     * In case you have alternating big and small packets you
     * might want to set this to the size of the biggest packets
     * in order to prevent unnecessary memory allocations
     */
    public max_carry_oversize = 100;

    /**
     * When enabled (default), empty packets are ignored
     */
    public ignore_empty_packets = true;

    #carry = new Uint8Array(0);
    #carrySize = 0;
    #esc = false;

    /**
     * Call this for every chunk of data you receive
     * @returns Generator of the packets that were encoded within the chunk and previously received incomplete ones
     */
    public *decode(chunk: Uint8Array): Generator<Uint8Array> {
        // maximum amount of data that might be be cached
        // = the amount that is carried + the new data
        const max_size = this.#carrySize + chunk.length;
        // check if the carry could be reused
        const reuse = max_size <= this.#carry.length;

        const b = reuse ? this.#carry : new Uint8Array(max_size + 10);
        if (!reuse && this.#carrySize > 0) {
            b.set(this.#carry);
        }
        let bi = this.#carrySize;

        for (let i = 0; i < chunk.length; i++) {
            const char = chunk[i];
            if (this.#esc) {
                if (char === SLIP.ESC_END) {
                    b[bi] = SLIP.END;
                } else if (char === SLIP.ESC_ESC) {
                    b[bi] = SLIP.ESC;
                } else {
                    console.error(`invalid SLIP escape code ${char}`);
                }
                bi++;
                this.#esc = false;
            } else if (char === SLIP.ESC) {
                this.#esc = true;
            } else if (char === SLIP.END) {
                if (!this.ignore_empty_packets || bi !== 0) {
                    yield b.slice(0, bi);
                }
                bi = 0;
                this.#esc = false;
            } else {
                b[bi] = char;
                bi++;
            }
        }

        this.#carrySize = bi;
        if (b.length < (bi - this.max_carry_oversize)) {
            this.#carry = b;
        } else if (bi > 0) {
            // prevent the carry from getting too large
            this.#carry = b.slice(0, bi);
        }
    }
}
