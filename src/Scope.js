import {cloneDeep, forEachRight, isArray, isEqual, isObject} from 'lodash';
import literals from './literals';
import {log} from './logger';

const $$applyAsyncId = new WeakMap();
const $$applyAsyncQueue = new WeakMap();
const $$children = new WeakMap();
const $$evalAsyncQueue = new WeakMap();
const $$initialWatchValue = Symbol.for('$$initialWatchValue');
const $$lastDirtyWatch = new WeakMap();
const $$phase = new WeakMap();
const $$watchers = new WeakMap();

function initialize($scope) {

    $$applyAsyncId.set($scope.$root, null);
    $$applyAsyncQueue.set($scope, []);
    $$children.set($scope, []);
    $$evalAsyncQueue.set($scope, []);
    $$lastDirtyWatch.set($scope.$root, null);
    $$watchers.set($scope, []);

    Scope.$$clearPhase($scope);

}

export default class Scope {

    get $$phase() {

        return $$phase.get(this);

    }

    static $$areEqual(newValue, oldValue, compareValues) {

        return compareValues ?
            isEqual(newValue, oldValue) :
        newValue === oldValue || Scope.testNaN(newValue, oldValue);

    }

    static $$beginPhase($scope, phase) {

        if ($scope.$$phase) {

            throw new Error(`${$scope.$$phase} ${literals.PHASE_ALREADY_IN_PROGRESS}`);

        }

        $$phase.set($scope, phase);

    }

    static $$clearPhase($scope) {

        $$phase.set($scope, null);

    }

    static $$digestOnce($root) {

        let continueDigest = true,
            dirty = false;

        Scope.$$everyScope($root, $scope => {

            forEachRight($$watchers.get($scope), watcher => { // eslint-disable-line complexity

                if (!watcher) {

                    return true;

                }

                try {

                    const {compareValues} = watcher;
                    const newValue = watcher.watchFn($scope);
                    const oldValue = watcher.last;

                    if (!Scope.$$areEqual(newValue, oldValue, compareValues)) {

                        $$lastDirtyWatch.set($scope.$root, watcher);

                        watcher.last = Scope.copyValue(newValue, compareValues);
                        watcher.listenerFn(
                            newValue,
                            Scope.getOldValue(newValue, oldValue),
                            $scope
                        );

                        dirty = true;

                    } else if ($$lastDirtyWatch.get($scope.$root) === watcher) {

                        continueDigest = false;

                        return false;

                    }

                } catch (error) {

                    log('error', error);

                }

                return true;

            });

            return continueDigest;

        });

        return dirty;

    }

    static $$everyScope($scope, execFn) {

        return execFn($scope) ? $$children.get($scope).every(
            child => Scope.$$everyScope(child, execFn)
        ) : false;

    }

    static $$flushApplyAsync($scope) {

        const applyAsyncId = $$applyAsyncId.get($scope.$root);

        if (applyAsyncId) {

            clearTimeout(applyAsyncId);

            Scope.executeApplyQueue($scope);

        }

    }

    static $$flushEvalAsync($scope) {

        const asyncQueue = $$evalAsyncQueue.get($scope);

        while (asyncQueue.length) {

            try {

                const asyncTask = asyncQueue.shift();

                asyncTask.scope.$eval(asyncTask.evalFn, ...asyncTask.args);

            } catch (error) {

                log('error', error);

            }

        }

    }

    static checkForInfiniteDigestion($scope, dirty, iterations) {

        if (dirty && !iterations) {

            Scope.$$clearPhase($scope);

            throw new Error(literals.INFINITE_DIGESTION);

        }

    }

    static copyValue(value, shouldClone) {

        return shouldClone ? cloneDeep(value) : value;

    }

    static executeApplyQueue($scope) {

        const applyAsyncQueue = $$applyAsyncQueue.get($scope);

        while (applyAsyncQueue.length) {

            try {

                applyAsyncQueue.shift()();

            } catch (error) {

                log('error', error);

            }

        }

        $$applyAsyncId.set($scope.$root, null);

    }

    static getOldValue(newValue, oldValue) {

        return oldValue === $$initialWatchValue ? newValue : oldValue;

    }

    static isArrayLike(object) {

        if (!object) {

            return false;

        }

        return typeof object.length === 'number';

    }

    static testNaN(newValue, oldValue) {

        return [
            () => typeof newValue === 'number',
            () => typeof oldValue === 'number',
            () => isNaN(newValue),
            () => isNaN(oldValue)
        ].every(condition => condition());

    }

    constructor() {

        this.$root = this;

        initialize(this);

    }

    $apply(...args) {

        try {

            Scope.$$beginPhase(this, '$apply');

            this.$eval(...args);

        } finally {

            Scope.$$clearPhase(this);

            this.$root.$digest();

        }

    }

