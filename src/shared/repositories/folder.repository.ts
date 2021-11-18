import {
    BadRequestException,
    UnprocessableEntityException,
    NotFoundException,
    Inject,
    ForbiddenException,
    Injectable,
    Module,
} from "@nestjs/common"

import * as crypto from "bcryptjs"
import { Db, ObjectId } from "mongodb"
import { FolderEntity, AudioEntity, TSort } from "../types"

export class FolderRepository {
    constructor(
        @Inject("DATABASE_CONNECTION")
        private db: Db,
    ) {}

    async like(folderId: string, userId: string) {
        const folder = await this.db.collection("like").findOne({
            folderId: new ObjectId(folderId),
            userId,
        })
        if (folder) {
            await Promise.all([
                this.db
                    .collection("like")
                    .deleteOne({ folderId: new ObjectId(folderId), userId }),
                this.db
                    .collection("folder")
                    .updateOne(
                        { _id: new ObjectId(folderId) },
                        { $inc: { likes: -1 } },
                    ),
            ])
        } else {
            await Promise.all([
                this.db
                    .collection("like")
                    .insertOne({ folderId: new ObjectId(folderId), userId }),
                this.db
                    .collection("folder")
                    .updateOne(
                        { _id: new ObjectId(folderId) },
                        { $inc: { likes: 1 } },
                    ),
            ])
        }
    }

    async getFolderByFolderId(
        folderId: string,
    ): Promise<FolderEntity & { _id: ObjectId }> {
        const folder = (await this.db.collection("folder").findOne({
            _id: new ObjectId(folderId),
        })) as FolderEntity & { _id: ObjectId }
        return folder
    }
    async createFolder(
        creator: string,
        folderName: string,
    ): Promise<FolderEntity> {
        const now = new Date()
        const { insertedId } = await this.db.collection("folder").insertOne({
            creator,
            folderName,
            likes: 0,
            createdAt: now,
            updatedAt: now,
        })
        return {
            creator,
            folderName,
            folderId: insertedId,
            likes: 0,
            createdAt: now,
            updatedAt: now,
            likeStatus: false,
        }
    }

    async getFolderInfo(folderId: string, userId?: string) {
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

        const audios = (await this.db
            .collection("audio")
            .find({ _id: { $in: songList.map((song) => song.audioId) } })
            .toArray()) as (AudioEntity & { _id: ObjectId })[]

        let likeStatus = false
        if (userId) {
            const like = await this.db.collection("like").findOne({
                folderId: new ObjectId(folderId),
                userId: userId,
            })
            likeStatus = like !== null
        }
        return {
            creator: folder.creator,
            folderName: folder.folderName,
            folderId: folder._id,
            audioList: audios.map((audio) => {
                return {
                    audioId: audio._id,
                    audioName: audio.title,
                    audioUrl: audio.url,
                    audioViews: audio.views,
                    userId: audio.userId,
                    audioFilter: audio.filter,
                    audioDuration: audio.duration,
                }
            }),
            likes: folder.likes,
            likeStatus,
            updatedAt: folder.updatedAt,
            createdAt: folder.createdAt,
        }
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

    async delFolder(folderId: string, creator: string) {
        const { deletedCount } = await this.db.collection("folder").deleteOne({
            _id: new ObjectId(folderId),
            creator,
        })
        if (deletedCount === 0) {
            throw new Error(
                "해당 폴더가 존재하지 않거나 본인의 폴더가 아닙니다",
            )
        }
        await this.db.collection("file").deleteMany({
            folderId: new ObjectId(folderId),
        })
    }

    async updateFolder(folderId: string | ObjectId, folderName: string) {
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

    async searchFolder(
        keyword: string,
        creator: string,
        page: number,
        sort: TSort,
        userId?: string,
    ) {
        let query = {},
            sortOption = {}
        if (keyword) {
            query = {
                folderName: {
                    $regex: new RegExp(keyword, "i"),
                },
            }
        }
        if (creator) {
            query = {
                ...query,
                creator,
            }
        }
        if (sort === "LikeDesc") {
            sortOption = { likes: -1 }
        } else if (sort === "LikeAsc") {
            sortOption = { likes: 1 }
        } else if (sort === "DateLatest") {
            sortOption = { updatedAt: -1 }
        } else {
            sortOption = { updatedAt: 1 }
        }
        const [folderList, cnt] = await Promise.all([
            this.db
                .collection("folder")
                .find(query)
                .sort(sortOption)
                .skip((Math.max(page - 1), 0) * 10)
                .limit(10)
                .toArray() as Promise<(FolderEntity & { _id: ObjectId })[]>,
            this.db.collection("folder").find(query).count(),
        ])
        let likeList = null,
            idxMap = null
        if (userId) {
            likeList = await this.db
                .collection("like")
                .find({
                    folderId: { $in: folderList.map((x) => x._id) },
                    userId,
                })
                .toArray()
            idxMap = folderList.reduce((acc, cur, idx) => {
                acc[cur._id.toString()] = idx
                return acc
            }, {})
            for (const item of likeList) {
                const idx = idxMap[item.folderId.toString()]
                folderList[idx].likeStatus = true
            }
        }

        return {
            count: cnt,
            data: folderList.map((x) => {
                if (x?.likeStatus === undefined) {
                    x.likeStatus = false
                }
                return { ...x, folderId: x._id }
            }),
        }
    }

    async getLikeFolders(userId: string, page: number) {
        const [lists, count] = await Promise.all([
            this.db
                .collection("like")
                .find({ userId })
                .skip((Math.max(page - 1), 0) * 10)
                .limit(10)
                .toArray(),
            this.db.collection("like").find({ userId }).count(),
        ])
        const folderLists = lists.map((x) => x.folderId)
        const folderList = await this.db
            .collection("folder")
            .find({
                _id: { $in: folderLists },
            })
            .sort({ _id: -1 })
            .toArray()
        return {
            count,
            data: folderList.map((x: FolderEntity & { _id: ObjectId }) => {
                return { ...x, likeStatus: true }
            }),
        }
    }
}
