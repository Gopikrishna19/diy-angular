import {expect} from 'code';
import literals from '../src/literals';
import parse from '../src/parse';

describe('parsing', () => {

    describe('integers', () => {

        it('should return the value', () => {

            const fn = parse('12');
            const parsedValue = 12;

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

    });

    describe('floating points', () => {

        it('should return the value', () => {

            const fn = parse('1.2');
            const parsedValue = 1.2;

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

        it('should parse expression without integer part', () => {

            const fn = parse('.2');
            const parsedValue = 0.2;

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

    });

    describe('scientific notations', () => {

        it('should return the value', () => {

            const fn = parse('12e3');
            const parsedValue = 12000;

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

        it('should parse expression with float coefficient', () => {

            const fn = parse('.12e3');
            const parsedValue = 120;

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

        it('should parse expression with negative exponent', () => {

            const fn = parse('12000e-3');
            const parsedValue = 12;

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

        it('should parse expression with signed exponent', () => {

            const fn = parse('12e+3');
            const parsedValue = 12000;

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

        it('should be case insensitive', () => {

            const fn = parse('12E3');
            const parsedValue = 12000;

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

    });

    describe('strings', () => {

        it('should return the value in double quotes', () => {

            const fn = parse('"abc"');
            const parsedValue = 'abc';

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

        it('should return the value in single quotes', () => {

            const fn = parse('\'abc\'');
            const parsedValue = 'abc';

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

        it('should return the value in back ticks', () => {

            const fn = parse('`abc`');
            const parsedValue = 'abc';

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

        it('should parse escaped characters', () => {

            const fn = parse('"a\\\"\\t\\v\\f\\\``\\\'\'\\n\\r\\eb"');
            const parsedValue = 'a\"\t\v\f\``\'\'\n\reb';

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

        it('should parse unicode characters', () => {

            const fn = parse('"\\u00A0"');
            const parsedValue = '\u00A0';

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

    });

    it('should throw on invalid expression', () => {

        expect(() => parse('1a')).throw(`${literals.UNEXPECTED_CHARACTER} a`);
        expect(() => parse('12e-')).throw(`${literals.UNEXPECTED_CHARACTER} -`);
        expect(() => parse('12e-a')).throw(`${literals.UNEXPECTED_CHARACTER} -`);
        expect(() => parse('"def')).throw(literals.MISMATCHED_QUOTES);
        expect(() => parse('"\\u0T00"')).throw(literals.INVALID_UNICODE);

    });

});
