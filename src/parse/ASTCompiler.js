import ASTBuilder from './ASTBuilder';

export default class ASTCompiler {

    static escape(value) {

        return typeof value === 'string' ? `'${value}'` : value;

    }

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
            [ASTBuilder.LITERAL]: () => ASTCompiler.escape(ast.value)
        };

        return nodeTypes[ast.type]();

    }

}
