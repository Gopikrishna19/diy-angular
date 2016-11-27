import {isObject} from 'lodash';

const deepCompare = (target, predicate, compare) => {

    if (isObject(target)) {

        return Object.values(target).some(value => deepCompare(value, predicate, compare));

    }

    return compare(target, predicate);

};

const stringCompare = (a, b) => a.toLowerCase().indexOf(b.toLowerCase()) >= 0;
const numberCompare = (a, b) => a === b;

const getNumberPredicate = predicate =>
    value => deepCompare(
        value,
        predicate,
        numberCompare
    );

const getStringPredicate = predicate =>
    value => deepCompare(
        value,
        predicate,
        stringCompare
    );

export default () =>
    (array, predicate) =>
        array.filter(
            {
                'Boolean': () => getNumberPredicate(predicate),
                'Function': () => predicate,
                'Number': () => getNumberPredicate(predicate),
                'String': () => getStringPredicate(predicate)
            }[predicate.constructor.name]()
        );
