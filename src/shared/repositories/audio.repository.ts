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
import { Db, ObjectId } from "mongodb"
import { Repository, EntityRepository, Like } from "typeorm"

// Local files
import {
    UpdateAudioDto,
    UploadAudioByFileDto,
    UploadAudioByLinkDto,
} from "src/app/audio/dto"
import { configService } from "../services/config.service"
import { AudioEntity, FolderEntity } from "../types"

@Injectable()
export class AudioRepository {
    constructor(
        @Inject("DATABASE_CONNECTION")
        private db: Db,
    ) {}

    private isValidId(id: string | ObjectId) {
        const valid = ObjectId.isValid(id)
        if (valid === false) {
            throw new BadRequestException("올바르지않은 Audio ID 입니다")
        }
    }

    async uploadAudio(userId: string, dto, url: string): Promise<AudioEntity> {
        const audio = {
            userId: userId,
            url,
            title: dto.name,
            filter: dto.filter,
            views: 0,
            duration: dto.duration,
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

    async getAudioByAudioId(audioId: string): Promise<AudioEntity> {
        this.isValidId(audioId)
        const audio = await this.db
            .collection("audio")
            .findOne({ _id: new ObjectId(audioId) })
        if (audio === null) {
            throw new BadRequestException("해당 음원이 존재하지가 않습니다")
        }
        return this.formatAudioEntity(audio)
    }

    async getUploaderByAudio(id: string): Promise<AudioEntity[]> {
        const audios = await this.db
            .collection("audio")
            .find({ userId: id })
            .sort({ _id: -1 })
            .toArray()
        return audios.map(this.formatAudioEntity)
    }

    async updateAudioViewCount(audioId: string, count: number) {
        this.isValidId(audioId)
        const audio = await this.db
            .collection("audio")
            .updateOne(
                { _id: new ObjectId(audioId) },
                { $inc: { views: count } },
            )
        if (audio.modifiedCount === 0) {
            throw new BadRequestException("해당 음원이 존재하지가 않습니다")
        }
    }

    async randomAudio() {
        const audios = await this.db
            .collection("audio")
            .aggregate([{ $sample: { size: 15 } }])
            .toArray()
        return audios.map(this.formatAudioEntity)
    }

    async searchAudio(
        page: number,
        keyword = "",
    ): Promise<{ count: number; data: AudioEntity[] }> {
        const skip = Math.max(page - 1, 0) * 10
        const take = 10
        const [result, count] = await Promise.all([
            this.db
                .collection("audio")
                .find({ $text: { $search: keyword } })
                .skip(skip)
                .limit(take)
                .toArray(),
            this.db
                .collection("audio")
                .find({ $text: { $search: keyword } })
                .count(),
        ])
        return {
            data: result.map(this.formatAudioEntity),
            count,
        }
    }

    async deleteAudio(userId: string, audioId: string) {
        this.isValidId(audioId)
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

    private formatAudioEntity(data): AudioEntity {
        return {
            audioId: data._id,
            title: data.title,
            views: data.views,
            duration: data.duration,
            filter: data.filter,
            url: data.url,
            userId: data.userId,
        }
    }

    async getFilterAudio(page, filter) {
        const skip = Math.max(page - 1, 0) * 10
        let sort
        if (filter === "Latest") {
            sort = { _id: -1 }
        } else if (filter === "Last") {
            sort = { _id: 1 }
        } else if (filter === "ViewsDesc") {
            sort = { views: -1 }
        } else {
            sort = { views: 1 }
        }
        const take = 10
        const [result, count] = await Promise.all([
            this.db
                .collection("audio")
                .find({})
                .sort(sort)
                .skip(skip)
                .limit(take)
                .toArray(),
            this.db.collection("audio").countDocuments(),
        ])
        return {
            data: result.map(this.formatAudioEntity),
            count,
        }
    }
}
