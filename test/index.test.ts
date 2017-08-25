import "mocha"
import * as anyjson from '../lib'
import * as fs from 'fs'
import promisify = require('util.promisify');
const readFile = promisify(fs.readFile)
import * as path from 'path'
import * as chai from 'chai'

const assert = chai.assert;

const fixturesDirectory = path.join(__dirname, 'fixtures');

function inputFixture(name: string) {
  return path.join(fixturesDirectory, 'in', name);
}

function outputFixture(name: string) {
  return path.join(fixturesDirectory, 'out', name);
}

function readInputFixture(name: string) {
  return readFile(inputFixture(name), 'utf8');
}

function readOutputFixture(name: string, encoding = 'utf8') {
  return readFile(outputFixture(name), encoding);
}

suite('safe-formats', () => {

  const safe_formats = [
    "cson",
    "hjson",
    "json",
    "json5",
    "yaml"
  ]

  testEncode(safe_formats);
  testDecode(safe_formats);
});

suite('problematic-formats', () => {

  const problematic_formats = [
    "ini",
    //"xml" // Decoding the XML does not work: https://github.com/Leonidas-from-XIV/node-xml2js/issues/393
  ]

  testEncode(problematic_formats.concat(["xml"]));
  testDecode(problematic_formats);

  // TOML does not support top-level arrays.
  suite('toml', () => {
    test('encode', async () => {
      const format = "toml"
      const input = JSON.parse(await readInputFixture('product.json'));
      const actual = anyjson.encode(input, format);
      const expected = readOutputFixture(`product.${format}`);
      return assert.strictEqual(await actual, await expected)
    })

    test('decode', async () => {
      const format = "toml";
      const expected = JSON.parse(await readInputFixture('product.json'));
      const contents = await readOutputFixture('product.' + format)
      const actual = await anyjson.decode(contents, format);
      return assert.deepEqual(actual, expected)
    })
  })
});

suite('tabular-formats', () => {

  const tabular_formats = [
    "csv",
    // "xls",
    // "xlsx"
  ]

  testEncode(tabular_formats);
  testDecode(tabular_formats);
});

function testEncode(formats: string[]) {
  suite('encode', function () {
    suite('product-set', () => {
      for (const format of formats) {
        test(format, async function () {
          const input = JSON.parse(await readInputFixture('product-set.json'));
          const actual = anyjson.encode(input, format)
          const expected = readOutputFixture(`product-set.${format}`, anyjson.getEncoding(format))
          return assert.strictEqual(await actual, await expected)
        })
      }
    });
  });
};

function testDecode(formats: string[]) {
  suite('decode', function () {
    suite('product-set', () => {

      for (const format of formats) {
        test(format, async function () {
          const expected = await getExpectedJson(format)
          const contents = await readOutputFixture('product-set.' + format, anyjson.getEncoding(format))
          const actual = await anyjson.decode(contents, format);
          return assert.deepEqual(actual, expected)
        })
      }
    });
  });
}

async function getExpectedJson(format: string) {
  const specializedPath = inputFixture(`product-set.${format}.json`);
  if (fs.existsSync(specializedPath)) {
    return JSON.parse(await readFile(specializedPath, 'utf8'));
  } else {
    return JSON.parse(await readInputFixture('product-set.json'));
  }
}