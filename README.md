# any-json

[![NPM version](https://img.shields.io/npm/v/any-json.svg?style=flat-square)](http://www.npmjs.com/package/any-json)

# Usage

// TODO: Update command line interface

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

# Data Safety

## Safe

When only JSON features are used, conversion should not result in any data loss when using these formats.

- cson
- hjson
- json
- json5
- yaml

## Problematic

Some loss of information may occur.  Improved parsers/serializers could provide better compatibility, but implementation is provided as-is.  Known issues are listed below the format.

- ini
  - All numbers are converted to strings (the `ini` library would need to quote strings in order be recognize numbers)
  - In the unlikely case an object was not an array but has only has sequential, numeric members starting at zero it will be decoded as an array.
- xml
  - It cannot parse its own output (node-xml2js#391)[https://github.com/Leonidas-from-XIV/node-xml2js/issues/391]

## Limited

These formats are conceptually different and only work on a limited basis.  With effort, conventions could be established to provide a more complete transfer but there will be some impedance.

Tabular formats:
- csv
- xls
- xlsx

# History

- v3 Re-written to be Promise-based and bi-directional (serialization capabilities as well as parsing).
- v2 removed the experimental/unreliable format detection.
