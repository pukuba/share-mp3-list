// Nest dependencies
import { Injectable, BadRequestException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"

// Other dependencies
import { validate } from "class-validator"

// Local files
import { UploadAudioByFileDto, UploadAudioByLinkDto } from "../dto"
import { FFmpegService } from "src/shared/services/ffmpeg.service"
import { AwsService } from "src/shared/services/aws.service"
import { IFile } from "src/shared/types"
import { AudioRepository } from "src/shared/repositories/audio.repository"
import { RedisService } from "src/shared/services/redis.service"

@Injectable()
export class AudioService {
    constructor(
        private readonly awsService: AwsService,
        private readonly redisService: RedisService,
        private readonly ffmpegService: FFmpegService,
        private readonly audioRepository: AudioRepository,
    ) {}

    async uploadAudioByFile(
        userId: string,
        file: IFile,
        payload: UploadAudioByFileDto,
    ) {
        payload.name = payload.name.replace(/^\s+|\s+$/g, "")
        if (!file.originalname.endsWith(".mp3")) {
            throw new BadRequestException("Only mp3 files are allowed")
        }
        if (
            payload.name.length === 0 ||
            file.originalname.split(".mp3")[0].length === 0
        ) {
            throw new BadRequestException("제목이 존재하지 않습니다")
        }
        const dto = new UploadAudioByFileDto()
        dto.name = payload.name || file.originalname.split("mp3")[0]
        dto.filter = payload.filter
        return await validate(dto, { validationError: { target: false } }).then(
            async (errors) => {
                if (errors.length > 0) {
                    throw new BadRequestException("validate error")
                }
                try {
                    const name = `${Date.now()}-${this.createRandomKey()}`
                    await this.ffmpegService.filterByFile(
                        file.buffer,
                        name,
                        dto.filter,
                    )
                    const duration = await this.ffmpegService.getAudioDuration(
                        `test/${name}-1.mp3`,
                    )
                    await this.awsService.uploadFile(
                        `${name}.mp3`,
                        "audio",
                        `test/${name}-1.mp3`,
                    )
                    const [_, newAudio] = await Promise.all([
                        this.ffmpegService.removeFile(`${name}-1`),
                        this.audioRepository.uploadAudio(
                            userId,
                            { ...payload, duration },
                            `https://cdn.pukuba.dev/sharemp3/audio/${name}.mp3`,
                        ),
                    ])
                    return newAudio
                } catch (e) {
                    console.log(e)
                    throw new BadRequestException(
                        "올바르지 않은 음원이거나, 길이가 너무 깁니다 max(300sec)",
                    )
                }
            },
        )
    }

    async uploadAudioByLink(userId: string, payload: UploadAudioByLinkDto) {
        const dto = new UploadAudioByLinkDto()
        dto.youtubeLink = payload.youtubeLink
        dto.filter = payload.filter
        return await validate(dto, { validationError: { target: false } }).then(
            async (errors) => {
                if (errors.length > 0) {
                    console.log(errors)
                    throw new BadRequestException(errors)
                }
                try {
                    const name = `${Date.now()}-${this.createRandomKey()}`
                    const title =
                        payload.name ||
                        (await this.ffmpegService.filterByYoutube(
                            payload.youtubeLink,
                            name,
                            dto.filter,
                        ))
                    const duration = await this.ffmpegService.getAudioDuration(
                        `test/${name}-1.mp3`,
                    )
                    await this.awsService.uploadFile(
                        `${name}.mp3`,
                        "audio",
                        `test/${name}-1.mp3`,
                    )
                    const [_, newAudio] = await Promise.all([
                        this.ffmpegService.removeFile(`${name}-1`),
                        this.audioRepository.uploadAudio(
                            userId,
                            { name: title, filter: dto.filter, duration },
                            `https://cdn.pukuba.dev/sharemp3/audio/${name}.mp3`,
                        ),
                    ])
                    return newAudio
                } catch (e) {
                    throw new BadRequestException("Error uploading file")
                }
            },
        )
    }

    async getAudio(audioId: string, ip: string) {
        const audio = await this.audioRepository.getAudioByAudioId(audioId)
        const view = await this.redisService.getData(`views:${audioId}${ip}`)
        if (view === null) {
            await Promise.all([
                this.redisService.setOnlyKey(`views:${audioId}${ip}`, 1800),
                this.audioRepository.updateAudioViewCount(audioId, 1),
            ])
            audio.views++
        }
        return audio
    }

    async searchAudio(page: number, keyword: string) {
        return await this.audioRepository.searchAudio(page, keyword)
    }

    async deleteAudio(userId: string, audioId: string) {
        return await this.audioRepository.deleteAudio(userId, audioId)
    }

    private createRandomKey() {
        return (
            (Math.random() + 1).toString(36).substring(2, 15) +
            (Math.random() + 1).toString(36).substring(2, 15)
        )
    }
}
