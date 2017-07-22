// Type definitions for tomlify-j0.4 2.1
// Project: https://github.com/jakwings/tomlify-j0.4

/*~ Note that ES6 modules cannot directly export callable functions.
 *~ This file should be imported using the CommonJS-style:
 *~   import x = require('someLibrary');
 *~
 *~ Refer to the documentation to understand common
 *~ workarounds for this limitation of ES6 modules.
 */

export = tomlify;

/**
 * Transform a table object into TOML text.
 * @param value The object to be transformed.
 * It can be any JavaScript object, except for `null` and `undefined`.
 * By default, all numbers are transformed into floats and arrays of numbers will become arrays of floats.
 * And `null` or `undefined` in an array or object property whose value is `null` or `undefined` will be ignored.
 * You can change this behavior through replacer.
 *
 * If table is a boolean value, a number, a string, a date or an array, the result will be the same as tomlify.toValue(table, replacer, space).
 * @param replacer A function that will be used to transform the values, controlling the serialization.
 * @param space The padding string for indentation.
 * If it is a non-negative integer N, then use N space " " for indentation.
 * If it is a string, then use this string for indentation.
 * Otherwise, no indentation will be performed.
 */
declare function tomlify(value: any, replacer?: Replacer, space?: string | number): string;

declare namespace tomlify {
    /**
     * The same as tomlify(table, replacer, space), except that value must be an object other than an instance of Array or Date.
     * @param value The object to be transformed.
     * It can be any JavaScript object, except for `null` and `undefined`.
     * By default, all numbers are transformed into floats and arrays of numbers will become arrays of floats.
     * And `null` or `undefined` in an array or object property whose value is `null` or `undefined` will be ignored.
     * You can change this behavior through replacer.
     *
     * If table is a boolean value, a number, a string, a date or an array, the result will be the same as tomlify.toValue(table, replacer, space).
     * @param replacer A function that will be used to transform the values, controlling the serialization.
     * @param space The padding string for indentation.
     * If it is a non-negative integer N, then use N space " " for indentation.
     * If it is a string, then use this string for indentation.
     * Otherwise, no indentation will be performed.
     */
    function toToml(value: any, replacer?: Replacer, space?: string | number): string;

    /**
     * Transform a value into TOML value for a key-value pair. `value` cannot be `null` or `undefined`.
     * @param value The object to be transformed.
     * It can be any JavaScript object, except for `null` and `undefined`.
     * By default, all numbers are transformed into floats and arrays of numbers will become arrays of floats.
     * And `null` or `undefined` in an array or object property whose value is `null` or `undefined` will be ignored.
     * You can change this behavior through replacer.
     *
     * If table is a boolean value, a number, a string, a date or an array, the result will be the same as tomlify.toValue(table, replacer, space).
     * @param replacer A function that will be used to transform the values, controlling the serialization.
     * @param space The padding string for indentation.
     * If it is a non-negative integer N, then use N space " " for indentation.
     * If it is a string, then use this string for indentation.
     * Otherwise, no indentation will be performed.
     */
    function toValue(value: any, replacer?: Replacer, space?: string | number): string;

    /**
     * Get a TOML key or key path for the key-value pair
     * @param path A key or a key path.
     * @param alternative Whether numbers in the key path will be ignored.
     */
    function toKey(path: string | Array<string | number>, alternative?: boolean): string;
}

type Replacer = (this: Context, key: string | number, value: any) => any;

interface Context {
    /**
     * The key path to current value
     */
    path: Array<string | number>;

    /**
     * The direct parent object
     */
    table: any;
}
