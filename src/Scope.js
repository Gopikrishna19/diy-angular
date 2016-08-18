import {forEach} from 'lodash';

const $$watchers = new WeakMap();

export default class Scope {

    constructor() {

        $$watchers.set(this, []);

    }

    $watch(watchFn, listenerFn) {

        $$watchers.get(this).push({
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
