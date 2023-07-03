import { Client, Events, GatewayIntentBits } from "discord.js"
import { loadSubtitle } from "./load";
import { generateSummary } from "./invokegpt";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
})

// fuck slash commands, we use old school text commands
// [[ Why? Typing slash commands sucks because I don't like pressing tab to switch between arguments 
//    + I use an old pre-react discord app on android since the react one is still buggy as hell     ]]

const ytRegex = /(youtu\.be)|(youtube\.[a-z]+)$/
const defaultInstruction = "Summarize the content of the video.";

client.on(Events.MessageCreate, async (msg) => {
    console.log("Got message ", msg.content)
    if (msg.channel.isDMBased()) return;

    if (!msg.content.startsWith(".s")) return;

    let args = msg.content.split(" ").slice(1)

    if (args.length == 0) return

    let url: URL;
    try {
        url = new URL(args.shift()!);
    } catch { return }

    if (!ytRegex.test(url.hostname)) return;

    let instruction = args.join(" ");
    if (instruction == "") instruction = defaultInstruction;

    let { text: subs, channelname, title } = await loadSubtitle(url.toString());
    console.log(`Video ${url.toString()} : '${title}' by ${channelname} requested by ${msg.author.username}`);

    let response: string;
    try {
        response = await generateSummary(subs, title, channelname, instruction);
    } catch (e) {
        if (e instanceof Error) {
            msg.reply("Error: " + e.message);
            return;
        } else throw e;
    }

    msg.reply(response);
});

// client.on(Events.MessageCreate, async message => {
// 	console.log("Hello")
// });


client.on("ready", () => {
    console.log("Discord bot ready");
})

client.on("error", console.error)
client.on("warn", console.warn);

export function startDiscordBot() {
    client.login(process.env.DISCORD_TOKEN)
    console.log("Logging in to discord...")
}