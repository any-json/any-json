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

async function main() {
    const parser = dashdash.createParser(inputConfiguration);

    function printHelp() {
        const help = parser.help();
        console.log(
            `usage: any-json FILE [options]

any-json can be used to convert (almost) anything to or from JSON.

options:
${help}`);
        process.exit(0);
    }
    const options = function () {
        try {
            return parser.parse();
        }
        catch (err) {
            console.log(err.message);
            process.exit(1);
            throw "unrechable";
        }
    }();

    if (options.version) {
        console.log(`any-json version ${version}`)
        process.exit(0);
    }

    if (options.help || process.argv.length <= 2) {
        printHelp();
    }

    if (options._args.length > 1) {
        console.log("Too many arguments");
        process.exit(1);
    }

    // TODO: Will need to check for binary files (see `getEncoding`)
    const fileName = options._args[0] as string;
    const content = await util.promisify(fs.readFile)(fileName, "utf8")
    const parsed = await anyjson.decode(removeLeadingDot(path.extname(fileName)), content)
    console.log(await anyjson.encode(parsed, 'json'));
}

main().catch(error => console.error(error));