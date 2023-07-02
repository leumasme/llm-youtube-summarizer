import { readFile, writeFile } from "fs/promises";
import ytdl from "youtube-dl-exec";

async function downloadSubtitle(link: string, preferredLang?: string) {
    let subLang = preferredLang ?? "en";
    let subFormat = "json3";
    let output = "sub";
    const result = await ytdl(link, {
        skipDownload: true,
        writeSub: true,
        writeAutoSub: true,
        printJson: true,
        subLang,
        subFormat,
        output,
    }) as Record<string, any>; // Typings of ytdl are incomplete
    
    
    if (result.subtitles[subLang] == null) {
        if (Object.keys(result.subtitles).length > 0) {
            // If there are manual subtitles in other languages available, we can use those
            let availableSubs = Object.keys(result.subtitles);
            subLang = availableSubs[0];
            console.warn(`Manual subtitles available, but not in the preferred language '${subLang}'`);
            console.warn(`Choosing manual subs: '${subLang}'. Available: ${availableSubs.join(", ")}`);

            await ytdl(link, {
                skipDownload: true,
                writeSub: true,
                subLang,
                subFormat,
                output,
            });
        } else if (result.automatic_captions[subLang] == null) {
            // If there are no subtitles and no captions in the preferred language,
            // fall back to captions in other languages
            if (Object.keys(result.automatic_captions).length > 1) {
                console.warn(`No Manual subtitles available, no automatic captions in the preferred language ${preferredLang} available.`)
                
                let availableSubs = Object.keys(result.automatic_captions);
                // First, prefer a few common constant languages
                let preferred = ["en", "de", "fr", "es", "it"];
                let chosenSub = preferred.find(x => availableSubs.includes(x));
                if (chosenSub == null) {
                    // Otherwise, prefer a language without "-" in it
                    chosenSub = availableSubs.find(x => !x.includes("-"));
                }
                if (chosenSub == null) {
                    // Otherwise, just choose the first one
                    chosenSub = availableSubs[0];
                }
                subLang = chosenSub;
                console.warn(`Choosing automatic captions: '${subLang}'`);
                await ytdl(link, {
                    skipDownload: true,
                    writeAutoSub: true,
                    subLang,
                    subFormat,
                    output,
                });

            } else {
                throw new Error("No subtitles or automatic captions are available for any language.")
            }
        }
    }

    return {
        filename: `${output}.${subLang}.${subFormat}`,
        channelname: result.channel as string,
        title: result.title as string,
    };
}

type J3Subtitle = {
    pens: any[],
    wireMagic: string,
    wpWinPositions: any[],
    wsWinStyles: any[],
    events: {
        aAppend?: number,
        dDurationMs: number,
        id?: number,
        tStartMs: number,
        wpWinPosId?: number,
        wsWinStyleId?: number,
        wWinId?: number,
        segs?: {
            utf8: string,
            toOffsetMs?: number,
            acAsrConf?: number,
        }[]
    }[]
}

export async function loadSubtitle(link: string, lang?: string) {
    const result = await downloadSubtitle(link, lang);
    // const filename = "sub.en.json3"; // TODO: remove or add caching
    const file = await readFile(result.filename, "utf-8");
    const data: J3Subtitle = JSON.parse(file.toString());

    const text = data.events
        .map(x => x.segs?.map(seg => seg.utf8).join("").trim())
        .filter(x => x != null)
        .join(" ")

    return { ...result, text };
}