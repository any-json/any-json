# any-json

any-json can be used to convert (almost) anything to and from JSON.

[![NPM version](https://img.shields.io/npm/v/any-json.svg?style=flat-square)](http://www.npmjs.com/package/any-json)

## Install from npm

```
npm install any-json -g
```

## Examples

### convert

```bash
# Prints as JSON to standard out
any-json package.json5

# Writes the contents from `package.json` to `package.json5` as JSON5
any-json package.json package.json5

# Same as above (the `convert` command is default).
any-json convert package.json5
any-json convert package.json package.json5
```

### combine

```bash
# Prints an JSON array containing an item for every JSON file in directory
any-json combine *.json

# Combines A.json and B.json, writing the result to C.json
any-json combine A.json B.json --out C.json

# Create a csv from a collection of flat YAML files
any-json combine *.yaml --out=data.csv
```

### split

```bash
# Creates a JSON file for each row in the CSV where the name is based on the `product_id` column
any-json split products.csv prod-{product_id}.json
```

## Formats and Data Safety

### Safe

When only JSON features are used, conversion should not result in any data loss when using these formats.

- cson
- hjson
- json
- json5
- yaml

### Problematic

Some loss of information may occur.  Improved parsers/serializers could provide better compatibility, but implementation is provided as-is.  Known issues are listed below the format.

- ini
  - All numbers are converted to strings (the `ini` library would need to quote strings in order be recognize numbers)
  - In the unlikely case an object was not an array but has only has sequential, numeric members starting at zero it will be decoded as an array.
- toml
  - Top-level array and date objects are not supported
    - It would be non-standard, but this could be worked around by wrapping the content in an object (then discarding the object when decoding).
- xml
  - It cannot parse its own output [node-xml2js#391](https://github.com/Leonidas-from-XIV/node-xml2js/issues/391)

### Limited

These formats are conceptually different and only work on a limited basis.  With effort, conventions could be established to provide a more complete transfer but there will be some impedance.

Tabular formats:
- csv
- xls
- xlsx

## Usage

### Command Line

```
usage: any-json [command] FILE [options] [OUT_FILE]

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
    -?, --help              Prints this help and exits.
    --version               Prints version information and exits.
    --input-format=FORMAT   Specifies the format of the input (assumed by file
                            extension when not provided).
    --output-format=FORMAT  Specifies the format of the output (default: json or
                            assumed by file extension when available).

  combine (additional options):
    --out=OUT_FILE          The output file.
```

### API

```js
const anyjson = require('any-json')
const obj = await anyjson.decode(/* string to parse */, /* format (string) */)
const str = await anyjson.encode(/* object to encode */, /* desired format (string) */)
```

## Contributing

Contributions welcome!  If **any-json** is not meeting your needs or your have an idea for an improvement, please open an issue or create a pull request.

## History

_For detailed release history, see [Releases](https://github.com/any-json/any-json/releases)._

- v3 Re-written to be Promise-based and bi-directional (serialization capabilities as well as parsing).
- v2 removed the experimental/unreliable format detection.
