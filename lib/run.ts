#!/usr/bin/env node

import * as dashdash from "dashdash";
import * as fs from "fs";
import * as anyjson from "./";
import * as path from "path";
import * as util from "util";
import formatUnicorn = require("format-unicorn/safe");
import { EOL } from "os";

require('util.promisify/shim')();

const readFile = util.promisify(fs.readFile);

const version = require("../../package.json").version;

function getFormatFromFileName(fileName?: string): string | undefined {
  if (fileName) {
    const extension = removeLeadingDot(path.extname(fileName)).toLowerCase();
    return extension === "yml" ? "yaml" : extension;
  }
}

function removeLeadingDot(formatOrExtension: string) {
  if (formatOrExtension && formatOrExtension[0] === ".") return formatOrExtension.substr(1);
  else return formatOrExtension;
}

function legacyOptionsParsing(argv: string[]) {
  const options: any = {}
  var unnamedArgs = [] as string[];
  argv.slice(2).forEach(
    function (x) {
      if (x[0] === "-") {
        var i = x.indexOf("=");
        options[x.substr(1, i > 0 ? i - 1 : undefined)] = i > 0 ? x.substr(i + 1) : true;
      }
      else unnamedArgs.push(x);
    });

  return { options, unnamedArgs };
}

async function legacyEncode(options: any, input: any) {
  if (options.c) {
    return JSON.stringify(input);
  }

  if (options.h) {
    return await anyjson.encode(input, "hjson");
  }

  // options.j or default
  return await anyjson.encode(input, "json");
}

const generalOptions: Array<dashdash.Option | dashdash.Group> =
  [
    {
      names: ["help", '?'],
      type: "bool",
      help: "Prints this help and exits."
    },
    {
      name: "version",
      type: "bool",
      help: "Prints version information and exits."
    }
  ]

const converstionOptions =
  [
    {
      name: "input-format",
      type: "string",
      help: "Specifies the format of the input (assumed by file extension when not provided).",
      helpArg: "FORMAT"
    },
    {
      name: "output-format",
      type: "string",
      help: "Specifies the format of the output (default: json or assumed by file extension when available).",
      helpArg: "FORMAT",
    }
  ]

const combineOptions =
  [
    {
      name: 'out',
      type: 'string',
      help: "The output file.",
      helpArg: "OUT_FILE"
    }
  ];

const convertConfiguration: dashdash.ParserConfiguration =
  { options: converstionOptions };

const combineConfiguration: dashdash.ParserConfiguration =
  { options: converstionOptions.concat(combineOptions) }

