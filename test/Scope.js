import Scope from '../src/Scope';
import {expect} from 'code';

describe('Scope', () => {

  it('should be constructed and used as an object', () => {

    const scope = new Scope();

    scope.aProperty = 1;

    expect(scope.aProperty).equals(1);

  });

});
