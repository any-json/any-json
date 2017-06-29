/*! @preserve
 * any-json
 *
 * Copyright 2015-2016 Christian Zangl, MIT license
 * Details and documentation:
 * https://github.com/laktak/any-json
 */

import * as cson from 'cson-safe';
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
  if (formatOrExtension && formatOrExtension[0]===".") return formatOrExtension.substr(1);
  else return formatOrExtension;
}

export function getEncoding(format) {
  format=removeLeadingDot(format);
  switch (format) {
    case "xlsx": return "binary";
    case "xls": return "binary";
    default: return "utf8";
  }
}

// parsers that support a JSON.parse interface (immediately return)

export const parser = {
  json: function(text: string): object { return JSON.parse(strip_json_comments(text)); },
  hjson: hjson.parse,
  json5: json5.parse,
  cson: cson.parse,
  yaml: yaml.safeLoad,
  ini: ini.parse,

};

/**
 * Parse the given text with the specified format
 * @param text The original text
 * @param format The original format
 * @returns The parsed object
 */
export function convert(text: string, format: string): object {
  format=removeLeadingDot(format);
  if (!format) throw new Error("Missing format!");

  var parse=parser[format.toLowerCase()];
  if (parse) return parse(text);
  else throw new Error("Unknown format "+format+"!");
}

export interface AsyncParserSource{
  [name: string]: (text: string, options: object, cb: (e: Error, res?: any) => void) => void
}

/**
 * parsers that require a callback
 */
var parserAsync: AsyncParserSource={
  xml: function(text, options, cb) { xml2js.parseString(text, cb); },
  csv: function(text, options, cb) {
    var res=[];
    csv.fromString(text, options)
    .on("data", function(data) { res.push(data); })
    .on("end", function() { cb(null, res); });
  },
  xlsx: function(text, options, cb) {
    var workbook=XLSX.read(new Buffer(text), { type: "buffer" });
    var res={};
    workbook.SheetNames.forEach(function(sheetName) {
      // TODO: make the following line type-check
      var roa=XLSX.utils['sheet_to_row_object_array'](workbook.Sheets[sheetName]);
      if (roa.length>0) res[sheetName]=roa;
    });
    cb(null, res);
  },
  xls: function(text, options, cb) {
    var workbook=XLS.read(new Buffer(text), { type: "buffer" });
    var res={};
    workbook.SheetNames.forEach(function(sheetName) {
      var roa=XLS.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
      if (roa.length>0) res[sheetName]=roa;
    });
    cb(null, res);
  },
};

// wrap for safety
Object.keys(parserAsync).forEach(function(format) {
  var wrap=parserAsync[format];
  parserAsync[format]=function(text, options, cb) {
    try { wrap(text, options, cb); }
    catch (err) { cb(err); }
  };
});


// add from sync
Object.keys(parser).forEach(function(format) {
  parserAsync[format]=function(text, options, cb) {
    process.nextTick(function() {
      var obj;
      try { obj=parser[format](text); }
      catch (err) { return cb(err); }
      cb(null, obj);
    });
  };
});

    const promiseMethod = function<T, U> (fn: (...T) => U) {
        if (typeof fn !== "function") {
            throw new TypeError("Parameter is not a function:" + fn);
        }
        return <(...T) => Promise<U>>function () {
            try{
              var value = fn.apply(this, arguments);
              return Promise.resolve(value);
            }
            catch (error){
              return Promise.reject(error);
            }
        };
    };

function convertAsync(text: string, format: string, options: any, cb: (e: Error, result?: any) => void) {
  if (format && format[0]===".") format=format.substr(1);
  if (!format) return cb(new Error("missing format"));

  var parse=parserAsync[format.toLowerCase()];
  if (parse) parse(text, options, cb);
  else cb(new Error("Unknown format "+format+"!"));
}

export const _encodings = {
  json: promiseMethod(JSON.stringify),
  hjson: promiseMethod((value, opts?) => hjson.stringify(value, opts)),
  json5: promiseMethod(json5.stringify),
  cson: promiseMethod((value, replacer?: (key: string, value: any) => any, space?: string | number) => cson.stringify(value, replacer, space)),
  yaml: promiseMethod(yaml.safeDump),
  ini: promiseMethod(ini.stringify),
  xml: promiseMethod(((value, options?) => { const builder = new xml2js.Builder(options); return builder.buildObject(value) }))
}

export function encode(value: any, format: string): Promise<string> {
  switch (format) {
    case 'cson': {
      return _encodings.cson(value, null, 2)
    }
    case 'json': {
      return _encodings.json(value, null, 4)
    }
    case 'json5': {
      return _encodings.json5(value, null, 4)
    }
    default: {
      const encoding = _encodings[format]
      if (encoding) {
        return encoding(value)
      }

      throw new Error(`Unsupported output format ${format}!`)
    }
  }
}

export const async = {
  convert: convertAsync,
  parser: parserAsync,
};
