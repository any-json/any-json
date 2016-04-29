# any-json

[![NPM version](https://img.shields.io/npm/v/any-json.svg?style=flat-square)](http://www.npmjs.com/package/any-json)

# Usage

```
usage: any-json [OPTIONS] [INPUT]

  any-json can be used to convert (almost) anything to JSON.
  This version supports:
  cson, csv, hjson, ini, json, json5, xls, xlsx, xml, yaml

  any-json will read the given input file or read from stdin.

  Output format:
    -j: will output as formatted JSON (default).
    -c: will output as JSON (compact).
    -h: will output as Hjson (Human JSON).

  Optional input format (usually the file extension):
    -format=FORMAT

  {-?|-help} shows this help.
```

# Install from npm

```
npm install any-json -g
```

# API

See lib/anyjson.js

# History

- v2 removed the experimental/unreliable format detection.
