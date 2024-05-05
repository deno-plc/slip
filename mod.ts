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

import {
    encodeSLIP,
    SLIPDecoder,
    type SLIPEncoderOptions,
} from "./src/slip.core.ts";
export { encodeSLIP, SLIPDecoder } from "./src/slip.core.ts";

/**
 * SLIP decoder as a TransformStream
 */
export class SLIPDecoderStream extends TransformStream<Uint8Array, Uint8Array> {
    /**
     * set options on the {@link SLIPDecoder}
     */
    public readonly decoder: SLIPDecoder = new SLIPDecoder();
    constructor() {
        super({
            transform: (chunk, controller) => {
                for (const packet of this.decoder.decode(chunk)) {
                    controller.enqueue(packet);
                }
            },
        });
    }
}

/**
 * SLIP encoder as a TransformStream
 */
export class SLIPEncoderStream extends TransformStream<Uint8Array, Uint8Array> {
    constructor(options: SLIPEncoderOptions = {}) {
        super({
            transform: (chunk, controller) => {
                controller.enqueue(encodeSLIP(chunk, options));
            },
        });
    }
}
