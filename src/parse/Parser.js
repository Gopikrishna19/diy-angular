import ASTBuilder from './ASTBuilder';
import ASTCompiler from './ASTCompiler';

export default class Parser {

    constructor(lexer) {

        this.lexer = lexer;
        this.astBuilder = new ASTBuilder(this.lexer);
        this.astCompiler = new ASTCompiler(this.astBuilder);

    }

    parse(text) {

        return this.astCompiler.compile(text);

    }

}
