import {expect} from 'code';
import literals from '../src/literals';
import parse from '../src/parse';

describe('parse', () => {

    it('should parse integers', () => {

        const fn = parse('12');
        const parsedValue = 12;

        expect(fn).function();
        expect(fn()).equals(parsedValue);

    });

    it('should parse floating points', () => {

        const fn = parse('1.2');
        const parsedValue = 1.2;

        expect(fn).function();
        expect(fn()).equals(parsedValue);

    });

    it('should throw on invalid expression', () => {

        expect(() => parse('1a')).throw(`${literals.UNEXPECTED_NEXT_CHAR} a`);

    });

});
