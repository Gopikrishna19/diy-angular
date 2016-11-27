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
                    'isEven': n => n % 2 === 0
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

            it('should match any value in a complex array', () => {

                const $scope = {
                    arr: [
                        {
                            firstName: 'John',
                            lastName: 'Brown'
                        },
                        [
                            {
                                firstName: 'Jane',
                                lastName: 'Fox'
                            }
                        ],
                        {
                            firstName: 'Mary',
                            lastName: 'Quick'
                        }
                    ]
                };

                expect(parse('arr | filter : "o"')($scope)).equals([
                    {
                        firstName: 'John',
                        lastName: 'Brown'
                    },
                    [
                        {
                            firstName: 'Jane',
                            lastName: 'Fox'
                        }
                    ]
                ]);

            });

            it('should negate matching predicates starting with a !', () => {

                expect(parse('arr | filter : "!a"')({arr: ['apple', 'brown', 'aloha']})).equals(['brown']);

            });

        });

        describe('number', () => {

            it('should return the value', () => {

                expect(parse('arr | filter : 2')({arr: [2, 1, 2]})).equals([2, 2]);

            });

            it('should match any value in a complex array', () => {

                const $scope = {
                    arr: [
                        {
                            age: 2,
                            name: 'Mary'
                        },
                        {
                            age: 3,
                            name: 'John'
                        },
                        {
                            age: 4,
                            name: 'Jane'
                        }
                    ]
                };

                expect(parse('arr | filter : 2')($scope)).equals([
                    {
                        age: 2,
                        name: 'Mary'
                    }
                ]);

            });

        });

        describe('boolean', () => {

            it('should return the value', () => {

                expect(parse('arr | filter : true')({arr: [true, false, true]})).equals([true, true]);

            });

            it('should match any value in a complex array', () => {

                const $scope = {
                    arr: [
                        {
                            admin: true,
                            name: 'Mary'
                        },
                        {
                            admin: true,
                            name: 'John'
                        },
                        {
                            admin: false,
                            name: 'Jane'
                        }
                    ]
                };

                expect(parse('arr | filter : true')($scope)).equals([
                    {
                        admin: true,
                        name: 'Mary'
                    },
                    {
                        admin: true,
                        name: 'John'
                    }
                ]);

            });

        });

        describe('null', () => {

            it('should return the value', () => {

                expect(parse('arr | filter : null')({arr: [null, 'not null']})).equals([null]);

            });

            it('should not get confused with string', () => {

                expect(parse('arr | filter : "null"')({arr: [null, 'not null']})).equals(['not null']);

            });

        });

        describe('undefined', () => {

            it('should return the value', () => {

                expect(parse('arr | filter : undefined')({arr: [undefined, 'not undefined']})).equals([undefined]);

            });

            it('should not get confused with string', () => {

                const $scope = {
                    arr: [
                        undefined,
                        'not undefined'
                    ]
                };

                expect(parse('arr | filter : "undefined"')($scope)).equals(['not undefined']);

            });

        });

    });

});
