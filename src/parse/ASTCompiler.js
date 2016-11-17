import ASTBuilder from './ASTBuilder';

export default class ASTCompiler {

    static escape(value) {

        const radix = 16;
        const start = -4;

        if (typeof value === 'string') {

            return `'${
                value.replace(/[^ a-zA-Z0-9]/g, char => `\\u${
                    (`0000${
                        char.charCodeAt(0).toString(radix)
                        }`).slice(start)
                    }`)
                }'`;

        } else if (value === null) {

            return 'null';

        }

        return value;

    }

    static getIdentifier(context, name) {

        return `(${context})['${name}']`;

    }

    constructor(astBuilder) {

        this.astBuilder = astBuilder;

    }

    compile(text) {

        const ast = this.astBuilder.build(text);
        const $scope = 's';

        this.state = {
            body: []
        };

        this.recurse(ast);

        return new Function($scope, this.state.body.join(''));

    }

    recurse(ast) {

        const $scope = 's';
        const nodeTypes = {
            [ASTBuilder.ARRAY]: () => `[${
                ast.elements.map(element => this.recurse(element))
                }]`,
            [ASTBuilder.IDENTIFIER]: () => ASTCompiler.getIdentifier($scope, ast.name),
            [ASTBuilder.LITERAL]: () => ASTCompiler.escape(ast.value),
            [ASTBuilder.OBJECT]: () => `{${
                ast.properties.map(({key, value}) => `${
                    key.type === ASTBuilder.IDENTIFIER ? key.name : ASTCompiler.escape(key.value)
                    }: ${this.recurse(value)}`)
                }}`,
            [ASTBuilder.PROGRAM]: () => {

                this.state.body.push('return ', this.recurse(ast.body), ';');

            }
        };

        return nodeTypes[ast.type]();

    }

}
