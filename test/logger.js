import * as logger from '../src/logger';
import sinon from 'sinon';

describe('logger', () => {

    let sandbox;

    beforeEach(() => sandbox = sinon.sandbox.create());

    afterEach(() => sandbox.restore());

    it('should output the arguments to the console with given type', () => {

        const messageToLog = 'message to log';
        const types = ['log', 'error', 'warn', 'info'];
        const type = types[Math.floor(Math.random() * types.length)];

        /* eslint-disable no-console */

        sandbox.stub(console, type);

        logger.log(type, messageToLog);

        sinon.assert.calledOnce(console[type]);
        sinon.assert.calledWithExactly(console[type], messageToLog);

        console[type].restore();

        /* eslint-enable */

    });

});
