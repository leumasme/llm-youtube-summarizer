import { readFile } from "fs/promises";
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
        noWarnings: true,
        subLang,
        subFormat,
        output,
    }) as Record<string, any>; // Typings of ytdl are incomplete


    if (result.subtitles[subLang] == null) {
        let availableSubs = Object.keys(result.subtitles)
            .filter(x => result.subtitles[x].some((e: any) => e.ext == subFormat));
        if (availableSubs.length > 0) {
            // If there are manual subtitles in other languages available, we can use those
            console.warn(`Manual subtitles available, but not in the preferred language '${subLang}'`);
            subLang = availableSubs[0];
            console.warn(`Choosing manual subs: '${subLang}'. Available: ${availableSubs.join(", ")}`);

            await ytdl(link, {
                skipDownload: true,
                writeSub: true,
                noWarnings: true,
                subLang,
                subFormat,
                output,
            });
        } else if (result.automatic_captions[subLang] == null) {
            // If there are no subtitles and no captions in the preferred language,
            // fall back to captions in other languages
            let availableSubs = Object.keys(result.automatic_captions)
                .filter(x => result.automatic_captions[x].some((e: any) => e.ext == subFormat));
            if (availableSubs.length > 1) {
                console.warn(`No Manual subtitles available, no automatic captions in the preferred language ${preferredLang} available.`)

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
                    noWarnings: true,
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
        dDurationMs?: number,
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

function msToTimestamp(ms: number) {
    let sec = (Math.floor(ms / 1000) % 60).toString().padStart(2, "0");
    let hour = (Math.floor(ms / 1000 / 60 / 60) % 60);
    let min = (Math.floor(ms / 1000 / 60) % 60).toString();
    if (hour > 0) min = min.padStart(2, "0");

    return hour == 0 ? `[${min}:${sec}]` : `[${hour}:${min}:${sec}]`;
}

// By replacing some characters with their more common counterparts,
// we can likely improve the quality of the generated text and save a few tokens.
const charReplacements: Record<string, string> = {
    "’": "'", // Right single quotation mark
    " ": " ", // Non-breaking space
    "…": "...", // Horizontal ellipsis
}

export async function loadSubtitle(link: string, timestampIntervalSec?: number, lang?: string) {
    const result = await downloadSubtitle(link, lang);
    // const filename = "sub.en.json3"; // TODO: remove or add caching
    const file = await readFile(result.filename, "utf-8");
    const data: J3Subtitle = JSON.parse(file.toString());

    // if (!timestampIntervalSec) {
    //     text = data.events
    //         .map(x => x.segs?.map(seg => seg.utf8).join("").trim())
    //         .filter(x => x != null)
    //         .join(" ")
    // } else {

    const timestampInterval = (timestampIntervalSec ?? Number.POSITIVE_INFINITY) * 1000;

    let textParts: string[] = timestampIntervalSec ? ["[0:00]"] : [];
    let lastTimestamp = 0;
    for (let part of data.events) {
        if (!part.segs) continue;
        if ((lastTimestamp + timestampInterval) < part.tStartMs) {
            // Add a timestamp roughly every {timestampInterval} ms
            // It will always be a bit off, but that doesn't really matter.
            // We might be able to make the timing more accurate for automatic subtitles
            // using the segment timing which is usually word-level. 
            textParts.push(msToTimestamp(part.tStartMs));
            lastTimestamp = part.tStartMs;
        }
        let newText = part.segs.map(seg => seg.utf8).join("").trim();
        if (newText.length == 0) continue;
        textParts.push(part.segs.map(seg => seg.utf8).join("").trim());
    }

    let text = textParts.join(" ");

    for (let [key, value] of Object.entries(charReplacements)) {
        text = text.replaceAll(key, value);
    }

    return { ...result, text };
}