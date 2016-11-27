const filters = {};

export const filter = name => filters[name];

export const register = (name, factory) => {

    if (typeof name === 'object') {

        Object.keys(name).forEach(key => register(key, name[key]));

    } else {

        filters[name] = factory();

    }

};
