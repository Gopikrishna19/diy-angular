import literals from '../literals';

export default class ASTBuilder {

    static ARRAY = Symbol.for('ARRAY');
    static ASSIGNMENT = Symbol.for('ASSIGNMENT');
    static FUNCTION = Symbol.for('FUNCTION');
    static IDENTIFIER = Symbol.for('IDENTIFIER');
    static LITERAL = Symbol.for('LITERAL');
    static LOCALS = Symbol.for('LOCALS');
    static OBJECT = Symbol.for('OBJECT');
    static OBJECT_PROPERTY = Symbol.for('OBJECT_PROPERTY');
    static OBJECT_PROPERTY_EXPRESSION = Symbol.for('OBJECT_PROPERTY_EXPRESSION');
    static PROGRAM = Symbol.for('PROGRAM');
    static THIS = Symbol.for('THIS');
    static UNARY = Symbol.for('UNARY');

    static LITERALS = {
        '$locals': {
            type: ASTBuilder.LOCALS
        },
        'false': {
            type: ASTBuilder.LITERAL,
            value: false
        },
        'null': {
            type: ASTBuilder.LITERAL,
            value: null
        },
        'this': {
            type: ASTBuilder.THIS
        },
        'true': {
            type: ASTBuilder.LITERAL,
            value: true
        }
    };

    static INSECURE_METHODS = [
        'constructor',
        '__proto__',
        '__defineGetter__',
        '__defineSetter__',
        '__lookupGetter__',
        '__lookupSetter__'
    ];

    static OPERATORS = ['+', '-', '!'];

    constructor(lexer) {

        this.lexer = lexer;

    }

    assign() {

        const name = this.unary();

        if (this.expect('=')) {

            return {
                name,
                type: ASTBuilder.ASSIGNMENT,
                value: this.unary()
            };

        }

        return name;

    }

    build(text) {

        this.tokens = this.lexer.lex(text);

        return this.program();

    }

    constant() {

        return {
            type: ASTBuilder.LITERAL,
            value: this.consume().value
        };

    }

    consume(text) {

        const token = this.expect(text);

        if (!token) {

            throw new Error(`${literals.UNEXPECTED_EXPECTED} ${text}`);

        }

        return token;

    }

    buildArguments() {

        const args = [];

        if (!this.peek(')')) {

            do {

                args.push((this.assign()));

            } while (this.expect(','));

        }

        return args;

    }

    declareArray() {

        const elements = [];

        if (!this.peek(']')) {

            do {

                if (this.peek(']')) {

                    break;

                }

                elements.push((this.assign()));

            } while (this.expect(','));

        }

        this.consume(']');

        return {
            elements,
            type: ASTBuilder.ARRAY
        };

    }

    declareObject() {

        const properties = [];

        if (!this.peek('}')) {

            do {

                const property = {
                    type: ASTBuilder.OBJECT_PROPERTY
                };

                property.key = this.peek().identifier ? this.identifier() : this.constant();
                this.consume(':');
                property.value = this.assign();

                properties.push(property);

            } while (this.expect(','));

        }

        this.consume('}');

        return {
            properties,
            type: ASTBuilder.OBJECT
        };

    }

    expect(...targets) {

        if (this.peek(...targets)) {

            return this.tokens.shift();

        }

        return null;

    }

    identifier() {

        return {
            name: this.consume().text,
            type: ASTBuilder.IDENTIFIER
        };

    }

    peek(...targets) {

        if (this.tokens.length) {

            const text = this.tokens[0].text;
            const peek = targets.reduce((condition, target) => condition || target === text, false) || !targets.some(target => target);

            if (peek) {

                return this.tokens[0];

            }

        }

        return null;

    }

    primary() {

        let next,
            primary;

        if (this.expect('[')) {

            primary = this.declareArray();

        } else if (this.expect('{')) {

            primary = this.declareObject();

        } else if (ASTBuilder.LITERALS.hasOwnProperty(this.tokens[0].text)) {

            primary = ASTBuilder.LITERALS[this.consume().text];

        } else if (this.peek().identifier) {

            primary = this.identifier();

        } else {

            primary = this.constant();

        }

        while (next = this.expect('.', '[', '(')) {

            if (next.text === '[') {

                primary = {
                    computed: true,
                    object: primary,
                    property: this.assign(),
                    type: ASTBuilder.OBJECT_PROPERTY_EXPRESSION
                };

                this.consume(']');

            } else if (next.text === '.') {

                primary = {
                    computed: false,
                    object: primary,
                    property: this.identifier(),
                    type: ASTBuilder.OBJECT_PROPERTY_EXPRESSION
                };

            } else {

                primary = {
                    args: this.buildArguments(),
                    callee: primary,
                    type: ASTBuilder.FUNCTION
                };

                this.consume(')');

            }

        }

        return primary;

    }

    program() {

        return {
            body: this.assign(),
            type: ASTBuilder.PROGRAM
        };

    }

    unary() {

        const token = this.expect(...ASTBuilder.OPERATORS);

        return token ? {
            operand: this.unary(),
            operator: token.text,
            type: ASTBuilder.UNARY
        } : this.primary();

    }

}
