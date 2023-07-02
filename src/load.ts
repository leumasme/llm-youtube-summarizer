import { readFile, writeFile } from "fs/promises";
import ytdl from "youtube-dl-exec";

async function downloadSubtitle(link: string) {
    let subLang = "en";
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
    });
    
    return {
        filename: `${output}.${subLang}.${subFormat}`,
        channelname: result.channel,
        title: result.title,
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

export async function loadSubtitle(link: string) {
    const result = await downloadSubtitle(link);
    // const filename = "sub.en.json3"; // TODO: remove or add caching
    const file = await readFile(result.filename, "utf-8");
    const data: J3Subtitle = JSON.parse(file.toString());

    const text = data.events
        .map(x => x.segs?.map(seg => seg.utf8).join(""))
        .filter(x => x != null)
        .join("")

    return { ...result, text };
}