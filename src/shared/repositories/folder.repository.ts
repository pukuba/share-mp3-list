import {
    BadRequestException,
    UnprocessableEntityException,
    NotFoundException,
    Inject,
    ForbiddenException,
    Injectable,
    Module,
} from "@nestjs/common"

import { Repository, EntityRepository } from "typeorm"
import * as crypto from "bcryptjs"
import { Db, ObjectId } from "mongodb"

export class FolderRepository {
    constructor(
        @Inject("DATABASE_CONNECTION")
        private db: Db,
    ) {}

    async createFolder(userId: string, folderName: string) {
        const { insertedId } = await this.db.collection("folder").insertOne({
            userId,
            folderName,
            like: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        return {
            userId,
            folderName,
            folderId: insertedId,
        }
    }

    async getFolderInfo(folderId: string) {
        const folder = await this.db.collection("folder").findOne({
            _id: new ObjectId(folderId),
        })
        if (folder === null) {
            throw new Error("해당 폴더가 존재하지 않습니다")
        }
        const songList = await this.db
            .collection("file")
            .find({
                folderId: new ObjectId(folderId),
            })
            .toArray()

        const audios = await this.db
            .collection("audio")
            .find({
                _id: {
                    $in: songList.map((song) => new ObjectId(song.audioId)),
                },
            })
            .toArray()

        return {
            creator: folder.userId,
            folderName: folder.folderName,
            folderId: folder._id,
            audioList: audios.map((audio) => {
                return {
                    audioId: audio._id,
                    audioName: audio.title,
                    audioUrl: audio.url,
                    audioViews: audio.views,
                    uploader: audio.userId,
                }
            }),
            likeCount: folder.like,
        }
    }

    async getFolderByFolderId(folderId: string) {
        const folder = await this.db.collection("folder").findOne({
            _id: new ObjectId(folderId),
        })
        return folder
    }

    async getFolderByFolderName(folderName: string) {
        const folder = await this.db.collection("folder").findOne({
            folderName,
        })
        return folder
    }

    async addAudioToFolder(folderId: string, audioId: string) {
        const song = await this.db
            .collection("audio")
            .findOne({ _id: new ObjectId(audioId) })
        if (song === null) {
            throw new Error("음원이 존재하지 않습니다")
        }
        try {
            await this.db.collection("file").insertOne({
                folderId: new ObjectId(folderId),
                audioId: new ObjectId(audioId),
            })
            await this.db
                .collection("folder")
                .updateOne(
                    { _id: new ObjectId(folderId) },
                    { $set: { updatedAt: new Date() } },
                )
        } catch (e) {
            console.log(e)
            throw new Error("이미 해당 음원이 폴더에 존재합니다")
        }
    }

    async delAudioToFolder(folderId: string, audioId: string) {
        const { deletedCount } = await this.db.collection("file").deleteOne({
            folderId: new ObjectId(folderId),
            audioId: new ObjectId(audioId),
        })
        if (deletedCount === 0) {
            throw new Error("해당 음원이 폴더에 존재하지 않습니다")
        }
        await this.db
            .collection("folder")
            .updateOne(
                { _id: new ObjectId(folderId) },
                { $set: { updatedAt: new Date() } },
            )
    }

    async delFolder(folderId: string) {
        const { deletedCount } = await this.db.collection("folder").deleteOne({
            _id: new ObjectId(folderId),
        })
        if (deletedCount === 0) {
            throw new Error("해당 폴더가 존재하지 않습니다")
        }
        await this.db.collection("file").deleteMany({
            folderId: new ObjectId(folderId),
        })
    }

    async updateFolder(folderId: string, folderName: string) {
        const { modifiedCount } = await this.db.collection("folder").updateOne(
            { _id: new ObjectId(folderId) },
            {
                $set: {
                    folderName,
                    updatedAt: new Date(),
                },
            },
        )
        if (modifiedCount === 0) {
            throw new Error("해당 폴더가 존재하지 않습니다")
        }
    }

    async searchFolder(keyword: string, userId: string, page: number) {
        let query = {}
        if (keyword) {
            query = {
                folderName: {
                    $regex: new RegExp(keyword, "i"),
                },
            }
        }
        if (userId) {
            query = {
                ...query,
                userId,
            }
        }
        const [folderList, cnt] = await Promise.all([
            this.db
                .collection("folder")
                .find(query)
                .skip((Math.max(page - 1), 0) * 10)
                .limit(10)
                .toArray(),
            this.db.collection("folder").find(query).count(),
        ])
        return { count: cnt, data: folderList }
    }
}
