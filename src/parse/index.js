import Lexer from './Lexer';
import Parser from './Parser';

export default expression => {

    const lexer = new Lexer();
    const parser = new Parser(lexer);

    return parser.parse(expression);

};
