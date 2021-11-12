// Nest dependencies
import {
    BadRequestException,
    UnprocessableEntityException,
    NotFoundException,
    ForbiddenException,
    Injectable,
    Inject,
} from "@nestjs/common"

// Other dependencies
import { Db, ObjectId, ObjectID } from "mongodb"
import { Repository, EntityRepository, Like } from "typeorm"

// Local files
import {
    UpdateAudioDto,
    UploadAudioByFileDto,
    UploadAudioByLinkDto,
} from "src/app/audio/dto"
import { configService } from "../services/config.service"

@Injectable()
export class AudioRepository {
    constructor(
        @Inject("DATABASE_CONNECTION")
        private db: Db,
    ) {}
    async uploadAudio(userId: string, dto: UploadAudioByFileDto, url: string) {
        const audio = {
            userId: userId,
            url,
            title: dto.name,
            views: 0,
        }

        try {
            const id = await this.db
                .collection("audio")
                .insertOne(audio)
                .then(({ insertedId }) => insertedId)
            return { ...audio, audioId: id }
        } catch (err) {
            throw new UnprocessableEntityException(err.errmsg)
        }
    }

    async getAudioByAudioId(audioId: string) {
        const audio = await this.db
            .collection("audio")
            .findOne({ _id: new ObjectId(audioId) })
        if (audio === null) {
            throw new BadRequestException("해당 음원이 존재하지가 않습니다")
        }

        return audio
    }

    async updateAudioViewCount(mediaId: string, count: number) {
        let audio
        try {
            // media = await this.findOneOrFail({ mediaId: mediaId })
            // media.views += count
            // await this.save(media)
        } catch {
            throw new NotFoundException("해당 게시글이 존재하지가 않습니다")
        }
    }

    async searchAudio(page: number, keyword: string = "") {
        const skip = Math.max(page - 1, 0) * 20
        const take = 20
        const [result, count] = await Promise.all([
            this.db
                .collection("audio")
                .find({ title: { $regex: new RegExp(keyword, "i") } })
                .skip(skip)
                .limit(take)
                .toArray(),
            this.db
                .collection("audio")
                .find({ title: { $regex: new RegExp(keyword, "i") } })
                .count(),
        ])
        return {
            data: result,
            count,
        }
    }

    async deleteAudio(userId: string, audioId: string) {
        const { deletedCount } = await this.db
            .collection("audio")
            .deleteOne({ userId, _id: new ObjectId(audioId) })
        if (deletedCount === 0) {
            throw new NotFoundException("해당 음원이 존재하지 않습니다")
        }
        await this.db
            .collection("file")
            .deleteMany({ audioId: new ObjectId(audioId) })
    }

    // async patchMedia(userId: string, mediaId: string, dto: UpdateMediaDto) {
    //     try {
    //         const audio = await this.db.collection("audio").findOne({
    //             mediaId,
    //             userId,
    //         })
    //         media.title = dto.title || media.title
    //         media.description = dto.description || media.description
    //         return await this.save(media)
    //     } catch {
    //         throw new NotFoundException("해당 영상이 존재하지 않습니다")
    //     }
    // }
}
