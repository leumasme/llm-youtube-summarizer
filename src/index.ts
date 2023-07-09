import dotenv from "dotenv";
dotenv.config();
import { generateSummary } from "./invokegpt";
import { loadSubtitle } from "./load";

async function main() {
    const youtubeLink = "https://www.youtube.com/watch?v=NlBjVJPkT6M"
    const instruction = "Summarize the key takeaways of the video as bullet points.";

    let timestampsEvery = undefined; // Change to a number of seconds to get timestamps injected into the subtitles every N seconds
    let { text: subs, channelname, title } = await loadSubtitle(youtubeLink, timestampsEvery);
    console.log(`Downloaded subtitles for video ${title} by ${channelname}. Characters:`, subs.length);

    let response = await generateSummary(subs, title, channelname, instruction);

    console.log(response, response.length);
}

main();
