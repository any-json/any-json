import "mocha"
import * as anyjson from '../anyjson'
import * as fs from 'fs'
import promisify = require('util.promisify');
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
import * as path from 'path'
import * as chai from 'chai'

const assert = chai.assert;

suite('safe-formats', () => {

  const safe_formats = [
    "cson",
    "hjson",
    "json",
    "json5",
    "yaml"
  ]

  suite('encode', function () {
    suite('product-set', () => {
      const input = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'in', 'product-set.json'), 'utf8'));

      for (const format of safe_formats) {
        test(format, async function () {
          const actual = anyjson.encode(input, format)
          const expected = readFile(path.join(__dirname, 'fixtures', 'out', `product-set.${format}`), 'utf8')
          return assert.strictEqual(await actual, await expected)
        })
      }
    });
  });

  suite('decode', function () {
    suite('product-set', () => {
      const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'in', 'product-set.json'), 'utf8'));

      for (const format of safe_formats) {
        test(format, async function () {
          const contents = fs.readFileSync(path.join(__dirname, 'fixtures', 'out', 'product-set.' + format), 'utf8')
          const actual = await anyjson.decode(format, contents);
          return assert.deepEqual(actual, expected)
        })
      }
    });
  });
});

suite('problematic-formats', () => {

  const safe_formats = [
    "ini",
    "xml"
  ]

  suite('encode', function () {
    suite('product-set', () => {
      const input = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'in', 'product-set.json'), 'utf8'));

      for (const format of safe_formats) {
        test(format, async function () {
          const actual = anyjson.encode(input, format)
          const expected = readFile(path.join(__dirname, 'fixtures', 'out', `product-set.${format}`), 'utf8')
          return assert.strictEqual(await actual, await expected)
        })
      }
    });
  });

  suite('decode', function () {
    suite('product-set', () => {
      const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'in', 'product-set.json'), 'utf8'));

      for (const format of safe_formats) {
        test(format, async function () {
          const contents = fs.readFileSync(path.join(__dirname, 'fixtures', 'out', 'product-set.' + format), 'utf8')
          const actual = await anyjson.decode(format, contents);
          return assert.deepEqual(actual, expected)
        })
      }
    });
  });
});

suite('tabular-formats', () => {

  const safe_formats = [
    "csv",
    "xls",
    "xlsx"
  ]

  suite('encode', function () {
    suite('product-set', () => {
      const input = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'in', 'product-set.json'), 'utf8'));

      for (const format of safe_formats) {
        test(format, async function () {
          const actual = anyjson.encode(input, format)
          const expected = readFile(path.join(__dirname, 'fixtures', 'out', `product-set.${format}`), 'utf8')
          return assert.strictEqual(await actual, await expected)
        })
      }
    });
  });

  suite('decode', function () {
    suite('product-set', () => {
      const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'in', 'product-set.json'), 'utf8'));

      for (const format of safe_formats) {
        test(format, async function () {
          const contents = fs.readFileSync(path.join(__dirname, 'fixtures', 'out', 'product-set.' + format), 'utf8')
          const actual = await anyjson.decode(format, contents);
          return assert.deepEqual(actual, expected)
        })
      }
    });
  });
});