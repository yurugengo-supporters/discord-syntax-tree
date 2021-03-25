const Parser = require("./parser");
const Tokenizer = require("./tokenizer");
const Tree = require("./tree");
const { createCanvas } = require('canvas');
const canvas = createCanvas(100, 100);

const tree = new Tree.Tree();
tree.setCanvas(canvas);
const phrase = "[A [B C][D E][F G ->1]]";
const tokens = Tokenizer.tokenize(phrase);
const syntaxTree = Parser.parse(tokens)
tree.draw(syntaxTree);
tree.download();