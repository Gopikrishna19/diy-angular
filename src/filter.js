import {isObject} from 'lodash';

const deepCompare = (target, predicate, compare) => {

    if (isObject(target)) {

        return Object.values(target).some(value => deepCompare(value, predicate, compare));

    }

    return compare(target, predicate);

};

const stringCompare = (a, b) => a.toLowerCase().indexOf(b.toLowerCase()) >= 0;

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
                Function: () => predicate,
                String: () => getStringPredicate(predicate)
            }[predicate.constructor.name]()
        );
