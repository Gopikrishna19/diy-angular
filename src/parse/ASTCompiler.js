import ASTBuilder from './ASTBuilder';

const $scope = 's';
const $locals = 'l';

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

        do {

            yield id += 1;

        } while (id);

    }

    static assign(name, value) {

        return `${name} = ${value};`;

    }

    static declare(variables) {

        return `var ${variables};`;

    }

    static elsePath(consequent) {

        return `else { ${consequent} }`;

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

    static getHasOwnProperty(context, property) {

        return `${context} && ${ASTCompiler.getIdentifier(context, property)}`;

    }

    static getIdentifier(context, name) {

        return `(${context})[${ASTCompiler.escape(name)}]`;

    }

    static ifPath(condition, consequent) {

        return `if (${condition}) { ${consequent} }`;

    }

    static setPropertyValue(identifier, object, property) {

        return ASTCompiler.ifPath(
            ASTCompiler.getHasOwnProperty(object, property),
            ASTCompiler.assign(
                identifier,
                ASTCompiler.getIdentifier(
                    object,
                    property
                )
            )
        );

    }

    constructor(astBuilder) {

        this.astBuilder = astBuilder;
        this.variableGenerator = ASTCompiler.nextVar();
        this.variables = [];

    }

    compile(text) {

        const ast = this.astBuilder.build(text);

        this.state = {
            body: []
        };

        this.recurse(ast);

        if (this.variables.length) {

            this.state.body.unshift(ASTCompiler.declare(this.variables));

        }

        return new Function($scope, $locals, this.state.body.join(''));

    }

    recurse(ast) {

        const nodeTypes = {
            [ASTBuilder.ARRAY]: () => `[${
                ast.elements.map(element => this.recurse(element))
                }]`,
            [ASTBuilder.IDENTIFIER]: () => {

                const identifier = this.nextVar;

                this.append = ASTCompiler.setPropertyValue(identifier, $locals, ast.name);
                this.append = ASTCompiler.elsePath(ASTCompiler.setPropertyValue(identifier, $scope, ast.name));

                return identifier;

            },
            [ASTBuilder.LITERAL]: () => ASTCompiler.escape(ast.value),
            [ASTBuilder.OBJECT]: () => `{${
                ast.properties.map(({key, value}) => `${
                    key.type === ASTBuilder.IDENTIFIER ? key.name : ASTCompiler.escape(key.value)
                    }: ${this.recurse(value)}`)
                }}`,
            [ASTBuilder.OBJECT_PROPERTY_EXPRESSION]: () => {

                const identifier = this.nextVar;
                const object = this.recurse(ast.object);

                this.append = ASTCompiler.setPropertyValue(identifier, object, ast.property.name);

                return identifier;

            },
            [ASTBuilder.PROGRAM]: () => this.append = `return ${this.recurse(ast.body)};`,
            [ASTBuilder.THIS]: () => $scope
        };

        return nodeTypes[ast.type]();

    }

}
