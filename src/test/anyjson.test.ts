import anyjson = require('../anyjson')
import fs = require('fs')
import path = require('path')
import chai = require('chai')

const assert = chai.assert;

suite('encode', function () {

    const input = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'in', 'product-set.json'), 'utf8'));

    for (const format of Object.keys(anyjson._encodings)) {
        test(format, function () {
            const actual = anyjson.encode(input, format)
            const expected = fs.readFileSync(path.join(__dirname, 'fixtures', 'out', `product-set.${format}`), 'utf8')
            assert.strictEqual(actual, expected)
        })
    }
})