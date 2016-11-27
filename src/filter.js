import {isObject} from 'lodash';

const deepCompare = (target, predicate, compare) => { // eslint-disable-line complexity

    if (typeof predicate === 'string' && predicate[0] === '!') {

        return !deepCompare(target, predicate.slice(1), stringCompare);

    } else if (isObject(predicate)) {

        return Object.values(predicate).some(value => deepCompare(target, value, compare));

    } else if (isObject(target)) {

        return Object.values(target).some(value => deepCompare(value, predicate, compare));

    }

    return compare(target, predicate);

};

const genericCompare = (a, b) => a === b;
const stringCompare = (a, b) => a && a.toLowerCase().indexOf(`${b}`.toLowerCase()) >= 0;

const getGenericPredicate = predicate =>
    value => deepCompare(value, predicate, genericCompare);

const getObjectPredicate = predicate =>
    value => Object.keys(predicate).every(
        key => deepCompare(value[key], predicate[key], stringCompare)
    );

const getStringPredicate = predicate =>
    value => deepCompare(value, predicate, stringCompare);

export default () =>
    (array, predicate) => {

        if (predicate === null || predicate === undefined) {

            return array.filter(getGenericPredicate(predicate));

        }

        return array.filter(
            {
                'Boolean': () => getGenericPredicate(predicate),
                'Function': () => predicate,
                'Number': () => getGenericPredicate(predicate),
                'Object': () => getObjectPredicate(predicate),
                'String': () => getStringPredicate(predicate)
            }[predicate.constructor.name]()
        );

    };
