import literals from '../literals';

export default class ASTBuilder {

    static ADDITIVES = ['+', '-'];
    static ARRAY = Symbol.for('ARRAY');
    static ASSIGNMENT = Symbol.for('ASSIGNMENT');
    static ASSIGNMENTS = ['='];
    static BINARY = Symbol.for('BINARY');
    static EQUALITIES = ['==', '!=', '===', '!=='];
    static FUNCTION = Symbol.for('FUNCTION');
    static IDENTIFIER = Symbol.for('IDENTIFIER');
    static LITERAL = Symbol.for('LITERAL');
    static LOCALS = Symbol.for('LOCALS');
    static LOGICAL = Symbol.for('LOGICAL');
    static LOGICAL_OPERATORS = ['&&', '||'];
    static OBJECT = Symbol.for('OBJECT');
    static OBJECT_PROPERTY = Symbol.for('OBJECT_PROPERTY');
    static OBJECT_PROPERTY_EXPRESSION = Symbol.for('OBJECT_PROPERTY_EXPRESSION');
    static MULTIPLICATIVES = ['*', '/', '%'];
    static NEGATIONS = ['!'];
    static PROGRAM = Symbol.for('PROGRAM');
    static RELATIONALS = ['<', '>', '<=', '>='];
    static TERNARY = Symbol.for('TERNARY');
    static THIS = Symbol.for('THIS');
    static UNARY = Symbol.for('UNARY');

    static BINARY_OPERATORS = [
        ...ASTBuilder.ADDITIVES,
        ...ASTBuilder.NEGATIONS,
        ...ASTBuilder.MULTIPLICATIVES,
        ...ASTBuilder.RELATIONALS,
        ...ASTBuilder.ASSIGNMENTS,
        ...ASTBuilder.EQUALITIES
    ];

    static INSECURE_METHODS = [
        'constructor',
        '__proto__',
        '__defineGetter__',
        '__defineSetter__',
        '__lookupGetter__',
        '__lookupSetter__'
    ];

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

    static OPERATORS = [
        ...ASTBuilder.BINARY_OPERATORS,
        ...ASTBuilder.LOGICAL_OPERATORS
    ];

    constructor(lexer) {

        this.lexer = lexer;

    }

    assign() {

        const name = this.ternary();

        if (this.expect('=')) {

            return {
                name,
                type: ASTBuilder.ASSIGNMENT,
                value: this.ternary()
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

    getNextPrecedent(operators, type, nextPrecedent) {

        let left = nextPrecedent(),
            token = this.expect(...operators);

        while (token) {

            left = {
                left,
                operator: token.text,
                right: nextPrecedent(),
                type
            };

            token = this.expect(...operators);

        }

        return left;

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

    /* OPERATIONS */

    unary() {

        const token = this.expect(...ASTBuilder.BINARY_OPERATORS);

        return token ? {
            operand: this.unary(),
            operator: token.text,
            type: ASTBuilder.UNARY
        } : this.primary();

    }

    binary() {

        const multiplicative = () => this.getNextPrecedent(ASTBuilder.MULTIPLICATIVES, ASTBuilder.BINARY, () => this.unary());
        const additive = () => this.getNextPrecedent(ASTBuilder.ADDITIVES, ASTBuilder.BINARY, multiplicative);
        const relational = () => this.getNextPrecedent(ASTBuilder.RELATIONALS, ASTBuilder.BINARY, additive);
        const equality = () => this.getNextPrecedent(ASTBuilder.EQUALITIES, ASTBuilder.BINARY, relational);
        const logicalAND = () => this.getNextPrecedent(['&&'], ASTBuilder.LOGICAL, equality);
        const logicalOR = () => this.getNextPrecedent(['||'], ASTBuilder.LOGICAL, logicalAND);

        return logicalOR();

    }

    ternary() {

        const condition = this.binary();

        if (this.expect('?')) {

            const ifPath = this.assign();

            this.consume(':');

            const elsePath = this.assign();

            return {
                condition,
                elsePath,
                ifPath,
                type: ASTBuilder.TERNARY
            };

        }

        return condition;

    }

}
