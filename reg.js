const config = require("./config");

const { Client, Intents, ClientApplication } = require('discord.js');

const commands=[
	{
		name: "tree",
		description: "文字列を樹形図に変換",
		options: [
			{
				type:"STRING",
				name:"phrase",
				description:"樹形図を表す文字列、[]を使ったやつ",
				required:true,
			},
		],
	},
	{
		name: "help",
		description: "ヘルプ",
	},
];
const guildId = process.argv[2];
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
client.token = config.BOT_TOKEN;

(async () => {
    client.application = new ClientApplication(client, {});
    await client.application.fetch();
    await client.application.commands.set(commands, guildId);
    console.log("success!");
})().catch(console.error);