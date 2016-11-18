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

    static func(name, args) {

        return `${name} && ${name}(${args})`;

    }

    static getHasOwnProperty(context, property, computed) {

        return `${context} && ${ASTCompiler.getIdentifier(context, property, computed)}`;

    }

    static getIdentifier(context, name, computed = false) {

        return `(${context})[${computed ? name : ASTCompiler.escape(name)}]`;

    }

    static ifPath(condition, consequent) {

        return `if (${condition}) { ${consequent} }`;

    }

    static setPropertyValue(identifier, object, property, computed) {

        return ASTCompiler.ifPath(
            ASTCompiler.getHasOwnProperty(object, property, computed),
            ASTCompiler.assign(
                identifier,
                ASTCompiler.getIdentifier(
                    object,
                    property,
                    computed
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

    recurse(ast, context) {

        const nodeTypes = {
            [ASTBuilder.ARRAY]: () => `[${
                ast.elements.map(element => this.recurse(element))
                }]`,
            [ASTBuilder.FUNCTION]: () => {

                const callContext = {};
                const args = ast.args.map(arg => this.recurse(arg));

                this.recurse(ast.callee, callContext);

                const name = ASTCompiler.getIdentifier(callContext.context, callContext.name, callContext.computed);

                return ASTCompiler.func(name, args);

            },
            [ASTBuilder.IDENTIFIER]: () => {

                const identifier = this.nextVar;

                this.append = ASTCompiler.setPropertyValue(identifier, $locals, ast.name);
                this.append = ASTCompiler.elsePath(ASTCompiler.setPropertyValue(identifier, $scope, ast.name));

                if (context) {

                    context.computed = false;
                    context.context = `${ASTCompiler.getHasOwnProperty($locals, ast.name)} ? ${$locals}: ${$scope}`;
                    context.name = ast.name;

                }

                return identifier;

            },
            [ASTBuilder.LITERAL]: () => ASTCompiler.escape(ast.value),
            [ASTBuilder.LOCALS]: () => $locals,
            [ASTBuilder.OBJECT]: () => `{${
                ast.properties.map(({key, value}) => `${
                    key.type === ASTBuilder.IDENTIFIER ? key.name : ASTCompiler.escape(key.value)
                    }: ${this.recurse(value)}`)
                }}`,
            [ASTBuilder.OBJECT_PROPERTY_EXPRESSION]: () => {

                const identifier = this.nextVar;
                const object = this.recurse(ast.object);
                const property = ast.computed ? this.recurse(ast.property) : ast.property.name;

                if (context) {

                    context.computed = ast.computed;
                    context.context = object;
                    context.name = property;

                }

                this.append = ASTCompiler.setPropertyValue(identifier, object, property, ast.computed);

                return identifier;

            },
            [ASTBuilder.PROGRAM]: () => this.append = `return ${this.recurse(ast.body)};`,
            [ASTBuilder.THIS]: () => $scope
        };

        return nodeTypes[ast.type]();

    }

}
