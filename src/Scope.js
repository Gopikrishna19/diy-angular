import {forEach} from 'lodash';
import literals from './literals';

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

        let dirty,
            iterations = 10;

        do {

            dirty = Scope.$$digestOnce(this);

            if (dirty && !iterations) {

                throw new Error(literals.INFINITE_DIGESTION);

            }

            iterations -= 1;

        } while (dirty);

    }

}
