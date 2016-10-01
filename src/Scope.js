import {cloneDeep, forEachRight, isEqual} from 'lodash';
import literals from './literals';
import {log} from './logger';

const $$asyncQueue = new WeakMap();
const $$initialWatchValue = Symbol.for('$$initialWatchValue');
const $$lastDirtyWatch = new WeakMap();
const $$watchers = new WeakMap();

export default class Scope {

    static $$areEqual(newValue, oldValue, compareValues) {

        return compareValues ?
               isEqual(newValue, oldValue) :
               newValue === oldValue || Scope.testNaN(newValue, oldValue);

    }

    static $$digestOnce($scope) {

        let dirty = false;

        forEachRight($$watchers.get($scope), watcher => { // eslint-disable-line complexity

            if (!watcher) {

                return true;

            }

            try {

                const {compareValues} = watcher;
                const newValue = watcher.watchFn($scope);
                const oldValue = watcher.last;

                if (!Scope.$$areEqual(newValue, oldValue, compareValues)) {

                    $$lastDirtyWatch.set($scope, watcher);

                    watcher.last = Scope.copyValue(newValue, compareValues);
                    watcher.listenerFn(
                        newValue,
                        Scope.getOldValue(newValue, oldValue),
                        $scope
                    );

                    dirty = true;

                } else if ($$lastDirtyWatch.get($scope) === watcher) {

                    return false;

                }

            } catch (error) {

                log('error', error);

            }

            return true;

        });

        return dirty;

    }

    static checkForInfiniteDigestion(dirty, iterations) {

        if (dirty && !iterations) {

            throw new Error(literals.INFINITE_DIGESTION);

        }

    }

    static copyValue(value, shouldClone) {

        return shouldClone ? cloneDeep(value) : value;

    }

    static executeAsyncQueue($scope) {

        const asyncQueue = $$asyncQueue.get($scope);

        while (asyncQueue.length) {

            const asyncTask = asyncQueue.shift();

            asyncTask.scope.$eval(asyncTask.evalFn, ...asyncTask.args);

        }

    }

    static getOldValue(newValue, oldValue) {

        return oldValue === $$initialWatchValue ? newValue : oldValue;

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

        $$asyncQueue.set(this, []);
        $$lastDirtyWatch.set(this, null);
        $$watchers.set(this, []);

    }

    $apply(...args) {

        try {

            this.$eval(...args);

        } finally {

            this.$digest();

        }

    }

    $eval(evalFn, ...args) {

        return evalFn(this, ...args);

    }

    $evalAsync(evalFn, ...args) {

        $$asyncQueue.get(this).push({
            args,
            evalFn,
            scope: this
        });

    }

    $digest() {

        let dirty = false,
            iterations = 10;

        $$lastDirtyWatch.set(this, null);

        do {

            Scope.executeAsyncQueue(this);

            dirty = Scope.$$digestOnce(this);

            Scope.checkForInfiniteDigestion(dirty, iterations);

            iterations -= 1;

        } while (dirty || $$asyncQueue.get(this).length);

    }

    $watch(watchFn, listenerFn = (() => {}), compareValues = false) {

        const watcher = {
            compareValues,
            last: $$initialWatchValue,
            listenerFn,
            watchFn
        };

        $$watchers.get(this).unshift(watcher);
        $$lastDirtyWatch.set(this, null);

        return () => {

            const index = $$watchers.get(this).indexOf(watcher);

            if (index >= 0) {

                $$watchers.get(this).splice(index, 1);
                $$lastDirtyWatch.set(this, null);

            }

        };

    }

}
