import {cloneDeep, forEachRight, isEqual} from 'lodash';
import literals from './literals';
import {log} from './logger';

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

    static copyValue(value, shouldClone) {

        return shouldClone ? cloneDeep(value) : value;

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

        $$watchers.set(this, []);
        $$lastDirtyWatch.set(this, null);

    }

    $digest() {

        let dirty = false,
            iterations = 10;

        $$lastDirtyWatch.set(this, null);

        do {

            dirty = Scope.$$digestOnce(this);

            if (dirty && !iterations) {

                throw new Error(literals.INFINITE_DIGESTION);

            }

            iterations -= 1;

        } while (dirty);

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
