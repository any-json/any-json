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
    await testIsHelpMessage("-?");
    await testIsHelpMessage("--help");
  })

  test("version", async () => {

    async function testIsHelpMessage(s?: string) {
      const result = await main(args(s)) as string;
      assert.match(result, /^any-json version \d*\.\d*\.\d*/);
    }

    await testIsHelpMessage("--version");
  })

  test(".yml files are yaml", async () => {
    const result = await main(args("convert .travis.yml"));
    assert.notEqual(result, "");
  })

  const basicJsonFile = path.join(__dirname, 'fixtures', 'in', 'product-set.json');

  suite("legacy argument format", () => {
    test("opt is not supported", async () => {
      const result = await main(args("whatever -opt whatever"));
      assert.match(result as string, /The "opt" argument is no longer supported./)
    })

    test("j is for JSON", async () => {
      const result = await main(args(`-j ${basicJsonFile} ignored`));
      assert.strictEqual(result, fs.readFileSync(path.join(__dirname, 'fixtures', 'out', 'product-set.json'), 'utf8'));
    })

    test("c is for [JSON] Compact", async () => {
      const result = await main(args(`${basicJsonFile} -c ignored`));
      assert.strictEqual(result, JSON.stringify(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'out', 'product-set.json'), 'utf8'))));
    })

    test("h is for Hjson", async () => {
      const result = await main(args(`${basicJsonFile} ignored -h`));
      assert.strictEqual(result, fs.readFileSync(path.join(__dirname, 'fixtures', 'out', 'product-set.hjson'), 'utf8'));
    })

    test("format is for input format", async () => {
      const file = path.join(__dirname, 'fixtures', 'out', 'product-set.ini')
      const result = await main(args(`-format=ini ${file}`));
      assert.strictEqual(result, fs.readFileSync(path.join(__dirname, 'fixtures', 'in', `product-set.ini.json`), 'utf8'))
    })

    test("reading from stdin", async () => {
      require('mock-stdin').stdin();
      const resultPromise = main(args(`-format=hjson`));

      const mockStdin: any = process.stdin;
      mockStdin.send("{key:1}");
      mockStdin.send(null);

      assert.strictEqual(await resultPromise, '{\n    "key": 1\n}');
    })

    test("reading from stdin requires format argument", async () => {
      const result = await main(args(``)) as string;

      assert.match(result, /^usage:.*/);
    })
  })

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

  suite("split", () => {
    test("too few arguments", async () => {
      try {
        const result = await main(args("split file.csv"));
        assert.fail();
      }
      catch (error) {
        assert.strictEqual(error, "too few arguments");
      }
    })

    test("not an array", async () => {
      try {
        const result = await main(args(`split package.json used-parameter`));
        assert.fail();
      }
      catch (error) {
        assert.strictEqual(error, "split only works on arrays");
      }
    })

    test("can split flat csv", async () => {
      const file = path.join(__dirname, 'fixtures', 'out', 'product-set.csv');

      const result = await main(args(`split ${file} out/{id}.json`));
      assert.strictEqual(result,
        `out/2.json written
out/3.json written`);
    })
  });
})