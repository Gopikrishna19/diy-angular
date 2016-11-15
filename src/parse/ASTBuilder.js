import literals from '../literals';

export default class ASTBuilder {

    static ARRAY = Symbol.for('ARRAY');
    static LITERAL = Symbol.for('LITERAL');
    static LITERALS = {
        'false': {
            type: ASTBuilder.LITERAL,
            value: false
        },
        'null': {
            type: ASTBuilder.LITERAL,
            value: null
        },
        'true': {
            type: ASTBuilder.LITERAL,
            value: true
        }
    };
    static PROGRAM = Symbol.for('PROGRAM');

    constructor(lexer) {

        this.lexer = lexer;

    }

    build(text) {

        this.tokens = this.lexer.lex(text);

        return this.program();

    }

    constant() {

        return {
            type: ASTBuilder.LITERAL,
            value: this.consume().value
        };

    }

    consume(text) {

        const token = this.expect(text);

        if (!token) {

            throw new Error(`${literals.UNEXPECTED_EXPECTED} ${text}`);

        }

        return token;

    }

    declareArray() {

        const elements = [];

        if (!this.peek(']')) {

            do {

                if (this.peek(']')) {

                    break;

                }

                elements.push((this.primary()));

            } while (this.expect(','));

        }

        this.consume(']');

        return {
            elements,
            type: ASTBuilder.ARRAY
        };

    }

    expect(text) {

        if (this.peek(text)) {

            return this.tokens.shift();

        }

        return null;

    }

    peek(text) {

        if (this.tokens.length) {

            if (this.tokens[0].text === text || !text) {

                return this.tokens[0];

            }

        }

        return null;

    }

    primary() {

        if (this.expect('[')) {

            return this.declareArray();

        } else if (ASTBuilder.LITERALS[this.tokens[0].text]) {

            return ASTBuilder.LITERALS[this.consume().text];

        }

        return this.constant();

    }

    program() {

        return {
            body: this.primary(),
            type: ASTBuilder.PROGRAM
        };

    }

}
