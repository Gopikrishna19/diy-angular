import {expect} from 'code';
import parse from '../src/parse';

describe('parse', () => {

    it('should parse an integer', () => {

        const fn = parse('1');

        expect(fn).function();
        expect(fn()).equals(1);

    });

});
