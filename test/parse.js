import {expect} from 'code';
import literals from '../src/literals';
import parse from '../src/parse';

describe('parsing', () => {

    let fn;

    beforeEach(() => {

        global.window = {};
        global.window.window = window;

    });

    afterEach(() => delete global.window);

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

        it('should not allow access to __proto__', () => {

            const prop = '__proto__';

            expect(() => {

                fn = parse(`a.${prop}`);

                fn({a: {}});

            }).throws(`${literals.PROPERTY_ACCESS_DENIED} ${prop}`);

        });

        it('should not allow access to __defineGetter__', () => {

            const prop = '__defineGetter__';

            expect(() => {

                fn = parse(`a.${prop}("b", call)`);

                fn({
                    a: {},
                    call: () => {}
                });

            }).throws(`${literals.PROPERTY_ACCESS_DENIED} ${prop}`);

        });

        it('should not allow access to __defineSetter__', () => {

            const prop = '__defineSetter__';

            expect(() => {

                fn = parse(`a.${prop}("b", call)`);

                fn({
                    a: {},
                    call: () => {}
                });

            }).throws(`${literals.PROPERTY_ACCESS_DENIED} ${prop}`);

        });

        it('should not allow access to __lookupGetter__', () => {

            const prop = '__lookupGetter__';

            expect(() => {

                fn = parse(`a.${prop}("b")`);

                fn({a: {}});

            }).throws(`${literals.PROPERTY_ACCESS_DENIED} ${prop}`);

        });

        it('should not allow access to computed descriptors', () => {

            const prop = '__lookupSetter__';

            expect(() => {

                fn = parse(`a["${prop}"]("b")`);

                fn({a: {}});

            }).throws(`${literals.PROPERTY_ACCESS_DENIED} ${prop}`);

        });

        it('should not allow access to window as a property', () => {

            fn = parse('object.wnd');

            expect(() => fn({object: {wnd: window}})).throws(literals.WINDOW_ACCESS_DENIED);

        });

        it('should not allow access to window as a computed property', () => {

            fn = parse('object["wnd"]');

            expect(() => fn({object: {wnd: window}})).throws(literals.WINDOW_ACCESS_DENIED);

        });

        it('should not allow access to DOM element as a property', () => {

            fn = parse('el.setAttribute("attr", "val")');

            expect(() => fn({
                el: {
                    attr: 'attr',
                    children: [],
                    find: () => {},
                    prop: {}
                }
            })).throws(literals.DOM_ACCESS_DENIED);
            expect(() => fn({
                el: {
                    children: [],
                    nodeName: 'DIV'
                }
            })).throws(literals.DOM_ACCESS_DENIED);

        });

        it('should not allow access to Object', () => {

            fn = parse('object.create({})');

            expect(() => fn({object: Object})).throws(literals.OBJECT_ACCESS_DENIED);

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

        it('should look up complex methods in $scope', () => {

            fn = parse('a.call(1)()');

            expect(fn({a: {call: a => () => a}})).equals(1);

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

        it('should bind bare functions to $scope', () => {

            const $scope = {
                call() {

                    return this;

                }
            };

            fn = parse('call()');

            expect(fn($scope)).equals($scope);

        });

        it('should bind bare functions to $locals', () => {

            const $locals = {
                call() {

                    return this;

                }
            };

            fn = parse('call()');

            expect(fn({}, $locals)).equals($locals);

        });

        it('should not allow access to constructor', () => {

            const prop = 'constructor';

            expect(() => {

                fn = parse(`call.${prop}("return 1")()`);

                fn({call: () => {}});

            }).throws(`${literals.PROPERTY_ACCESS_DENIED} ${prop}`);

        });

        it('should not allow access to aliased constructor', () => {

            expect(() => {

                fn = parse('call()');

                fn({call: (() => {}).constructor});

            }).throws(`${literals.PROPERTY_ACCESS_DENIED} constructor`);

        });

        it('should not allow window as a parameter', () => {

            fn = parse('func(wnd)');

            expect(() => fn({
                func: () => {},
                wnd: window
            })).throws(literals.WINDOW_ACCESS_DENIED);

        });

        it('should not allow calling window methods', () => {

            fn = parse('wnd.scrollTo(0)');

            expect(() => fn({
                wnd: window
            })).throws(literals.WINDOW_ACCESS_DENIED);

        });

        it('should not allow window to be returned', () => {

            fn = parse('func()');

            expect(() => fn({
                func: () => window
            })).throws(literals.WINDOW_ACCESS_DENIED);

        });

        it('should not allow `.apply`', () => {

            fn = parse('func.apply(obj)');

            expect(() => fn({
                func: () => {},
                obj: {}
            })).throws(literals.APPLY_BIND_CALL_ACCESS_DENIED);

        });

        it('should not allow `.bind`', () => {

            fn = parse('func.bind(obj)');

            expect(() => fn({
                func: () => {},
                obj: {}
            })).throws(literals.APPLY_BIND_CALL_ACCESS_DENIED);

        });

        it('should not allow `.call`', () => {

            fn = parse('func.call(obj)');

            expect(() => fn({
                func: () => {},
                obj: {}
            })).throws(literals.APPLY_BIND_CALL_ACCESS_DENIED);

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

    describe('assignments', () => {

        it('should put bare values in $scope', () => {

            const $scope = {};

            parse('a = 1')($scope);

            expect($scope.a).equals(1);

        });

        it('should allow assignments from a function call', () => {

            const $scope = {call: () => 1};

            parse('a = call()')($scope);

            expect($scope.a).equals(1);

        });

        it('should allow assignments to nested properties', () => {

            const $scope = {a: {}};

            parse('a.b = 1')($scope);

            expect($scope.a.b).equals(1);

        });

        it('should allow assignments to computed properties', () => {

            const $scope = {a: {b: {}}};

            parse('a.b["c"] = 1')($scope);

            expect($scope.a.b.c).equals(1);

        });

        it('should allow assignments to complex properties', () => {

            const $scope = {a: [{}]};

            parse('a[0].b = 1')($scope);

            expect($scope.a[0].b).equals(1);

        });

        it('should sync path before assigning', () => {

            const $scope = {};

            parse('a[0].b = 1')($scope);

            expect($scope.a[0].b).equals(1);

        });

        it('should not allow window to be assigned', () => {

            fn = parse('wnd = obj');

            expect(() => fn({
                obj: window
            })).throws(literals.WINDOW_ACCESS_DENIED);

        });

    });

    describe('unary operators', () => {

        it('should parse unary +', () => {

            expect(parse('+2')()).equals(2);
            expect(parse('+a')({a: 2})).equals(2);

        });

        it('should default to zero', () => {

            expect(parse('+a')()).equals(0);

        });

    });

    it('should throw on invalid expression', () => {

        expect(() => parse('-1a')).throws(`${literals.UNEXPECTED_CHARACTER} -`);
        expect(() => parse('12e-')).throws(`${literals.UNEXPECTED_CHARACTER} -`);
        expect(() => parse('12e-a')).throws(`${literals.UNEXPECTED_CHARACTER} -`);
        expect(() => parse('"def')).throws(literals.MISMATCHED_QUOTES);
        expect(() => parse('"\\u0T00"')).throws(literals.INVALID_UNICODE);
        expect(() => parse('[1')).throws(`${literals.UNEXPECTED_EXPECTED} ]`);
        expect(() => parse('{1')).throws(`${literals.UNEXPECTED_EXPECTED} :`);
        expect(() => parse('{1:1')).throws(`${literals.UNEXPECTED_EXPECTED} }`);
        expect(() => parse('wnd')({wnd: window})).throws(literals.WINDOW_ACCESS_DENIED);

    });

});
