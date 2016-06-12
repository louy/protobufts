import {readdirSync, readFileSync} from 'fs';
import {expect} from 'chai';
import {protoStringToTsDeclaration} from '../index';

const dir = `${__dirname}/../test-files`;

describe('#protoStringToTsDeclaration', () => {
  for (const file of readdirSync(dir)) {
    const [basename, ext] = file.split('.', 2);

    if (ext !== 'proto') continue;

    it(`converts proto file to ts declaration file: test-files/${basename}`, () => {
      const output = protoStringToTsDeclaration(
        readFileSync(
          `${dir}/${basename}.proto`,
          'utf8'
        ),
        `${dir}/${basename}.proto`
      );
      const expected = readFileSync(
        `${dir}/${basename}.d.ts`,
        'utf8'
      );

      expect(output).to.equal(expected);
    });
  }
});
