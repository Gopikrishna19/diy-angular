import {expect} from 'code';
import {filter} from '../src/filters';
import parse from '../src/parse';

describe('filtering', () => {

    it('should be available', () => {

        expect(filter('filter')).function();

    });

    describe('based on', () => {

        describe('function', () => {

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

            it('should ignore undefined values', () => {

                const $scope = {
                    arr: [
                        undefined,
                        'not undefined'
                    ]
                };

                expect(parse('arr | filter : "undefined"')($scope)).equals(['not undefined']);

            });

        });

        describe('object', () => {

            it('should return the value', () => {

                const $scope = {
                    arr: [
                        {
                            name: 'Joe',
                            role: 'admin'
                        },
                        {
                            name: 'Jane',
                            role: 'moderator'
                        }
                    ]
                };

                expect(parse('arr | filter : {name: "o"}')($scope)).equals([
                    {
                        name: 'Joe',
                        role: 'admin'
                    }
                ]);

            });

            it('should match complex predicates', () => {

                const $scope = {
                    arr: [
                        {
                            name: 'Joe',
                            role: 'admin'
                        },
                        {
                            name: 'Jane',
                            role: 'moderator'
                        }
                    ]
                };

                expect(parse('arr | filter : {name: "o", role: "m"}')($scope)).equals([
                    {
                        name: 'Joe',
                        role: 'admin'
                    }
                ]);

            });

            it('should match everything on an empty predicate', () => {

                const $scope = {
                    arr: [
                        {
                            name: 'Joe',
                            role: 'admin'
                        },
                        {
                            name: 'Jane',
                            role: 'moderator'
                        }
                    ]
                };

                expect(parse('arr | filter : {}')($scope)).equals($scope.arr);

            });

            it('should match everything on an undefined predicate', () => {

                const $scope = {
                    arr: [
                        {
                            name: {first: 'Joe'},
                            role: 'admin'
                        },
                        {
                            name: {first: 'Jane'},
                            role: 'moderator'
                        }
                    ]
                };

                expect(parse('arr | filter : {name: something}')($scope)).equals($scope.arr);
                expect(parse('arr | filter : {name: {first: something}}')($scope)).equals($scope.arr);

            });

            it('should match any value in a complex array', () => {

                const $scope = {
                    arr: [
                        {
                            name: {first: 'Joe'},
                            role: 'admin'
                        },
                        {
                            name: {first: 'Jane'},
                            role: 'moderator'
                        }
                    ]
                };

                expect(parse('arr | filter : {name: {first: "o"}}')($scope)).equals([
                    {
                        name: {first: 'Joe'},
                        role: 'admin'
                    }
                ]);

            });

            it('should match any value in a nested array', () => {

                const $scope = {
                    arr: [
                        {
                            users: [
                                {
                                    name: {first: 'Joe'},
                                    role: 'admin'
                                },
                                {
                                    name: {first: 'Jane'},
                                    role: 'moderator'
                                }
                            ]
                        },
                        {
                            users: [
                                {
                                    name: {first: 'Mary'},
                                    role: 'admin'
                                }
                            ]
                        }
                    ]
                };

                expect(parse('arr | filter : {users: {name: {first: "o"}}}')($scope)).equals([
                    {
                        users: [
                            {
                                name: {first: 'Joe'},
                                role: 'admin'
                            },
                            {
                                name: {first: 'Jane'},
                                role: 'moderator'
                            }
                        ]
                    }
                ]);

            });

            it('should match only on the same depth', () => {

                const $scope = {
                    arr: [
                        {user: 'Bob'},
                        {user: {name: 'Bob'}},
                        {
                            user: {
                                name: {
                                    first: 'Bob',
                                    last: 'Fox'
                                }
                            }
                        }
                    ]
                };

                expect(parse('arr | filter : {user: {name: "Bob"}}')($scope)).equals([
                    {user: {name: 'Bob'}}
                ]);

            });

            it('should match negations in string', () => {

                const $scope = {
                    arr: [
                        {
                            name: {first: 'Joe'},
                            role: 'admin'
                        },
                        {
                            name: {first: 'Jane'},
                            role: 'moderator'
                        }
                    ]
                };

                expect(parse('arr | filter : {name: {first: "!o"}}')($scope)).equals([
                    {
                        name: {first: 'Jane'},
                        role: 'moderator'
                    }
                ]);

            });

        });

        describe('wildcard $', () => {

            it('should return any matching value in array', () => {

                expect(parse('arr | filter : {$: "o"}')({arr: ['Joe', 'Jane', 'Mary']})).equals(['Joe']);

            });

            it('should return any matching value in object', () => {

                const $scope = {
                    arr: [
                        {
                            name: 'Joe',
                            role: 'admin'
                        },
                        {
                            name: 'Jane',
                            role: 'moderator'
                        },
                        {
                            name: 'Mary',
                            role: 'admin'
                        }
                    ]
                };

                expect(parse('arr | filter : {$: "o"}')($scope)).equals([
                    {
                        name: 'Joe',
                        role: 'admin'
                    },
                    {
                        name: 'Jane',
                        role: 'moderator'
                    }
                ]);

            });

            it('should match any value in a complex array', () => {

                const $scope = {
                    arr: [
                        {
                            name: {
                                first: 'Joe',
                                last: 'Fox'
                            },
                            role: 'admin'
                        },
                        {
                            name: {
                                first: 'Jane',
                                last: 'Quick'
                            },
                            role: 'moderator'
                        },
                        {
                            name: {
                                first: 'Mary',
                                last: 'Brown'
                            },
                            role: 'admin'
                        }
                    ]
                };

                expect(parse('arr | filter : {name: {$: "o"}}')($scope)).equals([
                    {
                        name: {
                            first: 'Joe',
                            last: 'Fox'
                        },
                        role: 'admin'
                    },
                    {
                        name: {
                            first: 'Mary',
                            last: 'Brown'
                        },
                        role: 'admin'
                    }
                ]);

            });

            it('should match nested wildcards', function () {

                const $scope = {
                    arr: [
                        {
                            name: {first: 'Joe'},
                            role: 'admin'
                        },
                        {
                            name: {first: 'Jane'},
                            role: 'moderator'
                        },
                        {
                            name: {first: 'Mary'},
                            role: 'admin'
                        }
                    ]
                };

                expect(parse('arr | filter : {$: {$: "o"}}')($scope)).equals([
                    {
                        name: {first: 'Joe'},
                        role: 'admin'
                    }
                ]);

            });

        });

    });

});
