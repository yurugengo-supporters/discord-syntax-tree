const { Client, Intents, MessageAttachment, MessageEmbed, SnowflakeUtil } = require("discord.js");
const config = require("./config");
const Parser = require("./parser");
const Tokenizer = require("./tokenizer");
const Tree = require("./tree");
const { createCanvas } = require('canvas');
const canvas = createCanvas(100, 100);
const strings = require("./strings.json");

const intents = new Intents();
intents.add([Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]);
const client = new Client({ intents: intents });
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

client.on("messageCreate", function (message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const commandBody = message.content.slice(PREFIX.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    switch (command) {
        case "tree":
            const phrase = args.join(' ');
            sendTree(message, phrase);
            break;
        case "help":
            sendHelp(message);
            break;
    }
});

client.on("ready", function () {
    client.user.setPresence({
        status: "online",
        activity: {
            name: "!help for info",
            type: "PLAYING"
        }
    });
});

function sendTree(message, phrase) {
    const tree = new Tree.Tree();
    tree.setSubscript(false); // Turn off subscript numbers
    tree.setCanvas(canvas);

    try {
        const tokens = Tokenizer.tokenize(phrase);
        validateTokens(tokens);

        const syntaxTree = Parser.parse(tokens);
        tree.draw(syntaxTree);
        const imgBuffer = tree.download();
        const attachment = new MessageAttachment(imgBuffer, "syntax_tree.png");
        message.channel.send({ files: [attachment] });
    } catch (err) {
        message.channel.send(err);
    }
}

function sendHelp(message) {
    const embed = new MessageEmbed()
        .setTitle("How I work")
        .setColor("#47bdff")
        .setDescription(strings.helpMessage);
    message.channel.send({ embeds: [embed] });
}

client.login(config.BOT_TOKEN);