import "mocha"
import * as chai from 'chai'
const assert = chai.assert;

import { main } from '../lib/run'
import * as anyjson from '../lib'
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

  const basicJsonFile = path.join(__dirname, 'fixtures', 'in', 'product-set.json');

  suite("convert", () => {
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
      const result = await main(args(`convert ${basicJsonFile}`)) as string;
      assert.deepEqual(JSON.parse(result), JSON.parse(fs.readFileSync(basicJsonFile, 'utf8')));
    })

    test("reading JSON", async () => {
      const result = await main(args(basicJsonFile)) as string;
      assert.deepEqual(JSON.parse(result), JSON.parse(fs.readFileSync(basicJsonFile, 'utf8')));
    })

    test("reading JSON as YAML", async () => {
      const result = await main(args(basicJsonFile + " --input-format=yaml")) as string;
      assert.deepEqual(JSON.parse(result), JSON.parse(fs.readFileSync(basicJsonFile, 'utf8')));
    })

    test("output as YAML", async () => {
      const result = await main(args(basicJsonFile + " --output-format=yaml")) as string;
      assert.strictEqual(result, fs.readFileSync(path.join(__dirname, 'fixtures', 'out', 'product-set.yaml'), 'utf8'));
    })

    test("output to file", async () => {
      const outputFile = path.join("out", "test.cson")
      const result = await main(args(`${basicJsonFile} ${outputFile}`)) as string;
      assert.strictEqual(result, "");
      const written = fs.readFileSync(outputFile, 'utf8')
      assert.strictEqual(written, fs.readFileSync(path.join(__dirname, 'fixtures', 'out', 'product-set.cson'), 'utf8'));
    })
  });

  suite("combine", () => {
    test("to standard out", async () => {
      const result = await main(args(`combine ${basicJsonFile} ${basicJsonFile}`)) as string;
      const singleEntry = JSON.parse(fs.readFileSync(basicJsonFile, 'utf8'));
      assert.deepEqual(JSON.parse(result), [singleEntry, singleEntry]);
    })

    test("to file", async () => {
      const outputFile = 'out/test.yaml'
      const result = await main(args(`combine ${basicJsonFile} ${basicJsonFile} --out=${outputFile}`)) as string;
      assert.strictEqual(result, "");
      const written = fs.readFileSync(outputFile, 'utf8')
      const singleEntry = JSON.parse(fs.readFileSync(basicJsonFile, 'utf8'));
      assert.deepEqual(await anyjson.decode(written, 'yaml'), [singleEntry, singleEntry]);
    })
  });
})