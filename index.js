const { Client, Intents, MessageEmbed } = require("discord.js");
require('dotenv').config();
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

async function set_command(guild) {
	const commands=[
		{
			name: "tree",
			description: "文字列を樹形図に変換する",
			options: [
				{
					type:"STRING",
					name:"phrase",
					description:"樹形図を表す文字列、[]を使ったやつ",
					required:true,
				},
				{
					type:"STRING",
					name:"color",
					description:"色",
					choices: [
						{ name: "ON", value: "true" },
						{ name: "OFF", value: "false" },
					],
					required:false,
				},
				{
					type:"STRING",
					name:"auto_subscript",
					description:"自動添え字",
					choices: [
						{ name: "ON", value: "true" },
						{ name: "OFF", value: "false" },
					],
					required:false,
				},
				{
					type:"STRING",
					name:"triangles",
					description:"三角",
					choices: [
						{ name: "ON", value: "true" },
						{ name: "OFF", value: "false" },
					],
					required:false,
				},	
				{
					type:"STRING",
					name:"align_at_bottom",
					description:"下寄せ",
					choices: [
						{ name: "ON", value: "true" },
						{ name: "OFF", value: "false" },
					],
					required:false,
				},	
			],
		},
		{
			name: "tree2",
			description: "直前の投稿を樹形図に変換する",
			options: [
				{
					type:"STRING",
					name:"color",
					description:"色",
					choices: [
						{ name: "ON", value: "true" },
						{ name: "OFF", value: "false" },
					],
					required:false,
				},
				{
					type:"STRING",
					name:"auto_subscript",
					description:"自動添え字",
					choices: [
						{ name: "ON", value: "true" },
						{ name: "OFF", value: "false" },
					],
					required:false,
				},
				{
					type:"STRING",
					name:"triangles",
					description:"三角",
					choices: [
						{ name: "ON", value: "true" },
						{ name: "OFF", value: "false" },
					],
					required:false,
				},	
				{
					type:"STRING",
					name:"align_at_bottom",
					description:"下寄せ",
					choices: [
						{ name: "ON", value: "true" },
						{ name: "OFF", value: "false" },
					],
					required:false,
				},	
			],
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

function get_option_value(interaction, name, initial_value) {
	const v = interaction.options.getString(name);
	if (v == null) {
		return initial_value;
	}
	return v.toLowerCase() === 'true';
}

client.on("interactionCreate", async function (interaction) {
	if (interaction.isCommand()){
		const { commandName } = interaction;
		switch (commandName) {
			case "tree":
				{
					const phrase = interaction.options.getString("phrase");
					let color = get_option_value(interaction,"color", true);
					let subscript = get_option_value(interaction,"auto_subscript", false);
					let triangles = get_option_value(interaction,"triangles", true);
					let align_bottom = get_option_value(interaction,"align_at_bottom", true);
					await sendTree(interaction, phrase, color, subscript, triangles, align_bottom);
				}
				break;
			case "tree2":
				{
					const fetched = await interaction.channel.messages.fetch({before : interaction.id, limit:1});
					const before = fetched.values().next().value;
					const phrase = before.content;
					let color = get_option_value(interaction,"color", true);
					let subscript = get_option_value(interaction,"auto_subscript", false);
					let triangles = get_option_value(interaction,"triangles", true);
					let align_bottom = get_option_value(interaction,"align_at_bottom", true);
					await sendTree(interaction, phrase, color, subscript, triangles, align_bottom);
				}
				break;
			case "help":
				await sendHelp(interaction);
				break;
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
	console.log("phrase:" + phrase);
	console.log("color:" + color.toString());
	console.log("auto_subscript:" + subscript.toString());
	console.log("triangles:" + triangles.toString());
	console.log("align_at_bottom:" + align_bottom.toString());
    try {
		const tree = new Tree.Tree();
		tree.setColor(color);
		tree.setSubscript(subscript); 
		tree.setTriangles(triangles);
		tree.setAlignBottom(align_bottom);
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