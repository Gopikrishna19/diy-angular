import {expect} from 'code';
import {filter} from '../src/filters';
import parse from '../src/parse';

describe('Filter filter', () => {

    it('should be available', () => {

        expect(filter('filter')).function();

    });

    it('should filter based on a predicate', () => {

        const $scope = {
            isEven: n => n % 2 === 0
        };

        expect(parse('[0, 1, 2, 3] | filter : isEven')($scope)).equals([0, 2]);

    });

    it('should filter based on a string', () => {

        expect(parse('arr | filter : "a"')({arr: ['a', 'b', 'a']})).equals(['a', 'a']);

    });

});
