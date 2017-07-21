import "mocha"
import * as chai from 'chai'
const assert = chai.assert;

import { main } from '../lib/run'
import * as fs from 'fs'
import * as path from 'path'

function args(s?: string): string[] {
    return ['node_path', 'file_path'].concat(s ? s.split(' ') : []);
}

suite("Command Line Application", () => {

    test("help", async () => {

        async function testIsHelpMessage(s?: string) {
            const result = await main(args(s)) as string;
            assert.match(result, /^usage:.*/);
        }

        await testIsHelpMessage();
        await testIsHelpMessage("-h");
        await testIsHelpMessage("--help");
    })

    test("version", async () => {

        async function testIsHelpMessage(s?: string) {
            const result = await main(args(s)) as string;
            assert.match(result, /^any-json version \d*\.\d*\.\d*/);
        }

        await testIsHelpMessage("--version");
    })

    test("too many args", async () => {
        try {
            const result = await main(args("This is a test"));
            assert.fail();
        }
        catch (error) {
            assert.strictEqual(error, "too many arguments");
        }
    })

    test("explicit convert command", async () => {
        const file = path.join(__dirname, 'fixtures', 'in', 'product-set.json');
        const result = await main(args(`convert ${file}`)) as string;
        assert.deepEqual(JSON.parse(result), JSON.parse(fs.readFileSync(file, 'utf8')));
    })

    test("reading JSON", async () => {
        const file = path.join(__dirname, 'fixtures', 'in', 'product-set.json');
        const result = await main(args(file)) as string;
        assert.deepEqual(JSON.parse(result), JSON.parse(fs.readFileSync(file, 'utf8')));
    })

    test("reading JSON as YAML", async () => {
        const file = path.join(__dirname, 'fixtures', 'in', 'product-set.json');
        const result = await main(args(file + " --input-format=yaml")) as string;
        assert.deepEqual(JSON.parse(result), JSON.parse(fs.readFileSync(file, 'utf8')));
    })

    test("output as YAML", async () => {
        const file = path.join(__dirname, 'fixtures', 'in', 'product-set.json');
        const result = await main(args(file + " --output-format=yaml")) as string;
        assert.strictEqual(result, fs.readFileSync(path.join(__dirname, 'fixtures', 'out', 'product-set.yaml'), 'utf8'));
    })
})