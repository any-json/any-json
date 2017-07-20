#!/usr/bin/env node

import * as dashdash from "dashdash";
import * as fs from "fs";
import * as anyjson from "./";
import * as path from "path";
import * as util from "util";
require('util.promisify/shim')();

const version = require("../../package.json").version;

function removeLeadingDot(formatOrExtension: string) {
    if (formatOrExtension && formatOrExtension[0] === ".") return formatOrExtension.substr(1);
    else return formatOrExtension;
}

function getEncoding(format: string) {
    switch (format) {
        case "xlsx": return "binary";
        case "xls": return "binary";
        default: return "utf8";
    }
}

const inputConfiguration =
    {
        options: [
            {
                names: ["help", 'h'],
                type: "bool",
                help: "Prints this help and exits."
            },
            {
                name: "version",
                type: "bool",
                help: "Prints version information and exits."
            }
        ]
    };

async function main(argv: string[]) {
    const parser = dashdash.createParser(inputConfiguration);

    function getHelpMessage() {
        const help = parser.help();
        return `usage: any-json FILE [options]

any-json can be used to convert (almost) anything to or from JSON.

options:
${help}`
    }

    const options = function () {
        try {
            return parser.parse(argv);
        }
        catch (err) {
            throw err.message;
        }
    }();

    if (options.version) {
        return `any-json version ${version}`;
    }

    if (options.help || process.argv.length <= 2) {
        return getHelpMessage();
    }

    if (options._args.length > 1) {
        throw "too many arguments";
    }

    // TODO: Will need to check for binary files (see `getEncoding`)
    const fileName = options._args[0] as string;
    const content = await util.promisify(fs.readFile)(fileName, "utf8")
    const parsed = await anyjson.decode(removeLeadingDot(path.extname(fileName)), content)
    return await anyjson.encode(parsed, 'json');
}

main(process.argv)
    .then(s => console.log(s))
    .catch(error => {
        console.error(error);
        process.exit(2);
    });