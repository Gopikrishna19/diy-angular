import Lexer from './Lexer';
import Parser from './Parser';

const hasOnetimeOperator = expression => expression[0] === ':' && expression[1] === ':';

export default expression => {

    const onetime = hasOnetimeOperator(expression);

    if (onetime) {

        expression = expression.slice(2);

    }

    if (typeof expression === 'function') {

        return expression;

    }

    const lexer = new Lexer();
    const parser = new Parser(lexer);
    const parseFn = parser.parse(expression);

    parseFn.onetime = onetime;

    return parseFn;

};
