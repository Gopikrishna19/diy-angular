import ASTBuilder from './ASTBuilder';
import literals from '../literals';

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

    static assertMethod(method) {

        if (ASTBuilder.INSECURE_METHODS.indexOf(method) >= 0) {

            throw new Error(`${literals.PROPERTY_ACCESS_DENIED} ${method}`);

        }

    }

    static assertComputedMethod(method) {

        return `assertMethod(${method});`;

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

    static not(condition) {

        return `!(${condition})`;

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

        return new Function(
            'assertMethod',
            `return function(${$scope}, ${$locals}) { ${this.state.body.join('').replace(/;+/g, ';')} }`
        )(ASTCompiler.assertMethod);

    }

    recurse(ast, context = null, sync = false) {

        const nodeTypes = {
            [ASTBuilder.ARRAY]: () => `[${
                ast.elements.map(element => this.recurse(element))
                }]`,
            [ASTBuilder.ASSIGNMENT]: () => {

                const assignContext = {};

                this.recurse(ast.name, assignContext, true);

                return ASTCompiler.assign(
                    ASTCompiler.getIdentifier(assignContext.context, assignContext.name, assignContext.computed),
                    this.recurse(ast.value)
                );

            },
            [ASTBuilder.FUNCTION]: () => {

                const callContext = {};
                const args = ast.args.map(arg => this.recurse(arg));
                let name = this.recurse(ast.callee, callContext);

                if (callContext.name) {

                    name = ASTCompiler.getIdentifier(callContext.context, callContext.name, callContext.computed);

                }

                return ASTCompiler.func(name, args);

            },
            [ASTBuilder.IDENTIFIER]: () => {

                ASTCompiler.assertMethod(ast.name);

                const identifier = this.nextVar;

                this.append = ASTCompiler.setPropertyValue(identifier, $locals, ast.name);
                this.append = ASTCompiler.elsePath(
                    (sync ? ASTCompiler.ifPath(
                        ASTCompiler.not(ASTCompiler.getHasOwnProperty($scope, ast.name)),
                        ASTCompiler.assign(ASTCompiler.getIdentifier($scope, ast.name, ast.computed), '{}')
                    ) : '') + ASTCompiler.setPropertyValue(identifier, $scope, ast.name)
                );

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
                const object = this.recurse(ast.object, null, sync);
                const property = ast.computed ? this.recurse(ast.property) : ast.property.name;

                if (ast.computed) {

                    this.append = ASTCompiler.assertComputedMethod(property);

                } else {

                    ASTCompiler.assertMethod(property);

                }

                if (context) {

                    context.computed = ast.computed;
                    context.context = object;
                    context.name = property;

                }

                if (sync) {

                    const propertyPath = ASTCompiler.getIdentifier(object, property, ast.computed);

                    this.append = ASTCompiler.ifPath(
                        ASTCompiler.not(propertyPath),
                        ASTCompiler.assign(propertyPath, '{}')
                    );

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
