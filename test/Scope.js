import * as logger from '../src/logger';
import Scope from '../src/Scope';
import {expect} from 'code';
import literals from '../src/literals';
import sinon from 'sinon';

describe('Scope', () => {

    const delay = 50;
    let $scope,
        sandbox;

    beforeEach(() => {

        $scope = new Scope();
        sandbox = sinon.sandbox.create();

    });

    afterEach(() => sandbox.restore());

    it('should be constructed and used as an object', () => {

        $scope.aProperty = 1;

        expect($scope.aProperty).equals(1);

    });

    describe('$digest', () => {

        let listenerFn,
            watchFn;

        beforeEach(() => {

            listenerFn = sandbox.stub();
            watchFn = sandbox.stub();

        });

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
            $scope.counter = 0;

            $scope.$watch(
                scope => scope.someValue,
                (newValue, oldValue, scope) => scope.counter += 1
            );

            expect($scope.counter).equals(0);

            $scope.$digest();
            expect($scope.counter).equals(1);

            $scope.$digest();
            expect($scope.counter).equals(1);

            $scope.someValue = 'b';
            expect($scope.counter).equals(1);

            $scope.$digest();
            expect($scope.counter).equals(2);

        });

        it('should call the listener function when watch value is first undefined', () => {

            $scope.counter = 0;

            $scope.$watch(
                scope => scope.someValue,
                (newValue, oldValue, scope) => scope.counter += 1
            );

            $scope.$digest();

            expect($scope.counter).equals(1);

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
            $scope.counter = 0;

            $scope.$watch(
                scope => scope.aValue,
                (newValue, oldValue, scope) =>
                    $scope.$watch(
                        () => scope.aValue,
                        () => scope.counter += 1
                    )
            );

            $scope.$digest();
            expect($scope.counter).equals(1);

        });

        it('should watch value if enabled in addition to reference for complex data', () => {

            $scope.aValue = [0, 1, 2];
            $scope.counter = 0;

            $scope.$watch(
                scope => scope.aValue,
                (newValue, oldValue, scope) => scope.counter += 1,
                true
            );

            $scope.$digest();
            expect($scope.counter).equals(1);

            $scope.aValue.push(1);
            $scope.$digest();
            expect($scope.counter).equals(2);

        });

        describe('quirks', () => {

            it('should watch for the values with NaN', () => {

                $scope.number = NaN;
                $scope.counter = 0;

                $scope.$watch(
                    scope => scope.number,
                    (newValue, oldValue, scope) => scope.counter += 1
                );

                $scope.$digest();
                expect($scope.counter).equals(1);

                $scope.$digest();
                expect($scope.counter).equals(1);

            });

        });

        describe('exceptions', () => {

            const error = new Error('error');

            beforeEach(() => {

                sandbox.stub(logger, 'log');

            });

            it('should log the error and continue $digesting after an exception in watch function', () => {

                $scope.aValue = 'abc';
                $scope.counter = 0;

                $scope.$watch(
                    () => {

                        throw error;

                    }
                );
                $scope.$watch(
                    scope => scope.aValue,
                    (newValue, oldValue, scope) => scope.counter += 1
                );

                $scope.$digest();

                sinon.assert.called(logger.log);
                sinon.assert.calledWithExactly(logger.log, 'error', error);

                expect($scope.counter).equals(1);

            });

            it('should log the error and continue $digesting after an exception in listener function', () => {

                $scope.aValue = 'abc';
                $scope.counter = 0;

                $scope.$watch(
                    scope => scope.aValue,
                    () => {

                        throw error;

                    }
                );
                $scope.$watch(
                    scope => scope.aValue,
                    (newValue, oldValue, scope) => scope.counter += 1
                );

                $scope.$digest();

                sinon.assert.calledOnce(logger.log);
                sinon.assert.calledWithExactly(logger.log, 'error', error);

                expect($scope.counter).equals(1);

            });

        });

        describe('destroying watchers', () => {

            it('should destroy the watcher with a removal function', () => {

                $scope.aValue = 'abc';
                $scope.counter = 0;

                const destroyWatch = $scope.$watch(
                    scope => scope.aValue,
                    (newValue, oldValue, scope) => scope.counter += 1
                );

                $scope.$digest();
                expect($scope.counter).equals(1);

                $scope.aValue = 'def';
                $scope.$digest();
                expect($scope.counter).equals(2);

                $scope.aValue = 'ghi';
                destroyWatch();
                $scope.$digest();
                expect($scope.counter).equals(2);

            });

            it('should not throw when removal function is called multiple times', () => {

                $scope.aValue = 'abc';
                $scope.counter = 0;

                const destroyWatch = $scope.$watch(
                    scope => scope.aValue,
                    (newValue, oldValue, scope) => scope.counter += 1
                );

                $scope.$digest();
                expect($scope.counter).equals(1);

                $scope.aValue = 'ghi';

                destroyWatch();
                destroyWatch();

                $scope.$digest();
                expect($scope.counter).equals(1);

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

                $scope.aValue = 'abc';
                $scope.counter = 0;

                let destroyWatch = null;

                $scope.$watch(
                    scope => scope.aValue,
                    () => destroyWatch()
                );

                destroyWatch = $scope.$watch(() => {});

                $scope.$watch(
                    scope => scope.aValue,
                    (newValue, oldValue, scope) => scope.counter += 1
                );

                $scope.$digest();
                expect($scope.counter).equals(1);

            });

            it('should allow destroying several $watches during digest', function () {

                $scope.aValue = 'abc';
                $scope.counter = 0;

                let destroyWatch1 = null,
                    destroyWatch2 = null;

                destroyWatch1 = $scope.$watch(() => {

                    destroyWatch1();
                    destroyWatch2();

                });

                destroyWatch2 = $scope.$watch(
                    scope => scope.aValue,
                    (newValue, oldValue, scope) => scope.counter += 1
                );

                $scope.$digest();
                expect($scope.counter).equals(0);

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
            $scope.counter = 0;

            $scope.$watch(
                scope => scope.aValue,
                (newValue, oldValue, scope) => scope.counter += 1
            );

            $scope.$digest();
            expect($scope.counter).equals(1);

            $scope.$apply(scope => scope.aValue = '456');
            expect($scope.counter).equals(2);

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
            $scope.asyncEval = 0;

            $scope.$watch(
                scope => {

                    if (scope.asyncEval < 2) {

                        scope.$evalAsync(() => scope.asyncEval += 1);

                    }

                    return scope.aValue;

                }
            );

            $scope.$digest();
            expect($scope.asyncEval).equals(2);

        });

        it('should eventually exhaust queued async functions from a watch function', () => {

            $scope.aValue = [1, 2];
            $scope.asyncEval = 0;

            $scope.$watch(
                scope => {

                    scope.$evalAsync(() => {});

                    return scope.aValue;

                }
            );

            expect(() => $scope.$digest()).throw(literals.INFINITE_DIGESTION);

        });

        it('should schedule a $digest', done => {

            $scope.aValue = 'abc';
            $scope.counter = 0;

            $scope.$watch(
                scope => scope.aValue,
                (newValue, oldValue, scope) => scope.counter += 1
            );
            $scope.$evalAsync(() => { });

            expect($scope.counter).equals(0);

            setTimeout(() => {

                expect($scope.counter).equals(1);
                done();

            }, delay);

        });

    });

    describe('$applyAsync', () => {

        it('should apply function asynchronously', done => {

            $scope.counter = 0;

            $scope.$watch(
                scope => scope.aValue,
                (newValue, oldValue, scope) => scope.counter += 1
            );

            $scope.$digest();
            expect($scope.counter).equals(1);

            $scope.$applyAsync(scope => scope.aValue = 'abc');
            expect($scope.counter).equals(1);

            setTimeout(() => {

                expect($scope.counter).equals(2);
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

        it('should coalesce all async functions', function (done) {

            $scope.counter = 0;

            $scope.$watch(
                scope => {

                    scope.counter += 1;
                    return scope.aValue;

                }
            );

            $scope.$applyAsync(scope => scope.aValue = 'abc');
            $scope.$applyAsync(scope => scope.aValue = 'def');

            setTimeout(() => {

                expect($scope.counter).equals(2);
                done();

            }, delay);

        });

        it('should cancel and flush async queue if a $digest is triggered', done => {

            $scope.counter = 0;

            $scope.$watch(
                scope => {

                    scope.counter += 1;
                    return $scope.aValue;

                }
            );
            $scope.$applyAsync(scope => scope.aValue = 'abc');
            $scope.$applyAsync(scope => scope.aValue = 'def');

            $scope.$digest();
            expect($scope.counter).equals(2);
            expect($scope.aValue).equals('def');

            setTimeout(() => {

                expect($scope.counter).equals(2);
                done();

            }, delay);

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
                () => {},
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

});
