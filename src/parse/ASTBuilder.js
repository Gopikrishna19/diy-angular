export default class ASTBuilder {

    static LITERAL = Symbol.for('LITERAL');
    static PROGRAM = Symbol.for('PROGRAM');
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

    primary() {

        return ASTBuilder.LITERALS[this.tokens[0].text] || this.constant();

    }

    program() {

        return {
            body: this.primary(),
            type: ASTBuilder.PROGRAM
        };

    }

}
