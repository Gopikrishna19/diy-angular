import {filter, register} from '../src/filter';
import {expect} from 'code';

describe('Filters', () => {

    it('should allow registering a filter', () => {

        const aFilter = () => {};
        const aFilterFactory = () => aFilter;

        register('aFilter', aFilterFactory);
        expect(filter('aFilter')).equals(aFilter);

    });

    it('should allow registering multiple filters', () => {

        const aFilter = () => {};
        const anotherFilter = () => {};

        register({
            aFilter: () => aFilter,
            anotherFilter: () => anotherFilter
        });
        expect(filter('aFilter')).equals(aFilter);
        expect(filter('anotherFilter')).equals(anotherFilter);

    });

});
