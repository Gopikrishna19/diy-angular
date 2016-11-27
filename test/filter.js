import {filter, register} from '../src/filter';
import {expect} from 'code';

describe('Filters', () => {

    it('should allow registering a filter', () => {

        const aFilter = () => {};
        const aFilterFactory = () => aFilter;

        register('aFilter', aFilterFactory);
        expect(filter('aFilter')).equals(aFilter);

    });

});
