import {forEach} from 'lodash';

const $$initialWatchValue = Symbol.for('$$initialWatchValue');
const $$watchers = new WeakMap();

export default class Scope {

    static $$digestOnce($scope) {

        let dirty = false;

        forEach($$watchers.get($scope), watcher => {

            const newValue = watcher.watchFn($scope);
            const oldValue = watcher.last;

            if (newValue !== oldValue) {

                watcher.last = newValue;
                watcher.listenerFn(
                    newValue,
                    oldValue === $$initialWatchValue ? newValue : oldValue,
                    $scope);

                dirty = true;

            }

        });

        return dirty;

    }

    constructor() {

        $$watchers.set(this, []);

    }

    $watch(watchFn, listenerFn = (() => {})) {

        $$watchers.get(this).push({
            last: $$initialWatchValue,
            listenerFn,
            watchFn
        });

    }

    $digest() {

        let dirty;

        do {

            dirty = Scope.$$digestOnce(this);

        } while (dirty);

    }

}
