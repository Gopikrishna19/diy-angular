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

    static isFloating(text, index) {

        const char = text[index];

        return Lexer.isNumber(char) || (char === '.' && Lexer.isNumber(Lexer.peek(text, index)));

    }

    static isIdentifier(char) {

        return [
            char >= 'a' && char <= 'z',
            char >= 'A' && char <= 'Z',
            char === '_',
            char === '$'
        ].some(condition => condition);

    }

    static isNumber(char) {

        return char >= '0' && char <= '9';

    }

    static isQuote(char) {

        return [
            char === '\'',
            char === '"',
            char === '`'
        ].some(condition => condition);

    }

    static isBraces(char) {

        return [
            char === '{',
            char === '}'
        ].some(condition => condition);

    }

    static isBrackets(char) {

        return [
            char === '[',
            char === ']'
        ].some(condition => condition);

    }

    static isValidExpOperator(char) {

        return [
            char === '+',
            char === '-',
            Lexer.isNumber(char)
        ].some(condition => condition);

    }

    static isWhitespace(char) {

        return [
            char === ' ',
            char === '\r',
            char === '\t',
            char === '\n',
            char === '\v',
            char === '\u00A0'
        ].some(condition => condition);

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

            } else if (Lexer.isBrackets(char) || char === ',') {

                tokens.push({
                    text: char
                });

                this.index += 1;

            } else if (Lexer.isBraces(char) || char === ',') {

                tokens.push({
                    text: char
                });

                this.index += 1;

            } else if (Lexer.isIdentifier(char)) {

                tokens.push(this.readIdentifier(text));

            } else if (Lexer.isWhitespace(char)) {

                this.index += 1;

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

    readString(text, quote) {

        let char,
            escape = false,
            string = '';

        this.index += 1;

        while (this.index < text.length) {

            char = text.charAt(this.index);

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
                    text: string,
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
