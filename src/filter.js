const getStringFn = predicate => x => x.indexOf(predicate) >= 0;

export default () =>
    (array, predicate) =>
        array.filter(
            {
                Function: () => predicate,
                String: () => getStringFn(predicate)
            }[predicate.constructor.name]()
        );
