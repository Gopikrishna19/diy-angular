import {cloneDeep, forEach, isEqual} from 'lodash';
import literals from './literals';

const $$initialWatchValue = Symbol.for('$$initialWatchValue');
const $$lastDirtyWatch = new WeakMap();
const $$watchers = new WeakMap();

export default class Scope {

    static $$areEqual(newValue, oldValue, compareValues) {

        return compareValues ?
               isEqual(newValue, oldValue) :
               newValue === oldValue;

    }

    static $$digestOnce($scope) {

        let dirty = false;

        forEach($$watchers.get($scope), watcher => {

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

        $$watchers.get(this).push({
            compareValues,
            last: $$initialWatchValue,
            listenerFn,
            watchFn
        });

        $$lastDirtyWatch.set(this, null);

    }

}