    $applyAsync(...args) {

        const applyAsyncQueue = $$applyAsyncQueue.get(this);

        applyAsyncQueue.push(() => this.$eval(...args));

        if ($$applyAsyncId.get(this.$root) === null) {

            $$applyAsyncId.set(
                this.$root,
                setTimeout(
                    () => this.$apply(
                        () => Scope.executeApplyQueue(this)
                    )
                )
            );

        }

    }

    $destroy() {

        if (this.$parent) {

            const siblings = $$children.get(this.$parent);
            const index = siblings.indexOf(this);

            if (index >= 0) {

                siblings.splice(index, 1);

            }

        }

        $$watchers.set(this, null);

    }

    $digest() {

        let dirty = false,
            iterations = 10;

        Scope.$$beginPhase(this, '$digest');

        $$lastDirtyWatch.set(this.$root, null);

        Scope.$$flushApplyAsync(this);

        do {

            Scope.$$flushEvalAsync(this);

            dirty = Scope.$$digestOnce(this) || $$evalAsyncQueue.get(this).length;

            Scope.checkForInfiniteDigestion(this, dirty, iterations);

            iterations -= 1;

        } while (dirty);

        Scope.$$clearPhase(this);

    }

    $eval(evalFn, ...args) {

        return evalFn(this, ...args);

    }

    $evalAsync(evalFn, ...args) {

        const asyncQueue = $$evalAsyncQueue.get(this);

        if (!this.$$phase && !asyncQueue.length) {

            setTimeout(() => {

                if (asyncQueue.length) {

                    this.$root.$digest();

                }

            });

        }

        asyncQueue.push({
            args,
            evalFn,
            scope: this
        });

    }

    $new(isolated = false, $parent = this) {

        let $child;

        if (isolated) {

            $child = new Scope();
            $child.$root = $parent.$root;
            $$evalAsyncQueue.set($child, $$evalAsyncQueue.get($parent));
            $$applyAsyncQueue.set($child, $$applyAsyncQueue.get($parent));

        } else {

            class ChildScope {}

            ChildScope.prototype = this;
            $child = new ChildScope();

            initialize($child);

        }

        $$children.get($parent).push($child);

        $child.$parent = $parent;

        return $child;

    }

    $watch(watchFn, listenerFn = (() => {}), compareValues = false) {

        const watcher = {
            compareValues,
            last: $$initialWatchValue,
            listenerFn,
            watchFn
        };

        $$watchers.get(this).unshift(watcher);
        $$lastDirtyWatch.set(this.$root, null);

        return () => {

            const index = $$watchers.get(this).indexOf(watcher);

            if (index >= 0) {

                $$watchers.get(this).splice(index, 1);
                $$lastDirtyWatch.set(this.$root, null);

            }

        };

    }

    $watchCollection(watchFn, listenerFn) {

        let newValue,
            oldValue,
            count = 0;

        const callWatcher = scope => {

            newValue = watchFn(scope);

            if (isObject(newValue)) {

                if (Scope.isArrayLike(newValue)) {

                    if (!isArray(oldValue)) {

                        count += 1;
                        oldValue = [];

                    }

                    if (newValue.length !== oldValue.length) {

                        count += 1;
                        oldValue.length = newValue.length;

                    }

                    Array.from(newValue).forEach((value, index) => {

                        if (!Scope.testNaN(value, oldValue[index]) && value !== oldValue[index]) {

                            count += 1;
                            oldValue[index] = value;

                        }

                    });

                } else {

                }

            } else {

                if (!Scope.$$areEqual(newValue, oldValue, false)) {

                    count += 1;

                }

                oldValue = newValue;

            }

            return count;

        };
        const tellListener = () => {

            listenerFn(newValue, oldValue, this);

        };

        return this.$watch(callWatcher, tellListener);

    }

    $watchGroup(array, listenerFn) {

        const newValues = new Array(array.length);
        const oldValues = new Array(array.length);
        let destroyer,
            firstRun = true,
            scheduleToTellListener = false;

        if (!array.length) {

            let destroyed = false;

            this.$evalAsync(() => {

                if (!destroyed) {

                    listenerFn(newValues, newValues, this);

                }

            });

            destroyer = () => destroyed = true;

        } else {

            const tellListener = () => {

                listenerFn(newValues, firstRun ? newValues : oldValues, this);

                firstRun = false;
                scheduleToTellListener = false;

            };

            const destroyers = array.map(
                (watchFn, index) => this.$watch(
                    watchFn,
                    (newValue, oldValue) => {

                        newValues[index] = newValue;
                        oldValues[index] = oldValue;

                        if (!scheduleToTellListener) {

                            scheduleToTellListener = true;
                            this.$evalAsync(tellListener);

                        }

                    }
                )
            );

            destroyer = () => destroyers.forEach(destroy => destroy());

        }

        return destroyer;

    }

}
