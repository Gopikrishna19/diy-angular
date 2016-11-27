import {isObject} from 'lodash';

const deepCompare = (target, predicate, compare) => {

    if (isObject(target)) {

        return Object.values(target).some(value => deepCompare(value, predicate, compare));

    }

    return compare(target, predicate);

};

const genericCompare = (a, b) => a === b;
const stringCompare = (a, b) => a && a.toLowerCase().indexOf(`${b}`.toLowerCase()) >= 0;

const getGenericPredicate = predicate =>
    value => deepCompare(value, predicate, genericCompare);

const getStringPredicate = predicate =>
    value => {

        if (predicate[0] === '!') {

            return !deepCompare(value, predicate.slice(1), stringCompare);

        }

        return deepCompare(value, predicate, stringCompare);

    };

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
                'String': () => getStringPredicate(predicate)
            }[predicate.constructor.name]()
        );

    };
