const getStringFn = predicate => x => x.toLowerCase().indexOf(predicate.toLowerCase()) >= 0;

export default () =>
    (array, predicate) =>
        array.filter(
            {
                Function: () => predicate,
                String: () => getStringFn(predicate)
            }[predicate.constructor.name]()
        );
