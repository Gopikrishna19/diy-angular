const filters = {};

export const register = (name, factory) => filters[name] = factory();
export const filter = name => filters[name];
