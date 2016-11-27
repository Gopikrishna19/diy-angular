import {isObject} from 'lodash';

const filters = {};

export const filter = name => filters[name];

export const register = (name, factory) => {

    if (isObject(name)) {

        Object.keys(name).forEach(key => register(key, name[key]));

    } else {

        filters[name] = factory();

    }

};
