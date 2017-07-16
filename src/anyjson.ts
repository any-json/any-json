/*! @preserve
 * any-json
 *
 * Copyright 2017 Adam Voss, MIT license
 * Copyright 2015-2016 Christian Zangl, MIT license
 * Details and documentation:
 * https://github.com/laktak/any-json
 */

import * as cson from 'cson';
import * as hjson from 'hjson';
import * as ini from 'ini';
import * as json5 from 'json5';
import * as util from 'util';
require('util.promisify/shim')();
import strip_json_comments = require('strip-json-comments');
import * as XLSX from 'xlsx';
import * as xml2js from 'xml2js';
import * as yaml from 'js-yaml';

function removeLeadingDot(formatOrExtension: string) {
  if (formatOrExtension && formatOrExtension[0] === ".") return formatOrExtension.substr(1);
  else return formatOrExtension;
}

function getEncoding(format: string) {
  format = removeLeadingDot(format);
  switch (format) {
    case "xlsx": return "binary";
    case "xls": return "binary";
    default: return "utf8";
  }
}

interface Format {
  readonly name: string
  encode(value: any): Promise<string | Buffer>
  decode(text: string, reviver?: (key: any, value: any) => any): Promise<any>
}

class CsonConverter implements Format {
  readonly name: string = 'cson'

  public async encode(value: any) {
    return cson.stringify(value, undefined, 2)
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return cson.parse(text, reviver)
  }
}

class HjsonConverter implements Format {
  readonly name: string = 'hjson'

  public async encode(value: any) {
    return hjson.stringify(value)
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return hjson.parse(text)
  }
}

class IniConverter implements Format {
  readonly name: string = 'ini'

  private looksLikeArray(object: object): boolean {
    const areInts = Object.getOwnPropertyNames(object).every(s => /^\d+$/.test(s))
    if (!areInts) {
      return false
    }
    const ints = Object.getOwnPropertyNames(object).map(s => parseInt(s)).sort();
    return [...Array(ints.length)].every(i => i === ints[i])
  }

  public async encode(value: any) {
    return ini.stringify(value)
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    const parsed = ini.parse(text)
    if (!this.looksLikeArray(parsed)) {
      return parsed
    }

    const array = Array(Object.getOwnPropertyNames(parsed).length)
    for (var index = 0; index < array.length; index++) {
      array[index] = parsed[index]
    }

    return array;
  }
}

class JsonConverter implements Format {
  readonly name: string = 'json'

  public async encode(value: any) {
    return JSON.stringify(value, null, 4)
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return JSON.parse(strip_json_comments(text), reviver)
  }
}


class Json5Converter implements Format {
  readonly name: string = 'json5'

  public async encode(value: any) {
    return json5.stringify(value, null, 4)
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return json5.parse(text, reviver)
  }
}

class XmlConverter implements Format {
  readonly name: string = 'xml'

  public async encode(value: any) {
    const builder = new xml2js.Builder();
    return builder.buildObject(value)
  }

  public decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return util.promisify(xml2js.parseString)(text)
  }
}

class YamlConverter implements Format {
  readonly name: string = 'yaml'

  public async encode(value: any) {
    return yaml.safeDump(value)
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return yaml.safeLoad(text)
  }
}

const codecs = new Map([
  new CsonConverter(),
  new HjsonConverter(),
  new IniConverter(),
  new JsonConverter(),
  new Json5Converter(),
  new XmlConverter(),
  new YamlConverter()
].map(c => [c.name, c] as [string, Format]))

/**
 * Parse the given text with the specified format
 * @param text The original text
 * @param format The original format
 * @returns The parsed object
 */
export async function convert(text: string, format: string): Promise<any> {
  format = removeLeadingDot(format);
  if (!format) throw new Error("Missing format!");

  var parse = await decode(format.toLowerCase(), text);
  if (parse) return parse(text);
  else throw new Error("Unknown format " + format + "!");
}

export async function decode(format: string, text: string, reviver?: (key: any, value: any) => any): Promise<any> {
  const codec = codecs.get(format)

  if (codec) {
    return codec.decode(text, reviver);
  }

  throw new Error("Unknown format " + format + "!");
}

export async function encode(value: any, format: string): Promise<string | Buffer> {
  const codec = codecs.get(format)

  if (codec) {
    return codec.encode(value);
  }

  throw new Error("Unknown format " + format + "!");
}