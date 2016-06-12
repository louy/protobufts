import {readdirSync, readFileSync, writeFileSync} from 'fs';
import {expect} from 'chai';
import {protoStringToJson, protoStringToTs} from '../index';
import * as ts from 'typescript';

import * as ProtoBuf from 'protobufjs';

const dir = `${__dirname}/../test-files`;

function split(filename: string) {
  var i = filename.lastIndexOf('.');
  if (i === -1) return [filename];
  return [filename.substr(0, i), filename.substr(i + 1)];
}

// protobufjs.builder.import has some side-effects. here we try to fix them.
function walk(object) {
  object.messages.forEach(message => {
    if (object.syntax && !message.syntax) message.syntax = object.syntax;
    walk(message);
  });
  object.enums.forEach(enm => {
    if (object.syntax && !enm.syntax) enm.syntax = object.syntax;
  });

  return object;
}

describe('#protoStringToTs', () => {
  for (const file of readdirSync(dir)) {
    const [basename, ext] = split(file);

    if (ext !== 'proto') continue;

    it(`converts proto file to ts file: test-files/${basename}`, () => {
      const filename = `${dir}/${basename}.proto`;
      const proto = readFileSync(filename, 'utf8');
      const output = protoStringToTs(proto);
      const json = protoStringToJson(proto);
      const transpiled = ts.transpile(output, { module: ts.ModuleKind.CommonJS });

      writeFileSync(`${filename}.ts`, output);
      writeFileSync(`${filename}.js`, transpiled);

      const result = require(`${filename}.js`);

      expect(result.json).to.deep.equal(walk(json));
      expect(result.default).to.be.an.instanceOf(ProtoBuf.Builder);
    });
  }
});