export async function main(argv: string[]) {

  const commands = ["convert", "combine", "split"];

  const commandSpecified = commands.indexOf(argv[2]) >= 0;
  const command = commandSpecified ? argv[2] : "convert";

  function getHelpMessage() {
    const help = new dashdash.Parser(
      {
        options: generalOptions
          .concat(converstionOptions)
          .concat({ group: "combine (additional options)" })
          .concat(combineOptions)
      }
    ).help();
    return `usage: any-json [command] FILE [options] [OUT_FILE]

any-json can be used to convert (almost) anything to JSON.

This version supports:
    cson, csv, hjson, ini, json, json5, toml, yaml

This version has is beta support for:
    xls, xlsx

The beta formats should work, but since they are new,
  behavior may change in later releases in response to feedback
  without requiring a major version update.

command:
    convert    convert between formats (default when none specified)
    combine    combine multiple documents
    split      spilts a document (containing an array) into multiple documents

options:
${help}`
  }

  const options = function () {
    const parser = dashdash.createParser({ options: generalOptions, allowUnknown: true });
    return parser.parse(argv);
  }();

  if (options.version) {
    return `any-json version ${version}`;
  }

  if (options.help || argv.length <= 2) {
    return getHelpMessage();
  }

  if (!commandSpecified) {
    // Try legacy argument format
    const { options, unnamedArgs } = legacyOptionsParsing(argv);

    const legacyProperties = ["j", "c", "h", "format", "opt"]

    if (Object.getOwnPropertyNames(options).some(key => legacyProperties.indexOf(key) >= 0)) {

      if (options.opt) {
        return `The "opt" argument is no longer supported.
Please open an issue on GitHub describing your need:

    https://github.com/any-json/any-json

In the mean time, you can downgrade to 2.2.0:

    npm install any-json@2.2.0
`
      }

      if (unnamedArgs.length < 1) {
        if (!options.format) {
          throw `too few arguments: please specify the file to convert
for help use 'any-json -?`;
        }

        const stdin = process.stdin;
        const encoding = anyjson.getEncoding(options.format);

        stdin.resume();
        if (encoding !== "binary") {
          stdin.setEncoding(encoding);
        }

        let text = "";
        stdin.on("data", (chunk: string | Buffer) => { text += chunk; });

        return await new Promise((resolve, reject) => {
          stdin.on("end", async () => {
            resolve(await legacyEncode(options, await anyjson.decode(text, options.format)));
          });
        });
      }

      const format = options.format || getFormatFromFileName(unnamedArgs[0]);
      const input = await anyjson.decode(await readFile(unnamedArgs[0], anyjson.getEncoding(format)), format);

      return await legacyEncode(options, input);
    }
    // Not legacy parsing continue as usual
  }

  async function convert(value: any, options: any, outputFileName?: string) {
    const output_format = options.output_format || getFormatFromFileName(outputFileName) || "json";
    const result = await anyjson.encode(value, output_format);

    if (outputFileName) {
      await util.promisify(fs.writeFile)(outputFileName, result, anyjson.getEncoding(output_format))
      return "";
    }
    return result;
  }

  switch (command) {
    case "convert": {
      const parser = dashdash.createParser(convertConfiguration);
      const options = parser.parse({ argv, slice: commandSpecified ? 3 : 2 });

      if (options._args.length > 2) {
        throw "too many arguments";
      }

      const fileName = options._args[0] as string;
      const format = options.input_format || getFormatFromFileName(fileName);

      const fileContents = await readFile(fileName, anyjson.getEncoding(format))

      const parsed = await anyjson.decode(fileContents, format)

      const outputFileName = options._args[1]
      return await convert(parsed, options, outputFileName);
    }
    case "combine": {
      const parser = new dashdash.Parser(combineConfiguration)

      const options = parser.parse({ argv, slice: 3 });

      const items = await Promise.all(
        options._args.map(async fileName => {
          const format = options.input_format || getFormatFromFileName(fileName);
          const fileContents = await readFile(fileName, anyjson.getEncoding(format)) as string
          return await anyjson.decode(fileContents, format)
        })
      )

      const outputFileName = options.out;
      return await convert(items, options, outputFileName);
    }
    case "split": {
      const parser = dashdash.createParser(convertConfiguration);
      if (options._args.length < 3) {
        throw "too few arguments";
      }

      const fileName = argv[3];
      const outputPattern = argv[4];

      const format = options.input_format || getFormatFromFileName(fileName);

      const fileContents = await readFile(fileName, "utf8")

      const array = await anyjson.decode(fileContents, format) as any[]

      if (!Array.isArray(array)) {
        throw "split only works on arrays";
      }

      const writtenFiles = await Promise.all(
        array.map(async (obj: any) => {
          const fileName = formatUnicorn(outputPattern, obj);
          await convert(obj, options, fileName)
          return `${fileName} written`;
        }))

      return writtenFiles.join(EOL);
    }
  }

  // Should be unreachable.
  throw new Error(`Command ${command} not implemented`)
}

if (require.main === module) {
  main(process.argv)
    .then(s => process.stdout.write(s as string, 'binary'))
    .catch(error => {
      console.error(error);
      process.exit(2);
    });
}