import {forEach} from 'lodash';

const $$initialWatchValue = Symbol.for('$$initialWatchValue');
const $$watchers = new WeakMap();

export default class Scope {

    constructor() {

        $$watchers.set(this, []);

    }

    $watch(watchFn, listenerFn) {

        $$watchers.get(this).push({
            last: $$initialWatchValue,
            listenerFn,
            watchFn
        });

    }

    $digest() {

        forEach($$watchers.get(this), watcher => {

            const newValue = watcher.watchFn(this);
            const oldValue = watcher.last;

            if (newValue !== oldValue) {

                watcher.last = newValue;
                watcher.listenerFn(newValue, oldValue, this);

            }

        });

    }

}
