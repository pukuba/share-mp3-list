import * as ytdl from "ytdl-core"
import { exec as syncExec } from "child_process"
import * as util from "util"
import { unlink } from "fs"
const exec = util.promisify(syncExec)
import * as fs from "fs"
const deleteFile = util.promisify(unlink)

export class FFmpegService {
    async filterByYoutube(url: string, filename: string, filter: string) {
        const info = await ytdl.getInfo(url)
        const len = info.videoDetails.lengthSeconds
        const title = info.videoDetails.title
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
        if (filter === "Default") {
            filter = ""
        } else if (filter === "Stereo") {
            filter = ` -i ./test/church.mp3 -filter_complex \
            '[0] [1] afir=dry=10:wet=10 [reverb]; [0] [reverb] amix=inputs=2:weights=1' `
        } else if (filter === "NightCore") {
            filter = `-filter:a "atempo=1.06,asetrate=44100*1.25"`
        } else {
            filter = ""
        }
        try {
            await exec(`
                ffmpeg -i '${downloadURL}' ${filter} \
                -c:a mp3 -strict -2 -b:a 192k \
                test/${filename}-1.mp3 -y
            `)
            return title
        } catch (e) {
            console.log(e)
        }
    }

    async filterByFile(file: Buffer, filename: string, filter: string) {
        fs.writeFileSync(`test/${filename}.mp3`, file, "binary")
        if (filter === "Default") {
            filter = ""
        } else if (filter === "Stereo") {
            filter = ` -i ./test/church.mp3 -filter_complex \
            '[0] [1] afir=dry=10:wet=10 [reverb]; [0] [reverb] amix=inputs=2:weights=1' `
        } else if (filter === "NightCore") {
            filter = `-filter:a "atempo=1.06,asetrate=44100*1.25"`
        } else {
            filter = ""
        }
        try {
            await exec(`
                ffmpeg -i test/${filename}.mp3 ${filter} \
                -c:a mp3 -strict -2 -b:a 192k \
                test/${filename}-1.mp3 -y
            `)
        } catch (e) {
            console.log(e)
        }
    }

    async removeFile(filename: string) {
        try {
            await deleteFile(`test/${filename}.mp3`)
        } catch {}
    }
}