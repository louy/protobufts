import {readdirSync, readFileSync} from 'fs';
import {expect} from 'chai';
import {protoStringToTsDeclaration} from '../index';

const dir = `${__dirname}/../test-files`;

function split(filename: string) {
  var i = filename.lastIndexOf('.');
  if (i === -1) return [filename];
  return [filename.substr(0, i), filename.substr(i + 1)];
}

describe('#protoStringToTsDeclaration', () => {
  for (const file of readdirSync(dir)) {
    const [basename, ext] = split(file);

    if (ext !== 'proto') continue;

    it(`converts proto file to ts declaration file: test-files/${basename}`, () => {
      const output = protoStringToTsDeclaration(
        readFileSync(
          `${dir}/${basename}.proto`,
          'utf8'
        )
      );
      const expected = readFileSync(
        `${dir}/${basename}.d.ts`,
        'utf8'
      );

      expect(output).to.equal(expected);
    });
  }
});
