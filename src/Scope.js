import {forEach} from 'lodash';
import literals from './literals';

const $$initialWatchValue = Symbol.for('$$initialWatchValue');
const $$lastDirtyWatch = new WeakMap();
const $$watchers = new WeakMap();

export default class Scope {

    static $$digestOnce($scope) {

        let dirty = false;

        forEach($$watchers.get($scope), watcher => {

            const newValue = watcher.watchFn($scope);
            const oldValue = watcher.last;

            if (newValue !== oldValue) {

                $$lastDirtyWatch.set($scope, watcher);

                watcher.last = newValue;
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

    $watch(watchFn, listenerFn = (() => {})) {

        $$watchers.get(this).push({
            last: $$initialWatchValue,
            listenerFn,
            watchFn
        });

        $$lastDirtyWatch.set(this, null);

    }

}
