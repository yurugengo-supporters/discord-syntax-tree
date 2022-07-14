const { Client, Intents, MessageEmbed } = require("discord.js");
const config = require("./config");
const Parser = require("./parser");
const Tokenizer = require("./tokenizer");
const Tree = require("./tree");
const { createCanvas } = require('canvas');
const canvas = createCanvas(100, 100);
const strings = require("./strings.json");
const { DiscordAPIError } = require("discord.js");

const intents = new Intents();
intents.add([Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]);
const client = new Client({ intents: intents });

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

client.on("interactionCreate", async function (interaction) {
	if (interaction.isCommand()){
		const { commandName } = interaction;
		switch (commandName) {
			case "tree":
				const phrase = interaction.options.getString("phrase");
				console.log(phrase);
				await sendTree(interaction, phrase);
				break;
			case "help":
				await sendHelp(interaction);
				break;
		}
	}
})

client.on("ready", function () {
    client.user.setPresence({
        status: "online",
        activity: {
            name: "/help for info",
            type: "PLAYING"
        }
    });
	console.log("ready");
});

async function sendTree(interaction, phrase) {
	await interaction.deferReply();
    try {
		const tree = new Tree.Tree();
		tree.setSubscript(false); // Turn off subscript numbers
		tree.setCanvas(canvas);
		const tokens = Tokenizer.tokenize(phrase);
        validateTokens(tokens);
        const syntaxTree = Parser.parse(tokens);
        tree.draw(syntaxTree);
        const imgBuffer = tree.download();
        interaction.followUp(
			{
				files:[{ attachment: imgBuffer }]
			}
		);
    } catch (err) {
		console.log(err);
		if (err instanceof DiscordAPIError) {
			interaction.followUp("DiscordAPIError");
		} else {
			interaction.followUp(err);
		}
    }
}

async function sendHelp(interaction) {
	await interaction.deferReply();
    const embed = new MessageEmbed()
        .setTitle("How I work")
        .setColor("#47bdff")
        .setDescription(strings.helpMessage);
	interaction.followUp({ embeds: [embed] });
}

client.login(config.BOT_TOKEN);