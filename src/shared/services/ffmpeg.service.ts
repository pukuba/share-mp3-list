import * as ytdl from "ytdl-core"
import { exec as syncExec } from "child_process"
import * as util from "util"
import { unlink } from "fs"
const exec = util.promisify(syncExec)
import * as fs from "fs"
const deleteFile = util.promisify(unlink)

import * as gad from "get-audio-duration"

export class FFmpegService {
    async filterByYoutube(url: string, filename: string, filter: string) {
        const info = await ytdl.getInfo(url)
        const len = info.videoDetails.lengthSeconds
        const title = info.videoDetails.title
        if (~~len >= 60 * 6) {
            throw new Error("audio is too long")
        }
        try {
            await exec(`
                yt-dlp -f bestaudio -o test/${filename}.mp3 -x --audio-format mp3 ${url} --exec \
                "ffmpeg -i {} ${this.filtering(filter)} \
                test/${filename}-1.mp3 -y && rm {}"
            `)
            return title
        } catch (e) {
            console.log(e)
        }
    }

    async filterByFile(file: Buffer, filename: string, filter: string) {
        fs.writeFileSync(`test/${filename}.mp3`, file, "binary")
        try {
            await exec(`
                ffmpeg -i test/${filename}.mp3 ${this.filtering(filter)} \
                -c:a mp3 -strict -2 -b:a 192k \
                test/${filename}-1.mp3 -y && rm test/${filename}.mp3
            `)
        } catch (e) {
            console.log(e)
        }
    }

    async removeFile(filename: string) {
        try {
            await deleteFile(`test/${filename}.mp3`)
        } catch (e) {
            console.log(e)
        }
    }

    private filtering(filter: string) {
        if (filter === "Default") {
            filter = ""
        } else if (filter === "Stereo") {
            filter = ` -i ./test/church.mp3 -filter_complex \
            '[0] [1] afir=dry=10:wet=10 [reverb]; [0] [reverb] amix=inputs=2:weights=1' `
        } else if (filter === "NightCore") {
            filter = `-filter:a atempo=1.06,asetrate=44100*1.25`
        } else if (filter === "NoiseFilter") {
            filter = `-af arnndn=m=./test/mp.rnnn`
        } else {
            filter = ""
        }
        return filter
    }

    async getAudioDuration(uri: string) {
        let duration
        try {
            duration = await gad.getAudioDurationInSeconds(uri)
        } catch (e) {
            throw new Error("음원 파일을 정상적으로 읽지 못했습니다")
        }
        if (duration > 60 * 5) {
            throw new Error("음원이 너무 길어요")
        }
        return duration
    }
}
