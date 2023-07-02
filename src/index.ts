import dotenv from "dotenv";
dotenv.config();
import { generateSummary } from "./invokegpt";
import { loadSubtitle } from "./load";

async function main() {
    let { text: subs, channelname, title } = await loadSubtitle("https://www.youtube.com/watch?v=gWOXSh4-Iuc");
    console.log(`Downloaded subtitles for video ${title} by ${channelname}. Characters:`, subs.length);

    let instruction = "Summarize the 'ultimate timeline' discussed in the video in bullet points.";
    let response = await generateSummary(subs, title, channelname, instruction);

    console.log(response, response.length);
}

main();
