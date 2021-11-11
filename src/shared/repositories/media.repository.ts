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
import { UploadMediaDto, UpdateMediaDto } from "src/app/media/dto"
import { configService } from "../services/config.service"

@Injectable()
export class MediaRepository {
    constructor(
        @Inject("MONGODB_CONNECTION")
        private db: Db,
    ) {}
    async uploadMedia(userId: string, dto: UploadMediaDto, url: string) {
        const audio = {
            userId: userId,
            url,
            name: dto.title,
        }

        try {
            await this.db.collection("audio").insertOne(audio)
        } catch (err) {
            throw new UnprocessableEntityException(err.errmsg)
        }
    }

    async getMediaByMediaId(audioId: string) {
        let audio
        try {
            audio = await this.db
                .collection("audio")
                .findOne({ _id: new ObjectId(audioId) })
        } catch {
            throw new BadRequestException("해당 영상이 존재하지가 않습니다")
        }
        return audio
    }

    async updateMediaViewCount(mediaId: string, count: number) {
        let audio
        try {
            // media = await this.findOneOrFail({ mediaId: mediaId })
            // media.views += count
            // await this.save(media)
        } catch {
            throw new NotFoundException("해당 게시글이 존재하지가 않습니다")
        }
    }

    async searchMedia(page: number, keyword: string = "") {
        const skip = Math.max(page - 1, 0) * 20
        const take = 20
        const result = await this.db
            .collection("audio")
            .find({
                name: {
                    $regex: new RegExp(keyword, "i"),
                },
            })
            .toArray()
        return {
            data: result,
            count: 1,
        }
    }

    async deleteMedia(userId: string, mediaId: string) {
        const { deletedCount } = await this.db
            .collection("audio")
            .deleteOne({ userId, _id: new ObjectId(mediaId) })
        if (deletedCount === 0) {
            throw new NotFoundException("해당 음원이 존재하지 않습니다")
        }
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
