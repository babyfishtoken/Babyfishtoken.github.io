const __$G = (typeof globalThis !== 'undefined' ? globalThis: typeof window !== 'undefined' ? window: typeof global !== 'undefined' ? global: typeof self !== 'undefined' ? self: {});
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ethers = {}));
})(this, (function (exports) { 'use strict';

    /* Do NOT modify this file; see /src.ts/_admin/update-version.ts */
    /**
     *  The current version of Ethers.
     */
    const version = "6.15.0";

    /**
     *  Property helper functions.
     *
     *  @_subsection api/utils:Properties  [about-properties]
     */
    function checkType(value, type, name) {
        const types = type.split("|").map(t => t.trim());
        for (let i = 0; i < types.length; i++) {
            switch (type) {
                case "any":
                    return;
                case "bigint":
                case "boolean":
                case "number":
                case "string":
                    if (typeof (value) === type) {
                        return;
                    }
            }
        }
        const error = new Error(`invalid value for type ${type}`);
        error.code = "INVALID_ARGUMENT";
        error.argument = `value.${name}`;
        error.value = value;
        throw error;
    }
    /**
     *  Resolves to a new object that is a copy of %%value%%, but with all
     *  values resolved.
     */
    async function resolveProperties(value) {
        const keys = Object.keys(value);
        const results = await Promise.all(keys.map((k) => Promise.resolve(value[k])));
        return results.reduce((accum, v, index) => {
            accum[keys[index]] = v;
            return accum;
        }, {});
    }
    /**
     *  Assigns the %%values%% to %%target%% as read-only values.
     *
     *  It %%types%% is specified, the values are checked.
     */
    function defineProperties(target, values, types) {
        for (let key in values) {
            let value = values[key];
            const type = (types ? types[key] : null);
            if (type) {
                checkType(value, type, key);
            }
            Object.defineProperty(target, key, { enumerable: true, value, writable: false });
        }
    }

    /**
     *  All errors in ethers include properties to ensure they are both
     *  human-readable (i.e. ``.message``) and machine-readable (i.e. ``.code``).
     *
     *  The [[isError]] function can be used to check the error ``code`` and
     *  provide a type guard for the properties present on that error interface.
     *
     *  @_section: api/utils/errors:Errors  [about-errors]
     */
    function stringify$1(value, seen) {
        if (value == null) {
            return "null";
        }
        if (seen == null) {
            seen = new Set();
        }
        if (typeof (value) === "object") {
            if (seen.has(value)) {
                return "[Circular]";
            }
            seen.add(value);
        }
        if (Array.isArray(value)) {
            return "[ " + (value.map((v) => stringify$1(v, seen))).join(", ") + " ]";
        }
        if (value instanceof Uint8Array) {
            const HEX = "0123456789abcdef";
            let result = "0x";
            for (let i = 0; i < value.length; i++) {
                result += HEX[value[i] >> 4];
                result += HEX[value[i] & 0xf];
            }
            return result;
        }
        if (typeof (value) === "object" && typeof (value.toJSON) === "function") {
            return stringify$1(value.toJSON(), seen);
        }
        switch (typeof (value)) {
            case "boolean":
            case "number":
            case "symbol":
                return value.toString();
            case "bigint":
                return BigInt(value).toString();
            case "string":
                return JSON.stringify(value);
            case "object": {
                const keys = Object.keys(value);
                keys.sort();
                return "{ " + keys.map((k) => `${stringify$1(k, seen)}: ${stringify$1(value[k], seen)}`).join(", ") + " }";
            }
        }
        return `[ COULD NOT SERIALIZE ]`;
    }
    /**
     *  Returns true if the %%error%% matches an error thrown by ethers
     *  that matches the error %%code%%.
     *
     *  In TypeScript environments, this can be used to check that %%error%%
     *  matches an EthersError type, which means the expected properties will
     *  be set.
     *
     *  @See [ErrorCodes](api:ErrorCode)
     *  @example
     *    try {
     *      // code....
     *    } catch (e) {
     *      if (isError(e, "CALL_EXCEPTION")) {
     *          // The Type Guard has validated this object
     *          console.log(e.data);
     *      }
     *    }
     */
    function isError(error, code) {
        return (error && error.code === code);
    }
    /**
     *  Returns true if %%error%% is a [[CallExceptionError].
     */
    function isCallException(error) {
        return isError(error, "CALL_EXCEPTION");
    }
    /**
     *  Returns a new Error configured to the format ethers emits errors, with
     *  the %%message%%, [[api:ErrorCode]] %%code%% and additional properties
     *  for the corresponding EthersError.
     *
     *  Each error in ethers includes the version of ethers, a
     *  machine-readable [[ErrorCode]], and depending on %%code%%, additional
     *  required properties. The error message will also include the %%message%%,
     *  ethers version, %%code%% and all additional properties, serialized.
     */
    function makeError(message, code, info) {
        let shortMessage = message;
        {
            const details = [];
            if (info) {
                if ("message" in info || "code" in info || "name" in info) {
                    throw new Error(`value will overwrite populated values: ${stringify$1(info)}`);
                }
                for (const key in info) {
                    if (key === "shortMessage") {
                        continue;
                    }
                    const value = (info[key]);
                    //                try {
                    details.push(key + "=" + stringify$1(value));
                    //                } catch (error: any) {
                    //                console.log("MMM", error.message);
                    //                    details.push(key + "=[could not serialize object]");
                    //                }
                }
            }
            details.push(`code=${code}`);
            details.push(`version=${version}`);
            if (details.length) {
                message += " (" + details.join(", ") + ")";
            }
        }
        let error;
        switch (code) {
            case "INVALID_ARGUMENT":
                error = new TypeError(message);
                break;
            case "NUMERIC_FAULT":
            case "BUFFER_OVERRUN":
                error = new RangeError(message);
                break;
            default:
                error = new Error(message);
        }
        defineProperties(error, { code });
        if (info) {
            Object.assign(error, info);
        }
        if (error.shortMessage == null) {
            defineProperties(error, { shortMessage });
        }
        return error;
    }
    /**
     *  Throws an EthersError with %%message%%, %%code%% and additional error
     *  %%info%% when %%check%% is falsish..
     *
     *  @see [[api:makeError]]
     */
    function assert(check, message, code, info) {
        if (!check) {
            throw makeError(message, code, info);
        }
    }
    /**
     *  A simple helper to simply ensuring provided arguments match expected
     *  constraints, throwing if not.
     *
     *  In TypeScript environments, the %%check%% has been asserted true, so
     *  any further code does not need additional compile-time checks.
     */
    function assertArgument(check, message, name, value) {
        assert(check, message, "INVALID_ARGUMENT", { argument: name, value: value });
    }
    function assertArgumentCount(count, expectedCount, message) {
        if (message == null) {
            message = "";
        }
        if (message) {
            message = ": " + message;
        }
        assert(count >= expectedCount, "missing argument" + message, "MISSING_ARGUMENT", {
            count: count,
            expectedCount: expectedCount
        });
        assert(count <= expectedCount, "too many arguments" + message, "UNEXPECTED_ARGUMENT", {
            count: count,
            expectedCount: expectedCount
        });
    }
    const _normalizeForms = ["NFD", "NFC", "NFKD", "NFKC"].reduce((accum, form) => {
        try {
            // General test for normalize
            /* c8 ignore start */
            if ("test".normalize(form) !== "test") {
                throw new Error("bad");
            }
            ;
            /* c8 ignore stop */
            if (form === "NFD") {
                const check = String.fromCharCode(0xe9).normalize("NFD");
                const expected = String.fromCharCode(0x65, 0x0301);
                /* c8 ignore start */
                if (check !== expected) {
                    throw new Error("broken");
                }
                /* c8 ignore stop */
            }
            accum.push(form);
        }
        catch (error) { }
        return accum;
    }, []);
    /**
     *  Throws if the normalization %%form%% is not supported.
     */
    function assertNormalize(form) {
        assert(_normalizeForms.indexOf(form) >= 0, "platform missing String.prototype.normalize", "UNSUPPORTED_OPERATION", {
            operation: "String.prototype.normalize", info: { form }
        });
    }
    /**
     *  Many classes use file-scoped values to guard the constructor,
     *  making it effectively private. This facilitates that pattern
     *  by ensuring the %%givenGaurd%% matches the file-scoped %%guard%%,
     *  throwing if not, indicating the %%className%% if provided.
     */
    function assertPrivate(givenGuard, guard, className) {
        if (className == null) {
            className = "";
        }
        if (givenGuard !== guard) {
            let method = className, operation = "new";
            if (className) {
                method += ".";
                operation += " " + className;
            }
            assert(false, `private constructor; use ${method}from* methods`, "UNSUPPORTED_OPERATION", {
                operation
            });
        }
    }

    /**
     *  Some data helpers.
     *
     *
     *  @_subsection api/utils:Data Helpers  [about-data]
     */
    function _getBytes(value, name, copy) {
        if (value instanceof Uint8Array) {
            if (copy) {
                return new Uint8Array(value);
            }
            return value;
        }
        if (typeof (value) === "string" && value.match(/^0x(?:[0-9a-f][0-9a-f])*$/i)) {
            const result = new Uint8Array((value.length - 2) / 2);
            let offset = 2;
            for (let i = 0; i < result.length; i++) {
                result[i] = parseInt(value.substring(offset, offset + 2), 16);
                offset += 2;
            }
            return result;
        }
        assertArgument(false, "invalid BytesLike value", name || "value", value);
    }
    /**
     *  Get a typed Uint8Array for %%value%%. If already a Uint8Array
     *  the original %%value%% is returned; if a copy is required use
     *  [[getBytesCopy]].
     *
     *  @see: getBytesCopy
     */
    function getBytes(value, name) {
        return _getBytes(value, name, false);
    }
    /**
     *  Get a typed Uint8Array for %%value%%, creating a copy if necessary
     *  to prevent any modifications of the returned value from being
     *  reflected elsewhere.
     *
     *  @see: getBytes
     */
    function getBytesCopy(value, name) {
        return _getBytes(value, name, true);
    }
    /**
     *  Returns true if %%value%% is a valid [[HexString]].
     *
     *  If %%length%% is ``true`` or a //number//, it also checks that
     *  %%value%% is a valid [[DataHexString]] of %%length%% (if a //number//)
     *  bytes of data (e.g. ``0x1234`` is 2 bytes).
     */
    function isHexString(value, length) {
        if (typeof (value) !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
            return false;
        }
        if (typeof (length) === "number" && value.length !== 2 + 2 * length) {
            return false;
        }
        if (length === true && (value.length % 2) !== 0) {
            return false;
        }
        return true;
    }
    /**
     *  Returns true if %%value%% is a valid representation of arbitrary
     *  data (i.e. a valid [[DataHexString]] or a Uint8Array).
     */
    function isBytesLike(value) {
        return (isHexString(value, true) || (value instanceof Uint8Array));
    }
    const HexCharacters = "0123456789abcdef";
    /**
     *  Returns a [[DataHexString]] representation of %%data%%.
     */
    function hexlify(data) {
        const bytes = getBytes(data);
        let result = "0x";
        for (let i = 0; i < bytes.length; i++) {
            const v = bytes[i];
            result += HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f];
        }
        return result;
    }
    /**
     *  Returns a [[DataHexString]] by concatenating all values
     *  within %%data%%.
     */
    function concat(datas) {
        return "0x" + datas.map((d) => hexlify(d).substring(2)).join("");
    }
    /**
     *  Returns the length of %%data%%, in bytes.
     */
    function dataLength(data) {
        if (isHexString(data, true)) {
            return (data.length - 2) / 2;
        }
        return getBytes(data).length;
    }
    /**
     *  Returns a [[DataHexString]] by slicing %%data%% from the %%start%%
     *  offset to the %%end%% offset.
     *
     *  By default %%start%% is 0 and %%end%% is the length of %%data%%.
     */
    function dataSlice(data, start, end) {
        const bytes = getBytes(data);
        if (end != null && end > bytes.length) {
            assert(false, "cannot slice beyond data bounds", "BUFFER_OVERRUN", {
                buffer: bytes, length: bytes.length, offset: end
            });
        }
        return hexlify(bytes.slice((start == null) ? 0 : start, (end == null) ? bytes.length : end));
    }
    /**
     *  Return the [[DataHexString]] result by stripping all **leading**
     ** zero bytes from %%data%%.
     */
    function stripZerosLeft(data) {
        let bytes = hexlify(data).substring(2);
        while (bytes.startsWith("00")) {
            bytes = bytes.substring(2);
        }
        return "0x" + bytes;
    }
    function zeroPad(data, length, left) {
        const bytes = getBytes(data);
        assert(length >= bytes.length, "padding exceeds data length", "BUFFER_OVERRUN", {
            buffer: new Uint8Array(bytes),
            length: length,
            offset: length + 1
        });
        const result = new Uint8Array(length);
        result.fill(0);
        if (left) {
            result.set(bytes, length - bytes.length);
        }
        else {
            result.set(bytes, 0);
        }
        return hexlify(result);
    }
    /**
     *  Return the [[DataHexString]] of %%data%% padded on the **left**
     *  to %%length%% bytes.
     *
     *  If %%data%% already exceeds %%length%%, a [[BufferOverrunError]] is
     *  thrown.
     *
     *  This pads data the same as **values** are in Solidity
     *  (e.g. ``uint128``).
     */
    function zeroPadValue(data, length) {
        return zeroPad(data, length, true);
    }
    /**
     *  Return the [[DataHexString]] of %%data%% padded on the **right**
     *  to %%length%% bytes.
     *
     *  If %%data%% already exceeds %%length%%, a [[BufferOverrunError]] is
     *  thrown.
     *
     *  This pads data the same as **bytes** are in Solidity
     *  (e.g. ``bytes16``).
     */
    function zeroPadBytes(data, length) {
        return zeroPad(data, length, false);
    }

    /**
     *  Some mathematic operations.
     *
     *  @_subsection: api/utils:Math Helpers  [about-maths]
     */
    const BN_0$a = BigInt(0);
    const BN_1$5 = BigInt(1);
    //const BN_Max256 = (BN_1 << BigInt(256)) - BN_1;
    // IEEE 754 support 53-bits of mantissa
    const maxValue = 0x1fffffffffffff;
    /**
     *  Convert %%value%% from a twos-compliment representation of %%width%%
     *  bits to its value.
     *
     *  If the highest bit is ``1``, the result will be negative.
     */
    function fromTwos(_value, _width) {
        const value = getUint(_value, "value");
        const width = BigInt(getNumber(_width, "width"));
        assert((value >> width) === BN_0$a, "overflow", "NUMERIC_FAULT", {
            operation: "fromTwos", fault: "overflow", value: _value
        });
        // Top bit set; treat as a negative value
        if (value >> (width - BN_1$5)) {
            const mask = (BN_1$5 << width) - BN_1$5;
            return -(((~value) & mask) + BN_1$5);
        }
        return value;
    }
    /**
     *  Convert %%value%% to a twos-compliment representation of
     *  %%width%% bits.
     *
     *  The result will always be positive.
     */
    function toTwos(_value, _width) {
        let value = getBigInt(_value, "value");
        const width = BigInt(getNumber(_width, "width"));
        const limit = (BN_1$5 << (width - BN_1$5));
        if (value < BN_0$a) {
            value = -value;
            assert(value <= limit, "too low", "NUMERIC_FAULT", {
                operation: "toTwos", fault: "overflow", value: _value
            });
            const mask = (BN_1$5 << width) - BN_1$5;
            return ((~value) & mask) + BN_1$5;
        }
        else {
            assert(value < limit, "too high", "NUMERIC_FAULT", {
                operation: "toTwos", fault: "overflow", value: _value
            });
        }
        return value;
    }
    /**
     *  Mask %%value%% with a bitmask of %%bits%% ones.
     */
    function mask(_value, _bits) {
        const value = getUint(_value, "value");
        const bits = BigInt(getNumber(_bits, "bits"));
        return value & ((BN_1$5 << bits) - BN_1$5);
    }
    /**
     *  Gets a BigInt from %%value%%. If it is an invalid value for
     *  a BigInt, then an ArgumentError will be thrown for %%name%%.
     */
    function getBigInt(value, name) {
        switch (typeof (value)) {
            case "bigint": return value;
            case "number":
                assertArgument(Number.isInteger(value), "underflow", name || "value", value);
                assertArgument(value >= -maxValue && value <= maxValue, "overflow", name || "value", value);
                return BigInt(value);
            case "string":
                try {
                    if (value === "") {
                        throw new Error("empty string");
                    }
                    if (value[0] === "-" && value[1] !== "-") {
                        return -BigInt(value.substring(1));
                    }
                    return BigInt(value);
                }
                catch (e) {
                    assertArgument(false, `invalid BigNumberish string: ${e.message}`, name || "value", value);
                }
        }
        assertArgument(false, "invalid BigNumberish value", name || "value", value);
    }
    /**
     *  Returns %%value%% as a bigint, validating it is valid as a bigint
     *  value and that it is positive.
     */
    function getUint(value, name) {
        const result = getBigInt(value, name);
        assert(result >= BN_0$a, "unsigned value cannot be negative", "NUMERIC_FAULT", {
            fault: "overflow", operation: "getUint", value
        });
        return result;
    }
    const Nibbles$1 = "0123456789abcdef";
    /*
     * Converts %%value%% to a BigInt. If %%value%% is a Uint8Array, it
     * is treated as Big Endian data.
     */
    function toBigInt(value) {
        if (value instanceof Uint8Array) {
            let result = "0x0";
            for (const v of value) {
                result += Nibbles$1[v >> 4];
                result += Nibbles$1[v & 0x0f];
            }
            return BigInt(result);
        }
        return getBigInt(value);
    }
    /**
     *  Gets a //number// from %%value%%. If it is an invalid value for
     *  a //number//, then an ArgumentError will be thrown for %%name%%.
     */
    function getNumber(value, name) {
        switch (typeof (value)) {
            case "bigint":
                assertArgument(value >= -maxValue && value <= maxValue, "overflow", name || "value", value);
                return Number(value);
            case "number":
                assertArgument(Number.isInteger(value), "underflow", name || "value", value);
                assertArgument(value >= -maxValue && value <= maxValue, "overflow", name || "value", value);
                return value;
            case "string":
                try {
                    if (value === "") {
                        throw new Error("empty string");
                    }
                    return getNumber(BigInt(value), name);
                }
                catch (e) {
                    assertArgument(false, `invalid numeric string: ${e.message}`, name || "value", value);
                }
        }
        assertArgument(false, "invalid numeric value", name || "value", value);
    }
    /**
     *  Converts %%value%% to a number. If %%value%% is a Uint8Array, it
     *  is treated as Big Endian data. Throws if the value is not safe.
     */
    function toNumber(value) {
        return getNumber(toBigInt(value));
    }
    /**
     *  Converts %%value%% to a Big Endian hexstring, optionally padded to
     *  %%width%% bytes.
     */
    function toBeHex(_value, _width) {
        const value = getUint(_value, "value");
        let result = value.toString(16);
        if (_width == null) {
            // Ensure the value is of even length
            if (result.length % 2) {
                result = "0" + result;
            }
        }
        else {
            const width = getNumber(_width, "width");
            assert(width * 2 >= result.length, `value exceeds width (${width} bytes)`, "NUMERIC_FAULT", {
                operation: "toBeHex",
                fault: "overflow",
                value: _value
            });
            // Pad the value to the required width
            while (result.length < (width * 2)) {
                result = "0" + result;
            }
        }
        return "0x" + result;
    }
    /**
     *  Converts %%value%% to a Big Endian Uint8Array.
     */
    function toBeArray(_value) {
        const value = getUint(_value, "value");
        if (value === BN_0$a) {
            return new Uint8Array([]);
        }
        let hex = value.toString(16);
        if (hex.length % 2) {
            hex = "0" + hex;
        }
        const result = new Uint8Array(hex.length / 2);
        for (let i = 0; i < result.length; i++) {
            const offset = i * 2;
            result[i] = parseInt(hex.substring(offset, offset + 2), 16);
        }
        return result;
    }
    /**
     *  Returns a [[HexString]] for %%value%% safe to use as a //Quantity//.
     *
     *  A //Quantity// does not have and leading 0 values unless the value is
     *  the literal value `0x0`. This is most commonly used for JSSON-RPC
     *  numeric values.
     */
    function toQuantity(value) {
        let result = hexlify(isBytesLike(value) ? value : toBeArray(value)).substring(2);
        while (result.startsWith("0")) {
            result = result.substring(1);
        }
        if (result === "") {
            result = "0";
        }
        return "0x" + result;
    }

    /**
     *  The [Base58 Encoding](link-base58) scheme allows a **numeric** value
     *  to be encoded as a compact string using a radix of 58 using only
     *  alpha-numeric characters. Confusingly similar characters are omitted
     *  (i.e. ``"l0O"``).
     *
     *  Note that Base58 encodes a **numeric** value, not arbitrary bytes,
     *  since any zero-bytes on the left would get removed. To mitigate this
     *  issue most schemes that use Base58 choose specific high-order values
     *  to ensure non-zero prefixes.
     *
     *  @_subsection: api/utils:Base58 Encoding [about-base58]
     */
    const Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let Lookup = null;
    function getAlpha(letter) {
        if (Lookup == null) {
            Lookup = {};
            for (let i = 0; i < Alphabet.length; i++) {
                Lookup[Alphabet[i]] = BigInt(i);
            }
        }
        const result = Lookup[letter];
        assertArgument(result != null, `invalid base58 value`, "letter", letter);
        return result;
    }
    const BN_0$9 = BigInt(0);
    const BN_58 = BigInt(58);
    /**
     *  Encode %%value%% as a Base58-encoded string.
     */
    function encodeBase58(_value) {
        const bytes = getBytes(_value);
        let value = toBigInt(bytes);
        let result = "";
        while (value) {
            result = Alphabet[Number(value % BN_58)] + result;
            value /= BN_58;
        }
        // Account for leading padding zeros
        for (let i = 0; i < bytes.length; i++) {
            if (bytes[i]) {
                break;
            }
            result = Alphabet[0] + result;
        }
        return result;
    }
    /**
     *  Decode the Base58-encoded %%value%%.
     */
    function decodeBase58(value) {
        let result = BN_0$9;
        for (let i = 0; i < value.length; i++) {
            result *= BN_58;
            result += getAlpha(value[i]);
        }
        return result;
    }

    // utils/base64-browser
    function decodeBase64(textData) {
        textData = atob(textData);
        const data = new Uint8Array(textData.length);
        for (let i = 0; i < textData.length; i++) {
            data[i] = textData.charCodeAt(i);
        }
        return getBytes(data);
    }
    function encodeBase64(_data) {
        const data = getBytes(_data);
        let textData = "";
        for (let i = 0; i < data.length; i++) {
            textData += String.fromCharCode(data[i]);
        }
        return btoa(textData);
    }

    /**
     *  Events allow for applications to use the observer pattern, which
     *  allows subscribing and publishing events, outside the normal
     *  execution paths.
     *
     *  @_section api/utils/events:Events  [about-events]
     */
    /**
     *  When an [[EventEmitterable]] triggers a [[Listener]], the
     *  callback always ahas one additional argument passed, which is
     *  an **EventPayload**.
     */
    class EventPayload {
        /**
         *  The event filter.
         */
        filter;
        /**
         *  The **EventEmitterable**.
         */
        emitter;
        #listener;
        /**
         *  Create a new **EventPayload** for %%emitter%% with
         *  the %%listener%% and for %%filter%%.
         */
        constructor(emitter, listener, filter) {
            this.#listener = listener;
            defineProperties(this, { emitter, filter });
        }
        /**
         *  Unregister the triggered listener for future events.
         */
        async removeListener() {
            if (this.#listener == null) {
                return;
            }
            await this.emitter.off(this.filter, this.#listener);
        }
    }

    /**
     *  Using strings in Ethereum (or any security-basd system) requires
     *  additional care. These utilities attempt to mitigate some of the
     *  safety issues as well as provide the ability to recover and analyse
     *  strings.
     *
     *  @_subsection api/utils:Strings and UTF-8  [about-strings]
     */
    function errorFunc(reason, offset, bytes, output, badCodepoint) {
        assertArgument(false, `invalid codepoint at offset ${offset}; ${reason}`, "bytes", bytes);
    }
    function ignoreFunc(reason, offset, bytes, output, badCodepoint) {
        // If there is an invalid prefix (including stray continuation), skip any additional continuation bytes
        if (reason === "BAD_PREFIX" || reason === "UNEXPECTED_CONTINUE") {
            let i = 0;
            for (let o = offset + 1; o < bytes.length; o++) {
                if (bytes[o] >> 6 !== 0x02) {
                    break;
                }
                i++;
            }
            return i;
        }
        // This byte runs us past the end of the string, so just jump to the end
        // (but the first byte was read already read and therefore skipped)
        if (reason === "OVERRUN") {
            return bytes.length - offset - 1;
        }
        // Nothing to skip
        return 0;
    }
    function replaceFunc(reason, offset, bytes, output, badCodepoint) {
        // Overlong representations are otherwise "valid" code points; just non-deistingtished
        if (reason === "OVERLONG") {
            assertArgument(typeof (badCodepoint) === "number", "invalid bad code point for replacement", "badCodepoint", badCodepoint);
            output.push(badCodepoint);
            return 0;
        }
        // Put the replacement character into the output
        output.push(0xfffd);
        // Otherwise, process as if ignoring errors
        return ignoreFunc(reason, offset, bytes);
    }
    /**
     *  A handful of popular, built-in UTF-8 error handling strategies.
     *
     *  **``"error"``** - throws on ANY illegal UTF-8 sequence or
     *  non-canonical (overlong) codepoints (this is the default)
     *
     *  **``"ignore"``** - silently drops any illegal UTF-8 sequence
     *  and accepts non-canonical (overlong) codepoints
     *
     *  **``"replace"``** - replace any illegal UTF-8 sequence with the
     *  UTF-8 replacement character (i.e. ``"\\ufffd"``) and accepts
     *  non-canonical (overlong) codepoints
     *
     *  @returns: Record<"error" | "ignore" | "replace", Utf8ErrorFunc>
     */
    const Utf8ErrorFuncs = Object.freeze({
        error: errorFunc,
        ignore: ignoreFunc,
        replace: replaceFunc
    });
    // http://stackoverflow.com/questions/13356493/decode-utf-8-with-javascript#13691499
    function getUtf8CodePoints(_bytes, onError) {
        if (onError == null) {
            onError = Utf8ErrorFuncs.error;
        }
        const bytes = getBytes(_bytes, "bytes");
        const result = [];
        let i = 0;
        // Invalid bytes are ignored
        while (i < bytes.length) {
            const c = bytes[i++];
            // 0xxx xxxx
            if (c >> 7 === 0) {
                result.push(c);
                continue;
            }
            // Multibyte; how many bytes left for this character?
            let extraLength = null;
            let overlongMask = null;
            // 110x xxxx 10xx xxxx
            if ((c & 0xe0) === 0xc0) {
                extraLength = 1;
                overlongMask = 0x7f;
                // 1110 xxxx 10xx xxxx 10xx xxxx
            }
            else if ((c & 0xf0) === 0xe0) {
                extraLength = 2;
                overlongMask = 0x7ff;
                // 1111 0xxx 10xx xxxx 10xx xxxx 10xx xxxx
            }
            else if ((c & 0xf8) === 0xf0) {
                extraLength = 3;
                overlongMask = 0xffff;
            }
            else {
                if ((c & 0xc0) === 0x80) {
                    i += onError("UNEXPECTED_CONTINUE", i - 1, bytes, result);
                }
                else {
                    i += onError("BAD_PREFIX", i - 1, bytes, result);
                }
                continue;
            }
            // Do we have enough bytes in our data?
            if (i - 1 + extraLength >= bytes.length) {
                i += onError("OVERRUN", i - 1, bytes, result);
                continue;
            }
            // Remove the length prefix from the char
            let res = c & ((1 << (8 - extraLength - 1)) - 1);
            for (let j = 0; j < extraLength; j++) {
                let nextChar = bytes[i];
                // Invalid continuation byte
                if ((nextChar & 0xc0) != 0x80) {
                    i += onError("MISSING_CONTINUE", i, bytes, result);
                    res = null;
                    break;
                }
                res = (res << 6) | (nextChar & 0x3f);
                i++;
            }
            // See above loop for invalid continuation byte
            if (res === null) {
                continue;
            }
            // Maximum code point
            if (res > 0x10ffff) {
                i += onError("OUT_OF_RANGE", i - 1 - extraLength, bytes, result, res);
                continue;
            }
            // Reserved for UTF-16 surrogate halves
            if (res >= 0xd800 && res <= 0xdfff) {
                i += onError("UTF16_SURROGATE", i - 1 - extraLength, bytes, result, res);
                continue;
            }
            // Check for overlong sequences (more bytes than needed)
            if (res <= overlongMask) {
                i += onError("OVERLONG", i - 1 - extraLength, bytes, result, res);
                continue;
            }
            result.push(res);
        }
        return result;
    }
    // http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
    /**
     *  Returns the UTF-8 byte representation of %%str%%.
     *
     *  If %%form%% is specified, the string is normalized.
     */
    function toUtf8Bytes(str, form) {
        assertArgument(typeof (str) === "string", "invalid string value", "str", str);
        if (form != null) {
            assertNormalize(form);
            str = str.normalize(form);
        }
        let result = [];
        for (let i = 0; i < str.length; i++) {
            const c = str.charCodeAt(i);
            if (c < 0x80) {
                result.push(c);
            }
            else if (c < 0x800) {
                result.push((c >> 6) | 0xc0);
                result.push((c & 0x3f) | 0x80);
            }
            else if ((c & 0xfc00) == 0xd800) {
                i++;
                const c2 = str.charCodeAt(i);
                assertArgument(i < str.length && ((c2 & 0xfc00) === 0xdc00), "invalid surrogate pair", "str", str);
                // Surrogate Pair
                const pair = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
                result.push((pair >> 18) | 0xf0);
                result.push(((pair >> 12) & 0x3f) | 0x80);
                result.push(((pair >> 6) & 0x3f) | 0x80);
                result.push((pair & 0x3f) | 0x80);
            }
            else {
                result.push((c >> 12) | 0xe0);
                result.push(((c >> 6) & 0x3f) | 0x80);
                result.push((c & 0x3f) | 0x80);
            }
        }
        return new Uint8Array(result);
    }
    //export 
    function _toUtf8String(codePoints) {
        return codePoints.map((codePoint) => {
            if (codePoint <= 0xffff) {
                return String.fromCharCode(codePoint);
            }
            codePoint -= 0x10000;
            return String.fromCharCode((((codePoint >> 10) & 0x3ff) + 0xd800), ((codePoint & 0x3ff) + 0xdc00));
        }).join("");
    }
    /**
     *  Returns the string represented by the UTF-8 data %%bytes%%.
     *
     *  When %%onError%% function is specified, it is called on UTF-8
     *  errors allowing recovery using the [[Utf8ErrorFunc]] API.
     *  (default: [error](Utf8ErrorFuncs))
     */
    function toUtf8String(bytes, onError) {
        return _toUtf8String(getUtf8CodePoints(bytes, onError));
    }
    /**
     *  Returns the UTF-8 code-points for %%str%%.
     *
     *  If %%form%% is specified, the string is normalized.
     */
    function toUtf8CodePoints(str, form) {
        return getUtf8CodePoints(toUtf8Bytes(str, form));
    }

    function createGetUrl(options) {
        async function getUrl(req, _signal) {
            assert(_signal == null || !_signal.cancelled, "request cancelled before sending", "CANCELLED");
            const protocol = req.url.split(":")[0].toLowerCase();
            assert(protocol === "http" || protocol === "https", `unsupported protocol ${protocol}`, "UNSUPPORTED_OPERATION", {
                info: { protocol },
                operation: "request"
            });
            assert(protocol === "https" || !req.credentials || req.allowInsecureAuthentication, "insecure authorized connections unsupported", "UNSUPPORTED_OPERATION", {
                operation: "request"
            });
            let error = null;
            const controller = new AbortController();
            const timer = setTimeout(() => {
                error = makeError("request timeout", "TIMEOUT");
                controller.abort();
            }, req.timeout);
            if (_signal) {
                _signal.addListener(() => {
                    error = makeError("request cancelled", "CANCELLED");
                    controller.abort();
                });
            }
            const init = Object.assign({}, options, {
                method: req.method,
                headers: new Headers(Array.from(req)),
                body: req.body || undefined,
                signal: controller.signal
            });
            let resp;
            try {
                resp = await fetch(req.url, init);
            }
            catch (_error) {
                clearTimeout(timer);
                if (error) {
                    throw error;
                }
                throw _error;
            }
            clearTimeout(timer);
            const headers = {};
            resp.headers.forEach((value, key) => {
                headers[key.toLowerCase()] = value;
            });
            const respBody = await resp.arrayBuffer();
            const body = (respBody == null) ? null : new Uint8Array(respBody);
            return {
                statusCode: resp.status,
                statusMessage: resp.statusText,
                headers, body
            };
        }
        return getUrl;
    }

    /**
     *  Fetching content from the web is environment-specific, so Ethers
     *  provides an abstraction that each environment can implement to provide
     *  this service.
     *
     *  On [Node.js](link-node), the ``http`` and ``https`` libs are used to
     *  create a request object, register event listeners and process data
     *  and populate the [[FetchResponse]].
     *
     *  In a browser, the [DOM fetch](link-js-fetch) is used, and the resulting
     *  ``Promise`` is waited on to retrieve the payload.
     *
     *  The [[FetchRequest]] is responsible for handling many common situations,
     *  such as redirects, server throttling, authentication, etc.
     *
     *  It also handles common gateways, such as IPFS and data URIs.
     *
     *  @_section api/utils/fetching:Fetching Web Content  [about-fetch]
     */
    const MAX_ATTEMPTS = 12;
    const SLOT_INTERVAL = 250;
    // The global FetchGetUrlFunc implementation.
    let defaultGetUrlFunc = createGetUrl();
    const reData = new RegExp("^data:([^;:]*)?(;base64)?,(.*)$", "i");
    const reIpfs = new RegExp("^ipfs:/\/(ipfs/)?(.*)$", "i");
    // If locked, new Gateways cannot be added
    let locked$5 = false;
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
    async function dataGatewayFunc(url, signal) {
        try {
            const match = url.match(reData);
            if (!match) {
                throw new Error("invalid data");
            }
            return new FetchResponse(200, "OK", {
                "content-type": (match[1] || "text/plain"),
            }, (match[2] ? decodeBase64(match[3]) : unpercent(match[3])));
        }
        catch (error) {
            return new FetchResponse(599, "BAD REQUEST (invalid data: URI)", {}, null, new FetchRequest(url));
        }
    }
    /**
     *  Returns a [[FetchGatewayFunc]] for fetching content from a standard
     *  IPFS gateway hosted at %%baseUrl%%.
     */
    function getIpfsGatewayFunc(baseUrl) {
        async function gatewayIpfs(url, signal) {
            try {
                const match = url.match(reIpfs);
                if (!match) {
                    throw new Error("invalid link");
                }
                return new FetchRequest(`${baseUrl}${match[2]}`);
            }
            catch (error) {
                return new FetchResponse(599, "BAD REQUEST (invalid IPFS URI)", {}, null, new FetchRequest(url));
            }
        }
        return gatewayIpfs;
    }
    const Gateways = {
        "data": dataGatewayFunc,
        "ipfs": getIpfsGatewayFunc("https:/\/gateway.ipfs.io/ipfs/")
    };
    const fetchSignals = new WeakMap();
    /**
     *  @_ignore
     */
    class FetchCancelSignal {
        #listeners;
        #cancelled;
        constructor(request) {
            this.#listeners = [];
            this.#cancelled = false;
            fetchSignals.set(request, () => {
                if (this.#cancelled) {
                    return;
                }
                this.#cancelled = true;
                for (const listener of this.#listeners) {
                    setTimeout(() => { listener(); }, 0);
                }
                this.#listeners = [];
            });
        }
        addListener(listener) {
            assert(!this.#cancelled, "singal already cancelled", "UNSUPPORTED_OPERATION", {
                operation: "fetchCancelSignal.addCancelListener"
            });
            this.#listeners.push(listener);
        }
        get cancelled() { return this.#cancelled; }
        checkSignal() {
            assert(!this.cancelled, "cancelled", "CANCELLED", {});
        }
    }
    // Check the signal, throwing if it is cancelled
    function checkSignal(signal) {
        if (signal == null) {
            throw new Error("missing signal; should not happen");
        }
        signal.checkSignal();
        return signal;
    }
    /**
     *  Represents a request for a resource using a URI.
     *
     *  By default, the supported schemes are ``HTTP``, ``HTTPS``, ``data:``,
     *  and ``IPFS:``.
     *
     *  Additional schemes can be added globally using [[registerGateway]].
     *
     *  @example:
     *    req = new FetchRequest("https://www.ricmoo.com")
     *    resp = await req.send()
     *    resp.body.length
     *    //_result:
     */
    class FetchRequest {
        #allowInsecure;
        #gzip;
        #headers;
        #method;
        #timeout;
        #url;
        #body;
        #bodyType;
        #creds;
        // Hooks
        #preflight;
        #process;
        #retry;
        #signal;
        #throttle;
        #getUrlFunc;
        /**
         *  The fetch URL to request.
         */
        get url() { return this.#url; }
        set url(url) {
            this.#url = String(url);
        }
        /**
         *  The fetch body, if any, to send as the request body. //(default: null)//
         *
         *  When setting a body, the intrinsic ``Content-Type`` is automatically
         *  set and will be used if **not overridden** by setting a custom
         *  header.
         *
         *  If %%body%% is null, the body is cleared (along with the
         *  intrinsic ``Content-Type``).
         *
         *  If %%body%% is a string, the intrinsic ``Content-Type`` is set to
         *  ``text/plain``.
         *
         *  If %%body%% is a Uint8Array, the intrinsic ``Content-Type`` is set to
         *  ``application/octet-stream``.
         *
         *  If %%body%% is any other object, the intrinsic ``Content-Type`` is
         *  set to ``application/json``.
         */
        get body() {
            if (this.#body == null) {
                return null;
            }
            return new Uint8Array(this.#body);
        }
        set body(body) {
            if (body == null) {
                this.#body = undefined;
                this.#bodyType = undefined;
            }
            else if (typeof (body) === "string") {
                this.#body = toUtf8Bytes(body);
                this.#bodyType = "text/plain";
            }
            else if (body instanceof Uint8Array) {
                this.#body = body;
                this.#bodyType = "application/octet-stream";
            }
            else if (typeof (body) === "object") {
                this.#body = toUtf8Bytes(JSON.stringify(body));
                this.#bodyType = "application/json";
            }
            else {
                throw new Error("invalid body");
            }
        }
        /**
         *  Returns true if the request has a body.
         */
        hasBody() {
            return (this.#body != null);
        }
        /**
         *  The HTTP method to use when requesting the URI. If no method
         *  has been explicitly set, then ``GET`` is used if the body is
         *  null and ``POST`` otherwise.
         */
        get method() {
            if (this.#method) {
                return this.#method;
            }
            if (this.hasBody()) {
                return "POST";
            }
            return "GET";
        }
        set method(method) {
            if (method == null) {
                method = "";
            }
            this.#method = String(method).toUpperCase();
        }
        /**
         *  The headers that will be used when requesting the URI. All
         *  keys are lower-case.
         *
         *  This object is a copy, so any changes will **NOT** be reflected
         *  in the ``FetchRequest``.
         *
         *  To set a header entry, use the ``setHeader`` method.
         */
        get headers() {
            const headers = Object.assign({}, this.#headers);
            if (this.#creds) {
                headers["authorization"] = `Basic ${encodeBase64(toUtf8Bytes(this.#creds))}`;
            }
            if (this.allowGzip) {
                headers["accept-encoding"] = "gzip";
            }
            if (headers["content-type"] == null && this.#bodyType) {
                headers["content-type"] = this.#bodyType;
            }
            if (this.body) {
                headers["content-length"] = String(this.body.length);
            }
            return headers;
        }
        /**
         *  Get the header for %%key%%, ignoring case.
         */
        getHeader(key) {
            return this.headers[key.toLowerCase()];
        }
        /**
         *  Set the header for %%key%% to %%value%%. All values are coerced
         *  to a string.
         */
        setHeader(key, value) {
            this.#headers[String(key).toLowerCase()] = String(value);
        }
        /**
         *  Clear all headers, resetting all intrinsic headers.
         */
        clearHeaders() {
            this.#headers = {};
        }
        [Symbol.iterator]() {
            const headers = this.headers;
            const keys = Object.keys(headers);
            let index = 0;
            return {
                next: () => {
                    if (index < keys.length) {
                        const key = keys[index++];
                        return {
                            value: [key, headers[key]], done: false
                        };
                    }
                    return { value: undefined, done: true };
                }
            };
        }
        /**
         *  The value that will be sent for the ``Authorization`` header.
         *
         *  To set the credentials, use the ``setCredentials`` method.
         */
        get credentials() {
            return this.#creds || null;
        }
        /**
         *  Sets an ``Authorization`` for %%username%% with %%password%%.
         */
        setCredentials(username, password) {
            assertArgument(!username.match(/:/), "invalid basic authentication username", "username", "[REDACTED]");
            this.#creds = `${username}:${password}`;
        }
        /**
         *  Enable and request gzip-encoded responses. The response will
         *  automatically be decompressed. //(default: true)//
         */
        get allowGzip() {
            return this.#gzip;
        }
        set allowGzip(value) {
            this.#gzip = !!value;
        }
        /**
         *  Allow ``Authentication`` credentials to be sent over insecure
         *  channels. //(default: false)//
         */
        get allowInsecureAuthentication() {
            return !!this.#allowInsecure;
        }
        set allowInsecureAuthentication(value) {
            this.#allowInsecure = !!value;
        }
        /**
         *  The timeout (in milliseconds) to wait for a complete response.
         *  //(default: 5 minutes)//
         */
        get timeout() { return this.#timeout; }
        set timeout(timeout) {
            assertArgument(timeout >= 0, "timeout must be non-zero", "timeout", timeout);
            this.#timeout = timeout;
        }
        /**
         *  This function is called prior to each request, for example
         *  during a redirection or retry in case of server throttling.
         *
         *  This offers an opportunity to populate headers or update
         *  content before sending a request.
         */
        get preflightFunc() {
            return this.#preflight || null;
        }
        set preflightFunc(preflight) {
            this.#preflight = preflight;
        }
        /**
         *  This function is called after each response, offering an
         *  opportunity to provide client-level throttling or updating
         *  response data.
         *
         *  Any error thrown in this causes the ``send()`` to throw.
         *
         *  To schedule a retry attempt (assuming the maximum retry limit
         *  has not been reached), use [[response.throwThrottleError]].
         */
        get processFunc() {
            return this.#process || null;
        }
        set processFunc(process) {
            this.#process = process;
        }
        /**
         *  This function is called on each retry attempt.
         */
        get retryFunc() {
            return this.#retry || null;
        }
        set retryFunc(retry) {
            this.#retry = retry;
        }
        /**
         *  This function is called to fetch content from HTTP and
         *  HTTPS URLs and is platform specific (e.g. nodejs vs
         *  browsers).
         *
         *  This is by default the currently registered global getUrl
         *  function, which can be changed using [[registerGetUrl]].
         *  If this has been set, setting is to ``null`` will cause
         *  this FetchRequest (and any future clones) to revert back to
         *  using the currently registered global getUrl function.
         *
         *  Setting this is generally not necessary, but may be useful
         *  for developers that wish to intercept requests or to
         *  configurege a proxy or other agent.
         */
        get getUrlFunc() {
            return this.#getUrlFunc || defaultGetUrlFunc;
        }
        set getUrlFunc(value) {
            this.#getUrlFunc = value;
        }
        /**
         *  Create a new FetchRequest instance with default values.
         *
         *  Once created, each property may be set before issuing a
         *  ``.send()`` to make the request.
         */
        constructor(url) {
            this.#url = String(url);
            this.#allowInsecure = false;
            this.#gzip = true;
            this.#headers = {};
            this.#method = "";
            this.#timeout = 300000;
            this.#throttle = {
                slotInterval: SLOT_INTERVAL,
                maxAttempts: MAX_ATTEMPTS
            };
            this.#getUrlFunc = null;
        }
        toString() {
            return `<FetchRequest method=${JSON.stringify(this.method)} url=${JSON.stringify(this.url)} headers=${JSON.stringify(this.headers)} body=${this.#body ? hexlify(this.#body) : "null"}>`;
        }
        /**
         *  Update the throttle parameters used to determine maximum
         *  attempts and exponential-backoff properties.
         */
        setThrottleParams(params) {
            if (params.slotInterval != null) {
                this.#throttle.slotInterval = params.slotInterval;
            }
            if (params.maxAttempts != null) {
                this.#throttle.maxAttempts = params.maxAttempts;
            }
        }
        async #send(attempt, expires, delay, _request, _response) {
            if (attempt >= this.#throttle.maxAttempts) {
                return _response.makeServerError("exceeded maximum retry limit");
            }
            assert(getTime$2() <= expires, "timeout", "TIMEOUT", {
                operation: "request.send", reason: "timeout", request: _request
            });
            if (delay > 0) {
                await wait(delay);
            }
            let req = this.clone();
            const scheme = (req.url.split(":")[0] || "").toLowerCase();
            // Process any Gateways
            if (scheme in Gateways) {
                const result = await Gateways[scheme](req.url, checkSignal(_request.#signal));
                if (result instanceof FetchResponse) {
                    let response = result;
                    if (this.processFunc) {
                        checkSignal(_request.#signal);
                        try {
                            response = await this.processFunc(req, response);
                        }
                        catch (error) {
                            // Something went wrong during processing; throw a 5xx server error
                            if (error.throttle == null || typeof (error.stall) !== "number") {
                                response.makeServerError("error in post-processing function", error).assertOk();
                            }
                            // Ignore throttling
                        }
                    }
                    return response;
                }
                req = result;
            }
            // We have a preflight function; update the request
            if (this.preflightFunc) {
                req = await this.preflightFunc(req);
            }
            const resp = await this.getUrlFunc(req, checkSignal(_request.#signal));
            let response = new FetchResponse(resp.statusCode, resp.statusMessage, resp.headers, resp.body, _request);
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Redirect
                try {
                    const location = response.headers.location || "";
                    return req.redirect(location).#send(attempt + 1, expires, 0, _request, response);
                }
                catch (error) { }
                // Things won't get any better on another attempt; abort
                return response;
            }
            else if (response.statusCode === 429) {
                // Throttle
                if (this.retryFunc == null || (await this.retryFunc(req, response, attempt))) {
                    const retryAfter = response.headers["retry-after"];
                    let delay = this.#throttle.slotInterval * Math.trunc(Math.random() * Math.pow(2, attempt));
                    if (typeof (retryAfter) === "string" && retryAfter.match(/^[1-9][0-9]*$/)) {
                        delay = parseInt(retryAfter);
                    }
                    return req.clone().#send(attempt + 1, expires, delay, _request, response);
                }
            }
            if (this.processFunc) {
                checkSignal(_request.#signal);
                try {
                    response = await this.processFunc(req, response);
                }
                catch (error) {
                    // Something went wrong during processing; throw a 5xx server error
                    if (error.throttle == null || typeof (error.stall) !== "number") {
                        response.makeServerError("error in post-processing function", error).assertOk();
                    }
                    // Throttle
                    let delay = this.#throttle.slotInterval * Math.trunc(Math.random() * Math.pow(2, attempt));
                    if (error.stall >= 0) {
                        delay = error.stall;
                    }
                    return req.clone().#send(attempt + 1, expires, delay, _request, response);
                }
            }
            return response;
        }
        /**
         *  Resolves to the response by sending the request.
         */
        send() {
            assert(this.#signal == null, "request already sent", "UNSUPPORTED_OPERATION", { operation: "fetchRequest.send" });
            this.#signal = new FetchCancelSignal(this);
            return this.#send(0, getTime$2() + this.timeout, 0, this, new FetchResponse(0, "", {}, null, this));
        }
        /**
         *  Cancels the inflight response, causing a ``CANCELLED``
         *  error to be rejected from the [[send]].
         */
        cancel() {
            assert(this.#signal != null, "request has not been sent", "UNSUPPORTED_OPERATION", { operation: "fetchRequest.cancel" });
            const signal = fetchSignals.get(this);
            if (!signal) {
                throw new Error("missing signal; should not happen");
            }
            signal();
        }
        /**
         *  Returns a new [[FetchRequest]] that represents the redirection
         *  to %%location%%.
         */
        redirect(location) {
            // Redirection; for now we only support absolute locations
            const current = this.url.split(":")[0].toLowerCase();
            const target = location.split(":")[0].toLowerCase();
            // Don't allow redirecting:
            // - non-GET requests
            // - downgrading the security (e.g. https => http)
            // - to non-HTTP (or non-HTTPS) protocols [this could be relaxed?]
            assert(this.method === "GET" && (current !== "https" || target !== "http") && location.match(/^https?:/), `unsupported redirect`, "UNSUPPORTED_OPERATION", {
                operation: `redirect(${this.method} ${JSON.stringify(this.url)} => ${JSON.stringify(location)})`
            });
            // Create a copy of this request, with a new URL
            const req = new FetchRequest(location);
            req.method = "GET";
            req.allowGzip = this.allowGzip;
            req.timeout = this.timeout;
            req.#headers = Object.assign({}, this.#headers);
            if (this.#body) {
                req.#body = new Uint8Array(this.#body);
            }
            req.#bodyType = this.#bodyType;
            // Do not forward credentials unless on the same domain; only absolute
            //req.allowInsecure = false;
            // paths are currently supported; may want a way to specify to forward?
            //setStore(req.#props, "creds", getStore(this.#pros, "creds"));
            return req;
        }
        /**
         *  Create a new copy of this request.
         */
        clone() {
            const clone = new FetchRequest(this.url);
            // Preserve "default method" (i.e. null)
            clone.#method = this.#method;
            // Preserve "default body" with type, copying the Uint8Array is present
            if (this.#body) {
                clone.#body = this.#body;
            }
            clone.#bodyType = this.#bodyType;
            // Preserve "default headers"
            clone.#headers = Object.assign({}, this.#headers);
            // Credentials is readonly, so we copy internally
            clone.#creds = this.#creds;
            if (this.allowGzip) {
                clone.allowGzip = true;
            }
            clone.timeout = this.timeout;
            if (this.allowInsecureAuthentication) {
                clone.allowInsecureAuthentication = true;
            }
            clone.#preflight = this.#preflight;
            clone.#process = this.#process;
            clone.#retry = this.#retry;
            clone.#throttle = Object.assign({}, this.#throttle);
            clone.#getUrlFunc = this.#getUrlFunc;
            return clone;
        }
        /**
         *  Locks all static configuration for gateways and FetchGetUrlFunc
         *  registration.
         */
        static lockConfig() {
            locked$5 = true;
        }
        /**
         *  Get the current Gateway function for %%scheme%%.
         */
        static getGateway(scheme) {
            return Gateways[scheme.toLowerCase()] || null;
        }
        /**
         *  Use the %%func%% when fetching URIs using %%scheme%%.
         *
         *  This method affects all requests globally.
         *
         *  If [[lockConfig]] has been called, no change is made and this
         *  throws.
         */
        static registerGateway(scheme, func) {
            scheme = scheme.toLowerCase();
            if (scheme === "http" || scheme === "https") {
                throw new Error(`cannot intercept ${scheme}; use registerGetUrl`);
            }
            if (locked$5) {
                throw new Error("gateways locked");
            }
            Gateways[scheme] = func;
        }
        /**
         *  Use %%getUrl%% when fetching URIs over HTTP and HTTPS requests.
         *
         *  This method affects all requests globally.
         *
         *  If [[lockConfig]] has been called, no change is made and this
         *  throws.
         */
        static registerGetUrl(getUrl) {
            if (locked$5) {
                throw new Error("gateways locked");
            }
            defaultGetUrlFunc = getUrl;
        }
        /**
         *  Creates a getUrl function that fetches content from HTTP and
         *  HTTPS URLs.
         *
         *  The available %%options%% are dependent on the platform
         *  implementation of the default getUrl function.
         *
         *  This is not generally something that is needed, but is useful
         *  when trying to customize simple behaviour when fetching HTTP
         *  content.
         */
        static createGetUrlFunc(options) {
            return createGetUrl(options);
        }
        /**
         *  Creates a function that can "fetch" data URIs.
         *
         *  Note that this is automatically done internally to support
         *  data URIs, so it is not necessary to register it.
         *
         *  This is not generally something that is needed, but may
         *  be useful in a wrapper to perfom custom data URI functionality.
         */
        static createDataGateway() {
            return dataGatewayFunc;
        }
        /**
         *  Creates a function that will fetch IPFS (unvalidated) from
         *  a custom gateway baseUrl.
         *
         *  The default IPFS gateway used internally is
         *  ``"https:/\/gateway.ipfs.io/ipfs/"``.
         */
        static createIpfsGatewayFunc(baseUrl) {
            return getIpfsGatewayFunc(baseUrl);
        }
    }
    /**
     *  The response for a FetchRequest.
     */
    class FetchResponse {
        #statusCode;
        #statusMessage;
        #headers;
        #body;
        #request;
        #error;
        toString() {
            return `<FetchResponse status=${this.statusCode} body=${this.#body ? hexlify(this.#body) : "null"}>`;
        }
        /**
         *  The response status code.
         */
        get statusCode() { return this.#statusCode; }
        /**
         *  The response status message.
         */
        get statusMessage() { return this.#statusMessage; }
        /**
         *  The response headers. All keys are lower-case.
         */
        get headers() { return Object.assign({}, this.#headers); }
        /**
         *  The response body, or ``null`` if there was no body.
         */
        get body() {
            return (this.#body == null) ? null : new Uint8Array(this.#body);
        }
        /**
         *  The response body as a UTF-8 encoded string, or the empty
         *  string (i.e. ``""``) if there was no body.
         *
         *  An error is thrown if the body is invalid UTF-8 data.
         */
        get bodyText() {
            try {
                return (this.#body == null) ? "" : toUtf8String(this.#body);
            }
            catch (error) {
                assert(false, "response body is not valid UTF-8 data", "UNSUPPORTED_OPERATION", {
                    operation: "bodyText", info: { response: this }
                });
            }
        }
        /**
         *  The response body, decoded as JSON.
         *
         *  An error is thrown if the body is invalid JSON-encoded data
         *  or if there was no body.
         */
        get bodyJson() {
            try {
                return JSON.parse(this.bodyText);
            }
            catch (error) {
                assert(false, "response body is not valid JSON", "UNSUPPORTED_OPERATION", {
                    operation: "bodyJson", info: { response: this }
                });
            }
        }
        [Symbol.iterator]() {
            const headers = this.headers;
            const keys = Object.keys(headers);
            let index = 0;
            return {
                next: () => {
                    if (index < keys.length) {
                        const key = keys[index++];
                        return {
                            value: [key, headers[key]], done: false
                        };
                    }
                    return { value: undefined, done: true };
                }
            };
        }
        constructor(statusCode, statusMessage, headers, body, request) {
            this.#statusCode = statusCode;
            this.#statusMessage = statusMessage;
            this.#headers = Object.keys(headers).reduce((accum, k) => {
                accum[k.toLowerCase()] = String(headers[k]);
                return accum;
            }, {});
            this.#body = ((body == null) ? null : new Uint8Array(body));
            this.#request = (request || null);
            this.#error = { message: "" };
        }
        /**
         *  Return a Response with matching headers and body, but with
         *  an error status code (i.e. 599) and %%message%% with an
         *  optional %%error%%.
         */
        makeServerError(message, error) {
            let statusMessage;
            if (!message) {
                message = `${this.statusCode} ${this.statusMessage}`;
                statusMessage = `CLIENT ESCALATED SERVER ERROR (${message})`;
            }
            else {
                statusMessage = `CLIENT ESCALATED SERVER ERROR (${this.statusCode} ${this.statusMessage}; ${message})`;
            }
            const response = new FetchResponse(599, statusMessage, this.headers, this.body, this.#request || undefined);
            response.#error = { message, error };
            return response;
        }
        /**
         *  If called within a [request.processFunc](FetchRequest-processFunc)
         *  call, causes the request to retry as if throttled for %%stall%%
         *  milliseconds.
         */
        throwThrottleError(message, stall) {
            if (stall == null) {
                stall = -1;
            }
            else {
                assertArgument(Number.isInteger(stall) && stall >= 0, "invalid stall timeout", "stall", stall);
            }
            const error = new Error(message || "throttling requests");
            defineProperties(error, { stall, throttle: true });
            throw error;
        }
        /**
         *  Get the header value for %%key%%, ignoring case.
         */
        getHeader(key) {
            return this.headers[key.toLowerCase()];
        }
        /**
         *  Returns true if the response has a body.
         */
        hasBody() {
            return (this.#body != null);
        }
        /**
         *  The request made for this response.
         */
        get request() { return this.#request; }
        /**
         *  Returns true if this response was a success statusCode.
         */
        ok() {
            return (this.#error.message === "" && this.statusCode >= 200 && this.statusCode < 300);
        }
        /**
         *  Throws a ``SERVER_ERROR`` if this response is not ok.
         */
        assertOk() {
            if (this.ok()) {
                return;
            }
            let { message, error } = this.#error;
            if (message === "") {
                message = `server response ${this.statusCode} ${this.statusMessage}`;
            }
            let requestUrl = null;
            if (this.request) {
                requestUrl = this.request.url;
            }
            let responseBody = null;
            try {
                if (this.#body) {
                    responseBody = toUtf8String(this.#body);
                }
            }
            catch (e) { }
            assert(false, message, "SERVER_ERROR", {
                request: (this.request || "unknown request"), response: this, error,
                info: {
                    requestUrl, responseBody,
                    responseStatus: `${this.statusCode} ${this.statusMessage}`
                }
            });
        }
    }
    function getTime$2() { return (new Date()).getTime(); }
    function unpercent(value) {
        return toUtf8Bytes(value.replace(/%([0-9a-f][0-9a-f])/gi, (all, code) => {
            return String.fromCharCode(parseInt(code, 16));
        }));
    }
    function wait(delay) {
        return new Promise((resolve) => setTimeout(resolve, delay));
    }

    /**
     *  The **FixedNumber** class permits using values with decimal places,
     *  using fixed-pont math.
     *
     *  Fixed-point math is still based on integers under-the-hood, but uses an
     *  internal offset to store fractional components below, and each operation
     *  corrects for this after each operation.
     *
     *  @_section: api/utils/fixed-point-math:Fixed-Point Maths  [about-fixed-point-math]
     */
    const BN_N1 = BigInt(-1);
    const BN_0$8 = BigInt(0);
    const BN_1$4 = BigInt(1);
    const BN_5 = BigInt(5);
    const _guard$5 = {};
    // Constant to pull zeros from for multipliers
    let Zeros$1 = "0000";
    while (Zeros$1.length < 80) {
        Zeros$1 += Zeros$1;
    }
    // Returns a string "1" followed by decimal "0"s
    function getTens(decimals) {
        let result = Zeros$1;
        while (result.length < decimals) {
            result += result;
        }
        return BigInt("1" + result.substring(0, decimals));
    }
    function checkValue(val, format, safeOp) {
        const width = BigInt(format.width);
        if (format.signed) {
            const limit = (BN_1$4 << (width - BN_1$4));
            assert(safeOp == null || (val >= -limit && val < limit), "overflow", "NUMERIC_FAULT", {
                operation: safeOp, fault: "overflow", value: val
            });
            if (val > BN_0$8) {
                val = fromTwos(mask(val, width), width);
            }
            else {
                val = -fromTwos(mask(-val, width), width);
            }
        }
        else {
            const limit = (BN_1$4 << width);
            assert(safeOp == null || (val >= 0 && val < limit), "overflow", "NUMERIC_FAULT", {
                operation: safeOp, fault: "overflow", value: val
            });
            val = (((val % limit) + limit) % limit) & (limit - BN_1$4);
        }
        return val;
    }
    function getFormat(value) {
        if (typeof (value) === "number") {
            value = `fixed128x${value}`;
        }
        let signed = true;
        let width = 128;
        let decimals = 18;
        if (typeof (value) === "string") {
            // Parse the format string
            if (value === "fixed") ;
            else if (value === "ufixed") {
                signed = false;
            }
            else {
                const match = value.match(/^(u?)fixed([0-9]+)x([0-9]+)$/);
                assertArgument(match, "invalid fixed format", "format", value);
                signed = (match[1] !== "u");
                width = parseInt(match[2]);
                decimals = parseInt(match[3]);
            }
        }
        else if (value) {
            // Extract the values from the object
            const v = value;
            const check = (key, type, defaultValue) => {
                if (v[key] == null) {
                    return defaultValue;
                }
                assertArgument(typeof (v[key]) === type, "invalid fixed format (" + key + " not " + type + ")", "format." + key, v[key]);
                return v[key];
            };
            signed = check("signed", "boolean", signed);
            width = check("width", "number", width);
            decimals = check("decimals", "number", decimals);
        }
        assertArgument((width % 8) === 0, "invalid FixedNumber width (not byte aligned)", "format.width", width);
        assertArgument(decimals <= 80, "invalid FixedNumber decimals (too large)", "format.decimals", decimals);
        const name = (signed ? "" : "u") + "fixed" + String(width) + "x" + String(decimals);
        return { signed, width, decimals, name };
    }
    function toString(val, decimals) {
        let negative = "";
        if (val < BN_0$8) {
            negative = "-";
            val *= BN_N1;
        }
        let str = val.toString();
        // No decimal point for whole values
        if (decimals === 0) {
            return (negative + str);
        }
        // Pad out to the whole component (including a whole digit)
        while (str.length <= decimals) {
            str = Zeros$1 + str;
        }
        // Insert the decimal point
        const index = str.length - decimals;
        str = str.substring(0, index) + "." + str.substring(index);
        // Trim the whole component (leaving at least one 0)
        while (str[0] === "0" && str[1] !== ".") {
            str = str.substring(1);
        }
        // Trim the decimal component (leaving at least one 0)
        while (str[str.length - 1] === "0" && str[str.length - 2] !== ".") {
            str = str.substring(0, str.length - 1);
        }
        return (negative + str);
    }
    /**
     *  A FixedNumber represents a value over its [[FixedFormat]]
     *  arithmetic field.
     *
     *  A FixedNumber can be used to perform math, losslessly, on
     *  values which have decmial places.
     *
     *  A FixedNumber has a fixed bit-width to store values in, and stores all
     *  values internally by multiplying the value by 10 raised to the power of
     *  %%decimals%%.
     *
     *  If operations are performed that cause a value to grow too high (close to
     *  positive infinity) or too low (close to negative infinity), the value
     *  is said to //overflow//.
     *
     *  For example, an 8-bit signed value, with 0 decimals may only be within
     *  the range ``-128`` to ``127``; so ``-128 - 1`` will overflow and become
     *  ``127``. Likewise, ``127 + 1`` will overflow and become ``-127``.
     *
     *  Many operation have a normal and //unsafe// variant. The normal variant
     *  will throw a [[NumericFaultError]] on any overflow, while the //unsafe//
     *  variant will silently allow overflow, corrupting its value value.
     *
     *  If operations are performed that cause a value to become too small
     *  (close to zero), the value loses precison and is said to //underflow//.
     *
     *  For example, a value with 1 decimal place may store a number as small
     *  as ``0.1``, but the value of ``0.1 / 2`` is ``0.05``, which cannot fit
     *  into 1 decimal place, so underflow occurs which means precision is lost
     *  and the value becomes ``0``.
     *
     *  Some operations have a normal and //signalling// variant. The normal
     *  variant will silently ignore underflow, while the //signalling// variant
     *  will thow a [[NumericFaultError]] on underflow.
     */
    class FixedNumber {
        /**
         *  The specific fixed-point arithmetic field for this value.
         */
        format;
        #format;
        // The actual value (accounting for decimals)
        #val;
        // A base-10 value to multiple values by to maintain the magnitude
        #tens;
        /**
         *  This is a property so console.log shows a human-meaningful value.
         *
         *  @private
         */
        _value;
        // Use this when changing this file to get some typing info,
        // but then switch to any to mask the internal type
        //constructor(guard: any, value: bigint, format: _FixedFormat) {
        /**
         *  @private
         */
        constructor(guard, value, format) {
            assertPrivate(guard, _guard$5, "FixedNumber");
            this.#val = value;
            this.#format = format;
            const _value = toString(value, format.decimals);
            defineProperties(this, { format: format.name, _value });
            this.#tens = getTens(format.decimals);
        }
        /**
         *  If true, negative values are permitted, otherwise only
         *  positive values and zero are allowed.
         */
        get signed() { return this.#format.signed; }
        /**
         *  The number of bits available to store the value.
         */
        get width() { return this.#format.width; }
        /**
         *  The number of decimal places in the fixed-point arithment field.
         */
        get decimals() { return this.#format.decimals; }
        /**
         *  The value as an integer, based on the smallest unit the
         *  [[decimals]] allow.
         */
        get value() { return this.#val; }
        #checkFormat(other) {
            assertArgument(this.format === other.format, "incompatible format; use fixedNumber.toFormat", "other", other);
        }
        #checkValue(val, safeOp) {
            /*
                    const width = BigInt(this.width);
                    if (this.signed) {
                        const limit = (BN_1 << (width - BN_1));
                        assert(safeOp == null || (val >= -limit  && val < limit), "overflow", "NUMERIC_FAULT", {
                            operation: <string>safeOp, fault: "overflow", value: val
                        });
            
                        if (val > BN_0) {
                            val = fromTwos(mask(val, width), width);
                        } else {
                            val = -fromTwos(mask(-val, width), width);
                        }
            
                    } else {
                        const masked = mask(val, width);
                        assert(safeOp == null || (val >= 0 && val === masked), "overflow", "NUMERIC_FAULT", {
                            operation: <string>safeOp, fault: "overflow", value: val
                        });
                        val = masked;
                    }
            */
            val = checkValue(val, this.#format, safeOp);
            return new FixedNumber(_guard$5, val, this.#format);
        }
        #add(o, safeOp) {
            this.#checkFormat(o);
            return this.#checkValue(this.#val + o.#val, safeOp);
        }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% added
         *  to %%other%%, ignoring overflow.
         */
        addUnsafe(other) { return this.#add(other); }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% added
         *  to %%other%%. A [[NumericFaultError]] is thrown if overflow
         *  occurs.
         */
        add(other) { return this.#add(other, "add"); }
        #sub(o, safeOp) {
            this.#checkFormat(o);
            return this.#checkValue(this.#val - o.#val, safeOp);
        }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%other%% subtracted
         *  from %%this%%, ignoring overflow.
         */
        subUnsafe(other) { return this.#sub(other); }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%other%% subtracted
         *  from %%this%%. A [[NumericFaultError]] is thrown if overflow
         *  occurs.
         */
        sub(other) { return this.#sub(other, "sub"); }
        #mul(o, safeOp) {
            this.#checkFormat(o);
            return this.#checkValue((this.#val * o.#val) / this.#tens, safeOp);
        }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% multiplied
         *  by %%other%%, ignoring overflow and underflow (precision loss).
         */
        mulUnsafe(other) { return this.#mul(other); }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% multiplied
         *  by %%other%%. A [[NumericFaultError]] is thrown if overflow
         *  occurs.
         */
        mul(other) { return this.#mul(other, "mul"); }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% multiplied
         *  by %%other%%. A [[NumericFaultError]] is thrown if overflow
         *  occurs or if underflow (precision loss) occurs.
         */
        mulSignal(other) {
            this.#checkFormat(other);
            const value = this.#val * other.#val;
            assert((value % this.#tens) === BN_0$8, "precision lost during signalling mul", "NUMERIC_FAULT", {
                operation: "mulSignal", fault: "underflow", value: this
            });
            return this.#checkValue(value / this.#tens, "mulSignal");
        }
        #div(o, safeOp) {
            assert(o.#val !== BN_0$8, "division by zero", "NUMERIC_FAULT", {
                operation: "div", fault: "divide-by-zero", value: this
            });
            this.#checkFormat(o);
            return this.#checkValue((this.#val * this.#tens) / o.#val, safeOp);
        }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% divided
         *  by %%other%%, ignoring underflow (precision loss). A
         *  [[NumericFaultError]] is thrown if overflow occurs.
         */
        divUnsafe(other) { return this.#div(other); }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% divided
         *  by %%other%%, ignoring underflow (precision loss). A
         *  [[NumericFaultError]] is thrown if overflow occurs.
         */
        div(other) { return this.#div(other, "div"); }
        /**
         *  Returns a new [[FixedNumber]] with the result of %%this%% divided
         *  by %%other%%. A [[NumericFaultError]] is thrown if underflow
         *  (precision loss) occurs.
         */
        divSignal(other) {
            assert(other.#val !== BN_0$8, "division by zero", "NUMERIC_FAULT", {
                operation: "div", fault: "divide-by-zero", value: this
            });
            this.#checkFormat(other);
            const value = (this.#val * this.#tens);
            assert((value % other.#val) === BN_0$8, "precision lost during signalling div", "NUMERIC_FAULT", {
                operation: "divSignal", fault: "underflow", value: this
            });
            return this.#checkValue(value / other.#val, "divSignal");
        }
        /**
         *  Returns a comparison result between %%this%% and %%other%%.
         *
         *  This is suitable for use in sorting, where ``-1`` implies %%this%%
         *  is smaller, ``1`` implies %%this%% is larger and ``0`` implies
         *  both are equal.
         */
        cmp(other) {
            let a = this.value, b = other.value;
            // Coerce a and b to the same magnitude
            const delta = this.decimals - other.decimals;
            if (delta > 0) {
                b *= getTens(delta);
            }
            else if (delta < 0) {
                a *= getTens(-delta);
            }
            // Comnpare
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        }
        /**
         *  Returns true if %%other%% is equal to %%this%%.
         */
        eq(other) { return this.cmp(other) === 0; }
        /**
         *  Returns true if %%other%% is less than to %%this%%.
         */
        lt(other) { return this.cmp(other) < 0; }
        /**
         *  Returns true if %%other%% is less than or equal to %%this%%.
         */
        lte(other) { return this.cmp(other) <= 0; }
        /**
         *  Returns true if %%other%% is greater than to %%this%%.
         */
        gt(other) { return this.cmp(other) > 0; }
        /**
         *  Returns true if %%other%% is greater than or equal to %%this%%.
         */
        gte(other) { return this.cmp(other) >= 0; }
        /**
         *  Returns a new [[FixedNumber]] which is the largest **integer**
         *  that is less than or equal to %%this%%.
         *
         *  The decimal component of the result will always be ``0``.
         */
        floor() {
            let val = this.#val;
            if (this.#val < BN_0$8) {
                val -= this.#tens - BN_1$4;
            }
            val = (this.#val / this.#tens) * this.#tens;
            return this.#checkValue(val, "floor");
        }
        /**
         *  Returns a new [[FixedNumber]] which is the smallest **integer**
         *  that is greater than or equal to %%this%%.
         *
         *  The decimal component of the result will always be ``0``.
         */
        ceiling() {
            let val = this.#val;
            if (this.#val > BN_0$8) {
                val += this.#tens - BN_1$4;
            }
            val = (this.#val / this.#tens) * this.#tens;
            return this.#checkValue(val, "ceiling");
        }
        /**
         *  Returns a new [[FixedNumber]] with the decimal component
         *  rounded up on ties at %%decimals%% places.
         */
        round(decimals) {
            if (decimals == null) {
                decimals = 0;
            }
            // Not enough precision to not already be rounded
            if (decimals >= this.decimals) {
                return this;
            }
            const delta = this.decimals - decimals;
            const bump = BN_5 * getTens(delta - 1);
            let value = this.value + bump;
            const tens = getTens(delta);
            value = (value / tens) * tens;
            checkValue(value, this.#format, "round");
            return new FixedNumber(_guard$5, value, this.#format);
        }
        /**
         *  Returns true if %%this%% is equal to ``0``.
         */
        isZero() { return (this.#val === BN_0$8); }
        /**
         *  Returns true if %%this%% is less than ``0``.
         */
        isNegative() { return (this.#val < BN_0$8); }
        /**
         *  Returns the string representation of %%this%%.
         */
        toString() { return this._value; }
        /**
         *  Returns a float approximation.
         *
         *  Due to IEEE 754 precission (or lack thereof), this function
         *  can only return an approximation and most values will contain
         *  rounding errors.
         */
        toUnsafeFloat() { return parseFloat(this.toString()); }
        /**
         *  Return a new [[FixedNumber]] with the same value but has had
         *  its field set to %%format%%.
         *
         *  This will throw if the value cannot fit into %%format%%.
         */
        toFormat(format) {
            return FixedNumber.fromString(this.toString(), format);
        }
        /**
         *  Creates a new [[FixedNumber]] for %%value%% divided by
         *  %%decimal%% places with %%format%%.
         *
         *  This will throw a [[NumericFaultError]] if %%value%% (once adjusted
         *  for %%decimals%%) cannot fit in %%format%%, either due to overflow
         *  or underflow (precision loss).
         */
        static fromValue(_value, _decimals, _format) {
            const decimals = (_decimals == null) ? 0 : getNumber(_decimals);
            const format = getFormat(_format);
            let value = getBigInt(_value, "value");
            const delta = decimals - format.decimals;
            if (delta > 0) {
                const tens = getTens(delta);
                assert((value % tens) === BN_0$8, "value loses precision for format", "NUMERIC_FAULT", {
                    operation: "fromValue", fault: "underflow", value: _value
                });
                value /= tens;
            }
            else if (delta < 0) {
                value *= getTens(-delta);
            }
            checkValue(value, format, "fromValue");
            return new FixedNumber(_guard$5, value, format);
        }
        /**
         *  Creates a new [[FixedNumber]] for %%value%% with %%format%%.
         *
         *  This will throw a [[NumericFaultError]] if %%value%% cannot fit
         *  in %%format%%, either due to overflow or underflow (precision loss).
         */
        static fromString(_value, _format) {
            const match = _value.match(/^(-?)([0-9]*)\.?([0-9]*)$/);
            assertArgument(match && (match[2].length + match[3].length) > 0, "invalid FixedNumber string value", "value", _value);
            const format = getFormat(_format);
            let whole = (match[2] || "0"), decimal = (match[3] || "");
            // Pad out the decimals
            while (decimal.length < format.decimals) {
                decimal += Zeros$1;
            }
            // Check precision is safe
            assert(decimal.substring(format.decimals).match(/^0*$/), "too many decimals for format", "NUMERIC_FAULT", {
                operation: "fromString", fault: "underflow", value: _value
            });
            // Remove extra padding
            decimal = decimal.substring(0, format.decimals);
            const value = BigInt(match[1] + whole + decimal);
            checkValue(value, format, "fromString");
            return new FixedNumber(_guard$5, value, format);
        }
        /**
         *  Creates a new [[FixedNumber]] with the big-endian representation
         *  %%value%% with %%format%%.
         *
         *  This will throw a [[NumericFaultError]] if %%value%% cannot fit
         *  in %%format%% due to overflow.
         */
        static fromBytes(_value, _format) {
            let value = toBigInt(getBytes(_value, "value"));
            const format = getFormat(_format);
            if (format.signed) {
                value = fromTwos(value, format.width);
            }
            checkValue(value, format, "fromBytes");
            return new FixedNumber(_guard$5, value, format);
        }
    }
    //const f1 = FixedNumber.fromString("12.56", "fixed16x2");
    //const f2 = FixedNumber.fromString("0.3", "fixed16x2");
    //console.log(f1.divSignal(f2));
    //const BUMP = FixedNumber.from("0.5");

    //See: https://github.com/ethereum/wiki/wiki/RLP
    function hexlifyByte(value) {
        let result = value.toString(16);
        while (result.length < 2) {
            result = "0" + result;
        }
        return "0x" + result;
    }
    function unarrayifyInteger(data, offset, length) {
        let result = 0;
        for (let i = 0; i < length; i++) {
            result = (result * 256) + data[offset + i];
        }
        return result;
    }
    function _decodeChildren(data, offset, childOffset, length) {
        const result = [];
        while (childOffset < offset + 1 + length) {
            const decoded = _decode(data, childOffset);
            result.push(decoded.result);
            childOffset += decoded.consumed;
            assert(childOffset <= offset + 1 + length, "child data too short", "BUFFER_OVERRUN", {
                buffer: data, length, offset
            });
        }
        return { consumed: (1 + length), result: result };
    }
    // returns { consumed: number, result: Object }
    function _decode(data, offset) {
        assert(data.length !== 0, "data too short", "BUFFER_OVERRUN", {
            buffer: data, length: 0, offset: 1
        });
        const checkOffset = (offset) => {
            assert(offset <= data.length, "data short segment too short", "BUFFER_OVERRUN", {
                buffer: data, length: data.length, offset
            });
        };
        // Array with extra length prefix
        if (data[offset] >= 0xf8) {
            const lengthLength = data[offset] - 0xf7;
            checkOffset(offset + 1 + lengthLength);
            const length = unarrayifyInteger(data, offset + 1, lengthLength);
            checkOffset(offset + 1 + lengthLength + length);
            return _decodeChildren(data, offset, offset + 1 + lengthLength, lengthLength + length);
        }
        else if (data[offset] >= 0xc0) {
            const length = data[offset] - 0xc0;
            checkOffset(offset + 1 + length);
            return _decodeChildren(data, offset, offset + 1, length);
        }
        else if (data[offset] >= 0xb8) {
            const lengthLength = data[offset] - 0xb7;
            checkOffset(offset + 1 + lengthLength);
            const length = unarrayifyInteger(data, offset + 1, lengthLength);
            checkOffset(offset + 1 + lengthLength + length);
            const result = hexlify(data.slice(offset + 1 + lengthLength, offset + 1 + lengthLength + length));
            return { consumed: (1 + lengthLength + length), result: result };
        }
        else if (data[offset] >= 0x80) {
            const length = data[offset] - 0x80;
            checkOffset(offset + 1 + length);
            const result = hexlify(data.slice(offset + 1, offset + 1 + length));
            return { consumed: (1 + length), result: result };
        }
        return { consumed: 1, result: hexlifyByte(data[offset]) };
    }
    /**
     *  Decodes %%data%% into the structured data it represents.
     */
    function decodeRlp(_data) {
        const data = getBytes(_data, "data");
        const decoded = _decode(data, 0);
        assertArgument(decoded.consumed === data.length, "unexpected junk after rlp payload", "data", _data);
        return decoded.result;
    }

    //See: https://github.com/ethereum/wiki/wiki/RLP
    function arrayifyInteger(value) {
        const result = [];
        while (value) {
            result.unshift(value & 0xff);
            value >>= 8;
        }
        return result;
    }
    function _encode(object) {
        if (Array.isArray(object)) {
            let payload = [];
            object.forEach(function (child) {
                payload = payload.concat(_encode(child));
            });
            if (payload.length <= 55) {
                payload.unshift(0xc0 + payload.length);
                return payload;
            }
            const length = arrayifyInteger(payload.length);
            length.unshift(0xf7 + length.length);
            return length.concat(payload);
        }
        const data = Array.prototype.slice.call(getBytes(object, "object"));
        if (data.length === 1 && data[0] <= 0x7f) {
            return data;
        }
        else if (data.length <= 55) {
            data.unshift(0x80 + data.length);
            return data;
        }
        const length = arrayifyInteger(data.length);
        length.unshift(0xb7 + length.length);
        return length.concat(data);
    }
    const nibbles = "0123456789abcdef";
    /**
     *  Encodes %%object%% as an RLP-encoded [[DataHexString]].
     */
    function encodeRlp(object) {
        let result = "0x";
        for (const v of _encode(object)) {
            result += nibbles[v >> 4];
            result += nibbles[v & 0xf];
        }
        return result;
    }

    /**
     *  Most interactions with Ethereum requires integer values, which use
     *  the smallest magnitude unit.
     *
     *  For example, imagine dealing with dollars and cents. Since dollars
     *  are divisible, non-integer values are possible, such as ``$10.77``.
     *  By using the smallest indivisible unit (i.e. cents), the value can
     *  be kept as the integer ``1077``.
     *
     *  When receiving decimal input from the user (as a decimal string),
     *  the value should be converted to an integer and when showing a user
     *  a value, the integer value should be converted to a decimal string.
     *
     *  This creates a clear distinction, between values to be used by code
     *  (integers) and values used for display logic to users (decimals).
     *
     *  The native unit in Ethereum, //ether// is divisible to 18 decimal places,
     *  where each individual unit is called a //wei//.
     *
     *  @_subsection api/utils:Unit Conversion  [about-units]
     */
    const names = [
        "wei",
        "kwei",
        "mwei",
        "gwei",
        "szabo",
        "finney",
        "ether",
    ];
    /**
     *  Converts %%value%% into a //decimal string//, assuming %%unit%% decimal
     *  places. The %%unit%% may be the number of decimal places or the name of
     *  a unit (e.g. ``"gwei"`` for 9 decimal places).
     *
     */
    function formatUnits(value, unit) {
        let decimals = 18;
        if (typeof (unit) === "string") {
            const index = names.indexOf(unit);
            assertArgument(index >= 0, "invalid unit", "unit", unit);
            decimals = 3 * index;
        }
        else if (unit != null) {
            decimals = getNumber(unit, "unit");
        }
        return FixedNumber.fromValue(value, decimals, { decimals, width: 512 }).toString();
    }
    /**
     *  Converts the //decimal string// %%value%% to a BigInt, assuming
     *  %%unit%% decimal places. The %%unit%% may the number of decimal places
     *  or the name of a unit (e.g. ``"gwei"`` for 9 decimal places).
     */
    function parseUnits$1(value, unit) {
        assertArgument(typeof (value) === "string", "value must be a string", "value", value);
        let decimals = 18;
        if (typeof (unit) === "string") {
            const index = names.indexOf(unit);
            assertArgument(index >= 0, "invalid unit", "unit", unit);
            decimals = 3 * index;
        }
        else if (unit != null) {
            decimals = getNumber(unit, "unit");
        }
        return FixedNumber.fromString(value, { decimals, width: 512 }).value;
    }
    /**
     *  Converts %%value%% into a //decimal string// using 18 decimal places.
     */
    function formatEther(wei) {
        return formatUnits(wei, 18);
    }
    /**
     *  Converts the //decimal string// %%ether%% to a BigInt, using 18
     *  decimal places.
     */
    function parseEther(ether) {
        return parseUnits$1(ether, 18);
    }

    /**
     *  Explain UUID and link to RFC here.
     *
     *  @_subsection: api/utils:UUID  [about-uuid]
     */
    /**
     *  Returns the version 4 [[link-uuid]] for the %%randomBytes%%.
     *
     *  @see: https://www.ietf.org/rfc/rfc4122.txt (Section 4.4)
     */
    function uuidV4(randomBytes) {
        const bytes = getBytes(randomBytes, "randomBytes");
        // Section: 4.1.3:
        // - time_hi_and_version[12:16] = 0b0100
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        // Section 4.4
        // - clock_seq_hi_and_reserved[6] = 0b0
        // - clock_seq_hi_and_reserved[7] = 0b1
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const value = hexlify(bytes);
        return [
            value.substring(2, 10),
            value.substring(10, 14),
            value.substring(14, 18),
            value.substring(18, 22),
            value.substring(22, 34),
        ].join("-");
    }

    /**
     * @_ignore:
     */
    const WordSize = 32;
    const Padding = new Uint8Array(WordSize);
    // Properties used to immediate pass through to the underlying object
    // - `then` is used to detect if an object is a Promise for await
    const passProperties$1 = ["then"];
    const _guard$4 = {};
    const resultNames = new WeakMap();
    function getNames(result) {
        return resultNames.get(result);
    }
    function setNames(result, names) {
        resultNames.set(result, names);
    }
    function throwError(name, error) {
        const wrapped = new Error(`deferred error during ABI decoding triggered accessing ${name}`);
        wrapped.error = error;
        throw wrapped;
    }
    function toObject(names, items, deep) {
        if (names.indexOf(null) >= 0) {
            return items.map((item, index) => {
                if (item instanceof Result) {
                    return toObject(getNames(item), item, deep);
                }
                return item;
            });
        }
        return names.reduce((accum, name, index) => {
            let item = items.getValue(name);
            if (!(name in accum)) {
                if (deep && item instanceof Result) {
                    item = toObject(getNames(item), item, deep);
                }
                accum[name] = item;
            }
            return accum;
        }, {});
    }
    /**
     *  A [[Result]] is a sub-class of Array, which allows accessing any
     *  of its values either positionally by its index or, if keys are
     *  provided by its name.
     *
     *  @_docloc: api/abi
     */
    class Result extends Array {
        // No longer used; but cannot be removed as it will remove the
        // #private field from the .d.ts which may break backwards
        // compatibility
        #names;
        /**
         *  @private
         */
        constructor(...args) {
            // To properly sub-class Array so the other built-in
            // functions work, the constructor has to behave fairly
            // well. So, in the event we are created via fromItems()
            // we build the read-only Result object we want, but on
            // any other input, we use the default constructor
            // constructor(guard: any, items: Array<any>, keys?: Array<null | string>);
            const guard = args[0];
            let items = args[1];
            let names = (args[2] || []).slice();
            let wrap = true;
            if (guard !== _guard$4) {
                items = args;
                names = [];
                wrap = false;
            }
            // Can't just pass in ...items since an array of length 1
            // is a special case in the super.
            super(items.length);
            items.forEach((item, index) => { this[index] = item; });
            // Find all unique keys
            const nameCounts = names.reduce((accum, name) => {
                if (typeof (name) === "string") {
                    accum.set(name, (accum.get(name) || 0) + 1);
                }
                return accum;
            }, (new Map()));
            // Remove any key thats not unique
            setNames(this, Object.freeze(items.map((item, index) => {
                const name = names[index];
                if (name != null && nameCounts.get(name) === 1) {
                    return name;
                }
                return null;
            })));
            // Dummy operations to prevent TypeScript from complaining
            this.#names = [];
            if (this.#names == null) {
                void (this.#names);
            }
            if (!wrap) {
                return;
            }
            // A wrapped Result is immutable
            Object.freeze(this);
            // Proxy indices and names so we can trap deferred errors
            const proxy = new Proxy(this, {
                get: (target, prop, receiver) => {
                    if (typeof (prop) === "string") {
                        // Index accessor
                        if (prop.match(/^[0-9]+$/)) {
                            const index = getNumber(prop, "%index");
                            if (index < 0 || index >= this.length) {
                                throw new RangeError("out of result range");
                            }
                            const item = target[index];
                            if (item instanceof Error) {
                                throwError(`index ${index}`, item);
                            }
                            return item;
                        }
                        // Pass important checks (like `then` for Promise) through
                        if (passProperties$1.indexOf(prop) >= 0) {
                            return Reflect.get(target, prop, receiver);
                        }
                        const value = target[prop];
                        if (value instanceof Function) {
                            // Make sure functions work with private variables
                            // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy#no_private_property_forwarding
                            return function (...args) {
                                return value.apply((this === receiver) ? target : this, args);
                            };
                        }
                        else if (!(prop in target)) {
                            // Possible name accessor
                            return target.getValue.apply((this === receiver) ? target : this, [prop]);
                        }
                    }
                    return Reflect.get(target, prop, receiver);
                }
            });
            setNames(proxy, getNames(this));
            return proxy;
        }
        /**
         *  Returns the Result as a normal Array. If %%deep%%, any children
         *  which are Result objects are also converted to a normal Array.
         *
         *  This will throw if there are any outstanding deferred
         *  errors.
         */
        toArray(deep) {
            const result = [];
            this.forEach((item, index) => {
                if (item instanceof Error) {
                    throwError(`index ${index}`, item);
                }
                if (deep && item instanceof Result) {
                    item = item.toArray(deep);
                }
                result.push(item);
            });
            return result;
        }
        /**
         *  Returns the Result as an Object with each name-value pair. If
         *  %%deep%%, any children which are Result objects are also
         *  converted to an Object.
         *
         *  This will throw if any value is unnamed, or if there are
         *  any outstanding deferred errors.
         */
        toObject(deep) {
            const names = getNames(this);
            return names.reduce((accum, name, index) => {
                assert(name != null, `value at index ${index} unnamed`, "UNSUPPORTED_OPERATION", {
                    operation: "toObject()"
                });
                return toObject(names, this, deep);
            }, {});
        }
        /**
         *  @_ignore
         */
        slice(start, end) {
            if (start == null) {
                start = 0;
            }
            if (start < 0) {
                start += this.length;
                if (start < 0) {
                    start = 0;
                }
            }
            if (end == null) {
                end = this.length;
            }
            if (end < 0) {
                end += this.length;
                if (end < 0) {
                    end = 0;
                }
            }
            if (end > this.length) {
                end = this.length;
            }
            const _names = getNames(this);
            const result = [], names = [];
            for (let i = start; i < end; i++) {
                result.push(this[i]);
                names.push(_names[i]);
            }
            return new Result(_guard$4, result, names);
        }
        /**
         *  @_ignore
         */
        filter(callback, thisArg) {
            const _names = getNames(this);
            const result = [], names = [];
            for (let i = 0; i < this.length; i++) {
                const item = this[i];
                if (item instanceof Error) {
                    throwError(`index ${i}`, item);
                }
                if (callback.call(thisArg, item, i, this)) {
                    result.push(item);
                    names.push(_names[i]);
                }
            }
            return new Result(_guard$4, result, names);
        }
        /**
         *  @_ignore
         */
        map(callback, thisArg) {
            const result = [];
            for (let i = 0; i < this.length; i++) {
                const item = this[i];
                if (item instanceof Error) {
                    throwError(`index ${i}`, item);
                }
                result.push(callback.call(thisArg, item, i, this));
            }
            return result;
        }
        /**
         *  Returns the value for %%name%%.
         *
         *  Since it is possible to have a key whose name conflicts with
         *  a method on a [[Result]] or its superclass Array, or any
         *  JavaScript keyword, this ensures all named values are still
         *  accessible by name.
         */
        getValue(name) {
            const index = getNames(this).indexOf(name);
            if (index === -1) {
                return undefined;
            }
            const value = this[index];
            if (value instanceof Error) {
                throwError(`property ${JSON.stringify(name)}`, value.error);
            }
            return value;
        }
        /**
         *  Creates a new [[Result]] for %%items%% with each entry
         *  also accessible by its corresponding name in %%keys%%.
         */
        static fromItems(items, keys) {
            return new Result(_guard$4, items, keys);
        }
    }
    /**
     *  Returns all errors found in a [[Result]].
     *
     *  Since certain errors encountered when creating a [[Result]] do
     *  not impact the ability to continue parsing data, they are
     *  deferred until they are actually accessed. Hence a faulty string
     *  in an Event that is never used does not impact the program flow.
     *
     *  However, sometimes it may be useful to access, identify or
     *  validate correctness of a [[Result]].
     *
     *  @_docloc api/abi
     */
    function checkResultErrors(result) {
        // Find the first error (if any)
        const errors = [];
        const checkErrors = function (path, object) {
            if (!Array.isArray(object)) {
                return;
            }
            for (let key in object) {
                const childPath = path.slice();
                childPath.push(key);
                try {
                    checkErrors(childPath, object[key]);
                }
                catch (error) {
                    errors.push({ path: childPath, error: error });
                }
            }
        };
        checkErrors([], result);
        return errors;
    }
    function getValue$1(value) {
        let bytes = toBeArray(value);
        assert(bytes.length <= WordSize, "value out-of-bounds", "BUFFER_OVERRUN", { buffer: bytes, length: WordSize, offset: bytes.length });
        if (bytes.length !== WordSize) {
            bytes = getBytesCopy(concat([Padding.slice(bytes.length % WordSize), bytes]));
        }
        return bytes;
    }
    /**
     *  @_ignore
     */
    class Coder {
        // The coder name:
        //   - address, uint256, tuple, array, etc.
        name;
        // The fully expanded type, including composite types:
        //   - address, uint256, tuple(address,bytes), uint256[3][4][],  etc.
        type;
        // The localName bound in the signature, in this example it is "baz":
        //   - tuple(address foo, uint bar) baz
        localName;
        // Whether this type is dynamic:
        //  - Dynamic: bytes, string, address[], tuple(boolean[]), etc.
        //  - Not Dynamic: address, uint256, boolean[3], tuple(address, uint8)
        dynamic;
        constructor(name, type, localName, dynamic) {
            defineProperties(this, { name, type, localName, dynamic }, {
                name: "string", type: "string", localName: "string", dynamic: "boolean"
            });
        }
        _throwError(message, value) {
            assertArgument(false, message, this.localName, value);
        }
    }
    /**
     *  @_ignore
     */
    class Writer {
        // An array of WordSize lengthed objects to concatenation
        #data;
        #dataLength;
        constructor() {
            this.#data = [];
            this.#dataLength = 0;
        }
        get data() {
            return concat(this.#data);
        }
        get length() { return this.#dataLength; }
        #writeData(data) {
            this.#data.push(data);
            this.#dataLength += data.length;
            return data.length;
        }
        appendWriter(writer) {
            return this.#writeData(getBytesCopy(writer.data));
        }
        // Arrayish item; pad on the right to *nearest* WordSize
        writeBytes(value) {
            let bytes = getBytesCopy(value);
            const paddingOffset = bytes.length % WordSize;
            if (paddingOffset) {
                bytes = getBytesCopy(concat([bytes, Padding.slice(paddingOffset)]));
            }
            return this.#writeData(bytes);
        }
        // Numeric item; pad on the left *to* WordSize
        writeValue(value) {
            return this.#writeData(getValue$1(value));
        }
        // Inserts a numeric place-holder, returning a callback that can
        // be used to asjust the value later
        writeUpdatableValue() {
            const offset = this.#data.length;
            this.#data.push(Padding);
            this.#dataLength += WordSize;
            return (value) => {
                this.#data[offset] = getValue$1(value);
            };
        }
    }
    /**
     *  @_ignore
     */
    class Reader {
        // Allows incomplete unpadded data to be read; otherwise an error
        // is raised if attempting to overrun the buffer. This is required
        // to deal with an old Solidity bug, in which event data for
        // external (not public thoguh) was tightly packed.
        allowLoose;
        #data;
        #offset;
        #bytesRead;
        #parent;
        #maxInflation;
        constructor(data, allowLoose, maxInflation) {
            defineProperties(this, { allowLoose: !!allowLoose });
            this.#data = getBytesCopy(data);
            this.#bytesRead = 0;
            this.#parent = null;
            this.#maxInflation = (maxInflation != null) ? maxInflation : 1024;
            this.#offset = 0;
        }
        get data() { return hexlify(this.#data); }
        get dataLength() { return this.#data.length; }
        get consumed() { return this.#offset; }
        get bytes() { return new Uint8Array(this.#data); }
        #incrementBytesRead(count) {
            if (this.#parent) {
                return this.#parent.#incrementBytesRead(count);
            }
            this.#bytesRead += count;
            // Check for excessive inflation (see: #4537)
            assert(this.#maxInflation < 1 || this.#bytesRead <= this.#maxInflation * this.dataLength, `compressed ABI data exceeds inflation ratio of ${this.#maxInflation} ( see: https:/\/github.com/ethers-io/ethers.js/issues/4537 )`, "BUFFER_OVERRUN", {
                buffer: getBytesCopy(this.#data), offset: this.#offset,
                length: count, info: {
                    bytesRead: this.#bytesRead,
                    dataLength: this.dataLength
                }
            });
        }
        #peekBytes(offset, length, loose) {
            let alignedLength = Math.ceil(length / WordSize) * WordSize;
            if (this.#offset + alignedLength > this.#data.length) {
                if (this.allowLoose && loose && this.#offset + length <= this.#data.length) {
                    alignedLength = length;
                }
                else {
                    assert(false, "data out-of-bounds", "BUFFER_OVERRUN", {
                        buffer: getBytesCopy(this.#data),
                        length: this.#data.length,
                        offset: this.#offset + alignedLength
                    });
                }
            }
            return this.#data.slice(this.#offset, this.#offset + alignedLength);
        }
        // Create a sub-reader with the same underlying data, but offset
        subReader(offset) {
            const reader = new Reader(this.#data.slice(this.#offset + offset), this.allowLoose, this.#maxInflation);
            reader.#parent = this;
            return reader;
        }
        // Read bytes
        readBytes(length, loose) {
            let bytes = this.#peekBytes(0, length, !!loose);
            this.#incrementBytesRead(length);
            this.#offset += bytes.length;
            // @TODO: Make sure the length..end bytes are all 0?
            return bytes.slice(0, length);
        }
        // Read a numeric values
        readValue() {
            return toBigInt(this.readBytes(WordSize));
        }
        readIndex() {
            return toNumber(this.readBytes(WordSize));
        }
    }

    function number(n) {
        if (!Number.isSafeInteger(n) || n < 0)
            throw new Error(`Wrong positive integer: ${n}`);
    }
    function bytes(b, ...lengths) {
        if (!(b instanceof Uint8Array))
            throw new Error('Expected Uint8Array');
        if (lengths.length > 0 && !lengths.includes(b.length))
            throw new Error(`Expected Uint8Array of length ${lengths}, not of length=${b.length}`);
    }
    function hash(hash) {
        if (typeof hash !== 'function' || typeof hash.create !== 'function')
            throw new Error('Hash should be wrapped by utils.wrapConstructor');
        number(hash.outputLen);
        number(hash.blockLen);
    }
    function exists(instance, checkFinished = true) {
        if (instance.destroyed)
            throw new Error('Hash instance has been destroyed');
        if (checkFinished && instance.finished)
            throw new Error('Hash#digest() has already been called');
    }
    function output(out, instance) {
        bytes(out);
        const min = instance.outputLen;
        if (out.length < min) {
            throw new Error(`digestInto() expects output buffer of length at least ${min}`);
        }
    }

    const crypto$1 = typeof globalThis === 'object' && 'crypto' in globalThis ? globalThis.crypto : undefined;

    /*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    // We use WebCrypto aka globalThis.crypto, which exists in browsers and node.js 16+.
    // node.js versions earlier than v19 don't declare it in global scope.
    // For node.js, package.json#exports field mapping rewrites import
    // from `crypto` to `cryptoNode`, which imports native module.
    // Makes the utils un-importable in browsers without a bundler.
    // Once node.js 18 is deprecated, we can just drop the import.
    const u8a$1 = (a) => a instanceof Uint8Array;
    const u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
    // Cast array to view
    const createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    // The rotate right (circular right shift) operation for uint32
    const rotr = (word, shift) => (word << (32 - shift)) | (word >>> shift);
    // big-endian hardware is rare. Just in case someone still decides to run hashes:
    // early-throw an error because we don't support BE yet.
    const isLE = new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44;
    if (!isLE)
        throw new Error('Non little-endian hardware is not supported');
    // There is no setImmediate in browser and setTimeout is slow.
    // call of async fn will return Promise, which will be fullfiled only on
    // next scheduler queue processing step and this is exactly what we need.
    const nextTick = async () => { };
    // Returns control to thread each 'tick' ms to avoid blocking
    async function asyncLoop(iters, tick, cb) {
        let ts = Date.now();
        for (let i = 0; i < iters; i++) {
            cb(i);
            // Date.now() is not monotonic, so in case if clock goes backwards we return return control too
            const diff = Date.now() - ts;
            if (diff >= 0 && diff < tick)
                continue;
            await nextTick();
            ts += diff;
        }
    }
    /**
     * @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
     */
    function utf8ToBytes$1(str) {
        if (typeof str !== 'string')
            throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
        return new Uint8Array(new TextEncoder().encode(str)); // https://bugzil.la/1681809
    }
    /**
     * Normalizes (non-hex) string or Uint8Array to Uint8Array.
     * Warning: when Uint8Array is passed, it would NOT get copied.
     * Keep in mind for future mutable operations.
     */
    function toBytes(data) {
        if (typeof data === 'string')
            data = utf8ToBytes$1(data);
        if (!u8a$1(data))
            throw new Error(`expected Uint8Array, got ${typeof data}`);
        return data;
    }
    /**
     * Copies several Uint8Arrays into one.
     */
    function concatBytes$1(...arrays) {
        const r = new Uint8Array(arrays.reduce((sum, a) => sum + a.length, 0));
        let pad = 0; // walk through each item, ensure they have proper type
        arrays.forEach((a) => {
            if (!u8a$1(a))
                throw new Error('Uint8Array expected');
            r.set(a, pad);
            pad += a.length;
        });
        return r;
    }
    // For runtime check if class implements interface
    class Hash {
        // Safe version that clones internal state
        clone() {
            return this._cloneInto();
        }
    }
    const toStr = {}.toString;
    function checkOpts(defaults, opts) {
        if (opts !== undefined && toStr.call(opts) !== '[object Object]')
            throw new Error('Options should be object or undefined');
        const merged = Object.assign(defaults, opts);
        return merged;
    }
    function wrapConstructor(hashCons) {
        const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
        const tmp = hashCons();
        hashC.outputLen = tmp.outputLen;
        hashC.blockLen = tmp.blockLen;
        hashC.create = () => hashCons();
        return hashC;
    }
    /**
     * Secure PRNG. Uses `crypto.getRandomValues`, which defers to OS.
     */
    function randomBytes$2(bytesLength = 32) {
        if (crypto$1 && typeof crypto$1.getRandomValues === 'function') {
            return crypto$1.getRandomValues(new Uint8Array(bytesLength));
        }
        throw new Error('crypto.getRandomValues must be defined');
    }

    // HMAC (RFC 2104)
    class HMAC extends Hash {
        constructor(hash$1, _key) {
            super();
            this.finished = false;
            this.destroyed = false;
            hash(hash$1);
            const key = toBytes(_key);
            this.iHash = hash$1.create();
            if (typeof this.iHash.update !== 'function')
                throw new Error('Expected instance of class which extends utils.Hash');
            this.blockLen = this.iHash.blockLen;
            this.outputLen = this.iHash.outputLen;
            const blockLen = this.blockLen;
            const pad = new Uint8Array(blockLen);
            // blockLen can be bigger than outputLen
            pad.set(key.length > blockLen ? hash$1.create().update(key).digest() : key);
            for (let i = 0; i < pad.length; i++)
                pad[i] ^= 0x36;
            this.iHash.update(pad);
            // By doing update (processing of first block) of outer hash here we can re-use it between multiple calls via clone
            this.oHash = hash$1.create();
            // Undo internal XOR && apply outer XOR
            for (let i = 0; i < pad.length; i++)
                pad[i] ^= 0x36 ^ 0x5c;
            this.oHash.update(pad);
            pad.fill(0);
        }
        update(buf) {
            exists(this);
            this.iHash.update(buf);
            return this;
        }
        digestInto(out) {
            exists(this);
            bytes(out, this.outputLen);
            this.finished = true;
            this.iHash.digestInto(out);
            this.oHash.update(out);
            this.oHash.digestInto(out);
            this.destroy();
        }
        digest() {
            const out = new Uint8Array(this.oHash.outputLen);
            this.digestInto(out);
            return out;
        }
        _cloneInto(to) {
            // Create new instance without calling constructor since key already in state and we don't know it.
            to || (to = Object.create(Object.getPrototypeOf(this), {}));
            const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
            to = to;
            to.finished = finished;
            to.destroyed = destroyed;
            to.blockLen = blockLen;
            to.outputLen = outputLen;
            to.oHash = oHash._cloneInto(to.oHash);
            to.iHash = iHash._cloneInto(to.iHash);
            return to;
        }
        destroy() {
            this.destroyed = true;
            this.oHash.destroy();
            this.iHash.destroy();
        }
    }
    /**
     * HMAC: RFC2104 message authentication code.
     * @param hash - function that would be used e.g. sha256
     * @param key - message key
     * @param message - message data
     */
    const hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
    hmac.create = (hash, key) => new HMAC(hash, key);

    // Common prologue and epilogue for sync/async functions
    function pbkdf2Init(hash$1, _password, _salt, _opts) {
        hash(hash$1);
        const opts = checkOpts({ dkLen: 32, asyncTick: 10 }, _opts);
        const { c, dkLen, asyncTick } = opts;
        number(c);
        number(dkLen);
        number(asyncTick);
        if (c < 1)
            throw new Error('PBKDF2: iterations (c) should be >= 1');
        const password = toBytes(_password);
        const salt = toBytes(_salt);
        // DK = PBKDF2(PRF, Password, Salt, c, dkLen);
        const DK = new Uint8Array(dkLen);
        // U1 = PRF(Password, Salt + INT_32_BE(i))
        const PRF = hmac.create(hash$1, password);
        const PRFSalt = PRF._cloneInto().update(salt);
        return { c, dkLen, asyncTick, DK, PRF, PRFSalt };
    }
    function pbkdf2Output(PRF, PRFSalt, DK, prfW, u) {
        PRF.destroy();
        PRFSalt.destroy();
        if (prfW)
            prfW.destroy();
        u.fill(0);
        return DK;
    }
    /**
     * PBKDF2-HMAC: RFC 2898 key derivation function
     * @param hash - hash function that would be used e.g. sha256
     * @param password - password from which a derived key is generated
     * @param salt - cryptographic salt
     * @param opts - {c, dkLen} where c is work factor and dkLen is output message size
     */
    function pbkdf2$1(hash, password, salt, opts) {
        const { c, dkLen, DK, PRF, PRFSalt } = pbkdf2Init(hash, password, salt, opts);
        let prfW; // Working copy
        const arr = new Uint8Array(4);
        const view = createView(arr);
        const u = new Uint8Array(PRF.outputLen);
        // DK = T1 + T2 + ⋯ + Tdklen/hlen
        for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen) {
            // Ti = F(Password, Salt, c, i)
            const Ti = DK.subarray(pos, pos + PRF.outputLen);
            view.setInt32(0, ti, false);
            // F(Password, Salt, c, i) = U1 ^ U2 ^ ⋯ ^ Uc
            // U1 = PRF(Password, Salt + INT_32_BE(i))
            (prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
            Ti.set(u.subarray(0, Ti.length));
            for (let ui = 1; ui < c; ui++) {
                // Uc = PRF(Password, Uc−1)
                PRF._cloneInto(prfW).update(u).digestInto(u);
                for (let i = 0; i < Ti.length; i++)
                    Ti[i] ^= u[i];
            }
        }
        return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
    }

    // Polyfill for Safari 14
    function setBigUint64(view, byteOffset, value, isLE) {
        if (typeof view.setBigUint64 === 'function')
            return view.setBigUint64(byteOffset, value, isLE);
        const _32n = BigInt(32);
        const _u32_max = BigInt(0xffffffff);
        const wh = Number((value >> _32n) & _u32_max);
        const wl = Number(value & _u32_max);
        const h = isLE ? 4 : 0;
        const l = isLE ? 0 : 4;
        view.setUint32(byteOffset + h, wh, isLE);
        view.setUint32(byteOffset + l, wl, isLE);
    }
    // Base SHA2 class (RFC 6234)
    class SHA2 extends Hash {
        constructor(blockLen, outputLen, padOffset, isLE) {
            super();
            this.blockLen = blockLen;
            this.outputLen = outputLen;
            this.padOffset = padOffset;
            this.isLE = isLE;
            this.finished = false;
            this.length = 0;
            this.pos = 0;
            this.destroyed = false;
            this.buffer = new Uint8Array(blockLen);
            this.view = createView(this.buffer);
        }
        update(data) {
            exists(this);
            const { view, buffer, blockLen } = this;
            data = toBytes(data);
            const len = data.length;
            for (let pos = 0; pos < len;) {
                const take = Math.min(blockLen - this.pos, len - pos);
                // Fast path: we have at least one block in input, cast it to view and process
                if (take === blockLen) {
                    const dataView = createView(data);
                    for (; blockLen <= len - pos; pos += blockLen)
                        this.process(dataView, pos);
                    continue;
                }
                buffer.set(data.subarray(pos, pos + take), this.pos);
                this.pos += take;
                pos += take;
                if (this.pos === blockLen) {
                    this.process(view, 0);
                    this.pos = 0;
                }
            }
            this.length += data.length;
            this.roundClean();
            return this;
        }
        digestInto(out) {
            exists(this);
            output(out, this);
            this.finished = true;
            // Padding
            // We can avoid allocation of buffer for padding completely if it
            // was previously not allocated here. But it won't change performance.
            const { buffer, view, blockLen, isLE } = this;
            let { pos } = this;
            // append the bit '1' to the message
            buffer[pos++] = 0b10000000;
            this.buffer.subarray(pos).fill(0);
            // we have less than padOffset left in buffer, so we cannot put length in current block, need process it and pad again
            if (this.padOffset > blockLen - pos) {
                this.process(view, 0);
                pos = 0;
            }
            // Pad until full block byte with zeros
            for (let i = pos; i < blockLen; i++)
                buffer[i] = 0;
            // Note: sha512 requires length to be 128bit integer, but length in JS will overflow before that
            // You need to write around 2 exabytes (u64_max / 8 / (1024**6)) for this to happen.
            // So we just write lowest 64 bits of that value.
            setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
            this.process(view, 0);
            const oview = createView(out);
            const len = this.outputLen;
            // NOTE: we do division by 4 later, which should be fused in single op with modulo by JIT
            if (len % 4)
                throw new Error('_sha2: outputLen should be aligned to 32bit');
            const outLen = len / 4;
            const state = this.get();
            if (outLen > state.length)
                throw new Error('_sha2: outputLen bigger than state');
            for (let i = 0; i < outLen; i++)
                oview.setUint32(4 * i, state[i], isLE);
        }
        digest() {
            const { buffer, outputLen } = this;
            this.digestInto(buffer);
            const res = buffer.slice(0, outputLen);
            this.destroy();
            return res;
        }
        _cloneInto(to) {
            to || (to = new this.constructor());
            to.set(...this.get());
            const { blockLen, buffer, length, finished, destroyed, pos } = this;
            to.length = length;
            to.pos = pos;
            to.finished = finished;
            to.destroyed = destroyed;
            if (length % blockLen)
                to.buffer.set(buffer);
            return to;
        }
    }

    // SHA2-256 need to try 2^128 hashes to execute birthday attack.
    // BTC network is doing 2^67 hashes/sec as per early 2023.
    // Choice: a ? b : c
    const Chi = (a, b, c) => (a & b) ^ (~a & c);
    // Majority function, true if any two inpust is true
    const Maj = (a, b, c) => (a & b) ^ (a & c) ^ (b & c);
    // Round constants:
    // first 32 bits of the fractional parts of the cube roots of the first 64 primes 2..311)
    // prettier-ignore
    const SHA256_K = /* @__PURE__ */ new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]);
    // Initial state (first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19):
    // prettier-ignore
    const IV = /* @__PURE__ */ new Uint32Array([
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ]);
    // Temporary buffer, not used to store anything between runs
    // Named this way because it matches specification.
    const SHA256_W = /* @__PURE__ */ new Uint32Array(64);
    class SHA256 extends SHA2 {
        constructor() {
            super(64, 32, 8, false);
            // We cannot use array here since array allows indexing by variable
            // which means optimizer/compiler cannot use registers.
            this.A = IV[0] | 0;
            this.B = IV[1] | 0;
            this.C = IV[2] | 0;
            this.D = IV[3] | 0;
            this.E = IV[4] | 0;
            this.F = IV[5] | 0;
            this.G = IV[6] | 0;
            this.H = IV[7] | 0;
        }
        get() {
            const { A, B, C, D, E, F, G, H } = this;
            return [A, B, C, D, E, F, G, H];
        }
        // prettier-ignore
        set(A, B, C, D, E, F, G, H) {
            this.A = A | 0;
            this.B = B | 0;
            this.C = C | 0;
            this.D = D | 0;
            this.E = E | 0;
            this.F = F | 0;
            this.G = G | 0;
            this.H = H | 0;
        }
        process(view, offset) {
            // Extend the first 16 words into the remaining 48 words w[16..63] of the message schedule array
            for (let i = 0; i < 16; i++, offset += 4)
                SHA256_W[i] = view.getUint32(offset, false);
            for (let i = 16; i < 64; i++) {
                const W15 = SHA256_W[i - 15];
                const W2 = SHA256_W[i - 2];
                const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ (W15 >>> 3);
                const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ (W2 >>> 10);
                SHA256_W[i] = (s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16]) | 0;
            }
            // Compression function main loop, 64 rounds
            let { A, B, C, D, E, F, G, H } = this;
            for (let i = 0; i < 64; i++) {
                const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
                const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
                const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
                const T2 = (sigma0 + Maj(A, B, C)) | 0;
                H = G;
                G = F;
                F = E;
                E = (D + T1) | 0;
                D = C;
                C = B;
                B = A;
                A = (T1 + T2) | 0;
            }
            // Add the compressed chunk to the current hash value
            A = (A + this.A) | 0;
            B = (B + this.B) | 0;
            C = (C + this.C) | 0;
            D = (D + this.D) | 0;
            E = (E + this.E) | 0;
            F = (F + this.F) | 0;
            G = (G + this.G) | 0;
            H = (H + this.H) | 0;
            this.set(A, B, C, D, E, F, G, H);
        }
        roundClean() {
            SHA256_W.fill(0);
        }
        destroy() {
            this.set(0, 0, 0, 0, 0, 0, 0, 0);
            this.buffer.fill(0);
        }
    }
    /**
     * SHA2-256 hash function
     * @param message - data that would be hashed
     */
    const sha256$1 = /* @__PURE__ */ wrapConstructor(() => new SHA256());

    const U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
    const _32n = /* @__PURE__ */ BigInt(32);
    // We are not using BigUint64Array, because they are extremely slow as per 2022
    function fromBig(n, le = false) {
        if (le)
            return { h: Number(n & U32_MASK64), l: Number((n >> _32n) & U32_MASK64) };
        return { h: Number((n >> _32n) & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
    }
    function split$1(lst, le = false) {
        let Ah = new Uint32Array(lst.length);
        let Al = new Uint32Array(lst.length);
        for (let i = 0; i < lst.length; i++) {
            const { h, l } = fromBig(lst[i], le);
            [Ah[i], Al[i]] = [h, l];
        }
        return [Ah, Al];
    }
    const toBig = (h, l) => (BigInt(h >>> 0) << _32n) | BigInt(l >>> 0);
    // for Shift in [0, 32)
    const shrSH = (h, _l, s) => h >>> s;
    const shrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
    // Right rotate for Shift in [1, 32)
    const rotrSH = (h, l, s) => (h >>> s) | (l << (32 - s));
    const rotrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
    // Right rotate for Shift in (32, 64), NOTE: 32 is special case.
    const rotrBH = (h, l, s) => (h << (64 - s)) | (l >>> (s - 32));
    const rotrBL = (h, l, s) => (h >>> (s - 32)) | (l << (64 - s));
    // Right rotate for shift===32 (just swaps l&h)
    const rotr32H = (_h, l) => l;
    const rotr32L = (h, _l) => h;
    // Left rotate for Shift in [1, 32)
    const rotlSH = (h, l, s) => (h << s) | (l >>> (32 - s));
    const rotlSL = (h, l, s) => (l << s) | (h >>> (32 - s));
    // Left rotate for Shift in (32, 64), NOTE: 32 is special case.
    const rotlBH = (h, l, s) => (l << (s - 32)) | (h >>> (64 - s));
    const rotlBL = (h, l, s) => (h << (s - 32)) | (l >>> (64 - s));
    // JS uses 32-bit signed integers for bitwise operations which means we cannot
    // simple take carry out of low bit sum by shift, we need to use division.
    function add(Ah, Al, Bh, Bl) {
        const l = (Al >>> 0) + (Bl >>> 0);
        return { h: (Ah + Bh + ((l / 2 ** 32) | 0)) | 0, l: l | 0 };
    }
    // Addition with more than 2 elements
    const add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
    const add3H = (low, Ah, Bh, Ch) => (Ah + Bh + Ch + ((low / 2 ** 32) | 0)) | 0;
    const add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
    const add4H = (low, Ah, Bh, Ch, Dh) => (Ah + Bh + Ch + Dh + ((low / 2 ** 32) | 0)) | 0;
    const add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
    const add5H = (low, Ah, Bh, Ch, Dh, Eh) => (Ah + Bh + Ch + Dh + Eh + ((low / 2 ** 32) | 0)) | 0;
    // prettier-ignore
    const u64 = {
        fromBig, split: split$1, toBig,
        shrSH, shrSL,
        rotrSH, rotrSL, rotrBH, rotrBL,
        rotr32H, rotr32L,
        rotlSH, rotlSL, rotlBH, rotlBL,
        add, add3L, add3H, add4L, add4H, add5H, add5L,
    };

    // Round contants (first 32 bits of the fractional parts of the cube roots of the first 80 primes 2..409):
    // prettier-ignore
    const [SHA512_Kh, SHA512_Kl] = /* @__PURE__ */ (() => u64.split([
        '0x428a2f98d728ae22', '0x7137449123ef65cd', '0xb5c0fbcfec4d3b2f', '0xe9b5dba58189dbbc',
        '0x3956c25bf348b538', '0x59f111f1b605d019', '0x923f82a4af194f9b', '0xab1c5ed5da6d8118',
        '0xd807aa98a3030242', '0x12835b0145706fbe', '0x243185be4ee4b28c', '0x550c7dc3d5ffb4e2',
        '0x72be5d74f27b896f', '0x80deb1fe3b1696b1', '0x9bdc06a725c71235', '0xc19bf174cf692694',
        '0xe49b69c19ef14ad2', '0xefbe4786384f25e3', '0x0fc19dc68b8cd5b5', '0x240ca1cc77ac9c65',
        '0x2de92c6f592b0275', '0x4a7484aa6ea6e483', '0x5cb0a9dcbd41fbd4', '0x76f988da831153b5',
        '0x983e5152ee66dfab', '0xa831c66d2db43210', '0xb00327c898fb213f', '0xbf597fc7beef0ee4',
        '0xc6e00bf33da88fc2', '0xd5a79147930aa725', '0x06ca6351e003826f', '0x142929670a0e6e70',
        '0x27b70a8546d22ffc', '0x2e1b21385c26c926', '0x4d2c6dfc5ac42aed', '0x53380d139d95b3df',
        '0x650a73548baf63de', '0x766a0abb3c77b2a8', '0x81c2c92e47edaee6', '0x92722c851482353b',
        '0xa2bfe8a14cf10364', '0xa81a664bbc423001', '0xc24b8b70d0f89791', '0xc76c51a30654be30',
        '0xd192e819d6ef5218', '0xd69906245565a910', '0xf40e35855771202a', '0x106aa07032bbd1b8',
        '0x19a4c116b8d2d0c8', '0x1e376c085141ab53', '0x2748774cdf8eeb99', '0x34b0bcb5e19b48a8',
        '0x391c0cb3c5c95a63', '0x4ed8aa4ae3418acb', '0x5b9cca4f7763e373', '0x682e6ff3d6b2b8a3',
        '0x748f82ee5defb2fc', '0x78a5636f43172f60', '0x84c87814a1f0ab72', '0x8cc702081a6439ec',
        '0x90befffa23631e28', '0xa4506cebde82bde9', '0xbef9a3f7b2c67915', '0xc67178f2e372532b',
        '0xca273eceea26619c', '0xd186b8c721c0c207', '0xeada7dd6cde0eb1e', '0xf57d4f7fee6ed178',
        '0x06f067aa72176fba', '0x0a637dc5a2c898a6', '0x113f9804bef90dae', '0x1b710b35131c471b',
        '0x28db77f523047d84', '0x32caab7b40c72493', '0x3c9ebe0a15c9bebc', '0x431d67c49c100d4c',
        '0x4cc5d4becb3e42b6', '0x597f299cfc657e2a', '0x5fcb6fab3ad6faec', '0x6c44198c4a475817'
    ].map(n => BigInt(n))))();
    // Temporary buffer, not used to store anything between runs
    const SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
    const SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
    class SHA512 extends SHA2 {
        constructor() {
            super(128, 64, 16, false);
            // We cannot use array here since array allows indexing by variable which means optimizer/compiler cannot use registers.
            // Also looks cleaner and easier to verify with spec.
            // Initial state (first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19):
            // h -- high 32 bits, l -- low 32 bits
            this.Ah = 0x6a09e667 | 0;
            this.Al = 0xf3bcc908 | 0;
            this.Bh = 0xbb67ae85 | 0;
            this.Bl = 0x84caa73b | 0;
            this.Ch = 0x3c6ef372 | 0;
            this.Cl = 0xfe94f82b | 0;
            this.Dh = 0xa54ff53a | 0;
            this.Dl = 0x5f1d36f1 | 0;
            this.Eh = 0x510e527f | 0;
            this.El = 0xade682d1 | 0;
            this.Fh = 0x9b05688c | 0;
            this.Fl = 0x2b3e6c1f | 0;
            this.Gh = 0x1f83d9ab | 0;
            this.Gl = 0xfb41bd6b | 0;
            this.Hh = 0x5be0cd19 | 0;
            this.Hl = 0x137e2179 | 0;
        }
        // prettier-ignore
        get() {
            const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
            return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
        }
        // prettier-ignore
        set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
            this.Ah = Ah | 0;
            this.Al = Al | 0;
            this.Bh = Bh | 0;
            this.Bl = Bl | 0;
            this.Ch = Ch | 0;
            this.Cl = Cl | 0;
            this.Dh = Dh | 0;
            this.Dl = Dl | 0;
            this.Eh = Eh | 0;
            this.El = El | 0;
            this.Fh = Fh | 0;
            this.Fl = Fl | 0;
            this.Gh = Gh | 0;
            this.Gl = Gl | 0;
            this.Hh = Hh | 0;
            this.Hl = Hl | 0;
        }
        process(view, offset) {
            // Extend the first 16 words into the remaining 64 words w[16..79] of the message schedule array
            for (let i = 0; i < 16; i++, offset += 4) {
                SHA512_W_H[i] = view.getUint32(offset);
                SHA512_W_L[i] = view.getUint32((offset += 4));
            }
            for (let i = 16; i < 80; i++) {
                // s0 := (w[i-15] rightrotate 1) xor (w[i-15] rightrotate 8) xor (w[i-15] rightshift 7)
                const W15h = SHA512_W_H[i - 15] | 0;
                const W15l = SHA512_W_L[i - 15] | 0;
                const s0h = u64.rotrSH(W15h, W15l, 1) ^ u64.rotrSH(W15h, W15l, 8) ^ u64.shrSH(W15h, W15l, 7);
                const s0l = u64.rotrSL(W15h, W15l, 1) ^ u64.rotrSL(W15h, W15l, 8) ^ u64.shrSL(W15h, W15l, 7);
                // s1 := (w[i-2] rightrotate 19) xor (w[i-2] rightrotate 61) xor (w[i-2] rightshift 6)
                const W2h = SHA512_W_H[i - 2] | 0;
                const W2l = SHA512_W_L[i - 2] | 0;
                const s1h = u64.rotrSH(W2h, W2l, 19) ^ u64.rotrBH(W2h, W2l, 61) ^ u64.shrSH(W2h, W2l, 6);
                const s1l = u64.rotrSL(W2h, W2l, 19) ^ u64.rotrBL(W2h, W2l, 61) ^ u64.shrSL(W2h, W2l, 6);
                // SHA256_W[i] = s0 + s1 + SHA256_W[i - 7] + SHA256_W[i - 16];
                const SUMl = u64.add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
                const SUMh = u64.add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
                SHA512_W_H[i] = SUMh | 0;
                SHA512_W_L[i] = SUMl | 0;
            }
            let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
            // Compression function main loop, 80 rounds
            for (let i = 0; i < 80; i++) {
                // S1 := (e rightrotate 14) xor (e rightrotate 18) xor (e rightrotate 41)
                const sigma1h = u64.rotrSH(Eh, El, 14) ^ u64.rotrSH(Eh, El, 18) ^ u64.rotrBH(Eh, El, 41);
                const sigma1l = u64.rotrSL(Eh, El, 14) ^ u64.rotrSL(Eh, El, 18) ^ u64.rotrBL(Eh, El, 41);
                //const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
                const CHIh = (Eh & Fh) ^ (~Eh & Gh);
                const CHIl = (El & Fl) ^ (~El & Gl);
                // T1 = H + sigma1 + Chi(E, F, G) + SHA512_K[i] + SHA512_W[i]
                // prettier-ignore
                const T1ll = u64.add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
                const T1h = u64.add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
                const T1l = T1ll | 0;
                // S0 := (a rightrotate 28) xor (a rightrotate 34) xor (a rightrotate 39)
                const sigma0h = u64.rotrSH(Ah, Al, 28) ^ u64.rotrBH(Ah, Al, 34) ^ u64.rotrBH(Ah, Al, 39);
                const sigma0l = u64.rotrSL(Ah, Al, 28) ^ u64.rotrBL(Ah, Al, 34) ^ u64.rotrBL(Ah, Al, 39);
                const MAJh = (Ah & Bh) ^ (Ah & Ch) ^ (Bh & Ch);
                const MAJl = (Al & Bl) ^ (Al & Cl) ^ (Bl & Cl);
                Hh = Gh | 0;
                Hl = Gl | 0;
                Gh = Fh | 0;
                Gl = Fl | 0;
                Fh = Eh | 0;
                Fl = El | 0;
                ({ h: Eh, l: El } = u64.add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
                Dh = Ch | 0;
                Dl = Cl | 0;
                Ch = Bh | 0;
                Cl = Bl | 0;
                Bh = Ah | 0;
                Bl = Al | 0;
                const All = u64.add3L(T1l, sigma0l, MAJl);
                Ah = u64.add3H(All, T1h, sigma0h, MAJh);
                Al = All | 0;
            }
            // Add the compressed chunk to the current hash value
            ({ h: Ah, l: Al } = u64.add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
            ({ h: Bh, l: Bl } = u64.add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
            ({ h: Ch, l: Cl } = u64.add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
            ({ h: Dh, l: Dl } = u64.add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
            ({ h: Eh, l: El } = u64.add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
            ({ h: Fh, l: Fl } = u64.add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
            ({ h: Gh, l: Gl } = u64.add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
            ({ h: Hh, l: Hl } = u64.add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
            this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
        }
        roundClean() {
            SHA512_W_H.fill(0);
            SHA512_W_L.fill(0);
        }
        destroy() {
            this.buffer.fill(0);
            this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        }
    }
    const sha512$1 = /* @__PURE__ */ wrapConstructor(() => new SHA512());

    /* Browser Crypto Shims */
    function getGlobal$1() {
        if (typeof self !== 'undefined') {
            return self;
        }
        if (typeof window !== 'undefined') {
            return window;
        }
        if (typeof global !== 'undefined') {
            return global;
        }
        throw new Error('unable to locate global object');
    }
    const anyGlobal = getGlobal$1();
    const crypto = anyGlobal.crypto || anyGlobal.msCrypto;
    function createHash(algo) {
        switch (algo) {
            case "sha256": return sha256$1.create();
            case "sha512": return sha512$1.create();
        }
        assertArgument(false, "invalid hashing algorithm name", "algorithm", algo);
    }
    function createHmac(_algo, key) {
        const algo = ({ sha256: sha256$1, sha512: sha512$1 }[_algo]);
        assertArgument(algo != null, "invalid hmac algorithm", "algorithm", _algo);
        return hmac.create(algo, key);
    }
    function pbkdf2Sync(password, salt, iterations, keylen, _algo) {
        const algo = ({ sha256: sha256$1, sha512: sha512$1 }[_algo]);
        assertArgument(algo != null, "invalid pbkdf2 algorithm", "algorithm", _algo);
        return pbkdf2$1(algo, password, salt, { c: iterations, dkLen: keylen });
    }
    function randomBytes$1(length) {
        assert(crypto != null, "platform does not support secure random numbers", "UNSUPPORTED_OPERATION", {
            operation: "randomBytes"
        });
        assertArgument(Number.isInteger(length) && length > 0 && length <= 1024, "invalid length", "length", length);
        const result = new Uint8Array(length);
        crypto.getRandomValues(result);
        return result;
    }

    /**
     *  An **HMAC** enables verification that a given key was used
     *  to authenticate a payload.
     *
     *  See: [[link-wiki-hmac]]
     *
     *  @_subsection: api/crypto:HMAC  [about-hmac]
     */
    let locked$4 = false;
    const _computeHmac = function (algorithm, key, data) {
        return createHmac(algorithm, key).update(data).digest();
    };
    let __computeHmac = _computeHmac;
    /**
     *  Return the HMAC for %%data%% using the %%key%% key with the underlying
     *  %%algo%% used for compression.
     *
     *  @example:
     *    key = id("some-secret")
     *
     *    // Compute the HMAC
     *    computeHmac("sha256", key, "0x1337")
     *    //_result:
     *
     *    // To compute the HMAC of UTF-8 data, the data must be
     *    // converted to UTF-8 bytes
     *    computeHmac("sha256", key, toUtf8Bytes("Hello World"))
     *    //_result:
     *
     */
    function computeHmac(algorithm, _key, _data) {
        const key = getBytes(_key, "key");
        const data = getBytes(_data, "data");
        return hexlify(__computeHmac(algorithm, key, data));
    }
    computeHmac._ = _computeHmac;
    computeHmac.lock = function () { locked$4 = true; };
    computeHmac.register = function (func) {
        if (locked$4) {
            throw new Error("computeHmac is locked");
        }
        __computeHmac = func;
    };
    Object.freeze(computeHmac);

    // SHA3 (keccak) is based on a new design: basically, the internal state is bigger than output size.
    // It's called a sponge function.
    // Various per round constants calculations
    const [SHA3_PI, SHA3_ROTL, _SHA3_IOTA] = [[], [], []];
    const _0n$4 = /* @__PURE__ */ BigInt(0);
    const _1n$5 = /* @__PURE__ */ BigInt(1);
    const _2n$3 = /* @__PURE__ */ BigInt(2);
    const _7n = /* @__PURE__ */ BigInt(7);
    const _256n = /* @__PURE__ */ BigInt(256);
    const _0x71n = /* @__PURE__ */ BigInt(0x71);
    for (let round = 0, R = _1n$5, x = 1, y = 0; round < 24; round++) {
        // Pi
        [x, y] = [y, (2 * x + 3 * y) % 5];
        SHA3_PI.push(2 * (5 * y + x));
        // Rotational
        SHA3_ROTL.push((((round + 1) * (round + 2)) / 2) % 64);
        // Iota
        let t = _0n$4;
        for (let j = 0; j < 7; j++) {
            R = ((R << _1n$5) ^ ((R >> _7n) * _0x71n)) % _256n;
            if (R & _2n$3)
                t ^= _1n$5 << ((_1n$5 << /* @__PURE__ */ BigInt(j)) - _1n$5);
        }
        _SHA3_IOTA.push(t);
    }
    const [SHA3_IOTA_H, SHA3_IOTA_L] = /* @__PURE__ */ split$1(_SHA3_IOTA, true);
    // Left rotation (without 0, 32, 64)
    const rotlH = (h, l, s) => (s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s));
    const rotlL = (h, l, s) => (s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s));
    // Same as keccakf1600, but allows to skip some rounds
    function keccakP(s, rounds = 24) {
        const B = new Uint32Array(5 * 2);
        // NOTE: all indices are x2 since we store state as u32 instead of u64 (bigints to slow in js)
        for (let round = 24 - rounds; round < 24; round++) {
            // Theta θ
            for (let x = 0; x < 10; x++)
                B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
            for (let x = 0; x < 10; x += 2) {
                const idx1 = (x + 8) % 10;
                const idx0 = (x + 2) % 10;
                const B0 = B[idx0];
                const B1 = B[idx0 + 1];
                const Th = rotlH(B0, B1, 1) ^ B[idx1];
                const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
                for (let y = 0; y < 50; y += 10) {
                    s[x + y] ^= Th;
                    s[x + y + 1] ^= Tl;
                }
            }
            // Rho (ρ) and Pi (π)
            let curH = s[2];
            let curL = s[3];
            for (let t = 0; t < 24; t++) {
                const shift = SHA3_ROTL[t];
                const Th = rotlH(curH, curL, shift);
                const Tl = rotlL(curH, curL, shift);
                const PI = SHA3_PI[t];
                curH = s[PI];
                curL = s[PI + 1];
                s[PI] = Th;
                s[PI + 1] = Tl;
            }
            // Chi (χ)
            for (let y = 0; y < 50; y += 10) {
                for (let x = 0; x < 10; x++)
                    B[x] = s[y + x];
                for (let x = 0; x < 10; x++)
                    s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
            }
            // Iota (ι)
            s[0] ^= SHA3_IOTA_H[round];
            s[1] ^= SHA3_IOTA_L[round];
        }
        B.fill(0);
    }
    class Keccak extends Hash {
        // NOTE: we accept arguments in bytes instead of bits here.
        constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
            super();
            this.blockLen = blockLen;
            this.suffix = suffix;
            this.outputLen = outputLen;
            this.enableXOF = enableXOF;
            this.rounds = rounds;
            this.pos = 0;
            this.posOut = 0;
            this.finished = false;
            this.destroyed = false;
            // Can be passed from user as dkLen
            number(outputLen);
            // 1600 = 5x5 matrix of 64bit.  1600 bits === 200 bytes
            if (0 >= this.blockLen || this.blockLen >= 200)
                throw new Error('Sha3 supports only keccak-f1600 function');
            this.state = new Uint8Array(200);
            this.state32 = u32(this.state);
        }
        keccak() {
            keccakP(this.state32, this.rounds);
            this.posOut = 0;
            this.pos = 0;
        }
        update(data) {
            exists(this);
            const { blockLen, state } = this;
            data = toBytes(data);
            const len = data.length;
            for (let pos = 0; pos < len;) {
                const take = Math.min(blockLen - this.pos, len - pos);
                for (let i = 0; i < take; i++)
                    state[this.pos++] ^= data[pos++];
                if (this.pos === blockLen)
                    this.keccak();
            }
            return this;
        }
        finish() {
            if (this.finished)
                return;
            this.finished = true;
            const { state, suffix, pos, blockLen } = this;
            // Do the padding
            state[pos] ^= suffix;
            if ((suffix & 0x80) !== 0 && pos === blockLen - 1)
                this.keccak();
            state[blockLen - 1] ^= 0x80;
            this.keccak();
        }
        writeInto(out) {
            exists(this, false);
            bytes(out);
            this.finish();
            const bufferOut = this.state;
            const { blockLen } = this;
            for (let pos = 0, len = out.length; pos < len;) {
                if (this.posOut >= blockLen)
                    this.keccak();
                const take = Math.min(blockLen - this.posOut, len - pos);
                out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
                this.posOut += take;
                pos += take;
            }
            return out;
        }
        xofInto(out) {
            // Sha3/Keccak usage with XOF is probably mistake, only SHAKE instances can do XOF
            if (!this.enableXOF)
                throw new Error('XOF is not possible for this instance');
            return this.writeInto(out);
        }
        xof(bytes) {
            number(bytes);
            return this.xofInto(new Uint8Array(bytes));
        }
        digestInto(out) {
            output(out, this);
            if (this.finished)
                throw new Error('digest() was already called');
            this.writeInto(out);
            this.destroy();
            return out;
        }
        digest() {
            return this.digestInto(new Uint8Array(this.outputLen));
        }
        destroy() {
            this.destroyed = true;
            this.state.fill(0);
        }
        _cloneInto(to) {
            const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
            to || (to = new Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
            to.state32.set(this.state32);
            to.pos = this.pos;
            to.posOut = this.posOut;
            to.finished = this.finished;
            to.rounds = rounds;
            // Suffix can change in cSHAKE
            to.suffix = suffix;
            to.outputLen = outputLen;
            to.enableXOF = enableXOF;
            to.destroyed = this.destroyed;
            return to;
        }
    }
    const gen = (suffix, blockLen, outputLen) => wrapConstructor(() => new Keccak(blockLen, suffix, outputLen));
    /**
     * keccak-256 hash function. Different from SHA3-256.
     * @param message - that would be hashed
     */
    const keccak_256 = /* @__PURE__ */ gen(0x01, 136, 256 / 8);

    /**
     *  Cryptographic hashing functions
     *
     *  @_subsection: api/crypto:Hash Functions [about-crypto-hashing]
     */
    let locked$3 = false;
    const _keccak256 = function (data) {
        return keccak_256(data);
    };
    let __keccak256 = _keccak256;
    /**
     *  Compute the cryptographic KECCAK256 hash of %%data%%.
     *
     *  The %%data%% **must** be a data representation, to compute the
     *  hash of UTF-8 data use the [[id]] function.
     *
     *  @returns DataHexstring
     *  @example:
     *    keccak256("0x")
     *    //_result:
     *
     *    keccak256("0x1337")
     *    //_result:
     *
     *    keccak256(new Uint8Array([ 0x13, 0x37 ]))
     *    //_result:
     *
     *    // Strings are assumed to be DataHexString, otherwise it will
     *    // throw. To hash UTF-8 data, see the note above.
     *    keccak256("Hello World")
     *    //_error:
     */
    function keccak256(_data) {
        const data = getBytes(_data, "data");
        return hexlify(__keccak256(data));
    }
    keccak256._ = _keccak256;
    keccak256.lock = function () { locked$3 = true; };
    keccak256.register = function (func) {
        if (locked$3) {
            throw new TypeError("keccak256 is locked");
        }
        __keccak256 = func;
    };
    Object.freeze(keccak256);

    // https://homes.esat.kuleuven.be/~bosselae/ripemd160.html
    // https://homes.esat.kuleuven.be/~bosselae/ripemd160/pdf/AB-9601/AB-9601.pdf
    const Rho = /* @__PURE__ */ new Uint8Array([7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8]);
    const Id = /* @__PURE__ */ Uint8Array.from({ length: 16 }, (_, i) => i);
    const Pi = /* @__PURE__ */ Id.map((i) => (9 * i + 5) % 16);
    let idxL = [Id];
    let idxR = [Pi];
    for (let i = 0; i < 4; i++)
        for (let j of [idxL, idxR])
            j.push(j[i].map((k) => Rho[k]));
    const shifts = /* @__PURE__ */ [
        [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8],
        [12, 13, 11, 15, 6, 9, 9, 7, 12, 15, 11, 13, 7, 8, 7, 7],
        [13, 15, 14, 11, 7, 7, 6, 8, 13, 14, 13, 12, 5, 5, 6, 9],
        [14, 11, 12, 14, 8, 6, 5, 5, 15, 12, 15, 14, 9, 9, 8, 6],
        [15, 12, 13, 13, 9, 5, 8, 6, 14, 11, 12, 11, 8, 6, 5, 5],
    ].map((i) => new Uint8Array(i));
    const shiftsL = /* @__PURE__ */ idxL.map((idx, i) => idx.map((j) => shifts[i][j]));
    const shiftsR = /* @__PURE__ */ idxR.map((idx, i) => idx.map((j) => shifts[i][j]));
    const Kl = /* @__PURE__ */ new Uint32Array([
        0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e,
    ]);
    const Kr = /* @__PURE__ */ new Uint32Array([
        0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000,
    ]);
    // The rotate left (circular left shift) operation for uint32
    const rotl$1 = (word, shift) => (word << shift) | (word >>> (32 - shift));
    // It's called f() in spec.
    function f(group, x, y, z) {
        if (group === 0)
            return x ^ y ^ z;
        else if (group === 1)
            return (x & y) | (~x & z);
        else if (group === 2)
            return (x | ~y) ^ z;
        else if (group === 3)
            return (x & z) | (y & ~z);
        else
            return x ^ (y | ~z);
    }
    // Temporary buffer, not used to store anything between runs
    const BUF = /* @__PURE__ */ new Uint32Array(16);
    class RIPEMD160 extends SHA2 {
        constructor() {
            super(64, 20, 8, true);
            this.h0 = 0x67452301 | 0;
            this.h1 = 0xefcdab89 | 0;
            this.h2 = 0x98badcfe | 0;
            this.h3 = 0x10325476 | 0;
            this.h4 = 0xc3d2e1f0 | 0;
        }
        get() {
            const { h0, h1, h2, h3, h4 } = this;
            return [h0, h1, h2, h3, h4];
        }
        set(h0, h1, h2, h3, h4) {
            this.h0 = h0 | 0;
            this.h1 = h1 | 0;
            this.h2 = h2 | 0;
            this.h3 = h3 | 0;
            this.h4 = h4 | 0;
        }
        process(view, offset) {
            for (let i = 0; i < 16; i++, offset += 4)
                BUF[i] = view.getUint32(offset, true);
            // prettier-ignore
            let al = this.h0 | 0, ar = al, bl = this.h1 | 0, br = bl, cl = this.h2 | 0, cr = cl, dl = this.h3 | 0, dr = dl, el = this.h4 | 0, er = el;
            // Instead of iterating 0 to 80, we split it into 5 groups
            // And use the groups in constants, functions, etc. Much simpler
            for (let group = 0; group < 5; group++) {
                const rGroup = 4 - group;
                const hbl = Kl[group], hbr = Kr[group]; // prettier-ignore
                const rl = idxL[group], rr = idxR[group]; // prettier-ignore
                const sl = shiftsL[group], sr = shiftsR[group]; // prettier-ignore
                for (let i = 0; i < 16; i++) {
                    const tl = (rotl$1(al + f(group, bl, cl, dl) + BUF[rl[i]] + hbl, sl[i]) + el) | 0;
                    al = el, el = dl, dl = rotl$1(cl, 10) | 0, cl = bl, bl = tl; // prettier-ignore
                }
                // 2 loops are 10% faster
                for (let i = 0; i < 16; i++) {
                    const tr = (rotl$1(ar + f(rGroup, br, cr, dr) + BUF[rr[i]] + hbr, sr[i]) + er) | 0;
                    ar = er, er = dr, dr = rotl$1(cr, 10) | 0, cr = br, br = tr; // prettier-ignore
                }
            }
            // Add the compressed chunk to the current hash value
            this.set((this.h1 + cl + dr) | 0, (this.h2 + dl + er) | 0, (this.h3 + el + ar) | 0, (this.h4 + al + br) | 0, (this.h0 + bl + cr) | 0);
        }
        roundClean() {
            BUF.fill(0);
        }
        destroy() {
            this.destroyed = true;
            this.buffer.fill(0);
            this.set(0, 0, 0, 0, 0);
        }
    }
    /**
     * RIPEMD-160 - a hash function from 1990s.
     * @param message - msg that would be hashed
     */
    const ripemd160$1 = /* @__PURE__ */ wrapConstructor(() => new RIPEMD160());

    let locked$2 = false;
    const _ripemd160 = function (data) {
        return ripemd160$1(data);
    };
    let __ripemd160 = _ripemd160;
    /**
     *  Compute the cryptographic RIPEMD-160 hash of %%data%%.
     *
     *  @_docloc: api/crypto:Hash Functions
     *  @returns DataHexstring
     *
     *  @example:
     *    ripemd160("0x")
     *    //_result:
     *
     *    ripemd160("0x1337")
     *    //_result:
     *
     *    ripemd160(new Uint8Array([ 0x13, 0x37 ]))
     *    //_result:
     *
     */
    function ripemd160(_data) {
        const data = getBytes(_data, "data");
        return hexlify(__ripemd160(data));
    }
    ripemd160._ = _ripemd160;
    ripemd160.lock = function () { locked$2 = true; };
    ripemd160.register = function (func) {
        if (locked$2) {
            throw new TypeError("ripemd160 is locked");
        }
        __ripemd160 = func;
    };
    Object.freeze(ripemd160);

    /**
     *  A **Password-Based Key-Derivation Function** is designed to create
     *  a sequence of bytes suitible as a **key** from a human-rememberable
     *  password.
     *
     *  @_subsection: api/crypto:Passwords  [about-pbkdf]
     */
    let locked$1 = false;
    const _pbkdf2 = function (password, salt, iterations, keylen, algo) {
        return pbkdf2Sync(password, salt, iterations, keylen, algo);
    };
    let __pbkdf2 = _pbkdf2;
    /**
     *  Return the [[link-pbkdf2]] for %%keylen%% bytes for %%password%% using
     *  the %%salt%% and using %%iterations%% of %%algo%%.
     *
     *  This PBKDF is outdated and should not be used in new projects, but is
     *  required to decrypt older files.
     *
     *  @example:
     *    // The password must be converted to bytes, and it is generally
     *    // best practices to ensure the string has been normalized. Many
     *    // formats explicitly indicate the normalization form to use.
     *    password = "hello"
     *    passwordBytes = toUtf8Bytes(password, "NFKC")
     *
     *    salt = id("some-salt")
     *
     *    // Compute the PBKDF2
     *    pbkdf2(passwordBytes, salt, 1024, 16, "sha256")
     *    //_result:
     */
    function pbkdf2(_password, _salt, iterations, keylen, algo) {
        const password = getBytes(_password, "password");
        const salt = getBytes(_salt, "salt");
        return hexlify(__pbkdf2(password, salt, iterations, keylen, algo));
    }
    pbkdf2._ = _pbkdf2;
    pbkdf2.lock = function () { locked$1 = true; };
    pbkdf2.register = function (func) {
        if (locked$1) {
            throw new Error("pbkdf2 is locked");
        }
        __pbkdf2 = func;
    };
    Object.freeze(pbkdf2);

    /**
     *  A **Cryptographically Secure Random Value** is one that has been
     *  generated with additional care take to prevent side-channels
     *  from allowing others to detect it and prevent others from through
     *  coincidence generate the same values.
     *
     *  @_subsection: api/crypto:Random Values  [about-crypto-random]
     */
    let locked = false;
    const _randomBytes = function (length) {
        return new Uint8Array(randomBytes$1(length));
    };
    let __randomBytes = _randomBytes;
    /**
     *  Return %%length%% bytes of cryptographically secure random data.
     *
     *  @example:
     *    randomBytes(8)
     *    //_result:
     */
    function randomBytes(length) {
        return __randomBytes(length);
    }
    randomBytes._ = _randomBytes;
    randomBytes.lock = function () { locked = true; };
    randomBytes.register = function (func) {
        if (locked) {
            throw new Error("randomBytes is locked");
        }
        __randomBytes = func;
    };
    Object.freeze(randomBytes);

    // RFC 7914 Scrypt KDF
    // Left rotate for uint32
    const rotl = (a, b) => (a << b) | (a >>> (32 - b));
    // The main Scrypt loop: uses Salsa extensively.
    // Six versions of the function were tried, this is the fastest one.
    // prettier-ignore
    function XorAndSalsa(prev, pi, input, ii, out, oi) {
        // Based on https://cr.yp.to/salsa20.html
        // Xor blocks
        let y00 = prev[pi++] ^ input[ii++], y01 = prev[pi++] ^ input[ii++];
        let y02 = prev[pi++] ^ input[ii++], y03 = prev[pi++] ^ input[ii++];
        let y04 = prev[pi++] ^ input[ii++], y05 = prev[pi++] ^ input[ii++];
        let y06 = prev[pi++] ^ input[ii++], y07 = prev[pi++] ^ input[ii++];
        let y08 = prev[pi++] ^ input[ii++], y09 = prev[pi++] ^ input[ii++];
        let y10 = prev[pi++] ^ input[ii++], y11 = prev[pi++] ^ input[ii++];
        let y12 = prev[pi++] ^ input[ii++], y13 = prev[pi++] ^ input[ii++];
        let y14 = prev[pi++] ^ input[ii++], y15 = prev[pi++] ^ input[ii++];
        // Save state to temporary variables (salsa)
        let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
        // Main loop (salsa)
        for (let i = 0; i < 8; i += 2) {
            x04 ^= rotl(x00 + x12 | 0, 7);
            x08 ^= rotl(x04 + x00 | 0, 9);
            x12 ^= rotl(x08 + x04 | 0, 13);
            x00 ^= rotl(x12 + x08 | 0, 18);
            x09 ^= rotl(x05 + x01 | 0, 7);
            x13 ^= rotl(x09 + x05 | 0, 9);
            x01 ^= rotl(x13 + x09 | 0, 13);
            x05 ^= rotl(x01 + x13 | 0, 18);
            x14 ^= rotl(x10 + x06 | 0, 7);
            x02 ^= rotl(x14 + x10 | 0, 9);
            x06 ^= rotl(x02 + x14 | 0, 13);
            x10 ^= rotl(x06 + x02 | 0, 18);
            x03 ^= rotl(x15 + x11 | 0, 7);
            x07 ^= rotl(x03 + x15 | 0, 9);
            x11 ^= rotl(x07 + x03 | 0, 13);
            x15 ^= rotl(x11 + x07 | 0, 18);
            x01 ^= rotl(x00 + x03 | 0, 7);
            x02 ^= rotl(x01 + x00 | 0, 9);
            x03 ^= rotl(x02 + x01 | 0, 13);
            x00 ^= rotl(x03 + x02 | 0, 18);
            x06 ^= rotl(x05 + x04 | 0, 7);
            x07 ^= rotl(x06 + x05 | 0, 9);
            x04 ^= rotl(x07 + x06 | 0, 13);
            x05 ^= rotl(x04 + x07 | 0, 18);
            x11 ^= rotl(x10 + x09 | 0, 7);
            x08 ^= rotl(x11 + x10 | 0, 9);
            x09 ^= rotl(x08 + x11 | 0, 13);
            x10 ^= rotl(x09 + x08 | 0, 18);
            x12 ^= rotl(x15 + x14 | 0, 7);
            x13 ^= rotl(x12 + x15 | 0, 9);
            x14 ^= rotl(x13 + x12 | 0, 13);
            x15 ^= rotl(x14 + x13 | 0, 18);
        }
        // Write output (salsa)
        out[oi++] = (y00 + x00) | 0;
        out[oi++] = (y01 + x01) | 0;
        out[oi++] = (y02 + x02) | 0;
        out[oi++] = (y03 + x03) | 0;
        out[oi++] = (y04 + x04) | 0;
        out[oi++] = (y05 + x05) | 0;
        out[oi++] = (y06 + x06) | 0;
        out[oi++] = (y07 + x07) | 0;
        out[oi++] = (y08 + x08) | 0;
        out[oi++] = (y09 + x09) | 0;
        out[oi++] = (y10 + x10) | 0;
        out[oi++] = (y11 + x11) | 0;
        out[oi++] = (y12 + x12) | 0;
        out[oi++] = (y13 + x13) | 0;
        out[oi++] = (y14 + x14) | 0;
        out[oi++] = (y15 + x15) | 0;
    }
    function BlockMix(input, ii, out, oi, r) {
        // The block B is r 128-byte chunks (which is equivalent of 2r 64-byte chunks)
        let head = oi + 0;
        let tail = oi + 16 * r;
        for (let i = 0; i < 16; i++)
            out[tail + i] = input[ii + (2 * r - 1) * 16 + i]; // X ← B[2r−1]
        for (let i = 0; i < r; i++, head += 16, ii += 16) {
            // We write odd & even Yi at same time. Even: 0bXXXXX0 Odd:  0bXXXXX1
            XorAndSalsa(out, tail, input, ii, out, head); // head[i] = Salsa(blockIn[2*i] ^ tail[i-1])
            if (i > 0)
                tail += 16; // First iteration overwrites tmp value in tail
            XorAndSalsa(out, head, input, (ii += 16), out, tail); // tail[i] = Salsa(blockIn[2*i+1] ^ head[i])
        }
    }
    // Common prologue and epilogue for sync/async functions
    function scryptInit(password, salt, _opts) {
        // Maxmem - 1GB+1KB by default
        const opts = checkOpts({
            dkLen: 32,
            asyncTick: 10,
            maxmem: 1024 ** 3 + 1024,
        }, _opts);
        const { N, r, p, dkLen, asyncTick, maxmem, onProgress } = opts;
        number(N);
        number(r);
        number(p);
        number(dkLen);
        number(asyncTick);
        number(maxmem);
        if (onProgress !== undefined && typeof onProgress !== 'function')
            throw new Error('progressCb should be function');
        const blockSize = 128 * r;
        const blockSize32 = blockSize / 4;
        if (N <= 1 || (N & (N - 1)) !== 0 || N >= 2 ** (blockSize / 8) || N > 2 ** 32) {
            // NOTE: we limit N to be less than 2**32 because of 32 bit variant of Integrify function
            // There is no JS engines that allows alocate more than 4GB per single Uint8Array for now, but can change in future.
            throw new Error('Scrypt: N must be larger than 1, a power of 2, less than 2^(128 * r / 8) and less than 2^32');
        }
        if (p < 0 || p > ((2 ** 32 - 1) * 32) / blockSize) {
            throw new Error('Scrypt: p must be a positive integer less than or equal to ((2^32 - 1) * 32) / (128 * r)');
        }
        if (dkLen < 0 || dkLen > (2 ** 32 - 1) * 32) {
            throw new Error('Scrypt: dkLen should be positive integer less than or equal to (2^32 - 1) * 32');
        }
        const memUsed = blockSize * (N + p);
        if (memUsed > maxmem) {
            throw new Error(`Scrypt: parameters too large, ${memUsed} (128 * r * (N + p)) > ${maxmem} (maxmem)`);
        }
        // [B0...Bp−1] ← PBKDF2HMAC-SHA256(Passphrase, Salt, 1, blockSize*ParallelizationFactor)
        // Since it has only one iteration there is no reason to use async variant
        const B = pbkdf2$1(sha256$1, password, salt, { c: 1, dkLen: blockSize * p });
        const B32 = u32(B);
        // Re-used between parallel iterations. Array(iterations) of B
        const V = u32(new Uint8Array(blockSize * N));
        const tmp = u32(new Uint8Array(blockSize));
        let blockMixCb = () => { };
        if (onProgress) {
            const totalBlockMix = 2 * N * p;
            // Invoke callback if progress changes from 10.01 to 10.02
            // Allows to draw smooth progress bar on up to 8K screen
            const callbackPer = Math.max(Math.floor(totalBlockMix / 10000), 1);
            let blockMixCnt = 0;
            blockMixCb = () => {
                blockMixCnt++;
                if (onProgress && (!(blockMixCnt % callbackPer) || blockMixCnt === totalBlockMix))
                    onProgress(blockMixCnt / totalBlockMix);
            };
        }
        return { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb, asyncTick };
    }
    function scryptOutput(password, dkLen, B, V, tmp) {
        const res = pbkdf2$1(sha256$1, password, B, { c: 1, dkLen });
        B.fill(0);
        V.fill(0);
        tmp.fill(0);
        return res;
    }
    /**
     * Scrypt KDF from RFC 7914.
     * @param password - pass
     * @param salt - salt
     * @param opts - parameters
     * - `N` is cpu/mem work factor (power of 2 e.g. 2**18)
     * - `r` is block size (8 is common), fine-tunes sequential memory read size and performance
     * - `p` is parallelization factor (1 is common)
     * - `dkLen` is output key length in bytes e.g. 32.
     * - `asyncTick` - (default: 10) max time in ms for which async function can block execution
     * - `maxmem` - (default: `1024 ** 3 + 1024` aka 1GB+1KB). A limit that the app could use for scrypt
     * - `onProgress` - callback function that would be executed for progress report
     * @returns Derived key
     */
    function scrypt$1(password, salt, opts) {
        const { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb } = scryptInit(password, salt, opts);
        for (let pi = 0; pi < p; pi++) {
            const Pi = blockSize32 * pi;
            for (let i = 0; i < blockSize32; i++)
                V[i] = B32[Pi + i]; // V[0] = B[i]
            for (let i = 0, pos = 0; i < N - 1; i++) {
                BlockMix(V, pos, V, (pos += blockSize32), r); // V[i] = BlockMix(V[i-1]);
                blockMixCb();
            }
            BlockMix(V, (N - 1) * blockSize32, B32, Pi, r); // Process last element
            blockMixCb();
            for (let i = 0; i < N; i++) {
                // First u32 of the last 64-byte block (u32 is LE)
                const j = B32[Pi + blockSize32 - 16] % N; // j = Integrify(X) % iterations
                for (let k = 0; k < blockSize32; k++)
                    tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k]; // tmp = B ^ V[j]
                BlockMix(tmp, 0, B32, Pi, r); // B = BlockMix(B ^ V[j])
                blockMixCb();
            }
        }
        return scryptOutput(password, dkLen, B, V, tmp);
    }
    /**
     * Scrypt KDF from RFC 7914.
     */
    async function scryptAsync(password, salt, opts) {
        const { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb, asyncTick } = scryptInit(password, salt, opts);
        for (let pi = 0; pi < p; pi++) {
            const Pi = blockSize32 * pi;
            for (let i = 0; i < blockSize32; i++)
                V[i] = B32[Pi + i]; // V[0] = B[i]
            let pos = 0;
            await asyncLoop(N - 1, asyncTick, () => {
                BlockMix(V, pos, V, (pos += blockSize32), r); // V[i] = BlockMix(V[i-1]);
                blockMixCb();
            });
            BlockMix(V, (N - 1) * blockSize32, B32, Pi, r); // Process last element
            blockMixCb();
            await asyncLoop(N, asyncTick, () => {
                // First u32 of the last 64-byte block (u32 is LE)
                const j = B32[Pi + blockSize32 - 16] % N; // j = Integrify(X) % iterations
                for (let k = 0; k < blockSize32; k++)
                    tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k]; // tmp = B ^ V[j]
                BlockMix(tmp, 0, B32, Pi, r); // B = BlockMix(B ^ V[j])
                blockMixCb();
            });
        }
        return scryptOutput(password, dkLen, B, V, tmp);
    }

    let lockedSync = false, lockedAsync = false;
    const _scryptAsync = async function (passwd, salt, N, r, p, dkLen, onProgress) {
        return await scryptAsync(passwd, salt, { N, r, p, dkLen, onProgress });
    };
    const _scryptSync = function (passwd, salt, N, r, p, dkLen) {
        return scrypt$1(passwd, salt, { N, r, p, dkLen });
    };
    let __scryptAsync = _scryptAsync;
    let __scryptSync = _scryptSync;
    /**
     *  The [[link-wiki-scrypt]] uses a memory and cpu hard method of
     *  derivation to increase the resource cost to brute-force a password
     *  for a given key.
     *
     *  This means this algorithm is intentionally slow, and can be tuned to
     *  become slower. As computation and memory speed improve over time,
     *  increasing the difficulty maintains the cost of an attacker.
     *
     *  For example, if a target time of 5 seconds is used, a legitimate user
     *  which knows their password requires only 5 seconds to unlock their
     *  account. A 6 character password has 68 billion possibilities, which
     *  would require an attacker to invest over 10,000 years of CPU time. This
     *  is of course a crude example (as password generally aren't random),
     *  but demonstrates to value of imposing large costs to decryption.
     *
     *  For this reason, if building a UI which involved decrypting or
     *  encrypting datsa using scrypt, it is recommended to use a
     *  [[ProgressCallback]] (as event short periods can seem lik an eternity
     *  if the UI freezes). Including the phrase //"decrypting"// in the UI
     *  can also help, assuring the user their waiting is for a good reason.
     *
     *  @_docloc: api/crypto:Passwords
     *
     *  @example:
     *    // The password must be converted to bytes, and it is generally
     *    // best practices to ensure the string has been normalized. Many
     *    // formats explicitly indicate the normalization form to use.
     *    password = "hello"
     *    passwordBytes = toUtf8Bytes(password, "NFKC")
     *
     *    salt = id("some-salt")
     *
     *    // Compute the scrypt
     *    scrypt(passwordBytes, salt, 1024, 8, 1, 16)
     *    //_result:
     */
    async function scrypt(_passwd, _salt, N, r, p, dkLen, progress) {
        const passwd = getBytes(_passwd, "passwd");
        const salt = getBytes(_salt, "salt");
        return hexlify(await __scryptAsync(passwd, salt, N, r, p, dkLen, progress));
    }
    scrypt._ = _scryptAsync;
    scrypt.lock = function () { lockedAsync = true; };
    scrypt.register = function (func) {
        if (lockedAsync) {
            throw new Error("scrypt is locked");
        }
        __scryptAsync = func;
    };
    Object.freeze(scrypt);
    /**
     *  Provides a synchronous variant of [[scrypt]].
     *
     *  This will completely lock up and freeze the UI in a browser and will
     *  prevent any event loop from progressing. For this reason, it is
     *  preferred to use the [async variant](scrypt).
     *
     *  @_docloc: api/crypto:Passwords
     *
     *  @example:
     *    // The password must be converted to bytes, and it is generally
     *    // best practices to ensure the string has been normalized. Many
     *    // formats explicitly indicate the normalization form to use.
     *    password = "hello"
     *    passwordBytes = toUtf8Bytes(password, "NFKC")
     *
     *    salt = id("some-salt")
     *
     *    // Compute the scrypt
     *    scryptSync(passwordBytes, salt, 1024, 8, 1, 16)
     *    //_result:
     */
    function scryptSync(_passwd, _salt, N, r, p, dkLen) {
        const passwd = getBytes(_passwd, "passwd");
        const salt = getBytes(_salt, "salt");
        return hexlify(__scryptSync(passwd, salt, N, r, p, dkLen));
    }
    scryptSync._ = _scryptSync;
    scryptSync.lock = function () { lockedSync = true; };
    scryptSync.register = function (func) {
        if (lockedSync) {
            throw new Error("scryptSync is locked");
        }
        __scryptSync = func;
    };
    Object.freeze(scryptSync);

    const _sha256 = function (data) {
        return createHash("sha256").update(data).digest();
    };
    const _sha512 = function (data) {
        return createHash("sha512").update(data).digest();
    };
    let __sha256 = _sha256;
    let __sha512 = _sha512;
    let locked256 = false, locked512 = false;
    /**
     *  Compute the cryptographic SHA2-256 hash of %%data%%.
     *
     *  @_docloc: api/crypto:Hash Functions
     *  @returns DataHexstring
     *
     *  @example:
     *    sha256("0x")
     *    //_result:
     *
     *    sha256("0x1337")
     *    //_result:
     *
     *    sha256(new Uint8Array([ 0x13, 0x37 ]))
     *    //_result:
     *
     */
    function sha256(_data) {
        const data = getBytes(_data, "data");
        return hexlify(__sha256(data));
    }
    sha256._ = _sha256;
    sha256.lock = function () { locked256 = true; };
    sha256.register = function (func) {
        if (locked256) {
            throw new Error("sha256 is locked");
        }
        __sha256 = func;
    };
    Object.freeze(sha256);
    /**
     *  Compute the cryptographic SHA2-512 hash of %%data%%.
     *
     *  @_docloc: api/crypto:Hash Functions
     *  @returns DataHexstring
     *
     *  @example:
     *    sha512("0x")
     *    //_result:
     *
     *    sha512("0x1337")
     *    //_result:
     *
     *    sha512(new Uint8Array([ 0x13, 0x37 ]))
     *    //_result:
     */
    function sha512(_data) {
        const data = getBytes(_data, "data");
        return hexlify(__sha512(data));
    }
    sha512._ = _sha512;
    sha512.lock = function () { locked512 = true; };
    sha512.register = function (func) {
        if (locked512) {
            throw new Error("sha512 is locked");
        }
        __sha512 = func;
    };
    Object.freeze(sha256);

    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    // 100 lines of code in the file are duplicated from noble-hashes (utils).
    // This is OK: `abstract` directory does not use noble-hashes.
    // User may opt-in into using different hashing library. This way, noble-hashes
    // won't be included into their bundle.
    const _0n$3 = BigInt(0);
    const _1n$4 = BigInt(1);
    const _2n$2 = BigInt(2);
    const u8a = (a) => a instanceof Uint8Array;
    const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
    /**
     * @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) // 'cafe0123'
     */
    function bytesToHex(bytes) {
        if (!u8a(bytes))
            throw new Error('Uint8Array expected');
        // pre-caching improves the speed 6x
        let hex = '';
        for (let i = 0; i < bytes.length; i++) {
            hex += hexes[bytes[i]];
        }
        return hex;
    }
    function numberToHexUnpadded(num) {
        const hex = num.toString(16);
        return hex.length & 1 ? `0${hex}` : hex;
    }
    function hexToNumber(hex) {
        if (typeof hex !== 'string')
            throw new Error('hex string expected, got ' + typeof hex);
        // Big Endian
        return BigInt(hex === '' ? '0' : `0x${hex}`);
    }
    /**
     * @example hexToBytes('cafe0123') // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
     */
    function hexToBytes(hex) {
        if (typeof hex !== 'string')
            throw new Error('hex string expected, got ' + typeof hex);
        const len = hex.length;
        if (len % 2)
            throw new Error('padded hex string expected, got unpadded hex of length ' + len);
        const array = new Uint8Array(len / 2);
        for (let i = 0; i < array.length; i++) {
            const j = i * 2;
            const hexByte = hex.slice(j, j + 2);
            const byte = Number.parseInt(hexByte, 16);
            if (Number.isNaN(byte) || byte < 0)
                throw new Error('Invalid byte sequence');
            array[i] = byte;
        }
        return array;
    }
    // BE: Big Endian, LE: Little Endian
    function bytesToNumberBE(bytes) {
        return hexToNumber(bytesToHex(bytes));
    }
    function bytesToNumberLE(bytes) {
        if (!u8a(bytes))
            throw new Error('Uint8Array expected');
        return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
    }
    function numberToBytesBE(n, len) {
        return hexToBytes(n.toString(16).padStart(len * 2, '0'));
    }
    function numberToBytesLE(n, len) {
        return numberToBytesBE(n, len).reverse();
    }
    // Unpadded, rarely used
    function numberToVarBytesBE(n) {
        return hexToBytes(numberToHexUnpadded(n));
    }
    /**
     * Takes hex string or Uint8Array, converts to Uint8Array.
     * Validates output length.
     * Will throw error for other types.
     * @param title descriptive title for an error e.g. 'private key'
     * @param hex hex string or Uint8Array
     * @param expectedLength optional, will compare to result array's length
     * @returns
     */
    function ensureBytes(title, hex, expectedLength) {
        let res;
        if (typeof hex === 'string') {
            try {
                res = hexToBytes(hex);
            }
            catch (e) {
                throw new Error(`${title} must be valid hex string, got "${hex}". Cause: ${e}`);
            }
        }
        else if (u8a(hex)) {
            // Uint8Array.from() instead of hash.slice() because node.js Buffer
            // is instance of Uint8Array, and its slice() creates **mutable** copy
            res = Uint8Array.from(hex);
        }
        else {
            throw new Error(`${title} must be hex string or Uint8Array`);
        }
        const len = res.length;
        if (typeof expectedLength === 'number' && len !== expectedLength)
            throw new Error(`${title} expected ${expectedLength} bytes, got ${len}`);
        return res;
    }
    /**
     * Copies several Uint8Arrays into one.
     */
    function concatBytes(...arrays) {
        const r = new Uint8Array(arrays.reduce((sum, a) => sum + a.length, 0));
        let pad = 0; // walk through each item, ensure they have proper type
        arrays.forEach((a) => {
            if (!u8a(a))
                throw new Error('Uint8Array expected');
            r.set(a, pad);
            pad += a.length;
        });
        return r;
    }
    function equalBytes(b1, b2) {
        // We don't care about timing attacks here
        if (b1.length !== b2.length)
            return false;
        for (let i = 0; i < b1.length; i++)
            if (b1[i] !== b2[i])
                return false;
        return true;
    }
    /**
     * @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
     */
    function utf8ToBytes(str) {
        if (typeof str !== 'string')
            throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
        return new Uint8Array(new TextEncoder().encode(str)); // https://bugzil.la/1681809
    }
    // Bit operations
    /**
     * Calculates amount of bits in a bigint.
     * Same as `n.toString(2).length`
     */
    function bitLen(n) {
        let len;
        for (len = 0; n > _0n$3; n >>= _1n$4, len += 1)
            ;
        return len;
    }
    /**
     * Gets single bit at position.
     * NOTE: first bit position is 0 (same as arrays)
     * Same as `!!+Array.from(n.toString(2)).reverse()[pos]`
     */
    function bitGet(n, pos) {
        return (n >> BigInt(pos)) & _1n$4;
    }
    /**
     * Sets single bit at position.
     */
    const bitSet = (n, pos, value) => {
        return n | ((value ? _1n$4 : _0n$3) << BigInt(pos));
    };
    /**
     * Calculate mask for N bits. Not using ** operator with bigints because of old engines.
     * Same as BigInt(`0b${Array(i).fill('1').join('')}`)
     */
    const bitMask = (n) => (_2n$2 << BigInt(n - 1)) - _1n$4;
    // DRBG
    const u8n = (data) => new Uint8Array(data); // creates Uint8Array
    const u8fr = (arr) => Uint8Array.from(arr); // another shortcut
    /**
     * Minimal HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
     * @returns function that will call DRBG until 2nd arg returns something meaningful
     * @example
     *   const drbg = createHmacDRBG<Key>(32, 32, hmac);
     *   drbg(seed, bytesToKey); // bytesToKey must return Key or undefined
     */
    function createHmacDrbg(hashLen, qByteLen, hmacFn) {
        if (typeof hashLen !== 'number' || hashLen < 2)
            throw new Error('hashLen must be a number');
        if (typeof qByteLen !== 'number' || qByteLen < 2)
            throw new Error('qByteLen must be a number');
        if (typeof hmacFn !== 'function')
            throw new Error('hmacFn must be a function');
        // Step B, Step C: set hashLen to 8*ceil(hlen/8)
        let v = u8n(hashLen); // Minimal non-full-spec HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
        let k = u8n(hashLen); // Steps B and C of RFC6979 3.2: set hashLen, in our case always same
        let i = 0; // Iterations counter, will throw when over 1000
        const reset = () => {
            v.fill(1);
            k.fill(0);
            i = 0;
        };
        const h = (...b) => hmacFn(k, v, ...b); // hmac(k)(v, ...values)
        const reseed = (seed = u8n()) => {
            // HMAC-DRBG reseed() function. Steps D-G
            k = h(u8fr([0x00]), seed); // k = hmac(k || v || 0x00 || seed)
            v = h(); // v = hmac(k || v)
            if (seed.length === 0)
                return;
            k = h(u8fr([0x01]), seed); // k = hmac(k || v || 0x01 || seed)
            v = h(); // v = hmac(k || v)
        };
        const gen = () => {
            // HMAC-DRBG generate() function
            if (i++ >= 1000)
                throw new Error('drbg: tried 1000 values');
            let len = 0;
            const out = [];
            while (len < qByteLen) {
                v = h();
                const sl = v.slice();
                out.push(sl);
                len += v.length;
            }
            return concatBytes(...out);
        };
        const genUntil = (seed, pred) => {
            reset();
            reseed(seed); // Steps D-G
            let res = undefined; // Step H: grind until k is in [1..n-1]
            while (!(res = pred(gen())))
                reseed();
            reset();
            return res;
        };
        return genUntil;
    }
    // Validating curves and fields
    const validatorFns = {
        bigint: (val) => typeof val === 'bigint',
        function: (val) => typeof val === 'function',
        boolean: (val) => typeof val === 'boolean',
        string: (val) => typeof val === 'string',
        stringOrUint8Array: (val) => typeof val === 'string' || val instanceof Uint8Array,
        isSafeInteger: (val) => Number.isSafeInteger(val),
        array: (val) => Array.isArray(val),
        field: (val, object) => object.Fp.isValid(val),
        hash: (val) => typeof val === 'function' && Number.isSafeInteger(val.outputLen),
    };
    // type Record<K extends string | number | symbol, T> = { [P in K]: T; }
    function validateObject(object, validators, optValidators = {}) {
        const checkField = (fieldName, type, isOptional) => {
            const checkVal = validatorFns[type];
            if (typeof checkVal !== 'function')
                throw new Error(`Invalid validator "${type}", expected function`);
            const val = object[fieldName];
            if (isOptional && val === undefined)
                return;
            if (!checkVal(val, object)) {
                throw new Error(`Invalid param ${String(fieldName)}=${val} (${typeof val}), expected ${type}`);
            }
        };
        for (const [fieldName, type] of Object.entries(validators))
            checkField(fieldName, type, false);
        for (const [fieldName, type] of Object.entries(optValidators))
            checkField(fieldName, type, true);
        return object;
    }
    // validate type tests
    // const o: { a: number; b: number; c: number } = { a: 1, b: 5, c: 6 };
    // const z0 = validateObject(o, { a: 'isSafeInteger' }, { c: 'bigint' }); // Ok!
    // // Should fail type-check
    // const z1 = validateObject(o, { a: 'tmp' }, { c: 'zz' });
    // const z2 = validateObject(o, { a: 'isSafeInteger' }, { c: 'zz' });
    // const z3 = validateObject(o, { test: 'boolean', z: 'bug' });
    // const z4 = validateObject(o, { a: 'boolean', z: 'bug' });

    var ut = /*#__PURE__*/Object.freeze({
        __proto__: null,
        bitGet: bitGet,
        bitLen: bitLen,
        bitMask: bitMask,
        bitSet: bitSet,
        bytesToHex: bytesToHex,
        bytesToNumberBE: bytesToNumberBE,
        bytesToNumberLE: bytesToNumberLE,
        concatBytes: concatBytes,
        createHmacDrbg: createHmacDrbg,
        ensureBytes: ensureBytes,
        equalBytes: equalBytes,
        hexToBytes: hexToBytes,
        hexToNumber: hexToNumber,
        numberToBytesBE: numberToBytesBE,
        numberToBytesLE: numberToBytesLE,
        numberToHexUnpadded: numberToHexUnpadded,
        numberToVarBytesBE: numberToVarBytesBE,
        utf8ToBytes: utf8ToBytes,
        validateObject: validateObject
    });

    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    // Utilities for modular arithmetics and finite fields
    // prettier-ignore
    const _0n$2 = BigInt(0), _1n$3 = BigInt(1), _2n$1 = BigInt(2), _3n$1 = BigInt(3);
    // prettier-ignore
    const _4n = BigInt(4), _5n = BigInt(5), _8n = BigInt(8);
    // prettier-ignore
    BigInt(9); BigInt(16);
    // Calculates a modulo b
    function mod(a, b) {
        const result = a % b;
        return result >= _0n$2 ? result : b + result;
    }
    /**
     * Efficiently raise num to power and do modular division.
     * Unsafe in some contexts: uses ladder, so can expose bigint bits.
     * @example
     * pow(2n, 6n, 11n) // 64n % 11n == 9n
     */
    // TODO: use field version && remove
    function pow(num, power, modulo) {
        if (modulo <= _0n$2 || power < _0n$2)
            throw new Error('Expected power/modulo > 0');
        if (modulo === _1n$3)
            return _0n$2;
        let res = _1n$3;
        while (power > _0n$2) {
            if (power & _1n$3)
                res = (res * num) % modulo;
            num = (num * num) % modulo;
            power >>= _1n$3;
        }
        return res;
    }
    // Does x ^ (2 ^ power) mod p. pow2(30, 4) == 30 ^ (2 ^ 4)
    function pow2(x, power, modulo) {
        let res = x;
        while (power-- > _0n$2) {
            res *= res;
            res %= modulo;
        }
        return res;
    }
    // Inverses number over modulo
    function invert(number, modulo) {
        if (number === _0n$2 || modulo <= _0n$2) {
            throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
        }
        // Euclidean GCD https://brilliant.org/wiki/extended-euclidean-algorithm/
        // Fermat's little theorem "CT-like" version inv(n) = n^(m-2) mod m is 30x slower.
        let a = mod(number, modulo);
        let b = modulo;
        // prettier-ignore
        let x = _0n$2, u = _1n$3;
        while (a !== _0n$2) {
            // JIT applies optimization if those two lines follow each other
            const q = b / a;
            const r = b % a;
            const m = x - u * q;
            // prettier-ignore
            b = a, a = r, x = u, u = m;
        }
        const gcd = b;
        if (gcd !== _1n$3)
            throw new Error('invert: does not exist');
        return mod(x, modulo);
    }
    /**
     * Tonelli-Shanks square root search algorithm.
     * 1. https://eprint.iacr.org/2012/685.pdf (page 12)
     * 2. Square Roots from 1; 24, 51, 10 to Dan Shanks
     * Will start an infinite loop if field order P is not prime.
     * @param P field order
     * @returns function that takes field Fp (created from P) and number n
     */
    function tonelliShanks(P) {
        // Legendre constant: used to calculate Legendre symbol (a | p),
        // which denotes the value of a^((p-1)/2) (mod p).
        // (a | p) ≡ 1    if a is a square (mod p)
        // (a | p) ≡ -1   if a is not a square (mod p)
        // (a | p) ≡ 0    if a ≡ 0 (mod p)
        const legendreC = (P - _1n$3) / _2n$1;
        let Q, S, Z;
        // Step 1: By factoring out powers of 2 from p - 1,
        // find q and s such that p - 1 = q*(2^s) with q odd
        for (Q = P - _1n$3, S = 0; Q % _2n$1 === _0n$2; Q /= _2n$1, S++)
            ;
        // Step 2: Select a non-square z such that (z | p) ≡ -1 and set c ≡ zq
        for (Z = _2n$1; Z < P && pow(Z, legendreC, P) !== P - _1n$3; Z++)
            ;
        // Fast-path
        if (S === 1) {
            const p1div4 = (P + _1n$3) / _4n;
            return function tonelliFast(Fp, n) {
                const root = Fp.pow(n, p1div4);
                if (!Fp.eql(Fp.sqr(root), n))
                    throw new Error('Cannot find square root');
                return root;
            };
        }
        // Slow-path
        const Q1div2 = (Q + _1n$3) / _2n$1;
        return function tonelliSlow(Fp, n) {
            // Step 0: Check that n is indeed a square: (n | p) should not be ≡ -1
            if (Fp.pow(n, legendreC) === Fp.neg(Fp.ONE))
                throw new Error('Cannot find square root');
            let r = S;
            // TODO: will fail at Fp2/etc
            let g = Fp.pow(Fp.mul(Fp.ONE, Z), Q); // will update both x and b
            let x = Fp.pow(n, Q1div2); // first guess at the square root
            let b = Fp.pow(n, Q); // first guess at the fudge factor
            while (!Fp.eql(b, Fp.ONE)) {
                if (Fp.eql(b, Fp.ZERO))
                    return Fp.ZERO; // https://en.wikipedia.org/wiki/Tonelli%E2%80%93Shanks_algorithm (4. If t = 0, return r = 0)
                // Find m such b^(2^m)==1
                let m = 1;
                for (let t2 = Fp.sqr(b); m < r; m++) {
                    if (Fp.eql(t2, Fp.ONE))
                        break;
                    t2 = Fp.sqr(t2); // t2 *= t2
                }
                // NOTE: r-m-1 can be bigger than 32, need to convert to bigint before shift, otherwise there will be overflow
                const ge = Fp.pow(g, _1n$3 << BigInt(r - m - 1)); // ge = 2^(r-m-1)
                g = Fp.sqr(ge); // g = ge * ge
                x = Fp.mul(x, ge); // x *= ge
                b = Fp.mul(b, g); // b *= g
                r = m;
            }
            return x;
        };
    }
    function FpSqrt(P) {
        // NOTE: different algorithms can give different roots, it is up to user to decide which one they want.
        // For example there is FpSqrtOdd/FpSqrtEven to choice root based on oddness (used for hash-to-curve).
        // P ≡ 3 (mod 4)
        // √n = n^((P+1)/4)
        if (P % _4n === _3n$1) {
            // Not all roots possible!
            // const ORDER =
            //   0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn;
            // const NUM = 72057594037927816n;
            const p1div4 = (P + _1n$3) / _4n;
            return function sqrt3mod4(Fp, n) {
                const root = Fp.pow(n, p1div4);
                // Throw if root**2 != n
                if (!Fp.eql(Fp.sqr(root), n))
                    throw new Error('Cannot find square root');
                return root;
            };
        }
        // Atkin algorithm for q ≡ 5 (mod 8), https://eprint.iacr.org/2012/685.pdf (page 10)
        if (P % _8n === _5n) {
            const c1 = (P - _5n) / _8n;
            return function sqrt5mod8(Fp, n) {
                const n2 = Fp.mul(n, _2n$1);
                const v = Fp.pow(n2, c1);
                const nv = Fp.mul(n, v);
                const i = Fp.mul(Fp.mul(nv, _2n$1), v);
                const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
                if (!Fp.eql(Fp.sqr(root), n))
                    throw new Error('Cannot find square root');
                return root;
            };
        }
        // Other cases: Tonelli-Shanks algorithm
        return tonelliShanks(P);
    }
    // prettier-ignore
    const FIELD_FIELDS = [
        'create', 'isValid', 'is0', 'neg', 'inv', 'sqrt', 'sqr',
        'eql', 'add', 'sub', 'mul', 'pow', 'div',
        'addN', 'subN', 'mulN', 'sqrN'
    ];
    function validateField(field) {
        const initial = {
            ORDER: 'bigint',
            MASK: 'bigint',
            BYTES: 'isSafeInteger',
            BITS: 'isSafeInteger',
        };
        const opts = FIELD_FIELDS.reduce((map, val) => {
            map[val] = 'function';
            return map;
        }, initial);
        return validateObject(field, opts);
    }
    // Generic field functions
    /**
     * Same as `pow` but for Fp: non-constant-time.
     * Unsafe in some contexts: uses ladder, so can expose bigint bits.
     */
    function FpPow(f, num, power) {
        // Should have same speed as pow for bigints
        // TODO: benchmark!
        if (power < _0n$2)
            throw new Error('Expected power > 0');
        if (power === _0n$2)
            return f.ONE;
        if (power === _1n$3)
            return num;
        let p = f.ONE;
        let d = num;
        while (power > _0n$2) {
            if (power & _1n$3)
                p = f.mul(p, d);
            d = f.sqr(d);
            power >>= _1n$3;
        }
        return p;
    }
    /**
     * Efficiently invert an array of Field elements.
     * `inv(0)` will return `undefined` here: make sure to throw an error.
     */
    function FpInvertBatch(f, nums) {
        const tmp = new Array(nums.length);
        // Walk from first to last, multiply them by each other MOD p
        const lastMultiplied = nums.reduce((acc, num, i) => {
            if (f.is0(num))
                return acc;
            tmp[i] = acc;
            return f.mul(acc, num);
        }, f.ONE);
        // Invert last element
        const inverted = f.inv(lastMultiplied);
        // Walk from last to first, multiply them by inverted each other MOD p
        nums.reduceRight((acc, num, i) => {
            if (f.is0(num))
                return acc;
            tmp[i] = f.mul(acc, tmp[i]);
            return f.mul(acc, num);
        }, inverted);
        return tmp;
    }
    // CURVE.n lengths
    function nLength(n, nBitLength) {
        // Bit size, byte size of CURVE.n
        const _nBitLength = nBitLength !== undefined ? nBitLength : n.toString(2).length;
        const nByteLength = Math.ceil(_nBitLength / 8);
        return { nBitLength: _nBitLength, nByteLength };
    }
    /**
     * Initializes a finite field over prime. **Non-primes are not supported.**
     * Do not init in loop: slow. Very fragile: always run a benchmark on a change.
     * Major performance optimizations:
     * * a) denormalized operations like mulN instead of mul
     * * b) same object shape: never add or remove keys
     * * c) Object.freeze
     * @param ORDER prime positive bigint
     * @param bitLen how many bits the field consumes
     * @param isLE (def: false) if encoding / decoding should be in little-endian
     * @param redef optional faster redefinitions of sqrt and other methods
     */
    function Field(ORDER, bitLen, isLE = false, redef = {}) {
        if (ORDER <= _0n$2)
            throw new Error(`Expected Field ORDER > 0, got ${ORDER}`);
        const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen);
        if (BYTES > 2048)
            throw new Error('Field lengths over 2048 bytes are not supported');
        const sqrtP = FpSqrt(ORDER);
        const f = Object.freeze({
            ORDER,
            BITS,
            BYTES,
            MASK: bitMask(BITS),
            ZERO: _0n$2,
            ONE: _1n$3,
            create: (num) => mod(num, ORDER),
            isValid: (num) => {
                if (typeof num !== 'bigint')
                    throw new Error(`Invalid field element: expected bigint, got ${typeof num}`);
                return _0n$2 <= num && num < ORDER; // 0 is valid element, but it's not invertible
            },
            is0: (num) => num === _0n$2,
            isOdd: (num) => (num & _1n$3) === _1n$3,
            neg: (num) => mod(-num, ORDER),
            eql: (lhs, rhs) => lhs === rhs,
            sqr: (num) => mod(num * num, ORDER),
            add: (lhs, rhs) => mod(lhs + rhs, ORDER),
            sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
            mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
            pow: (num, power) => FpPow(f, num, power),
            div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
            // Same as above, but doesn't normalize
            sqrN: (num) => num * num,
            addN: (lhs, rhs) => lhs + rhs,
            subN: (lhs, rhs) => lhs - rhs,
            mulN: (lhs, rhs) => lhs * rhs,
            inv: (num) => invert(num, ORDER),
            sqrt: redef.sqrt || ((n) => sqrtP(f, n)),
            invertBatch: (lst) => FpInvertBatch(f, lst),
            // TODO: do we really need constant cmov?
            // We don't have const-time bigints anyway, so probably will be not very useful
            cmov: (a, b, c) => (c ? b : a),
            toBytes: (num) => (isLE ? numberToBytesLE(num, BYTES) : numberToBytesBE(num, BYTES)),
            fromBytes: (bytes) => {
                if (bytes.length !== BYTES)
                    throw new Error(`Fp.fromBytes: expected ${BYTES}, got ${bytes.length}`);
                return isLE ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
            },
        });
        return Object.freeze(f);
    }
    /**
     * Returns total number of bytes consumed by the field element.
     * For example, 32 bytes for usual 256-bit weierstrass curve.
     * @param fieldOrder number of field elements, usually CURVE.n
     * @returns byte length of field
     */
    function getFieldBytesLength(fieldOrder) {
        if (typeof fieldOrder !== 'bigint')
            throw new Error('field order must be bigint');
        const bitLength = fieldOrder.toString(2).length;
        return Math.ceil(bitLength / 8);
    }
    /**
     * Returns minimal amount of bytes that can be safely reduced
     * by field order.
     * Should be 2^-128 for 128-bit curve such as P256.
     * @param fieldOrder number of field elements, usually CURVE.n
     * @returns byte length of target hash
     */
    function getMinHashLength(fieldOrder) {
        const length = getFieldBytesLength(fieldOrder);
        return length + Math.ceil(length / 2);
    }
    /**
     * "Constant-time" private key generation utility.
     * Can take (n + n/2) or more bytes of uniform input e.g. from CSPRNG or KDF
     * and convert them into private scalar, with the modulo bias being negligible.
     * Needs at least 48 bytes of input for 32-byte private key.
     * https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/
     * FIPS 186-5, A.2 https://csrc.nist.gov/publications/detail/fips/186/5/final
     * RFC 9380, https://www.rfc-editor.org/rfc/rfc9380#section-5
     * @param hash hash output from SHA3 or a similar function
     * @param groupOrder size of subgroup - (e.g. secp256k1.CURVE.n)
     * @param isLE interpret hash bytes as LE num
     * @returns valid private scalar
     */
    function mapHashToField(key, fieldOrder, isLE = false) {
        const len = key.length;
        const fieldLen = getFieldBytesLength(fieldOrder);
        const minLen = getMinHashLength(fieldOrder);
        // No small numbers: need to understand bias story. No huge numbers: easier to detect JS timings.
        if (len < 16 || len < minLen || len > 1024)
            throw new Error(`expected ${minLen}-1024 bytes of input, got ${len}`);
        const num = isLE ? bytesToNumberBE(key) : bytesToNumberLE(key);
        // `mod(x, 11)` can sometimes produce 0. `mod(x, 10) + 1` is the same, but no 0
        const reduced = mod(num, fieldOrder - _1n$3) + _1n$3;
        return isLE ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
    }

    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    // Abelian group utilities
    const _0n$1 = BigInt(0);
    const _1n$2 = BigInt(1);
    // Elliptic curve multiplication of Point by scalar. Fragile.
    // Scalars should always be less than curve order: this should be checked inside of a curve itself.
    // Creates precomputation tables for fast multiplication:
    // - private scalar is split by fixed size windows of W bits
    // - every window point is collected from window's table & added to accumulator
    // - since windows are different, same point inside tables won't be accessed more than once per calc
    // - each multiplication is 'Math.ceil(CURVE_ORDER / 𝑊) + 1' point additions (fixed for any scalar)
    // - +1 window is neccessary for wNAF
    // - wNAF reduces table size: 2x less memory + 2x faster generation, but 10% slower multiplication
    // TODO: Research returning 2d JS array of windows, instead of a single window. This would allow
    // windows to be in different memory locations
    function wNAF(c, bits) {
        const constTimeNegate = (condition, item) => {
            const neg = item.negate();
            return condition ? neg : item;
        };
        const opts = (W) => {
            const windows = Math.ceil(bits / W) + 1; // +1, because
            const windowSize = 2 ** (W - 1); // -1 because we skip zero
            return { windows, windowSize };
        };
        return {
            constTimeNegate,
            // non-const time multiplication ladder
            unsafeLadder(elm, n) {
                let p = c.ZERO;
                let d = elm;
                while (n > _0n$1) {
                    if (n & _1n$2)
                        p = p.add(d);
                    d = d.double();
                    n >>= _1n$2;
                }
                return p;
            },
            /**
             * Creates a wNAF precomputation window. Used for caching.
             * Default window size is set by `utils.precompute()` and is equal to 8.
             * Number of precomputed points depends on the curve size:
             * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
             * - 𝑊 is the window size
             * - 𝑛 is the bitlength of the curve order.
             * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
             * @returns precomputed point tables flattened to a single array
             */
            precomputeWindow(elm, W) {
                const { windows, windowSize } = opts(W);
                const points = [];
                let p = elm;
                let base = p;
                for (let window = 0; window < windows; window++) {
                    base = p;
                    points.push(base);
                    // =1, because we skip zero
                    for (let i = 1; i < windowSize; i++) {
                        base = base.add(p);
                        points.push(base);
                    }
                    p = base.double();
                }
                return points;
            },
            /**
             * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
             * @param W window size
             * @param precomputes precomputed tables
             * @param n scalar (we don't check here, but should be less than curve order)
             * @returns real and fake (for const-time) points
             */
            wNAF(W, precomputes, n) {
                // TODO: maybe check that scalar is less than group order? wNAF behavious is undefined otherwise
                // But need to carefully remove other checks before wNAF. ORDER == bits here
                const { windows, windowSize } = opts(W);
                let p = c.ZERO;
                let f = c.BASE;
                const mask = BigInt(2 ** W - 1); // Create mask with W ones: 0b1111 for W=4 etc.
                const maxNumber = 2 ** W;
                const shiftBy = BigInt(W);
                for (let window = 0; window < windows; window++) {
                    const offset = window * windowSize;
                    // Extract W bits.
                    let wbits = Number(n & mask);
                    // Shift number by W bits.
                    n >>= shiftBy;
                    // If the bits are bigger than max size, we'll split those.
                    // +224 => 256 - 32
                    if (wbits > windowSize) {
                        wbits -= maxNumber;
                        n += _1n$2;
                    }
                    // This code was first written with assumption that 'f' and 'p' will never be infinity point:
                    // since each addition is multiplied by 2 ** W, it cannot cancel each other. However,
                    // there is negate now: it is possible that negated element from low value
                    // would be the same as high element, which will create carry into next window.
                    // It's not obvious how this can fail, but still worth investigating later.
                    // Check if we're onto Zero point.
                    // Add random point inside current window to f.
                    const offset1 = offset;
                    const offset2 = offset + Math.abs(wbits) - 1; // -1 because we skip zero
                    const cond1 = window % 2 !== 0;
                    const cond2 = wbits < 0;
                    if (wbits === 0) {
                        // The most important part for const-time getPublicKey
                        f = f.add(constTimeNegate(cond1, precomputes[offset1]));
                    }
                    else {
                        p = p.add(constTimeNegate(cond2, precomputes[offset2]));
                    }
                }
                // JIT-compiler should not eliminate f here, since it will later be used in normalizeZ()
                // Even if the variable is still unused, there are some checks which will
                // throw an exception, so compiler needs to prove they won't happen, which is hard.
                // At this point there is a way to F be infinity-point even if p is not,
                // which makes it less const-time: around 1 bigint multiply.
                return { p, f };
            },
            wNAFCached(P, precomputesMap, n, transform) {
                // @ts-ignore
                const W = P._WINDOW_SIZE || 1;
                // Calculate precomputes on a first run, reuse them after
                let comp = precomputesMap.get(P);
                if (!comp) {
                    comp = this.precomputeWindow(P, W);
                    if (W !== 1) {
                        precomputesMap.set(P, transform(comp));
                    }
                }
                return this.wNAF(W, comp, n);
            },
        };
    }
    function validateBasic(curve) {
        validateField(curve.Fp);
        validateObject(curve, {
            n: 'bigint',
            h: 'bigint',
            Gx: 'field',
            Gy: 'field',
        }, {
            nBitLength: 'isSafeInteger',
            nByteLength: 'isSafeInteger',
        });
        // Set defaults
        return Object.freeze({
            ...nLength(curve.n, curve.nBitLength),
            ...curve,
            ...{ p: curve.Fp.ORDER },
        });
    }

    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    // Short Weierstrass curve. The formula is: y² = x³ + ax + b
    function validatePointOpts(curve) {
        const opts = validateBasic(curve);
        validateObject(opts, {
            a: 'field',
            b: 'field',
        }, {
            allowedPrivateKeyLengths: 'array',
            wrapPrivateKey: 'boolean',
            isTorsionFree: 'function',
            clearCofactor: 'function',
            allowInfinityPoint: 'boolean',
            fromBytes: 'function',
            toBytes: 'function',
        });
        const { endo, Fp, a } = opts;
        if (endo) {
            if (!Fp.eql(a, Fp.ZERO)) {
                throw new Error('Endomorphism can only be defined for Koblitz curves that have a=0');
            }
            if (typeof endo !== 'object' ||
                typeof endo.beta !== 'bigint' ||
                typeof endo.splitScalar !== 'function') {
                throw new Error('Expected endomorphism with beta: bigint and splitScalar: function');
            }
        }
        return Object.freeze({ ...opts });
    }
    // ASN.1 DER encoding utilities
    const { bytesToNumberBE: b2n, hexToBytes: h2b } = ut;
    const DER = {
        // asn.1 DER encoding utils
        Err: class DERErr extends Error {
            constructor(m = '') {
                super(m);
            }
        },
        _parseInt(data) {
            const { Err: E } = DER;
            if (data.length < 2 || data[0] !== 0x02)
                throw new E('Invalid signature integer tag');
            const len = data[1];
            const res = data.subarray(2, len + 2);
            if (!len || res.length !== len)
                throw new E('Invalid signature integer: wrong length');
            // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
            // since we always use positive integers here. It must always be empty:
            // - add zero byte if exists
            // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
            if (res[0] & 0b10000000)
                throw new E('Invalid signature integer: negative');
            if (res[0] === 0x00 && !(res[1] & 0b10000000))
                throw new E('Invalid signature integer: unnecessary leading zero');
            return { d: b2n(res), l: data.subarray(len + 2) }; // d is data, l is left
        },
        toSig(hex) {
            // parse DER signature
            const { Err: E } = DER;
            const data = typeof hex === 'string' ? h2b(hex) : hex;
            if (!(data instanceof Uint8Array))
                throw new Error('ui8a expected');
            let l = data.length;
            if (l < 2 || data[0] != 0x30)
                throw new E('Invalid signature tag');
            if (data[1] !== l - 2)
                throw new E('Invalid signature: incorrect length');
            const { d: r, l: sBytes } = DER._parseInt(data.subarray(2));
            const { d: s, l: rBytesLeft } = DER._parseInt(sBytes);
            if (rBytesLeft.length)
                throw new E('Invalid signature: left bytes after parsing');
            return { r, s };
        },
        hexFromSig(sig) {
            // Add leading zero if first byte has negative bit enabled. More details in '_parseInt'
            const slice = (s) => (Number.parseInt(s[0], 16) & 0b1000 ? '00' + s : s);
            const h = (num) => {
                const hex = num.toString(16);
                return hex.length & 1 ? `0${hex}` : hex;
            };
            const s = slice(h(sig.s));
            const r = slice(h(sig.r));
            const shl = s.length / 2;
            const rhl = r.length / 2;
            const sl = h(shl);
            const rl = h(rhl);
            return `30${h(rhl + shl + 4)}02${rl}${r}02${sl}${s}`;
        },
    };
    // Be friendly to bad ECMAScript parsers by not using bigint literals
    // prettier-ignore
    const _0n = BigInt(0), _1n$1 = BigInt(1); BigInt(2); const _3n = BigInt(3); BigInt(4);
    function weierstrassPoints(opts) {
        const CURVE = validatePointOpts(opts);
        const { Fp } = CURVE; // All curves has same field / group length as for now, but they can differ
        const toBytes = CURVE.toBytes ||
            ((_c, point, _isCompressed) => {
                const a = point.toAffine();
                return concatBytes(Uint8Array.from([0x04]), Fp.toBytes(a.x), Fp.toBytes(a.y));
            });
        const fromBytes = CURVE.fromBytes ||
            ((bytes) => {
                // const head = bytes[0];
                const tail = bytes.subarray(1);
                // if (head !== 0x04) throw new Error('Only non-compressed encoding is supported');
                const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
                const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
                return { x, y };
            });
        /**
         * y² = x³ + ax + b: Short weierstrass curve formula
         * @returns y²
         */
        function weierstrassEquation(x) {
            const { a, b } = CURVE;
            const x2 = Fp.sqr(x); // x * x
            const x3 = Fp.mul(x2, x); // x2 * x
            return Fp.add(Fp.add(x3, Fp.mul(x, a)), b); // x3 + a * x + b
        }
        // Validate whether the passed curve params are valid.
        // We check if curve equation works for generator point.
        // `assertValidity()` won't work: `isTorsionFree()` is not available at this point in bls12-381.
        // ProjectivePoint class has not been initialized yet.
        if (!Fp.eql(Fp.sqr(CURVE.Gy), weierstrassEquation(CURVE.Gx)))
            throw new Error('bad generator point: equation left != right');
        // Valid group elements reside in range 1..n-1
        function isWithinCurveOrder(num) {
            return typeof num === 'bigint' && _0n < num && num < CURVE.n;
        }
        function assertGE(num) {
            if (!isWithinCurveOrder(num))
                throw new Error('Expected valid bigint: 0 < bigint < curve.n');
        }
        // Validates if priv key is valid and converts it to bigint.
        // Supports options allowedPrivateKeyLengths and wrapPrivateKey.
        function normPrivateKeyToScalar(key) {
            const { allowedPrivateKeyLengths: lengths, nByteLength, wrapPrivateKey, n } = CURVE;
            if (lengths && typeof key !== 'bigint') {
                if (key instanceof Uint8Array)
                    key = bytesToHex(key);
                // Normalize to hex string, pad. E.g. P521 would norm 130-132 char hex to 132-char bytes
                if (typeof key !== 'string' || !lengths.includes(key.length))
                    throw new Error('Invalid key');
                key = key.padStart(nByteLength * 2, '0');
            }
            let num;
            try {
                num =
                    typeof key === 'bigint'
                        ? key
                        : bytesToNumberBE(ensureBytes('private key', key, nByteLength));
            }
            catch (error) {
                throw new Error(`private key must be ${nByteLength} bytes, hex or bigint, not ${typeof key}`);
            }
            if (wrapPrivateKey)
                num = mod(num, n); // disabled by default, enabled for BLS
            assertGE(num); // num in range [1..N-1]
            return num;
        }
        const pointPrecomputes = new Map();
        function assertPrjPoint(other) {
            if (!(other instanceof Point))
                throw new Error('ProjectivePoint expected');
        }
        /**
         * Projective Point works in 3d / projective (homogeneous) coordinates: (x, y, z) ∋ (x=x/z, y=y/z)
         * Default Point works in 2d / affine coordinates: (x, y)
         * We're doing calculations in projective, because its operations don't require costly inversion.
         */
        class Point {
            constructor(px, py, pz) {
                this.px = px;
                this.py = py;
                this.pz = pz;
                if (px == null || !Fp.isValid(px))
                    throw new Error('x required');
                if (py == null || !Fp.isValid(py))
                    throw new Error('y required');
                if (pz == null || !Fp.isValid(pz))
                    throw new Error('z required');
            }
            // Does not validate if the point is on-curve.
            // Use fromHex instead, or call assertValidity() later.
            static fromAffine(p) {
                const { x, y } = p || {};
                if (!p || !Fp.isValid(x) || !Fp.isValid(y))
                    throw new Error('invalid affine point');
                if (p instanceof Point)
                    throw new Error('projective point not allowed');
                const is0 = (i) => Fp.eql(i, Fp.ZERO);
                // fromAffine(x:0, y:0) would produce (x:0, y:0, z:1), but we need (x:0, y:1, z:0)
                if (is0(x) && is0(y))
                    return Point.ZERO;
                return new Point(x, y, Fp.ONE);
            }
            get x() {
                return this.toAffine().x;
            }
            get y() {
                return this.toAffine().y;
            }
            /**
             * Takes a bunch of Projective Points but executes only one
             * inversion on all of them. Inversion is very slow operation,
             * so this improves performance massively.
             * Optimization: converts a list of projective points to a list of identical points with Z=1.
             */
            static normalizeZ(points) {
                const toInv = Fp.invertBatch(points.map((p) => p.pz));
                return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
            }
            /**
             * Converts hash string or Uint8Array to Point.
             * @param hex short/long ECDSA hex
             */
            static fromHex(hex) {
                const P = Point.fromAffine(fromBytes(ensureBytes('pointHex', hex)));
                P.assertValidity();
                return P;
            }
            // Multiplies generator point by privateKey.
            static fromPrivateKey(privateKey) {
                return Point.BASE.multiply(normPrivateKeyToScalar(privateKey));
            }
            // "Private method", don't use it directly
            _setWindowSize(windowSize) {
                this._WINDOW_SIZE = windowSize;
                pointPrecomputes.delete(this);
            }
            // A point on curve is valid if it conforms to equation.
            assertValidity() {
                if (this.is0()) {
                    // (0, 1, 0) aka ZERO is invalid in most contexts.
                    // In BLS, ZERO can be serialized, so we allow it.
                    // (0, 0, 0) is wrong representation of ZERO and is always invalid.
                    if (CURVE.allowInfinityPoint && !Fp.is0(this.py))
                        return;
                    throw new Error('bad point: ZERO');
                }
                // Some 3rd-party test vectors require different wording between here & `fromCompressedHex`
                const { x, y } = this.toAffine();
                // Check if x, y are valid field elements
                if (!Fp.isValid(x) || !Fp.isValid(y))
                    throw new Error('bad point: x or y not FE');
                const left = Fp.sqr(y); // y²
                const right = weierstrassEquation(x); // x³ + ax + b
                if (!Fp.eql(left, right))
                    throw new Error('bad point: equation left != right');
                if (!this.isTorsionFree())
                    throw new Error('bad point: not in prime-order subgroup');
            }
            hasEvenY() {
                const { y } = this.toAffine();
                if (Fp.isOdd)
                    return !Fp.isOdd(y);
                throw new Error("Field doesn't support isOdd");
            }
            /**
             * Compare one point to another.
             */
            equals(other) {
                assertPrjPoint(other);
                const { px: X1, py: Y1, pz: Z1 } = this;
                const { px: X2, py: Y2, pz: Z2 } = other;
                const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
                const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
                return U1 && U2;
            }
            /**
             * Flips point to one corresponding to (x, -y) in Affine coordinates.
             */
            negate() {
                return new Point(this.px, Fp.neg(this.py), this.pz);
            }
            // Renes-Costello-Batina exception-free doubling formula.
            // There is 30% faster Jacobian formula, but it is not complete.
            // https://eprint.iacr.org/2015/1060, algorithm 3
            // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
            double() {
                const { a, b } = CURVE;
                const b3 = Fp.mul(b, _3n);
                const { px: X1, py: Y1, pz: Z1 } = this;
                let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO; // prettier-ignore
                let t0 = Fp.mul(X1, X1); // step 1
                let t1 = Fp.mul(Y1, Y1);
                let t2 = Fp.mul(Z1, Z1);
                let t3 = Fp.mul(X1, Y1);
                t3 = Fp.add(t3, t3); // step 5
                Z3 = Fp.mul(X1, Z1);
                Z3 = Fp.add(Z3, Z3);
                X3 = Fp.mul(a, Z3);
                Y3 = Fp.mul(b3, t2);
                Y3 = Fp.add(X3, Y3); // step 10
                X3 = Fp.sub(t1, Y3);
                Y3 = Fp.add(t1, Y3);
                Y3 = Fp.mul(X3, Y3);
                X3 = Fp.mul(t3, X3);
                Z3 = Fp.mul(b3, Z3); // step 15
                t2 = Fp.mul(a, t2);
                t3 = Fp.sub(t0, t2);
                t3 = Fp.mul(a, t3);
                t3 = Fp.add(t3, Z3);
                Z3 = Fp.add(t0, t0); // step 20
                t0 = Fp.add(Z3, t0);
                t0 = Fp.add(t0, t2);
                t0 = Fp.mul(t0, t3);
                Y3 = Fp.add(Y3, t0);
                t2 = Fp.mul(Y1, Z1); // step 25
                t2 = Fp.add(t2, t2);
                t0 = Fp.mul(t2, t3);
                X3 = Fp.sub(X3, t0);
                Z3 = Fp.mul(t2, t1);
                Z3 = Fp.add(Z3, Z3); // step 30
                Z3 = Fp.add(Z3, Z3);
                return new Point(X3, Y3, Z3);
            }
            // Renes-Costello-Batina exception-free addition formula.
            // There is 30% faster Jacobian formula, but it is not complete.
            // https://eprint.iacr.org/2015/1060, algorithm 1
            // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
            add(other) {
                assertPrjPoint(other);
                const { px: X1, py: Y1, pz: Z1 } = this;
                const { px: X2, py: Y2, pz: Z2 } = other;
                let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO; // prettier-ignore
                const a = CURVE.a;
                const b3 = Fp.mul(CURVE.b, _3n);
                let t0 = Fp.mul(X1, X2); // step 1
                let t1 = Fp.mul(Y1, Y2);
                let t2 = Fp.mul(Z1, Z2);
                let t3 = Fp.add(X1, Y1);
                let t4 = Fp.add(X2, Y2); // step 5
                t3 = Fp.mul(t3, t4);
                t4 = Fp.add(t0, t1);
                t3 = Fp.sub(t3, t4);
                t4 = Fp.add(X1, Z1);
                let t5 = Fp.add(X2, Z2); // step 10
                t4 = Fp.mul(t4, t5);
                t5 = Fp.add(t0, t2);
                t4 = Fp.sub(t4, t5);
                t5 = Fp.add(Y1, Z1);
                X3 = Fp.add(Y2, Z2); // step 15
                t5 = Fp.mul(t5, X3);
                X3 = Fp.add(t1, t2);
                t5 = Fp.sub(t5, X3);
                Z3 = Fp.mul(a, t4);
                X3 = Fp.mul(b3, t2); // step 20
                Z3 = Fp.add(X3, Z3);
                X3 = Fp.sub(t1, Z3);
                Z3 = Fp.add(t1, Z3);
                Y3 = Fp.mul(X3, Z3);
                t1 = Fp.add(t0, t0); // step 25
                t1 = Fp.add(t1, t0);
                t2 = Fp.mul(a, t2);
                t4 = Fp.mul(b3, t4);
                t1 = Fp.add(t1, t2);
                t2 = Fp.sub(t0, t2); // step 30
                t2 = Fp.mul(a, t2);
                t4 = Fp.add(t4, t2);
                t0 = Fp.mul(t1, t4);
                Y3 = Fp.add(Y3, t0);
                t0 = Fp.mul(t5, t4); // step 35
                X3 = Fp.mul(t3, X3);
                X3 = Fp.sub(X3, t0);
                t0 = Fp.mul(t3, t1);
                Z3 = Fp.mul(t5, Z3);
                Z3 = Fp.add(Z3, t0); // step 40
                return new Point(X3, Y3, Z3);
            }
            subtract(other) {
                return this.add(other.negate());
            }
            is0() {
                return this.equals(Point.ZERO);
            }
            wNAF(n) {
                return wnaf.wNAFCached(this, pointPrecomputes, n, (comp) => {
                    const toInv = Fp.invertBatch(comp.map((p) => p.pz));
                    return comp.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
                });
            }
            /**
             * Non-constant-time multiplication. Uses double-and-add algorithm.
             * It's faster, but should only be used when you don't care about
             * an exposed private key e.g. sig verification, which works over *public* keys.
             */
            multiplyUnsafe(n) {
                const I = Point.ZERO;
                if (n === _0n)
                    return I;
                assertGE(n); // Will throw on 0
                if (n === _1n$1)
                    return this;
                const { endo } = CURVE;
                if (!endo)
                    return wnaf.unsafeLadder(this, n);
                // Apply endomorphism
                let { k1neg, k1, k2neg, k2 } = endo.splitScalar(n);
                let k1p = I;
                let k2p = I;
                let d = this;
                while (k1 > _0n || k2 > _0n) {
                    if (k1 & _1n$1)
                        k1p = k1p.add(d);
                    if (k2 & _1n$1)
                        k2p = k2p.add(d);
                    d = d.double();
                    k1 >>= _1n$1;
                    k2 >>= _1n$1;
                }
                if (k1neg)
                    k1p = k1p.negate();
                if (k2neg)
                    k2p = k2p.negate();
                k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
                return k1p.add(k2p);
            }
            /**
             * Constant time multiplication.
             * Uses wNAF method. Windowed method may be 10% faster,
             * but takes 2x longer to generate and consumes 2x memory.
             * Uses precomputes when available.
             * Uses endomorphism for Koblitz curves.
             * @param scalar by which the point would be multiplied
             * @returns New point
             */
            multiply(scalar) {
                assertGE(scalar);
                let n = scalar;
                let point, fake; // Fake point is used to const-time mult
                const { endo } = CURVE;
                if (endo) {
                    const { k1neg, k1, k2neg, k2 } = endo.splitScalar(n);
                    let { p: k1p, f: f1p } = this.wNAF(k1);
                    let { p: k2p, f: f2p } = this.wNAF(k2);
                    k1p = wnaf.constTimeNegate(k1neg, k1p);
                    k2p = wnaf.constTimeNegate(k2neg, k2p);
                    k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
                    point = k1p.add(k2p);
                    fake = f1p.add(f2p);
                }
                else {
                    const { p, f } = this.wNAF(n);
                    point = p;
                    fake = f;
                }
                // Normalize `z` for both points, but return only real one
                return Point.normalizeZ([point, fake])[0];
            }
            /**
             * Efficiently calculate `aP + bQ`. Unsafe, can expose private key, if used incorrectly.
             * Not using Strauss-Shamir trick: precomputation tables are faster.
             * The trick could be useful if both P and Q are not G (not in our case).
             * @returns non-zero affine point
             */
            multiplyAndAddUnsafe(Q, a, b) {
                const G = Point.BASE; // No Strauss-Shamir trick: we have 10% faster G precomputes
                const mul = (P, a // Select faster multiply() method
                ) => (a === _0n || a === _1n$1 || !P.equals(G) ? P.multiplyUnsafe(a) : P.multiply(a));
                const sum = mul(this, a).add(mul(Q, b));
                return sum.is0() ? undefined : sum;
            }
            // Converts Projective point to affine (x, y) coordinates.
            // Can accept precomputed Z^-1 - for example, from invertBatch.
            // (x, y, z) ∋ (x=x/z, y=y/z)
            toAffine(iz) {
                const { px: x, py: y, pz: z } = this;
                const is0 = this.is0();
                // If invZ was 0, we return zero point. However we still want to execute
                // all operations, so we replace invZ with a random number, 1.
                if (iz == null)
                    iz = is0 ? Fp.ONE : Fp.inv(z);
                const ax = Fp.mul(x, iz);
                const ay = Fp.mul(y, iz);
                const zz = Fp.mul(z, iz);
                if (is0)
                    return { x: Fp.ZERO, y: Fp.ZERO };
                if (!Fp.eql(zz, Fp.ONE))
                    throw new Error('invZ was invalid');
                return { x: ax, y: ay };
            }
            isTorsionFree() {
                const { h: cofactor, isTorsionFree } = CURVE;
                if (cofactor === _1n$1)
                    return true; // No subgroups, always torsion-free
                if (isTorsionFree)
                    return isTorsionFree(Point, this);
                throw new Error('isTorsionFree() has not been declared for the elliptic curve');
            }
            clearCofactor() {
                const { h: cofactor, clearCofactor } = CURVE;
                if (cofactor === _1n$1)
                    return this; // Fast-path
                if (clearCofactor)
                    return clearCofactor(Point, this);
                return this.multiplyUnsafe(CURVE.h);
            }
            toRawBytes(isCompressed = true) {
                this.assertValidity();
                return toBytes(Point, this, isCompressed);
            }
            toHex(isCompressed = true) {
                return bytesToHex(this.toRawBytes(isCompressed));
            }
        }
        Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
        Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
        const _bits = CURVE.nBitLength;
        const wnaf = wNAF(Point, CURVE.endo ? Math.ceil(_bits / 2) : _bits);
        // Validate if generator point is on curve
        return {
            CURVE,
            ProjectivePoint: Point,
            normPrivateKeyToScalar,
            weierstrassEquation,
            isWithinCurveOrder,
        };
    }
    function validateOpts(curve) {
        const opts = validateBasic(curve);
        validateObject(opts, {
            hash: 'hash',
            hmac: 'function',
            randomBytes: 'function',
        }, {
            bits2int: 'function',
            bits2int_modN: 'function',
            lowS: 'boolean',
        });
        return Object.freeze({ lowS: true, ...opts });
    }
    function weierstrass(curveDef) {
        const CURVE = validateOpts(curveDef);
        const { Fp, n: CURVE_ORDER } = CURVE;
        const compressedLen = Fp.BYTES + 1; // e.g. 33 for 32
        const uncompressedLen = 2 * Fp.BYTES + 1; // e.g. 65 for 32
        function isValidFieldElement(num) {
            return _0n < num && num < Fp.ORDER; // 0 is banned since it's not invertible FE
        }
        function modN(a) {
            return mod(a, CURVE_ORDER);
        }
        function invN(a) {
            return invert(a, CURVE_ORDER);
        }
        const { ProjectivePoint: Point, normPrivateKeyToScalar, weierstrassEquation, isWithinCurveOrder, } = weierstrassPoints({
            ...CURVE,
            toBytes(_c, point, isCompressed) {
                const a = point.toAffine();
                const x = Fp.toBytes(a.x);
                const cat = concatBytes;
                if (isCompressed) {
                    return cat(Uint8Array.from([point.hasEvenY() ? 0x02 : 0x03]), x);
                }
                else {
                    return cat(Uint8Array.from([0x04]), x, Fp.toBytes(a.y));
                }
            },
            fromBytes(bytes) {
                const len = bytes.length;
                const head = bytes[0];
                const tail = bytes.subarray(1);
                // this.assertValidity() is done inside of fromHex
                if (len === compressedLen && (head === 0x02 || head === 0x03)) {
                    const x = bytesToNumberBE(tail);
                    if (!isValidFieldElement(x))
                        throw new Error('Point is not on curve');
                    const y2 = weierstrassEquation(x); // y² = x³ + ax + b
                    let y = Fp.sqrt(y2); // y = y² ^ (p+1)/4
                    const isYOdd = (y & _1n$1) === _1n$1;
                    // ECDSA
                    const isHeadOdd = (head & 1) === 1;
                    if (isHeadOdd !== isYOdd)
                        y = Fp.neg(y);
                    return { x, y };
                }
                else if (len === uncompressedLen && head === 0x04) {
                    const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
                    const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
                    return { x, y };
                }
                else {
                    throw new Error(`Point of length ${len} was invalid. Expected ${compressedLen} compressed bytes or ${uncompressedLen} uncompressed bytes`);
                }
            },
        });
        const numToNByteStr = (num) => bytesToHex(numberToBytesBE(num, CURVE.nByteLength));
        function isBiggerThanHalfOrder(number) {
            const HALF = CURVE_ORDER >> _1n$1;
            return number > HALF;
        }
        function normalizeS(s) {
            return isBiggerThanHalfOrder(s) ? modN(-s) : s;
        }
        // slice bytes num
        const slcNum = (b, from, to) => bytesToNumberBE(b.slice(from, to));
        /**
         * ECDSA signature with its (r, s) properties. Supports DER & compact representations.
         */
        class Signature {
            constructor(r, s, recovery) {
                this.r = r;
                this.s = s;
                this.recovery = recovery;
                this.assertValidity();
            }
            // pair (bytes of r, bytes of s)
            static fromCompact(hex) {
                const l = CURVE.nByteLength;
                hex = ensureBytes('compactSignature', hex, l * 2);
                return new Signature(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
            }
            // DER encoded ECDSA signature
            // https://bitcoin.stackexchange.com/questions/57644/what-are-the-parts-of-a-bitcoin-transaction-input-script
            static fromDER(hex) {
                const { r, s } = DER.toSig(ensureBytes('DER', hex));
                return new Signature(r, s);
            }
            assertValidity() {
                // can use assertGE here
                if (!isWithinCurveOrder(this.r))
                    throw new Error('r must be 0 < r < CURVE.n');
                if (!isWithinCurveOrder(this.s))
                    throw new Error('s must be 0 < s < CURVE.n');
            }
            addRecoveryBit(recovery) {
                return new Signature(this.r, this.s, recovery);
            }
            recoverPublicKey(msgHash) {
                const { r, s, recovery: rec } = this;
                const h = bits2int_modN(ensureBytes('msgHash', msgHash)); // Truncate hash
                if (rec == null || ![0, 1, 2, 3].includes(rec))
                    throw new Error('recovery id invalid');
                const radj = rec === 2 || rec === 3 ? r + CURVE.n : r;
                if (radj >= Fp.ORDER)
                    throw new Error('recovery id 2 or 3 invalid');
                const prefix = (rec & 1) === 0 ? '02' : '03';
                const R = Point.fromHex(prefix + numToNByteStr(radj));
                const ir = invN(radj); // r^-1
                const u1 = modN(-h * ir); // -hr^-1
                const u2 = modN(s * ir); // sr^-1
                const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2); // (sr^-1)R-(hr^-1)G = -(hr^-1)G + (sr^-1)
                if (!Q)
                    throw new Error('point at infinify'); // unsafe is fine: no priv data leaked
                Q.assertValidity();
                return Q;
            }
            // Signatures should be low-s, to prevent malleability.
            hasHighS() {
                return isBiggerThanHalfOrder(this.s);
            }
            normalizeS() {
                return this.hasHighS() ? new Signature(this.r, modN(-this.s), this.recovery) : this;
            }
            // DER-encoded
            toDERRawBytes() {
                return hexToBytes(this.toDERHex());
            }
            toDERHex() {
                return DER.hexFromSig({ r: this.r, s: this.s });
            }
            // padded bytes of r, then padded bytes of s
            toCompactRawBytes() {
                return hexToBytes(this.toCompactHex());
            }
            toCompactHex() {
                return numToNByteStr(this.r) + numToNByteStr(this.s);
            }
        }
        const utils = {
            isValidPrivateKey(privateKey) {
                try {
                    normPrivateKeyToScalar(privateKey);
                    return true;
                }
                catch (error) {
                    return false;
                }
            },
            normPrivateKeyToScalar: normPrivateKeyToScalar,
            /**
             * Produces cryptographically secure private key from random of size
             * (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
             */
            randomPrivateKey: () => {
                const length = getMinHashLength(CURVE.n);
                return mapHashToField(CURVE.randomBytes(length), CURVE.n);
            },
            /**
             * Creates precompute table for an arbitrary EC point. Makes point "cached".
             * Allows to massively speed-up `point.multiply(scalar)`.
             * @returns cached point
             * @example
             * const fast = utils.precompute(8, ProjectivePoint.fromHex(someonesPubKey));
             * fast.multiply(privKey); // much faster ECDH now
             */
            precompute(windowSize = 8, point = Point.BASE) {
                point._setWindowSize(windowSize);
                point.multiply(BigInt(3)); // 3 is arbitrary, just need any number here
                return point;
            },
        };
        /**
         * Computes public key for a private key. Checks for validity of the private key.
         * @param privateKey private key
         * @param isCompressed whether to return compact (default), or full key
         * @returns Public key, full when isCompressed=false; short when isCompressed=true
         */
        function getPublicKey(privateKey, isCompressed = true) {
            return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
        }
        /**
         * Quick and dirty check for item being public key. Does not validate hex, or being on-curve.
         */
        function isProbPub(item) {
            const arr = item instanceof Uint8Array;
            const str = typeof item === 'string';
            const len = (arr || str) && item.length;
            if (arr)
                return len === compressedLen || len === uncompressedLen;
            if (str)
                return len === 2 * compressedLen || len === 2 * uncompressedLen;
            if (item instanceof Point)
                return true;
            return false;
        }
        /**
         * ECDH (Elliptic Curve Diffie Hellman).
         * Computes shared public key from private key and public key.
         * Checks: 1) private key validity 2) shared key is on-curve.
         * Does NOT hash the result.
         * @param privateA private key
         * @param publicB different public key
         * @param isCompressed whether to return compact (default), or full key
         * @returns shared public key
         */
        function getSharedSecret(privateA, publicB, isCompressed = true) {
            if (isProbPub(privateA))
                throw new Error('first arg must be private key');
            if (!isProbPub(publicB))
                throw new Error('second arg must be public key');
            const b = Point.fromHex(publicB); // check for being on-curve
            return b.multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
        }
        // RFC6979: ensure ECDSA msg is X bytes and < N. RFC suggests optional truncating via bits2octets.
        // FIPS 186-4 4.6 suggests the leftmost min(nBitLen, outLen) bits, which matches bits2int.
        // bits2int can produce res>N, we can do mod(res, N) since the bitLen is the same.
        // int2octets can't be used; pads small msgs with 0: unacceptatble for trunc as per RFC vectors
        const bits2int = CURVE.bits2int ||
            function (bytes) {
                // For curves with nBitLength % 8 !== 0: bits2octets(bits2octets(m)) !== bits2octets(m)
                // for some cases, since bytes.length * 8 is not actual bitLength.
                const num = bytesToNumberBE(bytes); // check for == u8 done here
                const delta = bytes.length * 8 - CURVE.nBitLength; // truncate to nBitLength leftmost bits
                return delta > 0 ? num >> BigInt(delta) : num;
            };
        const bits2int_modN = CURVE.bits2int_modN ||
            function (bytes) {
                return modN(bits2int(bytes)); // can't use bytesToNumberBE here
            };
        // NOTE: pads output with zero as per spec
        const ORDER_MASK = bitMask(CURVE.nBitLength);
        /**
         * Converts to bytes. Checks if num in `[0..ORDER_MASK-1]` e.g.: `[0..2^256-1]`.
         */
        function int2octets(num) {
            if (typeof num !== 'bigint')
                throw new Error('bigint expected');
            if (!(_0n <= num && num < ORDER_MASK))
                throw new Error(`bigint expected < 2^${CURVE.nBitLength}`);
            // works with order, can have different size than numToField!
            return numberToBytesBE(num, CURVE.nByteLength);
        }
        // Steps A, D of RFC6979 3.2
        // Creates RFC6979 seed; converts msg/privKey to numbers.
        // Used only in sign, not in verify.
        // NOTE: we cannot assume here that msgHash has same amount of bytes as curve order, this will be wrong at least for P521.
        // Also it can be bigger for P224 + SHA256
        function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
            if (['recovered', 'canonical'].some((k) => k in opts))
                throw new Error('sign() legacy options not supported');
            const { hash, randomBytes } = CURVE;
            let { lowS, prehash, extraEntropy: ent } = opts; // generates low-s sigs by default
            if (lowS == null)
                lowS = true; // RFC6979 3.2: we skip step A, because we already provide hash
            msgHash = ensureBytes('msgHash', msgHash);
            if (prehash)
                msgHash = ensureBytes('prehashed msgHash', hash(msgHash));
            // We can't later call bits2octets, since nested bits2int is broken for curves
            // with nBitLength % 8 !== 0. Because of that, we unwrap it here as int2octets call.
            // const bits2octets = (bits) => int2octets(bits2int_modN(bits))
            const h1int = bits2int_modN(msgHash);
            const d = normPrivateKeyToScalar(privateKey); // validate private key, convert to bigint
            const seedArgs = [int2octets(d), int2octets(h1int)];
            // extraEntropy. RFC6979 3.6: additional k' (optional).
            if (ent != null) {
                // K = HMAC_K(V || 0x00 || int2octets(x) || bits2octets(h1) || k')
                const e = ent === true ? randomBytes(Fp.BYTES) : ent; // generate random bytes OR pass as-is
                seedArgs.push(ensureBytes('extraEntropy', e)); // check for being bytes
            }
            const seed = concatBytes(...seedArgs); // Step D of RFC6979 3.2
            const m = h1int; // NOTE: no need to call bits2int second time here, it is inside truncateHash!
            // Converts signature params into point w r/s, checks result for validity.
            function k2sig(kBytes) {
                // RFC 6979 Section 3.2, step 3: k = bits2int(T)
                const k = bits2int(kBytes); // Cannot use fields methods, since it is group element
                if (!isWithinCurveOrder(k))
                    return; // Important: all mod() calls here must be done over N
                const ik = invN(k); // k^-1 mod n
                const q = Point.BASE.multiply(k).toAffine(); // q = Gk
                const r = modN(q.x); // r = q.x mod n
                if (r === _0n)
                    return;
                // Can use scalar blinding b^-1(bm + bdr) where b ∈ [1,q−1] according to
                // https://tches.iacr.org/index.php/TCHES/article/view/7337/6509. We've decided against it:
                // a) dependency on CSPRNG b) 15% slowdown c) doesn't really help since bigints are not CT
                const s = modN(ik * modN(m + r * d)); // Not using blinding here
                if (s === _0n)
                    return;
                let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n$1); // recovery bit (2 or 3, when q.x > n)
                let normS = s;
                if (lowS && isBiggerThanHalfOrder(s)) {
                    normS = normalizeS(s); // if lowS was passed, ensure s is always
                    recovery ^= 1; // // in the bottom half of N
                }
                return new Signature(r, normS, recovery); // use normS, not s
            }
            return { seed, k2sig };
        }
        const defaultSigOpts = { lowS: CURVE.lowS, prehash: false };
        const defaultVerOpts = { lowS: CURVE.lowS, prehash: false };
        /**
         * Signs message hash with a private key.
         * ```
         * sign(m, d, k) where
         *   (x, y) = G × k
         *   r = x mod n
         *   s = (m + dr)/k mod n
         * ```
         * @param msgHash NOT message. msg needs to be hashed to `msgHash`, or use `prehash`.
         * @param privKey private key
         * @param opts lowS for non-malleable sigs. extraEntropy for mixing randomness into k. prehash will hash first arg.
         * @returns signature with recovery param
         */
        function sign(msgHash, privKey, opts = defaultSigOpts) {
            const { seed, k2sig } = prepSig(msgHash, privKey, opts); // Steps A, D of RFC6979 3.2.
            const C = CURVE;
            const drbg = createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac);
            return drbg(seed, k2sig); // Steps B, C, D, E, F, G
        }
        // Enable precomputes. Slows down first publicKey computation by 20ms.
        Point.BASE._setWindowSize(8);
        // utils.precompute(8, ProjectivePoint.BASE)
        /**
         * Verifies a signature against message hash and public key.
         * Rejects lowS signatures by default: to override,
         * specify option `{lowS: false}`. Implements section 4.1.4 from https://www.secg.org/sec1-v2.pdf:
         *
         * ```
         * verify(r, s, h, P) where
         *   U1 = hs^-1 mod n
         *   U2 = rs^-1 mod n
         *   R = U1⋅G - U2⋅P
         *   mod(R.x, n) == r
         * ```
         */
        function verify(signature, msgHash, publicKey, opts = defaultVerOpts) {
            const sg = signature;
            msgHash = ensureBytes('msgHash', msgHash);
            publicKey = ensureBytes('publicKey', publicKey);
            if ('strict' in opts)
                throw new Error('options.strict was renamed to lowS');
            const { lowS, prehash } = opts;
            let _sig = undefined;
            let P;
            try {
                if (typeof sg === 'string' || sg instanceof Uint8Array) {
                    // Signature can be represented in 2 ways: compact (2*nByteLength) & DER (variable-length).
                    // Since DER can also be 2*nByteLength bytes, we check for it first.
                    try {
                        _sig = Signature.fromDER(sg);
                    }
                    catch (derError) {
                        if (!(derError instanceof DER.Err))
                            throw derError;
                        _sig = Signature.fromCompact(sg);
                    }
                }
                else if (typeof sg === 'object' && typeof sg.r === 'bigint' && typeof sg.s === 'bigint') {
                    const { r, s } = sg;
                    _sig = new Signature(r, s);
                }
                else {
                    throw new Error('PARSE');
                }
                P = Point.fromHex(publicKey);
            }
            catch (error) {
                if (error.message === 'PARSE')
                    throw new Error(`signature must be Signature instance, Uint8Array or hex string`);
                return false;
            }
            if (lowS && _sig.hasHighS())
                return false;
            if (prehash)
                msgHash = CURVE.hash(msgHash);
            const { r, s } = _sig;
            const h = bits2int_modN(msgHash); // Cannot use fields methods, since it is group element
            const is = invN(s); // s^-1
            const u1 = modN(h * is); // u1 = hs^-1 mod n
            const u2 = modN(r * is); // u2 = rs^-1 mod n
            const R = Point.BASE.multiplyAndAddUnsafe(P, u1, u2)?.toAffine(); // R = u1⋅G + u2⋅P
            if (!R)
                return false;
            const v = modN(R.x);
            return v === r;
        }
        return {
            CURVE,
            getPublicKey,
            getSharedSecret,
            sign,
            verify,
            ProjectivePoint: Point,
            Signature,
            utils,
        };
    }

    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    // connects noble-curves to noble-hashes
    function getHash(hash) {
        return {
            hash,
            hmac: (key, ...msgs) => hmac(hash, key, concatBytes$1(...msgs)),
            randomBytes: randomBytes$2,
        };
    }
    function createCurve(curveDef, defHash) {
        const create = (hash) => weierstrass({ ...curveDef, ...getHash(hash) });
        return Object.freeze({ ...create(defHash), create });
    }

    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    const secp256k1P = BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f');
    const secp256k1N = BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');
    const _1n = BigInt(1);
    const _2n = BigInt(2);
    const divNearest = (a, b) => (a + b / _2n) / b;
    /**
     * √n = n^((p+1)/4) for fields p = 3 mod 4. We unwrap the loop and multiply bit-by-bit.
     * (P+1n/4n).toString(2) would produce bits [223x 1, 0, 22x 1, 4x 0, 11, 00]
     */
    function sqrtMod(y) {
        const P = secp256k1P;
        // prettier-ignore
        const _3n = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
        // prettier-ignore
        const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
        const b2 = (y * y * y) % P; // x^3, 11
        const b3 = (b2 * b2 * y) % P; // x^7
        const b6 = (pow2(b3, _3n, P) * b3) % P;
        const b9 = (pow2(b6, _3n, P) * b3) % P;
        const b11 = (pow2(b9, _2n, P) * b2) % P;
        const b22 = (pow2(b11, _11n, P) * b11) % P;
        const b44 = (pow2(b22, _22n, P) * b22) % P;
        const b88 = (pow2(b44, _44n, P) * b44) % P;
        const b176 = (pow2(b88, _88n, P) * b88) % P;
        const b220 = (pow2(b176, _44n, P) * b44) % P;
        const b223 = (pow2(b220, _3n, P) * b3) % P;
        const t1 = (pow2(b223, _23n, P) * b22) % P;
        const t2 = (pow2(t1, _6n, P) * b2) % P;
        const root = pow2(t2, _2n, P);
        if (!Fp.eql(Fp.sqr(root), y))
            throw new Error('Cannot find square root');
        return root;
    }
    const Fp = Field(secp256k1P, undefined, undefined, { sqrt: sqrtMod });
    const secp256k1 = createCurve({
        a: BigInt(0),
        b: BigInt(7),
        Fp,
        n: secp256k1N,
        // Base point (x, y) aka generator point
        Gx: BigInt('55066263022277343669578718895168534326250603453777594175500187360389116729240'),
        Gy: BigInt('32670510020758816978083085130507043184471273380659243275938904335757337482424'),
        h: BigInt(1),
        lowS: true,
        /**
         * secp256k1 belongs to Koblitz curves: it has efficiently computable endomorphism.
         * Endomorphism uses 2x less RAM, speeds up precomputation by 2x and ECDH / key recovery by 20%.
         * For precomputed wNAF it trades off 1/2 init time & 1/3 ram for 20% perf hit.
         * Explanation: https://gist.github.com/paulmillr/eb670806793e84df628a7c434a873066
         */
        endo: {
            beta: BigInt('0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee'),
            splitScalar: (k) => {
                const n = secp256k1N;
                const a1 = BigInt('0x3086d221a7d46bcde86c90e49284eb15');
                const b1 = -_1n * BigInt('0xe4437ed6010e88286f547fa90abfe4c3');
                const a2 = BigInt('0x114ca50f7a8e2f3f657c1108d9d44cfd8');
                const b2 = a1;
                const POW_2_128 = BigInt('0x100000000000000000000000000000000'); // (2n**128n).toString(16)
                const c1 = divNearest(b2 * k, n);
                const c2 = divNearest(-b1 * k, n);
                let k1 = mod(k - c1 * a1 - c2 * a2, n);
                let k2 = mod(-c1 * b1 - c2 * b2, n);
                const k1neg = k1 > POW_2_128;
                const k2neg = k2 > POW_2_128;
                if (k1neg)
                    k1 = n - k1;
                if (k2neg)
                    k2 = n - k2;
                if (k1 > POW_2_128 || k2 > POW_2_128) {
                    throw new Error('splitScalar: Endomorphism failed, k=' + k);
                }
                return { k1neg, k1, k2neg, k2 };
            },
        },
    }, sha256$1);
    // Schnorr signatures are superior to ECDSA from above. Below is Schnorr-specific BIP0340 code.
    // https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
    BigInt(0);
    secp256k1.ProjectivePoint;

    /**
     *  A constant for the zero address.
     *
     *  (**i.e.** ``"0x0000000000000000000000000000000000000000"``)
     */
    const ZeroAddress = "0x0000000000000000000000000000000000000000";

    /**
     *  A constant for the zero hash.
     *
     *  (**i.e.** ``"0x0000000000000000000000000000000000000000000000000000000000000000"``)
     */
    const ZeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

    /**
     *  A constant for the order N for the secp256k1 curve.
     *
     *  (**i.e.** ``0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n``)
     */
    const N$1 = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
    /**
     *  A constant for the number of wei in a single ether.
     *
     *  (**i.e.** ``1000000000000000000n``)
     */
    const WeiPerEther = BigInt("1000000000000000000");
    /**
     *  A constant for the maximum value for a ``uint256``.
     *
     *  (**i.e.** ``0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn``)
     */
    const MaxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    /**
     *  A constant for the minimum value for an ``int256``.
     *
     *  (**i.e.** ``-8000000000000000000000000000000000000000000000000000000000000000n``)
     */
    const MinInt256 = BigInt("0x8000000000000000000000000000000000000000000000000000000000000000") * BigInt(-1);
    /**
     *  A constant for the maximum value for an ``int256``.
     *
     *  (**i.e.** ``0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn``)
     */
    const MaxInt256 = BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

    // NFKC (composed)             // (decomposed)
    /**
     *  A constant for the ether symbol (normalized using NFKC).
     *
     *  (**i.e.** ``"\\u039e"``)
     */
    const EtherSymbol = "\u039e"; // "\uD835\uDF63";
    /**
     *  A constant for the [[link-eip-191]] personal message prefix.
     *
     *  (**i.e.** ``"\\x19Ethereum Signed Message:\\n"``)
     */
    const MessagePrefix = "\x19Ethereum Signed Message:\n";

    // Constants
    const BN_0$7 = BigInt(0);
    const BN_1$3 = BigInt(1);
    const BN_2$3 = BigInt(2);
    const BN_27$1 = BigInt(27);
    const BN_28$1 = BigInt(28);
    const BN_35$1 = BigInt(35);
    const _guard$3 = {};
    function toUint256(value) {
        return zeroPadValue(toBeArray(value), 32);
    }
    /**
     *  A Signature  @TODO
     *
     *
     *  @_docloc: api/crypto:Signing
     */
    class Signature {
        #r;
        #s;
        #v;
        #networkV;
        /**
         *  The ``r`` value for a signature.
         *
         *  This represents the ``x`` coordinate of a "reference" or
         *  challenge point, from which the ``y`` can be computed.
         */
        get r() { return this.#r; }
        set r(value) {
            assertArgument(dataLength(value) === 32, "invalid r", "value", value);
            this.#r = hexlify(value);
        }
        /**
         *  The ``s`` value for a signature.
         */
        get s() {
            assertArgument(parseInt(this.#s.substring(0, 3)) < 8, "non-canonical s; use ._s", "s", this.#s);
            return this.#s;
        }
        set s(_value) {
            assertArgument(dataLength(_value) === 32, "invalid s", "value", _value);
            this.#s = hexlify(_value);
        }
        /**
         *  Return the s value, unchecked for EIP-2 compliance.
         *
         *  This should generally not be used and is for situations where
         *  a non-canonical S value might be relevant, such as Frontier blocks
         *  that were mined prior to EIP-2 or invalid Authorization List
         *  signatures.
         */
        get _s() { return this.#s; }
        /**
         *  Returns true if the Signature is valid for [[link-eip-2]] signatures.
         */
        isValid() {
            return (parseInt(this.#s.substring(0, 3)) < 8);
        }
        /**
         *  The ``v`` value for a signature.
         *
         *  Since a given ``x`` value for ``r`` has two possible values for
         *  its correspondin ``y``, the ``v`` indicates which of the two ``y``
         *  values to use.
         *
         *  It is normalized to the values ``27`` or ``28`` for legacy
         *  purposes.
         */
        get v() { return this.#v; }
        set v(value) {
            const v = getNumber(value, "value");
            assertArgument(v === 27 || v === 28, "invalid v", "v", value);
            this.#v = v;
        }
        /**
         *  The EIP-155 ``v`` for legacy transactions. For non-legacy
         *  transactions, this value is ``null``.
         */
        get networkV() { return this.#networkV; }
        /**
         *  The chain ID for EIP-155 legacy transactions. For non-legacy
         *  transactions, this value is ``null``.
         */
        get legacyChainId() {
            const v = this.networkV;
            if (v == null) {
                return null;
            }
            return Signature.getChainId(v);
        }
        /**
         *  The ``yParity`` for the signature.
         *
         *  See ``v`` for more details on how this value is used.
         */
        get yParity() {
            return (this.v === 27) ? 0 : 1;
        }
        /**
         *  The [[link-eip-2098]] compact representation of the ``yParity``
         *  and ``s`` compacted into a single ``bytes32``.
         */
        get yParityAndS() {
            // The EIP-2098 compact representation
            const yParityAndS = getBytes(this.s);
            if (this.yParity) {
                yParityAndS[0] |= 0x80;
            }
            return hexlify(yParityAndS);
        }
        /**
         *  The [[link-eip-2098]] compact representation.
         */
        get compactSerialized() {
            return concat([this.r, this.yParityAndS]);
        }
        /**
         *  The serialized representation.
         */
        get serialized() {
            return concat([this.r, this.s, (this.yParity ? "0x1c" : "0x1b")]);
        }
        /**
         *  @private
         */
        constructor(guard, r, s, v) {
            assertPrivate(guard, _guard$3, "Signature");
            this.#r = r;
            this.#s = s;
            this.#v = v;
            this.#networkV = null;
        }
        [Symbol.for('nodejs.util.inspect.custom')]() {
            return `Signature { r: "${this.r}", s: "${this._s}"${this.isValid() ? "" : ', valid: "false"'}, yParity: ${this.yParity}, networkV: ${this.networkV} }`;
        }
        /**
         *  Returns a new identical [[Signature]].
         */
        clone() {
            const clone = new Signature(_guard$3, this.r, this._s, this.v);
            if (this.networkV) {
                clone.#networkV = this.networkV;
            }
            return clone;
        }
        /**
         *  Returns a representation that is compatible with ``JSON.stringify``.
         */
        toJSON() {
            const networkV = this.networkV;
            return {
                _type: "signature",
                networkV: ((networkV != null) ? networkV.toString() : null),
                r: this.r, s: this._s, v: this.v,
            };
        }
        /**
         *  Compute the chain ID from the ``v`` in a legacy EIP-155 transactions.
         *
         *  @example:
         *    Signature.getChainId(45)
         *    //_result:
         *
         *    Signature.getChainId(46)
         *    //_result:
         */
        static getChainId(v) {
            const bv = getBigInt(v, "v");
            // The v is not an EIP-155 v, so it is the unspecified chain ID
            if ((bv == BN_27$1) || (bv == BN_28$1)) {
                return BN_0$7;
            }
            // Bad value for an EIP-155 v
            assertArgument(bv >= BN_35$1, "invalid EIP-155 v", "v", v);
            return (bv - BN_35$1) / BN_2$3;
        }
        /**
         *  Compute the ``v`` for a chain ID for a legacy EIP-155 transactions.
         *
         *  Legacy transactions which use [[link-eip-155]] hijack the ``v``
         *  property to include the chain ID.
         *
         *  @example:
         *    Signature.getChainIdV(5, 27)
         *    //_result:
         *
         *    Signature.getChainIdV(5, 28)
         *    //_result:
         *
         */
        static getChainIdV(chainId, v) {
            return (getBigInt(chainId) * BN_2$3) + BigInt(35 + v - 27);
        }
        /**
         *  Compute the normalized legacy transaction ``v`` from a ``yParirty``,
         *  a legacy transaction ``v`` or a le