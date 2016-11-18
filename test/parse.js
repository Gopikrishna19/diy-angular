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

        it('should look up dynamic indices', () => {

            fn = parse('[1,2,3,4][1]');

            expect(fn()).equals(2);

        });

    });

    describe('objects', () => {

        it('should parse empty arrays', () => {

            fn = parse('{}');

            expect(fn).function();
            expect(fn()).equals({});

        });

        it('should parse objects with properties', () => {

            fn = parse('{"a key":1, `another-key`: 2, \'zero\': 0}');

            expect(fn).function();
            expect(fn()).equals({
                'a key': 1,
                'another-key': 2,
                zero: 0
            });

        });

        it('should parse objects with complex properties', () => {

            fn = parse('{array: [{a: 1}, 2], object: {a: [true, false]}}');

            expect(fn).function();
            expect(fn()).equals({
                array: [
                    {a: 1},
                    2
                ],
                object: {
                    a: [true, false]
                }
            });

        });

        it('should look up properties', () => {

            fn = parse('{aKey: 1}.aKey');

            expect(fn()).equals(1);

        });

        it('should look up dynamic properties', () => {

            fn = parse('{aKey: 1}["aKey"]');

            expect(fn()).equals(1);

        });

    });

    describe('functions', () => {

        it('should return the result', () => {

            fn = parse('call()');

            expect(fn({call: () => 2})).equals(2);

        });

        it('should parse calls with arguments', () => {

            fn = parse('call(1)');

            expect(fn({call: a => a + 1})).equals(2);

        });

        it('should parse calls with computed arguments', () => {

            fn = parse('call(n)');

            expect(fn({
                call: a => a + 1,
                n: 1
            })).equals(2);

        });

        it('should parse calls with functional arguments', () => {

            fn = parse('call(args())');

            expect(fn({
                args: () => 1,
                call: a => a + 1
            })).equals(2);

        });

        it('should parse calls with multiple arguments', () => {

            const parsedValue = 4;

            fn = parse('call(1, n, args())');

            expect(fn({
                args: () => 1,
                call: (a, b, c) => a + b + c + 1,
                n: 1
            })).equals(parsedValue);

        });

        it('should look up methods in $scope', () => {

            const $scope = {
                object: {
                    call: () => $scope.object.n,
                    n: 1
                }
            };

            fn = parse('object.call()');

            expect(fn($scope)).equals(1);

        });

        it('should look up computed methods in $scope', () => {

            const $scope = {
                object: {
                    call: () => $scope.object.n,
                    n: 1
                }
            };

            fn = parse('object["call"]()');

            expect(fn($scope)).equals(1);

        });

        it('should look up methods in context', () => {

            const $scope = {
                object: {
                    call() {

                        return this.n;

                    },
                    n: 1
                }
            };

            fn = parse('object.call()');

            expect(fn($scope)).equals(1);

        });

        it('should look up computed methods in context', () => {

            const $scope = {
                object: {
                    call() {

                        return this.n;

                    },
                    n: 1
                }
            };

            fn = parse('object["call"]()');

            expect(fn($scope)).equals(1);

        });

    });

    describe('$scope', () => {

        it('should look up properties', () => {

            fn = parse('aValue');

            expect(fn({aValue: 1})).equals(1);
            expect(fn({})).undefined();

        });

        it('should look up dynamic indices', () => {

            fn = parse('array[1]');

            expect(fn({array: [1, 2]})).equals(2);

        });

        it('should look up dynamic properties', () => {

            fn = parse('object["aKey"]');

            expect(fn({object: {aKey: 1}})).equals(1);

        });

        it('should look up computed indices', () => {

            fn = parse('array[index]');

            expect(fn({
                array: [1, 2],
                index: 1
            })).equals(2);

        });

        it('should look up computed properties', () => {

            fn = parse('object[key]');

            expect(fn({
                key: 'aKey',
                object: {aKey: 1}
            })).equals(1);

        });

        it('should return undefined when looking up properties on undefined', () => {

            fn = parse('aValue');

            expect(fn()).undefined();

        });

        it('should look up nested properties', () => {

            fn = parse('aKey.anotherKey');

            expect(fn({aKey: {anotherKey: 2}})).equals(2);
            expect(fn({aKey: {}})).undefined();
            expect(fn({})).undefined();

        });

        it('should look up properties at any depth', () => {

            fn = parse('aKey.secondKey.thirdKey.fourthKey');

            expect(fn({aKey: {secondKey: {thirdKey: {fourthKey: 1}}}})).equals(1);
            expect(fn({aKey: {secondKey: {thirdKey: {}}}})).undefined();
            expect(fn({aKey: {}})).undefined();
            expect(fn()).undefined();

        });

        it('should use $locals as primary values', () => {

            const $scope = {aKey: 1};
            const $locals = {aKey: 2};

            fn = parse('aKey');

            expect(fn($scope, $locals)).equals(2);

        });

        it('should default to $scope from $locals', () => {

            const $scope = {aKey: 1};
            const $locals = {anotherKey: 2};

            fn = parse('aKey');

            expect(fn($scope, $locals)).equals(1);

        });

        it('should use $locals to look up properties if the first depth matches', () => {

            const $scope = {aKey: {anotherKey: 1}};
            const $locals = {aKey: {}};

            fn = parse('aKey.anotherKey');

            expect(fn($scope, $locals)).undefined();

        });

        it('should look up properties at any depth from $local', () => {

            fn = parse('aKey.secondKey.thirdKey.fourthKey');

            expect(fn({}, {aKey: {secondKey: {thirdKey: {fourthKey: 1}}}})).equals(1);
            expect(fn({}, {aKey: {secondKey: {thirdKey: {}}}})).undefined();
            expect(fn({}, {aKey: {}})).undefined();
            expect(fn()).undefined();

        });

    });

    describe('$locals', () => {

        it('should return $locals', () => {

            const $locals = {aKey: 2};

            fn = parse('$locals');

            expect(fn({}, $locals)).equals($locals);
            expect(fn()).undefined();

        });

        it('should look up properties in $locals', () => {

            const $locals = {aKey: 1};

            fn = parse('$locals.aKey');

            expect(fn({}, $locals)).equals(1);

        });

    });

    describe('this', () => {

        it('should return $scope', () => {

            const $scope = {};

            fn = parse('this');

            expect(fn($scope)).equals($scope);
            expect(fn()).undefined();

        });

        it('should look up properties in $scope', () => {

            const $scope = {aKey: 1};

            fn = parse('this.aKey');

            expect(fn($scope)).equals(1);

        });

    });

    it('should throw on invalid expression', () => {

        expect(() => parse('-1a')).throw(`${literals.UNEXPECTED_CHARACTER} -`);
        expect(() => parse('12e-')).throw(`${literals.UNEXPECTED_CHARACTER} -`);
        expect(() => parse('12e-a')).throw(`${literals.UNEXPECTED_CHARACTER} -`);
        expect(() => parse('"def')).throw(literals.MISMATCHED_QUOTES);
        expect(() => parse('"\\u0T00"')).throw(literals.INVALID_UNICODE);
        expect(() => parse('[1')).throw(`${literals.UNEXPECTED_EXPECTED} ]`);
        expect(() => parse('{1')).throw(`${literals.UNEXPECTED_EXPECTED} :`);
        expect(() => parse('{1:1')).throw(`${literals.UNEXPECTED_EXPECTED} }`);

    });

});
