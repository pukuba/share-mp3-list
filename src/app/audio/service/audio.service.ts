// Nest dependencies
import {
    Injectable,
    HttpStatus,
    BadRequestException,
    UnauthorizedException,
    Inject,
} from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"

// Other dependencies
import { JwtPayload } from "jsonwebtoken"
import { validate } from "class-validator"
import { getRepository, Repository } from "typeorm"

// Local files
import {
    UpdateAudioDto,
    UploadAudioByFileDto,
    UploadAudioByLinkDto,
} from "../dto"
import { FFmpegService } from "src/shared/services/ffmpeg.service"
import { AwsService } from "src/shared/services/aws.service"
import { AudioRepository } from "src/shared/repositories/audio.repository"
import { File } from "src/shared/services/type"
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
        file: File,
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
                    const name = `${Date.now()}-${dto.name}`
                    await this.ffmpegService.filterByFile(
                        file.buffer,
                        name,
                        dto.filter,
                    )
                    const url = await this.awsService.uploadFile(
                        `${name}.mp3`,
                        "audio",
                        `test/${name}-1.mp3`,
                    )
                    const [_, __, newAudio] = await Promise.all([
                        this.ffmpegService.removeFile(`${name}`),
                        this.ffmpegService.removeFile(`${name}-1`),
                        this.audioRepository.uploadAudio(userId, payload, url),
                    ])
                    return newAudio
                } catch (e) {
                    console.log(e)
                    throw new BadRequestException("Error uploading file")
                }
            },
        )
    }

    async uploadAudioByLink(userId: string, payload: UploadAudioByLinkDto) {
        const dto = new UploadAudioByLinkDto()
        dto.youtubeLink = payload.youtubeLink
        return await validate(dto, { validationError: { target: false } }).then(
            async (errors) => {
                if (errors.length > 0) {
                    throw new BadRequestException(errors)
                }
                try {
                    const name = `${Date.now()}-${userId}`
                    const title = await this.ffmpegService.filterByYoutube(
                        payload.youtubeLink,
                        name,
                        dto.filter,
                    )
                    const url = await this.awsService.uploadFile(
                        `${name}.mp3`,
                        "audio",
                        `test/${name}-1.mp3`,
                    )
                    const [_, __, newAudio] = await Promise.all([
                        this.ffmpegService.removeFile(`test/${name}.mp3`),
                        this.ffmpegService.removeFile(`test/${name}-1.mp3`),
                        this.audioRepository.uploadAudio(
                            userId,
                            { name: title, filter: dto.filter },
                            url,
                        ),
                    ])
                    return newAudio
                } catch {
                    throw new BadRequestException("Error uploading file")
                }
            },
        )
    }

    async getAudio(audioId: string, ip: string) {
        const audio = await this.audioRepository.getAudioByAudioId(audioId)
        const view = await this.redisService.getData(`${audioId}${ip}`)
        if (view === null) {
            await Promise.all([
                this.redisService.setOnlyKey(`${audioId}${ip}`, 3600),
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
}
