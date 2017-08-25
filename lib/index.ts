/*! @preserve
 * any-json
 *
 * Copyright 2017 Adam Voss, MIT license
 * Copyright 2015-2016 Christian Zangl, MIT license
 * Details and documentation:
 * https://github.com/laktak/any-json
 */

import * as cson from 'cson';
import csv = require('fast-csv');
import * as hjson from 'hjson';
import * as ini from 'ini';
import * as json5 from 'json5';
import * as toml from 'toml-j0.4';
import tomlify = require('tomlify-j0.4');
import * as util from 'util';
require('util.promisify/shim')();
import strip_json_comments = require('strip-json-comments');
import * as XLSX from 'xlsx';
import * as xml2js from 'xml2js';
import * as yaml from 'js-yaml';

interface FormatConversion {
  readonly name: string
  encode(value: any): Promise<string>
  decode(text: string, reviver?: (key: any, value: any) => any): Promise<any>
}

abstract class AbstractWorkbookConverter implements FormatConversion {
  abstract readonly name: string;
  abstract readonly bookType: XLSX.BookType;

  public async encode(value: any) {
    const book = XLSX.utils.book_new();

    if (Array.isArray(value)) {
      const sheet = XLSX.utils.json_to_sheet(value);
      XLSX.utils.book_append_sheet(book, sheet);
    }
    else {
      for (let sheetName of Object.getOwnPropertyNames(value)) {
        const sheet = XLSX.utils.json_to_sheet(value[sheetName]);
        XLSX.utils.book_append_sheet(book, sheet, sheetName);
      }
    }

    return XLSX.write(book, { WTF: true, bookType: this.bookType, type: "binary" });
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    const book = XLSX.read(text, { type: "binary" });
    if (book.SheetNames.length === 1) {
      return XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], {raw: true, defval: null});
    }

    const result: any = {};

    for (let sheet of book.SheetNames) {
      result[sheet] = XLSX.utils.sheet_to_json(book.Sheets[sheet], {raw: true, defval: null })
    }

    return result;
  }
}

class CsonConverter implements FormatConversion {
  readonly name: string = 'cson'

  public async encode(value: any) {
    return cson.stringify(value, undefined, 2)
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return cson.parse(text, reviver)
  }
}

class CsvConverter implements FormatConversion {
  readonly name: string = 'csv'

  public encode(value: any) {
    return new Promise<string>((resolve, reject) => {
      if (Array.isArray(value)) {
        csv.writeToString(value, { headers: true }, function (err, result) {
          if (err) {
            reject(err);
          }
          else {
            resolve(result);
          }
        })
      }
      else {
        reject("CSV encoding requires the object be an array.")
      }
    })
  }

  public decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return new Promise((resolve, reject) => {
      const res: any[] = [];
      csv.fromString(text, { headers: true })
        .on("data", function (data) { res.push(data); })
        .on("end", function () { resolve(res); });
    });
  }
}

class HjsonConverter implements FormatConversion {
  readonly name: string = 'hjson'

  public async encode(value: any) {
    return hjson.stringify(value)
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return hjson.parse(text)
  }
}

class IniConverter implements FormatConversion {
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

class JsonConverter implements FormatConversion {
  readonly name: string = 'json'

  public async encode(value: any) {
    return JSON.stringify(value, null, 4)
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return JSON.parse(strip_json_comments(text), reviver)
  }
}


class Json5Converter implements FormatConversion {
  readonly name: string = 'json5'

  public async encode(value: any) {
    return json5.stringify(value, null, 4)
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return json5.parse(text, reviver)
  }
}

class TomlConverter implements FormatConversion {
  readonly name: string = 'toml'

  public async encode(value: any) {
    return tomlify.toToml(value, undefined);
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return toml.parse(text)
  }
}

class XlsxConverter extends AbstractWorkbookConverter {
  readonly name = "xlsx"
  readonly bookType = "xlsx";
}

class XlsConverter extends AbstractWorkbookConverter {
  readonly name = "xls"
  readonly bookType = "xlml";
}

class XmlConverter implements FormatConversion {
  readonly name: string = 'xml'

  public async encode(value: any) {
    const builder = new xml2js.Builder();
    return builder.buildObject(value)
  }

  public decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return util.promisify(xml2js.parseString)(text)
  }
}

class YamlConverter implements FormatConversion {
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
  new CsvConverter(),
  new HjsonConverter(),
  new IniConverter(),
  new JsonConverter(),
  new Json5Converter(),
  new TomlConverter(),
  new XlsConverter(),
  new XlsxConverter(),
  new XmlConverter(),
  new YamlConverter()
].map(c => [c.name, c] as [string, FormatConversion]))

export async function decode(text: string, format: string): Promise<any> {
  const codec = codecs.get(format)

  if (codec) {
    return codec.decode(text, undefined);
  }

  throw new Error("Unknown format " + format + "!");
}

export async function encode(value: any, format: string): Promise<string> {
  const codec = codecs.get(format)

  if (codec) {
    return codec.encode(value);
  }

  throw new Error("Unknown format " + format + "!");
}

/**
 * Gets the anticipated string encoding for the given format.
 */
export function getEncoding(format: string) {
  switch (format) {
    case "xlsx": return "binary";
    case "xls": return "binary";
    default: return "utf8";
  }
}