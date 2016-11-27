const getStringFn = predicate => x => x.indexOf(predicate) >= 0;

export default () =>
    (array, predicate) =>
        array.filter(
            {
                function: predicate,
                string: getStringFn(predicate)
            }[typeof predicate]
        );
