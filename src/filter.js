import {isArray, isObject} from 'lodash';

const isNull = (target, predicate) => target === null || predicate === null;

const comparator = (target, predicate) => {

    if (target === undefined) {

        return false;

    } else if (isNull(target, predicate)) {

        return target === predicate;

    }

    return `${target}`.toLowerCase().indexOf(`${predicate}`.toLowerCase()) >= 0;

};

const processPredicate = (key, target, predicate, compare) => {

    const expectation = predicate[key];
    const isWildcard = key === '$';

    if (expectation === undefined) {

        return true;

    }

    return deepCompare(isWildcard ? target : target[key], expectation, compare, isWildcard, isWildcard);

};

const processTarget = (target, predicate, compare, compareAny, compareWildcard) => {

    if (isObject(predicate) && !compareWildcard) {

        return Object.keys(predicate).every(key => processPredicate(key, target, predicate, compare));

    } else if (compareAny) {

        return Object.values(target).some(value => deepCompare(value, predicate, compare, compareAny));

    }

    return compare(target, predicate);

};

const isStringNegation = predicate => typeof predicate === 'string' && predicate[0] === '!';

const deepCompare = (target, predicate, compare, compareAny, compareWildcard) => {

    const steps = [
        () => !deepCompare(target, predicate.slice(1), compare, compareAny),
        () => target.some(value => deepCompare(value, predicate, compare, compareAny)),
        () => processTarget(target, predicate, compare, compareAny, compareWildcard)
    ];

    const conditions = [
        () => isStringNegation(predicate),
        () => isArray(target),
        () => isObject(target)
    ];

    const nextStep = steps[conditions.findIndex(condition => condition())];

    return nextStep ? nextStep() : compare(target, predicate);

};

const getPredicateFn = predicate =>
    value => {

        if (isObject(predicate) && ('$' in predicate) && !isObject(value)) {

            return deepCompare(value, predicate.$, comparator);

        }

        return deepCompare(value, predicate, comparator, true);

    };

const isPrimitive = predicate => [
    () => predicate === null,
    () => predicate === undefined,
    () => predicate.constructor.name === 'Boolean',
    () => predicate.constructor.name === 'Number',
    () => predicate.constructor.name === 'Object',
    () => predicate.constructor.name === 'String'
].some(condition => condition());

export default () =>
    (array, predicate) => {

        let predicateFn = predicate;

        if (isPrimitive(predicate)) {

            predicateFn = getPredicateFn(predicate);

        }

        return array.filter(predicateFn);

    };
