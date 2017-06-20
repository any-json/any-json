/*! @preserve
 * any-json
 *
 * Copyright 2015-2016 Christian Zangl, MIT license
 * Details and documentation:
 * https://github.com/laktak/any-json
 */

function getFormat(formatOrExtension) {
  if (formatOrExtension && formatOrExtension[0]===".") return formatOrExtension.substr(1);
  else return formatOrExtension;
}

function getEncoding(format) {
  format=getFormat(format);
  switch (format) {
    case "xlsx": return "binary";
    case "xls": return "binary";
    default: return "utf8";
  }
}

// parsers that support a JSON.parse interface (immediately return)

var parser={
  json: function(text) { return JSON.parse(require("strip-json-comments")(text)); },
  hjson: function(text) { return require("hjson").parse(text); },
  json5: function(text) { return require("json5").parse(text); },
  cson: function(text) { return require("cson-safe").parse(text); },
  yaml: function(text) { return require("js-yaml").safeLoad(text); },
  ini: function(text) { return require("ini").parse(text); },
};

function convert(text, format) {
  format=getFormat(format);
  if (!format) throw new Error("Missing format!");

  var parse=parser[format.toLowerCase()];
  if (parse) return parse(text);
  else throw new Error("Unknown format "+format+"!");
}


// parsers that require a callback

var parserAsync={
  xml: function(text, options, cb) { require("xml2js").parseString(text, cb); },
  csv: function(text, options, cb) {
    var res=[];
    require("fast-csv").fromString(text, options)
    .on("data", function(data) { res.push(data); })
    .on("end", function() { cb(null, res); });
  },
  xlsx: function(text, options, cb) {
    var XLSX=require("xlsx");
    var workbook=XLSX.read(new Buffer(text), { type: "buffer" });
    var res={};
    workbook.SheetNames.forEach(function(sheetName) {
      var roa=XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
      if (roa.length>0) res[sheetName]=roa;
    });
    cb(null, res);
  },
  xls: function(text, options, cb) {
    var XLS=require("xlsjs");
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

function convertAsync(text, format, options, cb) {
  if (format && format[0]===".") format=format.substr(1);
  if (!format) return cb(new Error("missing format"));

  var parse=parserAsync[format.toLowerCase()];
  if (parse) parse(text, options, cb);
  else cb(new Error("Unknown format "+format+"!"));
}

module.exports={
  getEncoding: getEncoding,
  convert: convert,
  parser: parser,
  async: {
    convert: convertAsync,
    parser: parserAsync,
  },
};
