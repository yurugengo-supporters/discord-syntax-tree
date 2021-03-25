const { Client, MessageAttachment } = require("discord.js");
const config = require("./config");
const Parser = require("./parser");
const Tokenizer = require("./tokenizer");
const Tree = require("./tree");
const { createCanvas } = require('canvas');
const canvas = createCanvas(100, 100);

const client = new Client();
const PREFIX = "!";

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

client.on("message", function (message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const commandBody = message.content.slice(PREFIX.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();
    const phrase = args.join(' ');

    if (command === "tree") {
        const tree = new Tree.Tree();
        tree.setCanvas(canvas);

        try {
            const tokens = Tokenizer.tokenize(phrase);
            validateTokens(tokens);

            const syntaxTree = Parser.parse(tokens);
            tree.draw(syntaxTree);
            const imgBuffer = tree.download();
            const attachment = new MessageAttachment(imgBuffer);
            message.channel.send(null, attachment);
        } catch (err) {
            message.channel.send(err);
        }
    }
});

client.login(config.BOT_TOKEN);