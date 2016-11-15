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
            value: this.tokens[0].value
        };

    }

    consume(text) {

        const token = this.expect(text);

        if (!token) {

            throw `${literals.UNEXPECTED_EXPECTED} ${text}`;

        }

        return token;

    }

    declareArray() {

        this.consume(']');

        return {
            type: ASTBuilder.ARRAY
        };

    }

    expect(text) {

        if (this.tokens.length) {

            if (this.tokens[0].text === text || !text) {

                return this.tokens.shift();

            }

        }

        return null;

    }

    primary() {

        if (this.expect('[')) {

            return this.declareArray();

        } else if (ASTBuilder.LITERALS[this.tokens[0].text]) {

            return ASTBuilder.LITERALS[this.tokens[0].text];

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
