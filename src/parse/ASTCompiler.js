import ASTBuilder from './ASTBuilder';

export default class ASTCompiler {

    static escape(value) {

        const radix = 16;
        const start = -4;

        return typeof value === 'string' ? `'${
            value.replace(/[^ a-zA-Z0-9]/g, char => `\\u${
                (`0000${
                    char.charCodeAt(0).toString(radix)
                    }`).slice(start)
                }`)
            }'` : value;

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
