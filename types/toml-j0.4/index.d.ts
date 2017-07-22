export function parse(src: string): any

export class SyntaxError {
    constructor(message: string, expected: string, found: string, offset: number, line: number, column: number);

    line: number;

    column: number;

    offset: number;

    message: string;    
}
