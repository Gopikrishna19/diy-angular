import {expect} from 'code';
import literals from '../src/literals';
import parse from '../src/parse';
import {register} from '../src/filters';
import sinon from 'sinon';

describe('parsing', () => {

    beforeEach(() => {

        global.window = {};
        global.window.window = window;

    });

    afterEach(() => delete global.window);

    describe('integers', () => {

        it('should return the value', () => {

            const parsedValue = 12;

            expect(parse('12')()).equals(parsedValue);

        });

        it('should be marked as literal', () => {

            expect(parse('2').literal).true();

        });

        it('should be marked as constant', () => {

            expect(parse('2').constant).true();

        });

    });

    describe('floating points', () => {

        it('should return the value', () => {

            const parsedValue = 1.2;

            expect(parse('1.2')()).equals(parsedValue);

        });

        it('should parse expression without integer part', () => {

            const parsedValue = 0.2;

            expect(parse('.2')()).equals(parsedValue);

        });

    });

    describe('scientific notations', () => {

        it('should return the value', () => {

            const parsedValue = 12000;

            expect(parse('12e3')()).equals(parsedValue);

        });

        it('should parse expression with float coefficient', () => {

            const parsedValue = 120;

            expect(parse('.12e3')()).equals(parsedValue);

        });

        it('should parse expression with negative exponent', () => {

            const parsedValue = 12;

            expect(parse('12000e-3')()).equals(parsedValue);

        });

        it('should parse expression with signed exponent', () => {

            const parsedValue = 12000;

            expect(parse('12e+3')()).equals(parsedValue);

        });

        it('should be case insensitive', () => {

            const parsedValue = 12000;

            expect(parse('12E3')()).equals(parsedValue);

        });

    });

    describe('strings', () => {

        it('should return the value in double quotes', () => {

            expect(parse('"abc"')()).equals('abc');

        });

        it('should return the value in single quotes', () => {

            expect(parse('\'abc\'')()).equals('abc');

        });

        it('should return the value in back ticks', () => {

            expect(parse('`abc`')()).equals('abc');

        });

        it('should parse escaped characters', () => {

            expect(parse('"a\\\"\\t\\v\\f\\\``\\\'\'\\n\\r\\eb"')()).equals('a\"\t\v\f\``\'\'\n\reb');

        });

        it('should parse unicode characters', () => {

            expect(parse('"\\u00A0"')()).equals('\u00A0');

        });

        it('should be marked as literal', () => {

            expect(parse('"abc"').literal).true();

        });

        it('should be marked as constant', () => {

            expect(parse('2').constant).true();

        });

    });

    describe('literals', () => {

        it('should parse null', () => {

            expect(parse('null')()).null();

        });

        it('should parse true', () => {

            expect(parse('true')()).true();

        });

        it('should parse false', () => {

            expect(parse('false')()).false();

        });

        it('should be marked as literal', () => {

            expect(parse('true').literal).true();
            expect(parse('false').literal).true();

        });

        it('should be marked as constant', () => {

            expect(parse('true').constant).true();
            expect(parse('false').constant).true();

        });

    });

    describe('whitespace', () => {

        it('should ignore whitespaces', () => {

            const parsedValue = 12;

            expect(parse(' \n12\r\v\t\u00A0 ')()).equals(parsedValue);

        });

    });

    describe('arrays', () => {

        it('should parse empty arrays', () => {

            expect(parse('[]')()).equals([]);

        });

        it('should parse arrays with values', () => {

            expect(parse('[0, 1, 2]')()).equals([0, 1, 2]);

        });

        it('should parse arrays with complex values', () => {

            expect(parse('[0, "abc", [null,true], false]')()).equals([0, 'abc', [null, true], false]);

        });

        it('should parse arrays with trailing commas', () => {

            expect(parse('[0, 1, 2, ]')()).equals([0, 1, 2]);

        });

        it('should look up dynamic indices', () => {

            expect(parse('[1,2,3,4][1]')()).equals(2);

        });

        it('should be marked as literal', () => {

            expect(parse('{a: 1, b: aVar}').literal).true();

        });

        it('should be marked as constant if all elements are constant', () => {

            expect(parse('[1, 2, 3]').constant).true();
            expect(parse('[1, [2, [3]]]').constant).true();
            expect(parse('[1, 2, a]').constant).false();
            expect(parse('[1, [2, [a]]]').constant).false();

        });

    });

    describe('objects', () => {

        it('should parse empty arrays', () => {

            expect(parse('{}')()).equals({});

        });

        it('should parse objects with properties', () => {

            expect(parse('{"a key":1, `another-key`: 2, \'zero\': 0}')()).equals({
                'a key': 1,
                'another-key': 2,
                zero: 0
            });

        });

        it('should parse objects with complex properties', () => {

            expect(parse('{array: [{a: 1}, 2], object: {a: [true, false]}}')()).equals({
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

            expect(parse('{aKey: 1}.aKey')()).equals(1);

        });

        it('should look up dynamic properties', () => {

            expect(parse('{aKey: 1}["aKey"]')()).equals(1);

        });

        it('should not allow access to __proto__', () => {

            const prop = '__proto__';

            expect(() => parse(`a.${prop}`)({a: {}})).throws(`${literals.PROPERTY_ACCESS_DENIED} ${prop}`);

        });

        it('should not allow access to __defineGetter__', () => {

            const prop = '__defineGetter__';

            expect(() => parse(`a.${prop}("b", call)`)({
                a: {},
                call: () => {}
            })).throws(`${literals.PROPERTY_ACCESS_DENIED} ${prop}`);

        });

        it('should not allow access to __defineSetter__', () => {

            const prop = '__defineSetter__';

            expect(() => parse(`a.${prop}("b", call)`)({
                a: {},
                call: () => {}
            })).throws(`${literals.PROPERTY_ACCESS_DENIED} ${prop}`);

        });

        it('should not allow access to __lookupGetter__', () => {

            const prop = '__lookupGetter__';

            expect(() => parse(`a.${prop}("b")`)({a: {}})).throws(`${literals.PROPERTY_ACCESS_DENIED} ${prop}`);

        });

        it('should not allow access to computed descriptors', () => {

            const prop = '__lookupSetter__';

            expect(() => parse(`a["${prop}"]("b")`)({a: {}})).throws(`${literals.PROPERTY_ACCESS_DENIED} ${prop}`);

        });

        it('should not allow access to window as a property', () => {

            expect(() => parse('object.wnd')({object: {wnd: window}})).throws(literals.WINDOW_ACCESS_DENIED);

        });

        it('should not allow access to window as a computed property', () => {

            expect(() => parse('object["wnd"]')({object: {wnd: window}})).throws(literals.WINDOW_ACCESS_DENIED);

        });

        it('should not allow access to DOM element as a property', () => {

            const parser = parse('el.setAttribute("attr", "val")');

            expect(() => parser({
                el: {
                    attr: 'attr',
                    children: [],
                    find: () => {},
                    prop: {}
                }
            })).throws(literals.DOM_ACCESS_DENIED);
            expect(() => parser({
                el: {
                    children: [],
                    nodeName: 'DIV'
                }
            })).throws(literals.DOM_ACCESS_DENIED);

        });

        it('should not allow access to Object', () => {

            expect(() => parse('object.create({})')({object: Object})).throws(literals.OBJECT_ACCESS_DENIED);

        });

        it('should be marked as literal', () => {

            expect(parse('[1, 2, aVar]').literal).true();

        });

        it('should be marked as constant if all properties are constant', () => {

            expect(parse('{a: 1, b: 2}').constant).true();
            expect(parse('{a: 1, b: {c: 3}}').constant).true();
            expect(parse('{a: 1, b: something}').constant).false();
            expect(parse('{a: 1, b: {c: something}}').constant).false();

        });

        it('should mark looked up properties constant if object is constant', () => {

            expect(parse('{a: 1}.a').constant).true();

        });

        it('should mark dynamic looked up properties constant if object is constant', () => {

            expect(parse('{a: 1}["a"]').constant).true();

        });

        it('should not mark computed properties as constant', () => {

            expect(parse('obj.a').constant).false();
            expect(parse('obj["a"]').constant).false();
            expect(parse('{a: 1}[something]').constant).false();
            expect(parse('obj[something]').constant).false();

        });

    });

    describe('functions', () => {

        it('should return the result', () => {

            expect(parse('call()')({call: () => 2})).equals(2);

        });

        it('should parse calls with arguments', () => {

            expect(parse('call(1)')({call: a => a + 1})).equals(2);

        });

        it('should parse calls with computed arguments', () => {

            expect(parse('call(n)')({
                call: a => a + 1,
                n: 1
            })).equals(2);

        });

        it('should parse calls with functional arguments', () => {

            expect(parse('call(args())')({
                args: () => 1,
                call: a => a + 1
            })).equals(2);

        });

        it('should parse calls with multiple arguments', () => {

            const parsedValue = 4;

            expect(parse('call(1, n, args())')({
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

            expect(parse('object.call()')($scope)).equals(1);

        });

        it('should look up computed methods in $scope', () => {

            const $scope = {
                object: {
                    call: () => $scope.object.n,
                    n: 1
                }
            };

            expect(parse('object["call"]()')($scope)).equals(1);

        });

        it('should look up complex methods in $scope', () => {

            expect(parse('a.call(1)()')({a: {call: a => () => a}})).equals(1);

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

            expect(parse('object.call()')($scope)).equals(1);

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

            expect(parse('object["call"]()')($scope)).equals(1);

        });

        it('should bind bare functions to $scope', () => {

            const $scope = {
                call() {

                    return this;

                }
            };

            expect(parse('call()')($scope)).equals($scope);

        });

        it('should bind bare functions to $locals', () => {

            const $locals = {
                call() {

                    return this;

                }
            };

            expect(parse('call()')({}, $locals)).equals($locals);

        });

        it('should not allow access to constructor', () => {

            const prop = 'constructor';

            expect(() => parse(`call.${prop}("return 1")()`)({call: () => {}})).throws(`${literals.PROPERTY_ACCESS_DENIED} ${prop}`);

        });

        it('should not allow access to aliased constructor', () => {

            expect(() => parse('call()')({call: (() => {}).constructor})).throws(`${literals.PROPERTY_ACCESS_DENIED} constructor`);

        });

        it('should not allow window as a parameter', () => {

            expect(() => parse('func(wnd)')({
                func: () => {},
                wnd: window
            })).throws(literals.WINDOW_ACCESS_DENIED);

        });

        it('should not allow calling window methods', () => {

            expect(() => parse('wnd.scrollTo(0)')({
                wnd: window
            })).throws(literals.WINDOW_ACCESS_DENIED);

        });

        it('should not allow window to be returned', () => {

            expect(() => parse('func()')({
                func: () => window
            })).throws(literals.WINDOW_ACCESS_DENIED);

        });

        it('should not allow `.apply`', () => {

            expect(() => parse('func.apply(obj)')({
                func: () => {},
                obj: {}
            })).throws(literals.APPLY_BIND_CALL_ACCESS_DENIED);

        });

        it('should not allow `.bind`', () => {

            expect(() => parse('func.bind(obj)')({
                func: () => {},
                obj: {}
            })).throws(literals.APPLY_BIND_CALL_ACCESS_DENIED);

        });

        it('should not allow `.call`', () => {

            expect(() => parse('func.call(obj)')({
                func: () => {},
                obj: {}
            })).throws(literals.APPLY_BIND_CALL_ACCESS_DENIED);

        });

        it('should not be marked as constant', () => {

            expect(parse('aFunction()').constant).false();

        });

    });

    describe('$scope', () => {

        it('should look up properties', () => {

            const parser = parse('aValue');

            expect(parser({aValue: 1})).equals(1);
            expect(parser({})).undefined();

        });

        it('should look up dynamic indices', () => {

            expect(parse('array[1]')({array: [1, 2]})).equals(2);

        });

        it('should look up dynamic properties', () => {

            expect(parse('object["aKey"]')({object: {aKey: 1}})).equals(1);

        });

        it('should look up computed indices', () => {

            expect(parse('array[index]')({
                array: [1, 2],
                index: 1
            })).equals(2);

        });

        it('should look up computed properties', () => {

            expect(parse('object[key]')({
                key: 'aKey',
                object: {aKey: 1}
            })).equals(1);

        });

        it('should return undefined when looking up properties on undefined', () => {

            expect(parse('aValue')()).undefined();

        });

        it('should look up nested properties', () => {

            const parser = parse('aKey.anotherKey');

            expect(parser({aKey: {anotherKey: 2}})).equals(2);
            expect(parser({aKey: {}})).undefined();
            expect(parser({})).undefined();

        });

        it('should look up properties at any depth', () => {

            const parser = parse('aKey.secondKey.thirdKey.fourthKey');

            expect(parser({aKey: {secondKey: {thirdKey: {fourthKey: 1}}}})).equals(1);
            expect(parser({aKey: {secondKey: {thirdKey: {}}}})).undefined();
            expect(parser({aKey: {}})).undefined();
            expect(parser()).undefined();

        });

        it('should use $locals as primary values', () => {

            const $scope = {aKey: 1};
            const $locals = {aKey: 2};

            expect(parse('aKey')($scope, $locals)).equals(2);

        });

        it('should default to $scope from $locals', () => {

            const $scope = {aKey: 1};
            const $locals = {anotherKey: 2};

            expect(parse('aKey')($scope, $locals)).equals(1);

        });

        it('should use $locals to look up properties if the first depth matches', () => {

            const $scope = {aKey: {anotherKey: 1}};
            const $locals = {aKey: {}};

            expect(parse('aKey.anotherKey')($scope, $locals)).undefined();

        });

        it('should look up properties at any depth from $local', () => {

            const parser = parse('aKey.secondKey.thirdKey.fourthKey');

            expect(parser({}, {aKey: {secondKey: {thirdKey: {fourthKey: 1}}}})).equals(1);
            expect(parser({}, {aKey: {secondKey: {thirdKey: {}}}})).undefined();
            expect(parser({}, {aKey: {}})).undefined();
            expect(parser()).undefined();

        });

    });

    describe('$locals', () => {

        it('should return $locals', () => {

            const $locals = {aKey: 2};
            const parser = parse('$locals');

            expect(parser({}, $locals)).equals($locals);
            expect(parser()).undefined();

        });

        it('should look up properties in $locals', () => {

            const $locals = {aKey: 1};

            expect(parse('$locals.aKey')({}, $locals)).equals(1);

        });

    });

    describe('this', () => {

        it('should return $scope', () => {

            const $scope = {};
            const parser = parse('this');

            expect(parser($scope)).equals($scope);
            expect(parser()).undefined();

        });

        it('should look up properties in $scope', () => {

            const $scope = {aKey: 1};

            expect(parse('this.aKey')($scope)).equals(1);

        });

        it('should not be marked as constant', () => {

            expect(parse('this').constant).false();

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

            expect(() => parse('wnd = obj')({
                obj: window
            })).throws(literals.WINDOW_ACCESS_DENIED);

        });

        it('should be marked as constant if both sides are constants', () => {

            expect(parse('1 = 2').constant).true();
            expect(parse('a = 2').constant).false();
            expect(parse('1 = b').constant).false();
            expect(parse('a = b').constant).false();

        });

    });

    describe('unary operators', () => {

        it('should parse unary +', () => {

            expect(parse('+2')()).equals(2);
            expect(parse('+a')({a: 2})).equals(2);

        });

        it('should parse unary -', () => {

            const two = 2;

            expect(parse('-2')()).equals(-two);
            expect(parse('-a')({a: -two})).equals(two);
            expect(parse('--a')({a: -two})).equals(-two);
            expect(parse('-a')({})).shallow.equals(0);

        });

        it('should parse unary !', () => {

            expect(parse('!true')()).false();
            expect(parse('!2')()).false();
            expect(parse('!a')({a: false})).true();
            expect(parse('!!a')({a: false})).false();
            expect(parse('"!"')()).equals('!');

        });

        it('should default to zero', () => {

            expect(parse('+a')()).equals(0);

        });

        it('should not be marked as literal', () => {

            expect(parse('+2').literal).false();
            expect(parse('!false').literal).false();
            expect(parse('-2').literal).false();

        });

    });

    describe('multiplicative operators', () => {

        it('should parse multiplication', () => {

            expect(parse('1 * 2')()).equals(2);

        });

        it('should parse division', () => {

            expect(parse('4 / 2')()).equals(2);

        });

        it('should parse remainder', () => {

            expect(parse('4 % 3')()).equals(1);

        });

        it('should parse multiple operators', () => {

            expect(parse('36 * 2 % 5')()).equals(2);

        });

        it('should parse with higher precedence than additives', () => {

            expect(parse('1 + 2 * 2 - 3')()).equals(2);

        });

    });

    describe('additive operators', () => {

        it('should parse addition', () => {

            expect(parse('0 + 2')()).equals(2);

        });

        it('should parse subtraction', () => {

            expect(parse('4 - 3')()).equals(1);

        });

        it('should parse multiple operators', () => {

            expect(parse('0 + 2 - 1')()).equals(1);

        });

        it('should default to 0 when undefined', () => {

            expect(parse('a + 1')()).equals(1);
            expect(parse('2 + a')()).equals(2);

            expect(parse('a - 1')()).equals(-1);
            expect(parse('2 - a')()).equals(2);

        });

        it('should parse with higher precedence than relational', () => {

            expect(parse('2 + 3 < 6 - 2')()).false();

        });

    });

    describe('relational operators', () => {

        it('should return the value', function () {

            expect(parse('1 < 2')()).true();
            expect(parse('1 > 2')()).false();
            expect(parse('1 <= 2')()).true();
            expect(parse('2 <= 2')()).true();
            expect(parse('1 >= 2')()).false();
            expect(parse('2 >= 2')()).true();

        });

        it('should parse with higher precedence than equality', () => {

            expect(parse('2 == "2" > 2 === "2"')()).false();

        });

    });

    describe('equality operators', () => {

        it('should return the value', () => {

            expect(parse('2 == 2')()).true();
            expect(parse('2 == "2"')()).true();
            expect(parse('2 != 2')()).false();
            expect(parse('2 === 2')()).true();
            expect(parse('2 === "2"')()).false();
            expect(parse('2 !== 2')()).false();

        });

        it('should parse with higher precedence than logical operators', () => {

            expect(parse('1 === 2 || 2 === 2')()).true();

        });

    });

    describe('logical operators', () => {

        let $scope,
            sandbox;

        beforeEach(() => {

            sandbox = sinon.sandbox.create();

            $scope = {call: sandbox.stub()};

        });

        afterEach(() => sandbox.restore());

        it('should parse &&', () => {

            expect(parse('true && true')()).true();
            expect(parse('true && false')()).false();

            parse('true && call()')($scope);
            sinon.assert.calledOnce($scope.call);

        });

        it('should parse ||', () => {

            expect(parse('true || true')()).true();
            expect(parse('true || false')()).true();
            expect(parse('false || false')()).false();

            parse('false || call()')($scope);
            sinon.assert.calledOnce($scope.call);

        });

        it('should parse multiple &&', () => {

            expect(parse('true && true && true')()).true();
            expect(parse('true && true && false')()).false();

        });

        it('should parse multiple ||', () => {

            expect(parse('true || true || true')()).true();
            expect(parse('true || true || false')()).true();
            expect(parse('false || false || true')()).true();
            expect(parse('false || false || false')()).false();

        });

        it('should short circuit &&', () => {

            parse('false && call()')($scope);

            sinon.assert.notCalled($scope.call);

        });

        it('should short circuit ||', () => {

            parse('true || call()')($scope);

            sinon.assert.notCalled($scope.call);

        });

        it('should parse && with higher precedence than ||', () => {

            expect(parse('false && true || true')()).true();

        });

        it('should parse || with higher precedence than ternary', () => {

            expect(parse('0 || 1 ? 0 || 2 : 0 || 3')()).equals(2);

        });

    });

    describe('binary operators', () => {

        it('should not be marked as literal', () => {

            expect(parse('1 * 2').literal).false();
            expect(parse('1 + 2').literal).false();
            expect(parse('1 == 2').literal).false();
            expect(parse('1 || 2').literal).false();

        });

    });

    describe('ternary operator', () => {

        it('should return the result', () => {

            expect(parse('a === 2 ? true : false')({a: 2})).true();
            expect(parse('a === 2 ? true : false')({a: 3})).false();

        });

        it('should parse nested expressions', () => {

            expect(parse('a === 2 ? b === 2 ? "a and b" : "a" : c === 2 ? "c" : "none"')({
                a: 4,
                b: 3,
                c: 2
            })).equals('c');

        });

    });

    describe('operators', () => {

        it('should parse parenthesis to alter precedence', () => {

            expect(parse('1 * (3 - 1)')()).equals(2);
            expect(parse('false && (true || true)')()).false();
            expect(parse('-((a % 2) === 0 ? 1 : 2)')({a: 2})).equals(-1);

        });

    });

    describe('statements', () => {

        it('should return the value of the last statement', () => {

            expect(parse('a = 0; b = 2; a + b')({})).equals(2);

        });

    });

    describe('filters', () => {

        it('should return the filtered value', () => {

            register('uppercase', () => str => str.toUpperCase());

            expect(parse('aString | uppercase')({aString: 'Hello'})).equals('HELLO');

        });

        it('should allow multiple filters', () => {

            register('uppercase', () => str => str.toUpperCase());
            register('exclaim', () => str => `${str}!`);

            expect(parse('aString | uppercase | exclaim')({aString: 'Hello'})).equals('HELLO!');

        });

        it('should take additional parameters', () => {

            register('repeat', () => (str, length) => Array.from({length}).fill(str).join(''));
            register('surround', () => (str, before, after) => `${before}${str}${after}`);

            expect(parse('aString | repeat : 3')({aString: 'Hello'})).equals('HelloHelloHello');
            expect(parse('aString | surround : "*" : "!"')({aString: 'Hello'})).equals('*Hello!');

        });

        it('should be marked as constant if arguments are constants', () => {

            register('aFilter', array => array);

            expect(parse('[1, 2, 3] | aFilter').constant).true();
            expect(parse('[1, 2, a] | aFilter').constant).false();
            expect(parse('[1, 2, 3] | aFilter : 42').constant).true();
            expect(parse('[1, 2, 3] | aFilter : a').constant).false();

        });

    });

    describe('raw functions', () => {

        it('should return the given functions', () => {

            const func = () => {};

            expect(parse(func)).equals(func);

        });

    });

    it('should throw on invalid expression', () => {

        expect(() => parse('^1a')).throws(`${literals.UNEXPECTED_CHARACTER} ^`);
        expect(() => parse('12e-')).throws(`${literals.UNEXPECTED_CHARACTER} -`);
        expect(() => parse('12e-a')).throws(`${literals.UNEXPECTED_CHARACTER} -`);
        expect(() => parse('"def')).throws(literals.MISMATCHED_QUOTES);
        expect(() => parse('"\\u0T00"')).throws(literals.INVALID_UNICODE);
        expect(() => parse('[1')).throws(`${literals.UNEXPECTED_EXPECTED} ]`);
        expect(() => parse('{1')).throws(`${literals.UNEXPECTED_EXPECTED} :`);
        expect(() => parse('a ? b')).throws(`${literals.UNEXPECTED_EXPECTED} :`);
        expect(() => parse('{1:1')).throws(`${literals.UNEXPECTED_EXPECTED} }`);
        expect(() => parse('wnd')({wnd: window})).throws(literals.WINDOW_ACCESS_DENIED);

    });

});
