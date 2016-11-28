import Lexer from './Lexer';
import Parser from './Parser';

export default expression => {

    if (typeof expression === 'function') {

        return expression;

    }

    const lexer = new Lexer();
    const parser = new Parser(lexer);

    return parser.parse(expression);

};
