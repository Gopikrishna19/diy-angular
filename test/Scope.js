import Scope from '../src/Scope';
import {expect} from 'code';
import literals from '../src/literals';
import sinon from 'sinon';

describe('Scope', () => {

    let $scope,
        listenerFn,
        sandbox,
        watchFn;

    beforeEach(() => {

        $scope = new Scope();
        sandbox = sinon.sandbox.create();
        listenerFn = sandbox.stub();
        watchFn = sandbox.stub();

    });

    afterEach(() => sandbox.restore());

    it('should be constructed and used as an object', () => {

        $scope.aProperty = 1;

        expect($scope.aProperty).equals(1);

    });

    describe('$digest', () => {

        it('should call the listener function of a watch on first $digest', () => {

            $scope.$watch(
                () => 'watch',
                listenerFn
            );

            $scope.$digest();

            sinon.assert.calledOnce(listenerFn);

        });

        it('should call the watch function with scope as argument', () => {

            $scope.$watch(watchFn, listenerFn);

            $scope.$digest();

            sinon.assert.calledTwice(watchFn);
            sinon.assert.calledWithExactly(watchFn, $scope);

        });

        it('should call the listener function when watched value changes', () => {

            $scope.someValue = 'a';
            $scope.counter = 0;

            $scope.$watch(
                scope => scope.someValue,
                (newValue, oldValue, scope) => scope.counter += 1
            );

            expect($scope.counter).equals(0);

            $scope.$digest();
            expect($scope.counter).equals(1);

            $scope.$digest();
            expect($scope.counter).equals(1);

            $scope.someValue = 'b';
            expect($scope.counter).equals(1);

            $scope.$digest();
            expect($scope.counter).equals(2);

        });

        it('should call the listener function when watch value is first undefined', () => {

            $scope.counter = 0;

            $scope.$watch(
                scope => scope.someValue,
                (newValue, oldValue, scope) => scope.counter += 1
            );

            $scope.$digest();

            expect($scope.counter).equals(1);

        });

        it('should call the listener with new value as old value the first time', () => {

            let oldValueGiven;

            $scope.someValue = 'a';

            $scope.$watch(
                scope => scope.someValue,
                (newValue, oldValue) => oldValueGiven = oldValue
            );

            $scope.$digest();
            expect(oldValueGiven).equals($scope.someValue);

        });

        it('should allow watchers without a listener function', () => {

            $scope.$watch(watchFn);

            $scope.$digest();
            sinon.assert.calledTwice(watchFn);

        });

        it('should trigger chained watchers in the same $digest', () => {

            $scope.name = 'Jane';

            $scope.$watch(
                scope => scope.nameUpper,
                (newValue, oldValue, scope) => {

                    if (newValue) {

                        scope.initial = `${newValue.substring(0, 1)}.`;

                    }

                }
            );

            $scope.$watch(
                scope => scope.name,
                (newValue, oldValue, scope) =>
                    scope.nameUpper = newValue.toUpperCase()
            );

            $scope.$digest();
            expect($scope.initial).equals('J.');

            $scope.name = 'Doe';
            $scope.$digest();
            expect($scope.initial).equals('D.');

        });

        it('should give up after 10 iterations', () => {

            $scope.counterA = 0;
            $scope.counterB = 0;

            $scope.$watch(
                scope => scope.counterA,
                (newValue, oldValue, scope) => scope.counterB += 1
            );

            $scope.$watch(
                scope => scope.counterB,
                (newValue, oldValue, scope) => scope.counterA += 1
            );

            expect(() => $scope.$digest()).throw(literals.INFINITE_DIGESTION);

        });

    });

});
