/*! @preserve
 * any-json
 *
 * Copyright 2015 Christian Zangl, MIT license
 * Details and documentation:
 * https://github.com/laktak/any-json
 */

// parsers that support a JSON.parse interface (immediately return)
var parser={
  json: function(text) { return JSON.parse(text); },
  hjson: function(text) { return require("hjson").parse(text); },
  json5: function(text) { return require("json5").parse(text); },
  cson: function(text) { return require("cson-safe").parse(text); },
  yaml: function(text) { return require("js-yaml").safeLoad(text); },
  ini: function(text) { return require("ini").parse(text); },
};

function convert(text, format) {
  if (format && format[0]==='.') format=format.substr(1);
  if (!format) format=detectFormat(text)[0];

  var parse=parser[format.toLowerCase()];
  if (parse) return parse(text);
  else throw new Error("Unknown format "+format+"!");
}

function detectFormat(text) {
  return Object.keys(parser).filter(function(format) {
    try { parser[format](text); return 1; }
    catch (err) {}
  });
}


// parsers that require a callback
var parserAsync={
  xml: function(text, cb) { require("xml2js").parseString(text, cb); },
};
Object.keys(parser).forEach(function(format) {
  parserAsync[format]=function(text, cb) {
    process.nextTick(function() {
      var obj;
      try { obj=parser[format](text); }
      catch (err) { return cb(err); }
      cb(null, obj);
    });
  };
});

function convertAsync(text, format, cb) {
  if (format && format[0]==='.') format=format.substr(1);
  if (!format) return cb(new Error("missing format"));

  var parse=parserAsync[format.toLowerCase()];
  if (parse) parse(text, cb);
  else cb(new Error("Unknown format "+format+"!"));
}

module.exports={
  convert: convert,
  detectFormat: detectFormat,
  parser: parser,
  async: {
    convert: convertAsync,
    parser: parserAsync,
  },
};
