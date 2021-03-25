const Parser = require("./parser");
const Tokenizer = require("./tokenizer");
const Tree = require("./tree");
const { createCanvas } = require('canvas');
const canvas = createCanvas(100, 100);

const tree = new Tree.Tree();
tree.setCanvas(canvas);
const phrase = "[A B C]]";

try {
    const tokens = Tokenizer.tokenize(phrase);
    validateTokens(tokens);

    const syntaxTree = Parser.parse(tokens);
    tree.draw(syntaxTree);
} catch (err) {
    console.error(err);
}

tree.download();


function validateTokens(tokens) {
    if (tokens.length < 3) throw 'Phrase too short';
    if (tokens[0].type !== Tokenizer.TokenType.BRACKET_OPEN ||
        tokens[tokens.length - 1].type !== Tokenizer.TokenType.BRACKET_CLOSE)
        throw 'Phrase must start with [ and end with ]';
    const brackets = countOpenBrackets(tokens);
    if (brackets > 0) throw brackets + ' bracket(s) open [';
    if (brackets < 0) throw Math.abs(brackets) + ' too many closed bracket(s) ]';
    return null;
}

function countOpenBrackets(tokens) {
    let o = 0;
    for (const token of tokens) {
        if (token.type === Tokenizer.TokenType.BRACKET_OPEN) ++o;
        if (token.type === Tokenizer.TokenType.BRACKET_CLOSE) --o;
    }
    return o;
}