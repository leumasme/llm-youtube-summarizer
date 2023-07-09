import { Client, Events, GatewayIntentBits } from "discord.js"
import { loadSubtitle } from "./load";
import { generateSummary } from "./invokegpt";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
})

// fuck slash commands, we use old school text commands
// [[ Why? Typing slash commands sucks because I don't like pressing tab to switch between arguments 
//    + I use an old pre-react discord app on android since the react one is still buggy as hell     ]]

const ytRegex = /(youtu\.be)|(youtube\.[a-z]+)$/i
function isYoutubeUrl(input: string) {
    let url: URL;
    try {
        url = new URL(input);
    } catch { return false }

    return ytRegex.test(url.hostname)
}

client.on(Events.MessageCreate, async (msg) => {
    console.log("Got message ", msg.content)
    if (msg.channel.isDMBased() || msg.author.bot || msg.content == "") return;

    let [url, argsStr, ...instructionArr] = msg.content.split(" ")

    if (!isYoutubeUrl(url)) return;

    // Clean up command
    // argsStr should start with -
    // + at start of instruction stands for append to default instruction
    if (argsStr == undefined) {
        argsStr = "-"
        instructionArr = ["+"]
    } else if (!argsStr.startsWith("-")) {
        instructionArr.unshift(argsStr)
        argsStr = "-"
    } else if (instructionArr.length == 0) {
        instructionArr = ["+"]
    }
    
    let timestampInterval: number | undefined = undefined;

    let args = argsStr.slice(1).split("");
    let defaultInstruction = "Summarize the content of the video.";

    if (args.includes("o") && args.length > 1) {
        msg.reply("Error: Arguments o must be the only argument.");
    }

    if (args.includes("t")) {
        defaultInstruction = "Summarize the content of the video. Pay special attention to answer any questions that the title of the video provokes."
    }
    if (args.includes("o")) {
        defaultInstruction = "Provide an outline of the video as bullet points. Include a timestamp at the end of each point to reference where the topic begins in the video."
        timestampInterval = 30;
    }
    if (args.includes("s")) {
        timestampInterval = 30;
        defaultInstruction += " Include timestamps to reference parts of the video where appropriate.";
    }
    let instruction = instructionArr.join(" ").trim();

    // If the message starts with +, append to the default instruction
    instruction = instruction.replace(/^\+/, defaultInstruction + " ").trim();

    msg.react("👌")

    let { text: subs, channelname, title } = await loadSubtitle(url.toString(), timestampInterval);
    console.log(`Video ${url.toString()} : '${title}' by ${channelname} requested by ${msg.author.username}`);
    console.log("Instruction:", instruction)
    console.log("timestampInterval:", timestampInterval)

    try {
        var { text, cost } = await generateSummary(subs, title, channelname, instruction);
    } catch (e) {
        if (e instanceof Error) {
            msg.reply("Error: " + e.message);
            debugger;
            return;
        } else throw e;
    }

    let response = text + "\n" + `*This query cost ${Math.round(cost * 100) / 100}ct*`;

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