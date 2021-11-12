import * as ytdl from "ytdl-core"
import { exec as syncExec } from "child_process"
import * as util from "util"
import { unlink } from "fs"
const exec = util.promisify(syncExec)
import * as fs from "fs"

export class FFmpegService {
    async download(url: string, filename: string, filter: string) {
        const info = await ytdl.getInfo(url)
        console.log(info.videoDetails.title)
        const len = info.videoDetails.lengthSeconds
        if (~~len >= 60 * 5) {
            throw new Error("audio is too long")
        }
        const audioLow = []
        const audioMedium = []
        for (const item of info.formats) {
            if (item?.audioQuality === "AUDIO_QUALITY_MEDIUM") {
                audioMedium.push(item.url)
                break
            } else if (item?.audioQuality === "AUDIO_QUALITY_LOW") {
                audioLow.push(item.url)
            }
        }
        let downloadURL = ""
        if (audioMedium.length) {
            downloadURL = audioMedium[0]
        } else if (audioLow.length) {
            downloadURL = audioLow[0]
        }
        if (!downloadURL) {
            throw new Error("no audio found")
        }
        if (filter === "default") {
            filter = ""
        } else if (filter === "3d") {
            filter = ` -i ./test/church.mp3 -filter_complex \
            '[0] [1] afir=dry=10:wet=10 [reverb]; [0] [reverb] amix=inputs=2:weights=1' `
        } else if (filter === "nightcore") {
            filter = `-filter:a "atempo=1.06,asetrate=44100*1.25"`
        }
        try {
            await exec(`
                ffmpeg -i '${downloadURL}' ${filter} \
                -c:a mp3 -strict -2 -b:a 192k \ 
                ${filename}.mp3 -y
            `)
        } catch (e) {
            console.log(e)
        }
    }
}

const test = new FFmpegService()
;(async () => {
    console.time("start")
    await test.download("https://youtu.be/qzUU5tfFAeA", "sex", "3d")
    console.timeEnd("start")
    process.exit(0)
})()
