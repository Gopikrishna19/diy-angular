import {filter, register} from '../src/filters';
import {expect} from 'code';

describe('filters', () => {

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

    describe('filter', () => {

        it('should be available', () => {

            expect(filter('filter')).function();

        });

    });

});
