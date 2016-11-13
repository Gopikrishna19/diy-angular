import literals from './literals';

class ASTBuilder {

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

class ASTCompiler {

    constructor(astBuilder) {

        this.astBuilder = astBuilder;

    }

    compile(text) {

        const ast = this.astBuilder.build(text);

        this.state = {
            body: []
        };

        this.recurse(ast);

        return new Function(this.state.body.join(''));

    }

    recurse(ast) {

        const nodeTypes = {
            [ASTBuilder.PROGRAM]: () => {

                this.state.body.push('return ', this.recurse(ast.body), ';');

            },
            [ASTBuilder.LITERAL]: () => ast.value
        };

        return nodeTypes[ast.type]();

    }

}

class Lexer {

    static isFloating(text, index) {

        const char = text[index];

        return Lexer.isNumber(char) || (char === '.' && Lexer.isNumber(Lexer.peek(text, index)));

    }

    static isNumber(char) {

        return char >= '0' && char <= '9';

    }

    static isNumeric(char) {

        return [
            char === '.',
            char === '+',
            char === '-',
            char === 'e',
            Lexer.isNumber(char)
        ].some(condition => condition);

    }

    static peek(text, index) {

        return text.charAt(index + 1);

    }

    lex(text) {

        this.index = 0;

        const tokens = [];
        let char;

        while (this.index < text.length) {

            char = text.charAt(this.index);

            if (Lexer.isFloating(text, this.index)) {

                tokens.push(this.readNumber(text));

            } else {

                throw new Error(`${literals.UNEXPECTED_NEXT_CHAR} ${char}`);

            }

        }

        return tokens;

    }

    readNumber(text) {

        let char,
            number = '';

        while (this.index < text.length) {

            char = text.charAt(this.index).toLowerCase();

            if (Lexer.isNumeric(char)) {

                number += char;

            } else {

                break;

            }

            this.index += 1;

        }

        return {
            text: number,
            value: Number(number)
        };

    }

}

class Parser {

    constructor(lexer) {

        this.lexer = lexer;
        this.astBuilder = new ASTBuilder(this.lexer);
        this.astCompiler = new ASTCompiler(this.astBuilder);

    }

    parse(text) {

        return this.astCompiler.compile(text);

    }

}

export default expression => {

    const lexer = new Lexer();
    const parser = new Parser(lexer);

    return parser.parse(expression);

};
