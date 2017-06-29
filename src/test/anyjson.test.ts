import * as anyjson from '../anyjson'
import * as fs from 'fs'
import * as promisify from 'util.promisify';
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
import * as path from 'path'
import * as chai from 'chai'

const assert = chai.assert;

suite('encode', function () {

    const input = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'in', 'product-set.json'), 'utf8'));

    for (const format of Object.keys(anyjson._encodings)) {
        test(format, async function () {
            const actual = anyjson.encode(input, format)
            const expected = readFile(path.join(__dirname, 'fixtures', 'out', `product-set.${format}`), 'utf8')
            return assert.strictEqual(await actual, await expected)
        })
    }
})