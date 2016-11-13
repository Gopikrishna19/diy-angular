import literals from '../literals';

/* eslint-disable complexity */
export default class Lexer {

    static isFloating(text, index) {

        const char = text[index];

        return Lexer.isNumber(char) || (char === '.' && Lexer.isNumber(Lexer.peek(text, index)));

    }

    static isNumber(char) {

        return char >= '0' && char <= '9';

    }

    static isNumeric(char) {

        return [
            char === '.',
            Lexer.isNumber(char)
        ].some(condition => condition);

    }

    static isValidExpOperator(char) {

        return [
            char === '+',
            char === '-',
            Lexer.isNumber(char)
        ].some(condition => condition);

    }

    static peek(text, index) {

        return text.charAt(index + 1);

    }

    static throwUnexpectedNextCharError(char) {

        throw new Error(`${literals.UNEXPECTED_NEXT_CHAR} ${char}`);

    }

    lex(text) {

        this.index = 0;

        const tokens = [];
        let char;

        while (this.index < text.length) {

            char = text.charAt(this.index);

            if (Lexer.isFloating(text, this.index)) {

                tokens.push(this.readNumber(text));

            } else {

                Lexer.throwUnexpectedNextCharError(char);

            }

        }

        return tokens;

    }

    readNumber(text) {

        let char,
            number = '';

        while (this.index < text.length) {

            char = text.charAt(this.index).toLowerCase();

            if (Lexer.isNumeric(char)) {

                number += char;

            } else {

                const nextChar = Lexer.peek(text, this.index);
                const prevChar = number.charAt(number.length - 1);

                if (char === 'e' && Lexer.isValidExpOperator(nextChar)) {

                    number += char;

                } else if (Lexer.isValidExpOperator(char) && prevChar === 'e' && nextChar && Lexer.isNumber(nextChar)) {

                    number += char;

                } else if (Lexer.isValidExpOperator(char) && prevChar === 'e' && (!nextChar || !Lexer.isNumber(nextChar))) {

                    Lexer.throwUnexpectedNextCharError(char);

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

}
