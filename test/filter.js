import {expect} from 'code';
import {filter} from '../src/filters';
import parse from '../src/parse';

describe('filtering', () => {

    it('should be available', () => {

        expect(filter('filter')).function();

    });

    describe('based on', () => {

        describe('predicate function', () => {

            it('should return the value', () => {

                const $scope = {
                    isEven: n => n % 2 === 0
                };

                expect(parse('[0, 1, 2, 3] | filter : isEven')($scope)).equals([0, 2]);

            });

        });

        describe('string', () => {

            it('should return the value', () => {

                expect(parse('arr | filter : "a"')({arr: ['a', 'b', 'a']})).equals(['a', 'a']);

            });

            it('should match substring', () => {

                expect(parse('arr | filter : "a"')({arr: ['apple', 'brown', 'aloha']})).equals(['apple', 'aloha']);

            });

            it('should match ignoring the case', () => {

                expect(parse('arr | filter : "a"')({arr: ['APPLE', 'brown', 'aloha']})).equals(['APPLE', 'aloha']);

            });

        });

    });

});
