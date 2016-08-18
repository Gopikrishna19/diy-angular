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

        forEach($$watchers.get(this), watcher => watcher.listenerFn());

    }

}
