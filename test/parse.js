import {expect} from 'code';
import literals from '../src/literals';
import parse from '../src/parse';

describe('parse', () => {

    describe('integer', () => {

        it('should return the value', () => {

            const fn = parse('1');

            expect(fn).function();
            expect(fn()).equals(1);

        });

        it('should throw on invalid expression', () => {

            expect(() => parse('1a')).throw(`${literals.UNEXPECTED_NEXT_CHAR} a`);

        });

    });

});
