## This branch

On this branch, I converted the script into a discord bot to make it easy and quick to use.  
I will not host a public instance of the bot since I don't want to pay for the OpenAI for people I don't know.  
If you want to host it, see the updated "Usage" 

# LLM Youtube Summarizer

- Youtube recently significantly improved the quality of the automatically generated captions
- GPT3.5 can handle up to 16k tokens
- You can download the captions of a youtube video using yt-dl

So let's make GPT3.5 summarize Youtube Videos!  
16k tokens is a lot. For example, [this](https://www.youtube.com/watch?v=NlBjVJPkT6M) 50 minute NDC talk has about 10k tokens.  
Currently, the pricing is 0.3/0.4ct per 1k tokens, so processing that 50 minute video costs ~3ct.

This project was mainly created as a test and published to showcase how trivial it is to build something decently useful with LLMs.  
As always, LLMs may produce inaccurate output, especially for very long transcripts, so you probably shouldn't use this for anything really important.

## Usage

- Clone the Repository
- Install NodeJS if you haven't already
- Run `npm i` in the project directory to install dependencies
- Create a file called `.env` in the project directory with the content `OPENAI_API_KEY=paste_your_api_key_here` and `DISCORD_TOKEN=paste_your_discord_bot_token_here`
  - You can get a Discord Bot token [here](https://discord.com/developers/applications)
  - You can get an OpenAI API key [here](https://platform.openai.com/account/api-keys)
  - You should probably set a Usage limit on your OpenAI account so you dont accidentally spam their api somehow and rack up a bill.
- Run `npm start` in the project directory and wait ~15 seconds. You should see the result

## TODO
- [ ] Use GPT3.5-4k
  - It's ~50% cheaper but only supports 4k tokens instead of 16k
  - Either only use it for short videos or split long scripts up into parts and process them independently, then process the output of each of the parts to answer the User's prompt
    - This way we could also support arbitrary-length videos, even longer than 16k tokens 
- [X] ~~Add a CLI~~ Turn it into a discord bot!
