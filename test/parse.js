import {expect} from 'code';
import literals from '../src/literals';
import parse from '../src/parse';

describe('parsing', () => {

    let fn;

    describe('integers', () => {

        it('should return the value', () => {

            const parsedValue = 12;

            fn = parse('12');

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

    });

    describe('floating points', () => {

        it('should return the value', () => {

            const parsedValue = 1.2;

            fn = parse('1.2');

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

        it('should parse expression without integer part', () => {

            const parsedValue = 0.2;

            fn = parse('.2');

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

    });

    describe('scientific notations', () => {

        it('should return the value', () => {

            const parsedValue = 12000;

            fn = parse('12e3');

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

        it('should parse expression with float coefficient', () => {

            const parsedValue = 120;

            fn = parse('.12e3');

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

        it('should parse expression with negative exponent', () => {

            const parsedValue = 12;

            fn = parse('12000e-3');

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

        it('should parse expression with signed exponent', () => {

            const parsedValue = 12000;

            fn = parse('12e+3');

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

        it('should be case insensitive', () => {

            const parsedValue = 12000;

            fn = parse('12E3');

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

    });

    describe('strings', () => {

        it('should return the value in double quotes', () => {

            fn = parse('"abc"');

            expect(fn).function();
            expect(fn()).equals('abc');

        });

        it('should return the value in single quotes', () => {

            fn = parse('\'abc\'');

            expect(fn).function();
            expect(fn()).equals('abc');

        });

        it('should return the value in back ticks', () => {

            fn = parse('`abc`');

            expect(fn).function();
            expect(fn()).equals('abc');

        });

        it('should parse escaped characters', () => {

            fn = parse('"a\\\"\\t\\v\\f\\\``\\\'\'\\n\\r\\eb"');

            expect(fn).function();
            expect(fn()).equals('a\"\t\v\f\``\'\'\n\reb');

        });

        it('should parse unicode characters', () => {

            fn = parse('"\\u00A0"');

            expect(fn).function();
            expect(fn()).equals('\u00A0');

        });

    });

    describe('literals', () => {

        it('should parse null', () => {

            fn = parse('null');

            expect(fn).function();
            expect(fn()).null();

        });

        it('should parse true', () => {

            fn = parse('true');

            expect(fn).function();
            expect(fn()).true();

        });

        it('should parse false', () => {

            fn = parse('false');

            expect(fn).function();
            expect(fn()).false();

        });

    });

    describe('whitespace', () => {

        it('should ignore whitespaces', () => {

            const parsedValue = 12;

            fn = parse(' \n12\r\v\t\u00A0 ');

            expect(fn).function();
            expect(fn()).equals(parsedValue);

        });

    });

    describe('arrays', () => {

        it('should parse empty arrays', () => {

            fn = parse('[]');

            expect(fn).function();
            expect(fn()).equals([]);

        });

        it('should parse arrays with values', () => {

            fn = parse('[0, 1, 2]');

            expect(fn).function();
            expect(fn()).equals([0, 1, 2]);

        });

        it('should parse arrays with complex values', () => {

            fn = parse('[0, "abc", [null,true], false]');

            expect(fn).function();
            expect(fn()).equals([0, 'abc', [null, true], false]);

        });

        it('should parse arrays with trailing commas', () => {

            fn = parse('[0, 1, 2, ]');

            expect(fn).function();
            expect(fn()).equals([0, 1, 2]);

        });

    });

    describe('objects', () => {

        it('should parse empty arrays', () => {

            fn = parse('{}');

            expect(fn).function();
            expect(fn()).equals({});

        });

    });

    it('should throw on invalid expression', () => {

        expect(() => parse('-1a')).throw(`${literals.UNEXPECTED_CHARACTER} -`);
        expect(() => parse('12e-')).throw(`${literals.UNEXPECTED_CHARACTER} -`);
        expect(() => parse('12e-a')).throw(`${literals.UNEXPECTED_CHARACTER} -`);
        expect(() => parse('"def')).throw(literals.MISMATCHED_QUOTES);
        expect(() => parse('"\\u0T00"')).throw(literals.INVALID_UNICODE);
        expect(() => parse('[1')).throw(`${literals.UNEXPECTED_EXPECTED} ]`);

    });

});
