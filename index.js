const { Client, GatewayIntentBits, Partials, InteractionType } = require("discord.js");
const {MessageEmbed,ApplicationCommandOptionType, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle} = require("discord.js");
require('dotenv').config();
const Parser = require("./parser");
const Tokenizer = require("./tokenizer");
const Tree = require("./tree");
const { createCanvas } = require('canvas');
const canvas = createCanvas(100, 100);
const strings = require("./strings.json");
const { DiscordAPIError } = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds], partials: [Partials.Channel] });

async function set_command(guild) {
	const commands=[
		{
			name: "tree",
			description: "文字列を樹形図に変換する",
		},
		{
			name: "help",
			description: "ヘルプ",
		},
	];
	console.log("コマンドを登録しました:" + guild.id + "(" + guild.name + ")" );
	await client.application.commands.set(commands, guild.id);
}
function ValidateTokensException(message) {
	this.message = message;
	this.name = 'ValidateTokensException';
 }
function validateTokens(tokens) {
    if (tokens.length < 3) throw new ValidateTokensException('Phrase too short');
    if (tokens[0].type !== Tokenizer.TokenType.BRACKET_OPEN ||
        tokens[tokens.length - 1].type !== Tokenizer.TokenType.BRACKET_CLOSE)
        throw new ValidateTokensException( 'Phrase must start with [ and end with ]');
    const brackets = countOpenBrackets(tokens);
    if (brackets > 0) throw new ValidateTokensException(brackets + ' bracket(s) open [');
    if (brackets < 0) throw new ValidateTokensException(Math.abs(brackets) + ' too many closed bracket(s) ]');
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

function get_option_value2(interaction, name, initial_value) {
	const v = interaction.fields.getTextInputValue(name);
	if (v == null) {
		return initial_value;
	}
	return v.toLowerCase() === '1';
}
function _createModal(phrase) {
	const modal = new ModalBuilder()
	.setCustomId("form")
	.setTitle('Yuru-Syntax-Tree');
	const row1 = new ActionRowBuilder().addComponents(
		new TextInputBuilder()
		.setCustomId('phrase')
		.setLabel("phrase")
		.setValue(phrase)
		.setStyle(TextInputStyle.Paragraph)
	);
	const row2 = new ActionRowBuilder().addComponents(
		new TextInputBuilder()
		.setCustomId('color')
		.setLabel("color")
		.setStyle(TextInputStyle.Short)
		.setMaxLength(1).setMinLength(1)
		.setValue("1")
	);
	const row3= new ActionRowBuilder().addComponents(
		new TextInputBuilder()
		.setCustomId('auto_subscript')
		.setLabel("auto_subscript")
		.setStyle(TextInputStyle.Short)
		.setMaxLength(1).setMinLength(1)
		.setValue("0")
	);
	const row4= new ActionRowBuilder().addComponents(
		new TextInputBuilder()
		.setCustomId('triangles')
		.setLabel("triangles")
		.setStyle(TextInputStyle.Short)
		.setMaxLength(1).setMinLength(1)
		.setValue("1")
	);
	const row5= new ActionRowBuilder().addComponents(
		new TextInputBuilder()
		.setCustomId('align_at_bottom')
		.setLabel("align_at_bottom")
		.setStyle(TextInputStyle.Short)
		.setMaxLength(1).setMinLength(1)
		.setValue("1")
	);

	modal.addComponents( row1,row2,row3,row4, row5);
	return modal;
}
client.on("interactionCreate", async function (interaction) {
	if (interaction.type == InteractionType.ApplicationCommand){
		const { commandName } = interaction;
		switch (commandName) {
			case "tree":
				{
					interaction.showModal(_createModal("[S [NP jsSyntaxTree][VP [V creates][NP nice syntax trees ->1]]]"));
				}
				break;
			case "help":
				await sendHelp(interaction);
				break;
		}
	}
	if (interaction.type == InteractionType.ModalSubmit) {
		if (interaction.customId=="form") {
			const phrase = interaction.fields.getTextInputValue('phrase');
			let color = get_option_value2(interaction,"color", true);
			let subscript = get_option_value2(interaction,"auto_subscript", false);
			let triangles = get_option_value2(interaction,"triangles", true);
			let align_bottom = get_option_value2(interaction,"align_at_bottom", true);
			await sendTree(interaction, phrase, color, subscript, triangles, align_bottom);
		}
	}
})

client.once("ready", async () => {
    client.user.setPresence({
        status: "online",
        activity: {
            name: "/help for info",
            type: "PLAYING"
        }
    });
	for (let guild of client.guilds.cache.values()) {
		await set_command(guild);
	}
	console.log("ready");
});

client.on("guildCreate", async guild=>{
	await set_command(guild);
	console.log("guildCreate:" + guild.name);
});

async function sendTree(interaction, phrase, color, subscript, triangles,align_bottom) {
	await interaction.deferReply();
	const phrase2 = phrase.replace(/\r?\n/g, ' ');
    try {
		const tree = new Tree.Tree();
		tree.setColor(color);
		tree.setSubscript(subscript); 
		tree.setTriangles(triangles);
		tree.setAlignBottom(align_bottom);
		tree.setCanvas(canvas);
		const tokens = Tokenizer.tokenize(phrase2);
        validateTokens(tokens);
        const syntaxTree = Parser.parse(tokens);
        tree.draw(syntaxTree);
        const imgBuffer = tree.download();
        interaction.followUp(
			{
				content:phrase,
				files:[{ attachment: imgBuffer }]
			}
		);
    } catch (err) {
		console.log(err);
		if (err instanceof DiscordAPIError) {
			interaction.followUp("通信に失敗したけど心配しないで続けてください");
		} else if (err instanceof ValidateTokensException) {
			interaction.followUp(err.message);
		} else {
			interaction.followUp("何か失敗したけど心配しないで続けてください");
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

client.login(process.env.BOT_TOKEN);