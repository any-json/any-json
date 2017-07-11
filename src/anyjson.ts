/*! @preserve
 * any-json
 *
 * Copyright 2015-2016 Christian Zangl, MIT license
 * Details and documentation:
 * https://github.com/laktak/any-json
 */

import * as cson from 'cson';
import * as csv from 'fast-csv';
import * as hjson from 'hjson';
import * as ini from 'ini';
import * as json5 from 'json5';
import * as util from 'util';
import * as promisify from 'util.promisify';
import strip_json_comments = require('strip-json-comments');
import * as XLS from 'xlsjs';
import * as XLSX from 'xlsx';
import * as xml2js from 'xml2js';
import * as yaml from 'js-yaml';

function removeLeadingDot(formatOrExtension: string) {
  if (formatOrExtension && formatOrExtension[0] === ".") return formatOrExtension.substr(1);
  else return formatOrExtension;
}

function getEncoding(format) {
  format = removeLeadingDot(format);
  switch (format) {
    case "xlsx": return "binary";
    case "xls": return "binary";
    default: return "utf8";
  }
}

// parsers that support a JSON.parse interface (immediately return)
export async function decode(format: string, text: string, reviver?: (key: any, value: any) => any): Promise<any> {
  switch (format) {
    case 'cson': {
      return cson.parse(text, reviver)
    }
    case 'csv': {
      return await new Promise((resolve, reject) => {
        const res = [];
        csv.fromString(text, null)
          .on("data", function (data) { res.push(data); })
          .on("end", function () { resolve(res); });
      });
    }
    case 'hjson': {
      return hjson.parse(text, reviver)
    }
    case 'ini': {
      return ini.parse(text)
    }
    case 'json': {
      return JSON.parse(strip_json_comments(text), reviver)
    }
    case 'json5': {
      return json5.parse(text, reviver)
    }
    case 'xls': {
      var workbook = XLS.read(new Buffer(text), { type: "buffer" });
      var res = {};
      workbook.SheetNames.forEach(function (sheetName) {
        var roa = XLS.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
        if (roa.length > 0) res[sheetName] = roa;
      });
      return res;
    }
    case 'xlsx': {
      var workbook = XLSX.read(new Buffer(text), { type: "buffer" });
      var res = {};
      workbook.SheetNames.forEach(function (sheetName) {
        // TODO: make the following line type-check
        var roa = XLSX.utils['sheet_to_row_object_array'](workbook.Sheets[sheetName]);
        if (roa.length > 0) res[sheetName] = roa;
      });
      return res;
    }
    case 'xml': {
      return await promisify(xml2js.parseString)(text)
    }
    case 'yaml': {
      return yaml.safeLoad(text)
    }
  }
}

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

export enum encodings {
  json,
  hjson,
  json5,
  cson,
  yaml,
  ini,
  xml,
}

export async function encode(value: any, format: string): Promise<string> {
  switch (format) {
    case 'cson': {
      return cson.stringify(value, null, 2)
    }
    case 'csv': {
      return ""; // TODO
    }
    case 'hjson': {
      return hjson.stringify(value)
    }
    case 'ini': {
      return ini.stringify(value)
    }
    case 'json': {
      return JSON.stringify(value, null, 4)
    }
    case 'json5': {
      return json5.stringify(value, null, 4)
    }
    case 'xls': {
      return ""; // TODO
    }
    case 'xlsx': {
      return ""; // TODO
    }
    case 'xml': {
      const builder = new xml2js.Builder(null);
      return builder.buildObject(value)
    }
    case 'yaml': {
      return yaml.safeDump(value)
    }
  }
}