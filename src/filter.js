const getPredicateFn = predicate => x => x === predicate;

export default () =>
    (array, predicate) =>
        array.filter(typeof predicate === 'function' ? predicate : getPredicateFn(predicate));
