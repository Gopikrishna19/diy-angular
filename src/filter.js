import {isArray, isObject} from 'lodash';

const deepCompare = (target, predicate, compare, inObject = false) => { // eslint-disable-line complexity

    if (typeof predicate === 'string' && predicate[0] === '!') {

        return !deepCompare(target, predicate.slice(1), stringCompare);

    } else if (isArray(target)) {

        return target.some(value => deepCompare(value, predicate, compare));

    } else if (isObject(predicate)) {

        return Object.keys(predicate).some(key => deepCompare(target[key], predicate[key], compare, true));

    } else if (isObject(target)) {

        if (!inObject || isObject(predicate) || predicate === undefined) {

            return Object.values(target).some(value => deepCompare(value, predicate, compare, true));

        }

        return false;

    } else if (inObject && predicate === undefined) {

        return true;

    }

    return compare(target, predicate);

};

const genericCompare = (a, b) => a === b;
const stringCompare = (a, b) => a && a.toLowerCase().indexOf(`${b}`.toLowerCase()) >= 0;

const getGenericPredicate = predicate =>
    value => deepCompare(value, predicate, genericCompare);

const getObjectPredicate = predicate =>
    value => Object.keys(predicate).every(
        key => deepCompare(value[key], predicate[key], stringCompare, true)
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
