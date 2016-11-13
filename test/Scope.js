import * as logger from '../src/logger';
import Scope from '../src/Scope';
import {expect} from 'code';
import literals from '../src/literals';
import sinon from 'sinon';

describe('Scope', () => {

    const delay = 50;
    const error = new Error('error');
    let $scope,
        listenerFn,
        sandbox,
        watchFn;

    beforeEach(() => {

        $scope = new Scope();
        sandbox = sinon.sandbox.create();

        listenerFn = sandbox.stub();
        watchFn = sandbox.stub();

        sandbox.stub(logger, 'log');

    });

    afterEach(() => sandbox.restore());

    it('should be constructed and used as an object', () => {

        $scope.aProperty = 1;

        expect($scope.aProperty).equals(1);

    });

    describe('$digest', () => {

        it('should call the listener function on first $digest', () => {

            $scope.$watch(
                () => 'watch',
                listenerFn
            );

            $scope.$digest();

            sinon.assert.calledOnce(listenerFn);

        });

        it('should call the watch function with scope as argument', () => {

            $scope.$watch(watchFn, listenerFn);

            $scope.$digest();

            sinon.assert.calledTwice(watchFn);
            sinon.assert.calledWithExactly(watchFn, $scope);

        });

        it('should call the listener function when watched value changes', () => {

            $scope.someValue = 'a';

            $scope.$watch(
                scope => scope.someValue,
                listenerFn
            );

            sinon.assert.notCalled(listenerFn);

            $scope.$digest();
            sinon.assert.calledOnce(listenerFn);

            $scope.$digest();
            sinon.assert.calledOnce(listenerFn);

            $scope.someValue = 'b';
            sinon.assert.calledOnce(listenerFn);

            $scope.$digest();
            sinon.assert.calledTwice(listenerFn);

        });

        it('should call the listener function when watch value is first undefined', () => {

            $scope.$watch(
                scope => scope.someValue,
                listenerFn
            );

            $scope.$digest();
            sinon.assert.calledOnce(listenerFn);

        });

        it('should call the listener function with new value as old value the first time', () => {

            let oldValueGiven = null;

            $scope.someValue = 'a';

            $scope.$watch(
                scope => scope.someValue,
                (newValue, oldValue) => oldValueGiven = oldValue
            );

            $scope.$digest();
            expect(oldValueGiven).equals($scope.someValue);

        });

        it('should allow watchers without a listener function', () => {

            $scope.$watch(watchFn);

            $scope.$digest();
            sinon.assert.calledTwice(watchFn);

        });

        it('should call chained watchers in the same $digest', () => {

            $scope.name = 'Jane';

            $scope.$watch(
                scope => scope.nameUpper,
                (newValue, oldValue, scope) => {

                    if (newValue) {

                        scope.initial = `${newValue.substring(0, 1)}.`;

                    }

                }
            );

            $scope.$watch(
                scope => scope.name,
                (newValue, oldValue, scope) =>
                    scope.nameUpper = newValue.toUpperCase()
            );

            $scope.$digest();
            expect($scope.initial).equals('J.');

            $scope.name = 'Doe';
            $scope.$digest();
            expect($scope.initial).equals('D.');

        });

        it('should end the $digest when the last dirty watcher is clean', () => {

            const length = 100;
            const affectedItemIndex = 1;
            const eachCalledTwiceOnFirstDigest = 200;
            const stopsAfterLastDirtyWatchIsClean = eachCalledTwiceOnFirstDigest +
                length +
                affectedItemIndex;
            let watchExecutions = 0;

            $scope.array = Array.from({length});

            $scope.array.forEach((item, index) =>
                $scope.$watch(
                    scope => {

                        watchExecutions += 1;
                        return scope.array[index];

                    }
                )
            );

            $scope.$digest();
            expect(watchExecutions).equals(eachCalledTwiceOnFirstDigest);

            $scope.array[affectedItemIndex - 1] = 'a';
            $scope.$digest();
            expect(watchExecutions).equals(stopsAfterLastDirtyWatchIsClean);

        });

        it('should not end $digest when a new watcher is added', () => {

            $scope.aValue = 'abc';

            $scope.$watch(
                scope => scope.aValue,
                (newValue, oldValue, scope) =>
                    $scope.$watch(
                        () => scope.aValue,
                        listenerFn
                    )
            );

            $scope.$digest();
            sinon.assert.calledOnce(listenerFn);

        });

        it('should watch value if enabled in addition to reference for complex data', () => {

            $scope.aValue = [0, 1, 2];

            $scope.$watch(
                scope => scope.aValue,
                listenerFn,
                true
            );

            $scope.$digest();
            sinon.assert.calledOnce(listenerFn);

            $scope.aValue.push(1);
            $scope.$digest();
            sinon.assert.calledTwice(listenerFn);

        });

        it('should $digest its children', () => {

            const child = $scope.$new();

            $scope.aValue = 'abc';
            child.$watch(
                watchFn.returns($scope.aValue),
                (newValue, oldValue, scope) => scope.aValueWas = newValue
            );

            $scope.$digest();
            expect(child.aValueWas).equals('abc');

        });

        it('should $digest its isolated children', () => {

            const child = $scope.$new(true);

            $scope.aValue = 'abc';
            child.$watch(
                watchFn.returns($scope.aValue),
                (newValue, oldValue, scope) => scope.aValueWas = newValue
            );

            $scope.$digest();
            expect(child.aValueWas).equals('abc');

        });

        describe('quirks', () => {

            it('should watch for the values with NaN', () => {

                $scope.number = NaN;

                $scope.$watch(
                    scope => scope.number,
                    listenerFn
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

            });

        });

        describe('exceptions', () => {

            it('should throw INFINITE_DIGESTION after 10 iterations of dirty watchers', () => {

                $scope.counterA = 0;
                $scope.counterB = 0;

                $scope.$watch(
                    scope => scope.counterA,
                    (newValue, oldValue, scope) => scope.counterB += 1
                );

                $scope.$watch(
                    scope => scope.counterB,
                    (newValue, oldValue, scope) => scope.counterA += 1
                );

                expect(() => $scope.$digest()).throw(literals.INFINITE_DIGESTION);

            });

            it('should log the error and continue $digesting after an exception in watch function', () => {

                $scope.aValue = 'abc';

                $scope.$watch(watchFn.throws(error));
                $scope.$watch(
                    scope => scope.aValue,
                    listenerFn
                );

                $scope.$digest();

                sinon.assert.calledTwice(logger.log);
                sinon.assert.calledWithExactly(logger.log, 'error', error);

                sinon.assert.calledOnce(listenerFn);

            });

            it('should log the error and continue $digesting after an exception in listener function', () => {

                $scope.aValue = 'abc';

                $scope.$watch(
                    scope => scope.aValue,
                    sandbox.stub().throws(error)
                );
                $scope.$watch(
                    scope => scope.aValue,
                    listenerFn
                );

                $scope.$digest();

                sinon.assert.calledOnce(logger.log);
                sinon.assert.calledWithExactly(logger.log, 'error', error);

                sinon.assert.calledOnce(listenerFn);

            });

        });

        describe('destroying watchers', () => {

            it('should destroy the watcher with a removal function', () => {

                $scope.aValue = 'abc';

                const destroyWatch = $scope.$watch(
                    scope => scope.aValue,
                    listenerFn
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                $scope.aValue = 'def';
                $scope.$digest();
                sinon.assert.calledTwice(listenerFn);

                $scope.aValue = 'ghi';
                destroyWatch();
                $scope.$digest();
                sinon.assert.calledTwice(listenerFn);

            });

            it('should not throw when removal function is called multiple times', () => {

                $scope.aValue = 'abc';

                const destroyWatch = $scope.$watch(
                    scope => scope.aValue,
                    listenerFn
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                $scope.aValue = 'ghi';

                destroyWatch();
                destroyWatch();

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

            });

            it('should allow destroying a watcher during $digest', () => {

                $scope.aValue = 'abc';

                const watchCalls = [];

                $scope.$watch(scope => {

                    watchCalls.push('first');
                    return scope.aValue;

                });

                const destroyWatch = $scope.$watch(() => {

                    watchCalls.push('second');
                    destroyWatch();

                });

                $scope.$watch(scope => {

                    watchCalls.push('third');
                    return scope.aValue;

                });

                $scope.$digest();
                expect(watchCalls).equals(['first', 'second', 'third', 'first', 'third']);

            });

            it('should allow a watcher to destroy another during $digest', () => {

                let destroyWatch = null;

                $scope.aValue = 'abc';

                $scope.$watch(
                    scope => scope.aValue,
                    () => destroyWatch()
                );

                destroyWatch = $scope.$watch(watchFn);

                $scope.$watch(
                    scope => scope.aValue,
                    listenerFn
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

            });

            it('should allow destroying several $watches during digest', () => {

                $scope.aValue = 'abc';

                let destroyWatch1 = null,
                    destroyWatch2 = null;

                destroyWatch1 = $scope.$watch(() => {

                    destroyWatch1();
                    destroyWatch2();

                });

                destroyWatch2 = $scope.$watch(
                    scope => scope.aValue,
                    listenerFn
                );

                $scope.$digest();
                sinon.assert.notCalled(listenerFn);

            });

        });

    });

    describe('$eval', () => {

        it('should evaluate given function and return result', () => {

            const aValue = 123;

            $scope.aValue = aValue;

            const result = $scope.$eval(scope => scope.aValue);

            expect(result).equals(aValue);

        });

        it('should evaluate given function with given args', () => {

            $scope.aValue = 123;

            const args = 456;
            const result = $scope.$eval((scope, arg) => scope.aValue + arg, args);
            const expectedResult = 579;

            expect(result).equals(expectedResult);

        });

    });

    describe('$apply', () => {

        it('should apply given function and start $digest', () => {

            $scope.aValue = '123';

            $scope.$watch(
                scope => scope.aValue,
                listenerFn
            );

            $scope.$digest();
            sinon.assert.calledOnce(listenerFn);

            $scope.$apply(scope => scope.aValue = '456');
            sinon.assert.calledTwice(listenerFn);

        });

        it('should apply given function from $root', () => {

            const child = $scope.$new();
            const grandchild = child.$new();

            $scope.$watch(
                watchFn,
                listenerFn
            );

            grandchild.$apply(() => {});
            sinon.assert.calledOnce(listenerFn);

        });

        it('should apply given function from isolated $root', () => {

            const child = $scope.$new(true);
            const grandchild = child.$new();

            $scope.$watch(
                watchFn,
                listenerFn
            );

            grandchild.$apply(() => {});
            sinon.assert.calledOnce(listenerFn);

        });

    });

    describe('$evalAsync', () => {

        it('should store given function in queue and evaluate it later in the same $digest', () => {

            $scope.aValue = [1, 2];
            $scope.asyncEval = false;
            $scope.asyncEvalImmediate = false;

            $scope.$watch(
                scope => scope.aValue,
                (newValue, oldValue, scope) => {

                    scope.$evalAsync(() => scope.asyncEval = true);
                    scope.asyncEvalImmediate = scope.asyncEval;

                }
            );

            $scope.$digest();
            expect($scope.asyncEval).true();
            expect($scope.asyncEvalImmediate).false();

        });

        it('should evaluate given function with given args', () => {

            $scope.aValue = 123;

            const args = 456;
            const expectedResult = 579;

            $scope.$evalAsync((scope, arg) => scope.aValue += arg, args);

            $scope.$digest();
            expect($scope.aValue).equals(expectedResult);

        });

        it('should evaluate given async function from a watch function', () => {

            $scope.aValue = [1, 2];
            $scope.asyncEval = false;

            $scope.$watch(
                scope => {

                    if (!scope.asyncEval) {

                        scope.$evalAsync(() => scope.asyncEval = true);

                    }

                    return scope.aValue;

                }
            );

            $scope.$digest();
            expect($scope.asyncEval).true();

        });

        it('should evaluate given async function from a watch function even when not dirty', () => {

            $scope.aValue = [1, 2];

            $scope.$watch(
                scope => {

                    if (watchFn.callCount < 2) {

                        scope.$evalAsync(watchFn);

                    }

                    return scope.aValue;

                }
            );

            $scope.$digest();
            sinon.assert.calledTwice(watchFn);

        });

        it('should eventually exhaust queued async functions from a watch function', () => {

            $scope.aValue = [1, 2];

            $scope.$watch(
                scope => {

                    scope.$evalAsync(watchFn);

                    return scope.aValue;

                }
            );

            expect(() => $scope.$digest()).throw(literals.INFINITE_DIGESTION);

        });

        it('should schedule a $digest', done => {

            $scope.aValue = 'abc';

            $scope.$watch(
                scope => scope.aValue,
                listenerFn
            );

            $scope.$evalAsync(watchFn);

            sinon.assert.notCalled(listenerFn);

            setTimeout(() => {

                sinon.assert.calledOnce(listenerFn);
                done();

            }, delay);

        });

        it('should schedule a $digest from $root', done => {

            const child = $scope.$new();
            const grandchild = child.$new();

            $scope.$watch(
                watchFn,
                listenerFn
            );
            grandchild.$evalAsync(() => {});

            setTimeout(() => {

                sinon.assert.calledOnce(listenerFn);
                done();

            }, delay);

        });

        it('should schedule a $digest from isolated $root', done => {

            const child = $scope.$new(true);
            const grandchild = child.$new();

            $scope.$watch(
                watchFn,
                listenerFn
            );
            grandchild.$evalAsync(() => {});

            setTimeout(() => {

                sinon.assert.calledOnce(listenerFn);
                done();

            }, delay);

        });

        it('should evaluate given async functions on isolated children', done => {

            const child = $scope.$new(true);

            child.$evalAsync(listenerFn);

            setTimeout(() => {

                sinon.assert.calledOnce(listenerFn);
                done();

            }, delay);

        });

        describe('exceptions', () => {

            it('should log the error and continue evaluating', done => {

                $scope.$watch(sandbox.stub(), listenerFn);
                $scope.$evalAsync(watchFn.throws(error));

                setTimeout(() => {

                    sinon.assert.calledOnce(logger.log);
                    sinon.assert.calledWithExactly(logger.log, 'error', error);

                    sinon.assert.calledOnce(listenerFn);
                    done();

                }, delay);

            });

        });

    });

    describe('$applyAsync', () => {

        it('should apply function asynchronously', done => {

            $scope.$watch(
                scope => scope.aValue,
                listenerFn
            );

            $scope.$digest();
            sinon.assert.calledOnce(listenerFn);

            $scope.$applyAsync(scope => scope.aValue = 'abc');
            sinon.assert.calledOnce(listenerFn);

            setTimeout(() => {

                sinon.assert.calledTwice(listenerFn);
                done();

            }, delay);

        });

        it('should not apply async function in the same $digest', done => {

            $scope.aValue = [1, 2];
            $scope.asyncApplied = false;

            $scope.$watch(
                scope => scope.aValue,
                (newValue, oldValue, scope) =>
                    scope.$applyAsync(() => scope.asyncApplied = true)
            );

            $scope.$digest();
            expect($scope.asyncApplied).false();

            setTimeout(() => {

                expect($scope.asyncApplied).true();
                done();

            }, delay);

        });

        it('should coalesce all async functions', done => {

            $scope.$watch(watchFn.returns($scope.aValue));

            $scope.$applyAsync(scope => scope.aValue = 'abc');
            $scope.$applyAsync(scope => scope.aValue = 'def');

            setTimeout(() => {

                sinon.assert.calledTwice(watchFn);
                done();

            }, delay);

        });

        it('should cancel and flush async queue if a $digest is triggered', done => {

            $scope.$watch(watchFn.returns($scope.aValue));

            $scope.$applyAsync(scope => scope.aValue = 'abc');
            $scope.$applyAsync(scope => scope.aValue = 'def');

            $scope.$digest();
            sinon.assert.calledTwice(watchFn);
            expect($scope.aValue).equals('def');

            setTimeout(() => {

                sinon.assert.calledTwice(watchFn);
                done();

            }, delay);

        });

        it('should apply async function in isolated children', () => {

            const child = $scope.$new(true);

            $scope.$applyAsync(listenerFn);

            child.$digest();
            sinon.assert.calledOnce(listenerFn);

        });

        describe('exceptions', () => {

            it('should log the error and continue applying functions', done => {

                $scope.$applyAsync(sandbox.stub().throws(error));
                $scope.$applyAsync(sandbox.stub().throws(error));

                $scope.$applyAsync(scope => scope.applied = true);

                setTimeout(() => {

                    sinon.assert.calledTwice(logger.log);
                    sinon.assert.calledWithExactly(logger.log, 'error', error);

                    expect($scope.applied).true();
                    done();

                }, delay);

            });

        });

    });

    describe('phase', () => {

        let phase = null;

        it('should be $digest when in watch function', () => {

            $scope.$watch(
                scope => phase = scope.$$phase
            );

            $scope.$digest();
            expect(phase).equals('$digest');

        });

        it('should be $digest when in listener function', () => {

            $scope.$watch(
                watchFn,
                (newValue, oldValue, scope) => phase = scope.$$phase
            );

            $scope.$digest();
            expect(phase).equals('$digest');

        });

        it('should be $apply when in apply function', () => {

            $scope.$apply(scope => phase = scope.$$phase);

            expect(phase).equals('$apply');

        });

        it('should throw PHASE_ALREADY_IN_PROGRESS if already in a phase', () => {

            expect(() => $scope.$apply(scope => scope.$digest())).throw(`$apply ${literals.PHASE_ALREADY_IN_PROGRESS}`);

        });

    });

    describe('$watchGroup', () => {

        it('should take array of watch functions and call listener function once for all changes', () => {

            $scope.$watchGroup(
                [
                    () => 1,
                    () => 2
                ],
                listenerFn
            );

            $scope.$digest();
            sinon.assert.calledOnce(listenerFn);
            sinon.assert.calledWithExactly(listenerFn, [1, 2], [1, 2], $scope);

        });

        it('should call the listener function with new and old values', () => {

            const three = 3;

            $scope.aValue = 1;
            $scope.$watchGroup(
                [
                    () => $scope.aValue,
                    () => 2
                ],
                listenerFn
            );

            $scope.$digest();
            sinon.assert.calledOnce(listenerFn);
            sinon.assert.calledWithExactly(listenerFn, [1, 2], [1, 2], $scope);

            listenerFn.reset();
            $scope.aValue = three;

            $scope.$digest();
            sinon.assert.calledOnce(listenerFn);
            sinon.assert.calledWithExactly(listenerFn, [three, 2], [1, 2], $scope);

        });

        it('should call the listener function with new values as old values the first time', () => {

            let newValuesList = null,
                oldValuesList = null;

            $scope.$watchGroup(
                [
                    () => 1,
                    () => 2
                ],
                (newValues, oldValues) => {

                    newValuesList = newValues;
                    oldValuesList = oldValues;

                }
            );

            $scope.$digest();
            expect(newValuesList).shallow.equals(oldValuesList);

        });

        it('should be able to be destroyed on calling the return function', () => {

            const destroy = $scope.$watchGroup([() => $scope.aValue], listenerFn);

            $scope.$digest();
            sinon.assert.calledOnce(listenerFn);

            $scope.aValue = 1;
            destroy();

            $scope.$digest();
            sinon.assert.calledOnce(listenerFn);

        });

        describe('quirks', () => {

            it('should call the listener function once when the group is empty', () => {

                $scope.$watchGroup([], listenerFn);

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);
                sinon.assert.calledWithExactly(listenerFn, [], [], $scope);

            });

            it('should not call listener of empty group when destroyed first', () => {

                const destroy = $scope.$watchGroup([], listenerFn);

                destroy();

                $scope.$digest();
                sinon.assert.notCalled(listenerFn);

            });

        });

    });

    describe('$watchCollection', () => {

        describe('watching primitive values', () => {

            it('should fall back to $watch', () => {

                $scope.aValue = 'abc';

                $scope.$watchCollection(
                    () => $scope.aValue,
                    listenerFn = sandbox.spy(newValue => $scope.newValue = newValue)
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);
                expect($scope.newValue).equals($scope.aValue);

                $scope.aValue = 'def';
                listenerFn.reset();
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                listenerFn.reset();
                $scope.$digest();
                sinon.assert.notCalled(listenerFn);

            });

            it('should watch for NaNs', () => {

                $scope.$watchCollection(
                    watchFn.returns(NaN),
                    listenerFn
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

            });

            it('should detect becoming an array', () => {

                $scope.$watchCollection(
                    () => $scope.array,
                    listenerFn
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                $scope.array = [1, 2];
                listenerFn.reset();
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                listenerFn.reset();
                $scope.$digest();
                sinon.assert.notCalled(listenerFn);

            });

            it('should detect becoming an object', () => {

                $scope.$watchCollection(
                    () => $scope.object,
                    listenerFn
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                $scope.object = {
                    prop: 'test'
                };
                listenerFn.reset();
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                listenerFn.reset();
                $scope.$digest();
                sinon.assert.notCalled(listenerFn);

            });

            it('should call listener function with old value when required', () => {

                $scope.aValue = 0;

                $scope.$watchCollection(
                    () => $scope.aValue,
                    listenerFn = sandbox.spy((newValue, oldValue) => $scope.oldValue = oldValue)
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);
                sinon.assert.calledWithExactly(listenerFn, 0, undefined, $scope);

                $scope.aValue = 1;
                listenerFn.reset();
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);
                sinon.assert.calledWithExactly(listenerFn, 1, 0, $scope);

            });

            it('should not call listener function with old value when not required', () => {

                $scope.aValue = 0;

                $scope.$watchCollection(
                    () => $scope.aValue,
                    listenerFn
                );

                $scope.$digest();

                $scope.aValue = 1;
                listenerFn.reset();
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);
                sinon.assert.calledWithExactly(listenerFn, 1, undefined, $scope);

            });

        });

        describe('watching arrays', () => {

            it('should detect adding or removing values', () => {

                $scope.array = [1, 2];

                $scope.$watchCollection(
                    () => $scope.array,
                    listenerFn
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                $scope.array.push(1);
                listenerFn.reset();
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                listenerFn.reset();
                $scope.array.shift(1);
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                listenerFn.reset();
                $scope.$digest();
                sinon.assert.notCalled(listenerFn);

            });

            it('should watch for NaNs', () => {

                $scope.array = [1, NaN, 2];

                $scope.$watchCollection(
                    () => $scope.array,
                    listenerFn
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

            });

            it('should call listener function with old value when required', () => {

                $scope.array = [1];

                $scope.$watchCollection(
                    () => $scope.array,
                    listenerFn = sandbox.spy((newValue, oldValue) => $scope.oldValue = oldValue)
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);
                sinon.assert.calledWithExactly(listenerFn, [1], undefined, $scope);

                $scope.array.push(2);
                listenerFn.reset();
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);
                sinon.assert.calledWithExactly(listenerFn, [1, 2], [1], $scope);

            });

            it('should not call listener function with old value when not required', () => {

                $scope.array = [1];

                $scope.$watchCollection(
                    () => $scope.array,
                    listenerFn
                );

                $scope.$digest();

                $scope.array.push(2);
                listenerFn.reset();
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);
                sinon.assert.calledWithExactly(listenerFn, [1, 2], undefined, $scope);

            });

        });

        describe('watching array like objects', () => {

            it('should detect changed values', () => {

                $scope.arrayLike = {
                    0: 1,
                    1: 2,
                    length: 2
                };

                $scope.$watchCollection(
                    () => $scope.arrayLike,
                    listenerFn
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                $scope.arrayLike[1] = 0;
                listenerFn.reset();
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                listenerFn.reset();
                $scope.$digest();
                sinon.assert.notCalled(listenerFn);

            });

            it('should not consider any object with length as an array', () => {

                $scope.object = {
                    length: 2
                };

                $scope.$watchCollection(
                    () => $scope.object,
                    listenerFn
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                $scope.object.prop = 'test';
                listenerFn.reset();
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                listenerFn.reset();
                $scope.$digest();
                sinon.assert.notCalled(listenerFn);

            });

        });

        describe('watching objects', () => {

            it('should detect adding or changing or removing properties', () => {

                $scope.object = {
                    prop: 'test'
                };

                $scope.$watchCollection(
                    () => $scope.object,
                    listenerFn
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                $scope.object.anotherProp = 1;
                listenerFn.reset();
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                listenerFn.reset();
                $scope.object.anotherProp = 2;
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                listenerFn.reset();
                delete $scope.object.anotherProp;
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                listenerFn.reset();
                $scope.$digest();
                sinon.assert.notCalled(listenerFn);

            });

            it('should watch for NaNs', () => {

                $scope.object = {
                    prop: NaN
                };

                $scope.$watchCollection(
                    () => $scope.object,
                    listenerFn
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

            });

            it('should call listener function with old value when required', () => {

                $scope.object = {a: 1};

                $scope.$watchCollection(
                    () => $scope.object,
                    listenerFn = sandbox.spy((newValue, oldValue) => $scope.oldValue = oldValue)
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);
                sinon.assert.calledWithExactly(listenerFn, {a: 1}, undefined, $scope);

                $scope.object.b = 2;
                listenerFn.reset();
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);
                sinon.assert.calledWithExactly(listenerFn, {
                    a: 1,
                    b: 2
                }, {a: 1}, $scope);

            });

            it('should not call listener function with old value when not required', () => {

                $scope.object = {a: 1};

                $scope.$watchCollection(
                    () => $scope.object,
                    listenerFn
                );

                $scope.$digest();

                $scope.object.b = 2;
                listenerFn.reset();
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);
                sinon.assert.calledWithExactly(listenerFn, {
                    a: 1,
                    b: 2
                }, undefined, $scope);

            });

            it('should detect only shallow changes', () => {

                $scope.object = {};

                $scope.$watchCollection(
                    () => $scope.object,
                    listenerFn
                );

                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                $scope.object.child = {prop: 1};
                listenerFn.reset();
                $scope.$digest();
                sinon.assert.calledOnce(listenerFn);

                $scope.object.child.prop = 2;
                listenerFn.reset();
                $scope.$digest();
                sinon.assert.notCalled(listenerFn);

            });

        });

    });

    describe('child scope', () => {

        it('should be constructed with parent properties', () => {

            $scope.aValue = [1, 2];

            const child = $scope.$new();

            expect(child.aValue).equals([1, 2]);

        });

        it('should be able to put properties on parent', () => {

            const child = $scope.$new();

            child.aValue = [1, 2];

            expect($scope.aValue).undefined();

        });

        it('should reflect new parent properties', () => {

            const child = $scope.$new();

            $scope.aValue = [1, 2];

            expect(child.aValue).equals([1, 2]);

        });

        it('should be able to manipulate parent', () => {

            $scope.aValue = [1, 2];

            const child = $scope.$new();

            child.aValue.push(0);

            expect(child.aValue).equals([1, 2, 0]);
            expect($scope.aValue).equals([1, 2, 0]);

        });

        it('should be able to watch parent properties', () => {

            const child = $scope.$new();

            $scope.aValue = [1, 2];

            child.$watch(
                () => $scope.aValue,
                listenerFn,
                true
            );

            child.$digest();
            sinon.assert.calledOnce(listenerFn);

            $scope.aValue.push(0);
            listenerFn.reset();

            child.$digest();
            sinon.assert.calledOnce(listenerFn);

        });

        it('should nest to any depth without affecting siblings', () => {

            const a = new Scope();

            const aa = a.$new();
            const aaa = aa.$new();
            const aab = aa.$new();

            const ab = a.$new();
            const abb = ab.$new();

            a.aValue = 1;

            expect(aa.aValue).equals(1);
            expect(aaa.aValue).equals(1);
            expect(aab.aValue).equals(1);

            expect(ab.aValue).equals(1);
            expect(abb.aValue).equals(1);

            ab.bValue = 2;

            expect(abb.bValue).equals(2);
            expect(aa.bValue).undefined();
            expect(aaa.bValue).undefined();

        });

        it('should be able to shadow parent properties', () => {

            const child = $scope.$new();

            $scope.name = 'John';
            child.name = 'Doe';

            expect(child.name).equals('Doe');
            expect($scope.name).equals('John');

        });

        it('should not shadow members of parent properties', () => {

            const child = $scope.$new();

            $scope.user = {name: 'John'};
            child.user.name = 'Doe';

            expect(child.user.name).equals('Doe');
            expect($scope.user.name).equals('Doe');

        });

        it('should not $digest its parent(s)', () => {

            const child = $scope.$new();

            $scope.$watch(
                watchFn,
                (newValue, oldValue, scope) => scope.aValue = newValue
            );

            child.$digest();
            expect(child.aValue).undefined();

        });

        it('should allow some other scope as the parent', function () {

            const prototypeParent = new Scope();
            const hierarchyParent = new Scope();

            const child = prototypeParent.$new(false, hierarchyParent);

            prototypeParent.aValue = 1;
            expect(child.aValue).equals(1);

            child.$watch(watchFn);

            prototypeParent.$digest();
            sinon.assert.notCalled(watchFn);

            hierarchyParent.$digest();
            sinon.assert.calledTwice(watchFn);

        });

    });

    describe('isolated scope', () => {

        it('should be constructed without parent properties', () => {

            $scope.aValue = 'abc';

            const child = $scope.$new(true);

            expect(child.aValue).undefined();

        });

        it('should not be able to watch parent properties', () => {

            const child = $scope.$new(true);

            $scope.aValue = 'abc';

            child.$watch(
                $child => $child.aValue,
                (newValue, oldValue, scope) => scope.aValueWas = newValue
            );

            child.$digest();
            expect(child.aValueWas).undefined();

        });

        it('should allow some other scope as the parent', function () {

            const prototypeParent = new Scope();
            const hierarchyParent = new Scope();

            const child = prototypeParent.$new(true, hierarchyParent);

            child.$watch(watchFn);

            prototypeParent.$digest();
            sinon.assert.notCalled(watchFn);

            hierarchyParent.$digest();
            sinon.assert.calledTwice(watchFn);

        });

    });

    describe('$destroy', () => {

        it('should remove all watchers', () => {

            $scope.$watch(watchFn);

            $scope.$destroy();
            $scope.$digest();
            sinon.assert.notCalled(watchFn);

        });

        it('should remove all collection watchers', () => {

            $scope.$watchCollection(watchFn);

            $scope.$destroy();
            $scope.$digest();
            sinon.assert.notCalled(watchFn);

        });

        it('should not throw when called multiple times', () => {

            const child = $scope.$new();

            child.$watch(watchFn, listenerFn);

            $scope.$digest();
            sinon.assert.calledOnce(listenerFn);

            child.$destroy();
            child.$destroy();

            listenerFn.reset();
            $scope.$digest();
            sinon.assert.notCalled(listenerFn);

        });

        it('should remove itself from its parent', () => {

            const child = $scope.$new();

            child.aValue = [1, 2];

            child.$watch(
                $child => $child.aValue,
                listenerFn,
                true
            );

            $scope.$digest();
            sinon.assert.calledOnce(listenerFn);

            child.aValue.push(1);
            $scope.$digest();
            sinon.assert.calledTwice(listenerFn);

            child.$destroy();
            child.aValue.push(0);
            $scope.$digest();
            sinon.assert.calledTwice(listenerFn);

        });

    });

    describe('events', () => {

        ['$emit', '$broadcast'].forEach(method => {

            it(`should call all the listeners on ${method}`, () => {

                const listenerFn2 = sandbox.stub();
                const listenerFn3 = sandbox.stub();

                $scope.$on('someEvent', listenerFn);
                $scope.$on('someEvent', listenerFn2);

                $scope.$on('someOtherEvent', listenerFn3);

                $scope[method]('someEvent');

                sinon.assert.calledOnce(listenerFn);
                sinon.assert.calledOnce(listenerFn2);

                sinon.assert.notCalled(listenerFn3);

            });

            it('should only call the listeners matching the event name', () => {

                $scope.$on('someEvent', listenerFn);

                $scope[method]('someOtherEvent');

                sinon.assert.notCalled(listenerFn);

            });

            it('should pass event object to the listeners', () => {

                $scope.$on('someEvent', listenerFn);

                $scope[method]('someEvent');

                sinon.assert.calledOnce(listenerFn);
                sinon.assert.calledWithExactly(listenerFn, {name: 'someEvent'});

            });

            it('should pass on additional arguments', () => {

                $scope.$on('someEvent', listenerFn);

                $scope[method]('someEvent', 1, 2);

                sinon.assert.calledOnce(listenerFn);
                sinon.assert.calledWithExactly(listenerFn, {name: 'someEvent'}, 1, 2);

            });

            it('should return an $event object', () => {

                $scope.$on('someEvent', listenerFn);

                const $event = $scope[method]('someEvent');

                expect($event).equals({name: 'someEvent'});

            });

        });

    });

});
