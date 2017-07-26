// Type definitions for toml-j0.4 1.0
// Project: https://github.com/jakwings/toml-j0.4

export function parse(src: string): any;

export class SyntaxError {
    constructor(message: string, expected: string, found: string, offset: number, line: number, column: number);

    /**
     * the line number
     */
    line: number;

    /**
     * the column number
     */
    column: number;

    /**
     * the zero-based offset from the start of the text
     */
    offset: number;

    /**
     * the error message
     */
    message: string;
}
