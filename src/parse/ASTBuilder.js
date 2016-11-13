export default class ASTBuilder {

    static LITERAL = Symbol.for('LITERAL');
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

    program() {

        return {
            body: this.constant(),
            type: ASTBuilder.PROGRAM
        };

    }

}
