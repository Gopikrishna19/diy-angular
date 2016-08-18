import Scope from '../src/Scope';
import {expect} from 'code';
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

    describe('digest', () => {

        it('should call the listener function of a watch on first $digest', () => {

            $scope.$watch(
                () => 'watch',
                listenerFn
            );

            $scope.$digest();

            sinon.assert.calledOnce(listenerFn);

        });

    });

});
