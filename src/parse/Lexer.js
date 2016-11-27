import ASTBuilder from './ASTBuilder';
import literals from '../literals';

export default class Lexer {

    static ESCAPES = {
        '"': '"',
        '\'': '\'',
        '`': '`',
        f: '\f',
        n: '\n',
        r: '\r',
        t: '\t',
        v: '\v'
    };

    static hasDecimals(char) {

        return [
            char === '.',
            Lexer.isNumber(char)
        ].some(condition => condition);

    }

    static is(char, chars) {

        return chars.indexOf(char) >= 0;

    }

    static isFloating(text, index) {

        const char = text[index];

        return Lexer.isNumber(char) || (char === '.' && Lexer.isNumber(Lexer.peek(text, index)));

    }

    static isIdentifier(char) {

        return [
            char >= 'a' && char <= 'z',
            char >= 'A' && char <= 'Z',
            Lexer.is(char, '_$')
        ].some(condition => condition);

    }

    static isNumber(char) {

        return char >= '0' && char <= '9';

    }

    static isOperator(text, index) {

        const char = text[index];
        const operator1 = char;
        const operator2 = char + Lexer.peek(text, index);
        const operator3 = char + Lexer.peek(text, index) + Lexer.peek(text, index + 1);

        return [
            Lexer.is(operator3, ASTBuilder.OPERATORS),
            Lexer.is(operator2, ASTBuilder.OPERATORS),
            Lexer.is(operator1, ASTBuilder.OPERATORS)
        ].some(condition => condition);

    }

    static isQuote(char) {

        return Lexer.is(char, '\'"`');

    }

    static isStructSymbol(char) {

        return Lexer.is(char, '[]{}:,.()?;');

    }

    static isValidExpOperator(char) {

        return [
            Lexer.is(char, ASTBuilder.ADDITIVES),
            Lexer.isNumber(char)
        ].some(condition => condition);

    }

    static isWhitespace(char) {

        return Lexer.is(char, ' \r\t\n\v\u00A0');

    }

    static peek(text, index) {

        return text.charAt(index + 1);

    }

    static throwUnexpectedCharError(char) {

        throw new Error(`${literals.UNEXPECTED_CHARACTER} ${char}`);

    }

    lex(text) {

        this.index = 0;

        const tokens = [];
        let char;

        while (this.index < text.length) {

            char = text.charAt(this.index);

            if (Lexer.isFloating(text, this.index)) {

                tokens.push(this.readNumber(text));

            } else if (Lexer.isQuote(char)) {

                tokens.push(this.readString(text, char));

            } else if (Lexer.isStructSymbol(char)) {

                tokens.push({text: char});

                this.index += 1;

            } else if (Lexer.isIdentifier(char)) {

                tokens.push(this.readIdentifier(text));

            } else if (Lexer.isWhitespace(char)) {

                this.index += 1;

            } else if (Lexer.isOperator(text, this.index)) {

                tokens.push(this.readOperator(text));

            } else {

                Lexer.throwUnexpectedCharError(char);

            }

        }

        return tokens;

    }

    readIdentifier(text) {

        let char,
            identifier = '';

        while (this.index < text.length) {

            char = text.charAt(this.index);

            if (Lexer.isIdentifier(char) || Lexer.isNumber(char)) {

                identifier += char;

            } else {

                break;

            }

            this.index += 1;

        }

        return {
            identifier: true,
            text: identifier
        };

    }

    readNumber(text) {

        let char,
            number = '';

        while (this.index < text.length) {

            char = text.charAt(this.index).toLowerCase();

            if (Lexer.hasDecimals(char)) {

                number += char;

            } else {

                const nextChar = Lexer.peek(text, this.index);
                const prevChar = number.charAt(number.length - 1);

                if (char === 'e' && Lexer.isValidExpOperator(nextChar)) {

                    number += char;

                } else if (Lexer.isValidExpOperator(char) && prevChar === 'e' && nextChar && Lexer.isNumber(nextChar)) {

                    number += char;

                } else if (Lexer.isValidExpOperator(char) && prevChar === 'e' && (!nextChar || !Lexer.isNumber(nextChar))) {

                    Lexer.throwUnexpectedCharError(char);

                } else {

                    break;

                }

            }

            this.index += 1;

        }

        return {
            text: number,
            value: Number(number)
        };

    }

    readOperator(text) {

        const {index} = this;
        const char = text[index];
        const operator1 = char;
        const operator2 = char + Lexer.peek(text, index);
        const operator3 = char + Lexer.peek(text, index) + Lexer.peek(text, index + 1);
        let operator = operator1;

        if (Lexer.is(operator3, ASTBuilder.OPERATORS)) {

            operator = operator3;

        } else if (Lexer.is(operator2, ASTBuilder.OPERATORS)) {

            operator = operator2;

        }

        this.index += operator.length;

        return {
            text: operator
        };

    }

    readString(text, quote) {

        let char,
            escape = false,
            original = quote,
            string = '';

        this.index += 1;

        while (this.index < text.length) {

            char = text.charAt(this.index);
            original += char;

            if (escape) {

                if (char === 'u') {

                    const hexLength = 4;
                    const radix = 16;
                    const hex = text.substring(this.index + 1, this.index + hexLength + 1);

                    if (!/[\da-f]{4}/i.test(hex)) {

                        throw new Error(literals.INVALID_UNICODE);

                    }

                    this.index += hexLength;

                    string += String.fromCharCode(parseInt(hex, radix));

                } else {

                    const escapedChar = Lexer.ESCAPES[char];

                    string += escapedChar ? escapedChar : char;

                }

                escape = false;

            } else if (char === quote) {

                this.index += 1;

                return {
                    text: original,
                    value: string
                };

            } else if (char === '\\') {

                escape = true;

            } else {

                string += char;

            }

            this.index += 1;

        }

        throw new Error(literals.MISMATCHED_QUOTES);

    }

}
