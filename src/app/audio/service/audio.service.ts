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
import { UpdateAudioDto, UploadAudioDto } from "../dto"
import { AwsService } from "src/shared/services/aws.service"
import { AudioRepository } from "src/shared/repositories/audio.repository"
import { File } from "src/shared/services/type"
import { RedisService } from "src/shared/services/redis.service"

@Injectable()
export class AudioService {
    constructor(
        private readonly awsService: AwsService,
        private readonly redisService: RedisService,
        private readonly audioRepository: AudioRepository,
    ) {}

    async uploadAudio(userId: string, file: File, payload: UploadAudioDto) {
        payload.name = payload.name.replace(/^\s+|\s+$/g, "")
        if (payload.name.length === 0) {
            throw new BadRequestException("Title name can not be whitespace")
        }
        const dto = new UploadAudioDto()
        dto.name = payload.name
        return await validate(dto, { validationError: { target: false } }).then(
            async (errors) => {
                if (errors.length > 0) {
                    throw new BadRequestException(errors)
                }
                try {
                    const url = await this.awsService.uploadFile(
                        `${Date.now()}-${file.originalname}`,
                        "audio",
                        file.buffer,
                    )
                    const newAudio = await this.audioRepository.uploadAudio(
                        userId,
                        payload,
                        url,
                    )
                    return newAudio
                } catch {
                    throw new BadRequestException("Error uploading file")
                }
            },
        )
    }

    async getAudio(audioId: string, ip: string, userId?: string) {
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

    async updateAudio(
        userId: string,
        audioId: string,
        payload: UpdateAudioDto,
    ) {
        // return await this.audioRepository.patchMedia(userId, audioId, payload)
    }
}
