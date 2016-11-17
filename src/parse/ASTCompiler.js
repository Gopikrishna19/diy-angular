import ASTBuilder from './ASTBuilder';

export default class ASTCompiler {

    get nextVar() {

        const variable = `v${this.variableGenerator.next().value}`;

        this.variables.push(variable);

        return variable;

    }

    set append(value) {

        this.state.body.push(value);

    }

    static * nextVar() {

        let id = 0;

        while (id >= 0) {

            yield id += 1;

        }

    }

    static assign(name, value) {

        return `${name} = ${value};`;

    }

    static declare(variables) {

        return `var ${variables};`;

    }

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

    static iff(condition, consequent) {

        return `if (${condition}) { ${consequent} }`;

    }

    constructor(astBuilder) {

        this.astBuilder = astBuilder;
        this.variableGenerator = ASTCompiler.nextVar();
        this.variables = [];

    }

    compile(text) {

        const ast = this.astBuilder.build(text);
        const $scope = 's';

        this.state = {
            body: []
        };

        this.recurse(ast);

        if (this.variables.length) {

            this.state.body.unshift(ASTCompiler.declare(this.variables));

        }

        return new Function($scope, this.state.body.join(''));

    }

    recurse(ast) {

        const $scope = 's';
        const nodeTypes = {
            [ASTBuilder.ARRAY]: () => `[${
                ast.elements.map(element => this.recurse(element))
                }]`,
            [ASTBuilder.IDENTIFIER]: () => {

                const identifier = this.nextVar;

                this.append = ASTCompiler.iff('s', ASTCompiler.assign(identifier, ASTCompiler.getIdentifier($scope, ast.name)));

                return identifier;

            },
            [ASTBuilder.LITERAL]: () => ASTCompiler.escape(ast.value),
            [ASTBuilder.OBJECT]: () => `{${
                ast.properties.map(({key, value}) => `${
                    key.type === ASTBuilder.IDENTIFIER ? key.name : ASTCompiler.escape(key.value)
                    }: ${this.recurse(value)}`)
                }}`,
            [ASTBuilder.PROGRAM]: () => this.append = `return ${this.recurse(ast.body)};`
        };

        return nodeTypes[ast.type]();

    }

}
