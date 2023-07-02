import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function generateSummary(input: string, title: string, channelname: string, instruction: string) {
    let fullmessage =
`The following is a transcript of a video titled ${title} by ${channelname}:
\`\`\`
${input}
\`\`\

${instruction}
`
    
    return await invokeModel([
        { role: "system", content: "You are an AI designed to summarize long transcripts of videos." },
        { role: "user", content: fullmessage },
    ]);
}

async function invokeModel(messages: ChatCompletionRequestMessage[]) {
    const { data } = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-16k",
        messages,
    });
    
    const message = data.choices[0].message;
    if (message?.role != "assistant" || !message?.content) throw new Error("Invalid response from LLM: " + JSON.stringify(message));
    console.log("Finsh reason:", data.choices[0].finish_reason)
    return message.content;
}