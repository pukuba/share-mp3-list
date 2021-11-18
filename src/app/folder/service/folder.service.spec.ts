// Nest dependencies
import { TypeOrmModule } from "@nestjs/typeorm"
import { Test, TestingModule } from "@nestjs/testing"

// Other dependencies

import { Connection, Repository } from "typeorm"
import { deepStrictEqual as equal } from "assert"
import * as fs from "fs"
// Local files
import { FolderService } from "./folder.service"
import { jwtManipulationService } from "src/shared/services/jwt.manipulation.service"
import { FolderModule } from "../folder.module"
import { UserRepository } from "src/shared/repositories/user.repository"
import { AudioRepository } from "src/shared/repositories/audio.repository"
import { ObjectId } from "bson"
import { FolderRepository } from "src/shared/repositories/folder.repository"
describe("Audio Service", () => {
    let service: FolderService
    let userDb: UserRepository
    let audioDb: AudioRepository
    let token: string
    let audioId: ObjectId
    let folderDb: FolderRepository
    let folderId: ObjectId
    before(async () => {
        const module = await Test.createTestingModule({
            imports: [FolderModule],
        }).compile()
        service = module.get<FolderService>(FolderService)
        userDb = module.get<UserRepository>(UserRepository)
        audioDb = module.get<AudioRepository>(AudioRepository)
        folderDb = module.get<FolderRepository>(FolderRepository)
        await userDb.createUser({
            username: "test",
            password: "testtest1@@",
            email: "pukuba@kakao.com",
            verificationToken: "01010101010",
        })
        token = jwtManipulationService.generateJwtToken({
            id: "pukuba@kakao.com",
            exp: Math.floor(Date.now() / 1000) + 60 * 60,
        })

        audioId = (
            await audioDb.uploadAudio(
                "pukuba@kakao.com",
                { name: "raw" },
                "https://youtu.be/sU02JH6uZMc",
            )
        ).audioId
    })
    describe("Create Folder", () => {
        it("should be return status: 'ok' - 1", async () => {
            const res = await service.createFolder(
                "pukuba@kakao.com",
                "test-FolderName",
            )
            equal(res.status, "ok")
            folderId = res.folderId
        })

        it("should be return status: 'ok' - 2", async () => {
            const res = await service.createFolder(
                "pukuba@kakao.com",
                "myTestFolder",
            )
            equal(res.status, "ok")
        })

        it("should be return BadRequestException error", async () => {
            try {
                await service.createFolder(
                    "pukuba@kakao.com",
                    "test-FolderName",
                )
            } catch (e) {
                equal(e.message, "Folder name is existed")
            }
        })
    })

    describe("Like Folder", () => {
        it("should be return status: ok - 1", async () => {
            const res = await service.like(
                "pukuba@kakao.com",
                folderId.toString(),
            )
            equal(res.status, "ok")
        })
        it("should be return status: ok - 2", async () => {
            const res = await service.like(
                "pukuba@kakao.com1",
                folderId.toString(),
            )
            equal(res.status, "ok")
        })
        it("should be return status: ok - 3", async () => {
            const res = await service.like(
                "pukuba@kakao.com1",
                folderId.toString(),
            )
            equal(res.status, "ok")
        })
    })

    describe("Search Folder", () => {
        it("should be return folder list & page info (sort: DateLatest)", async () => {
            const res = await service.searchFolder(
                "test",
                "",
                1,
                "DateLatest",
                "pukuba@kakao.com",
            )
            equal(res.pageInfo.count, 2)
            equal(res.data[1].likeStatus, true)
            equal(res.data[1].folderId.toString(), folderId.toString())
            equal(res.data[1].likes, 1)
        })

        it("should be return folder list & page info (sort: DateLast)", async () => {
            const res = await service.searchFolder(
                "test",
                "",
                1,
                "DateLast",
                "pukuba@kakao.com",
            )
            equal(res.pageInfo.count, 2)
            equal(res.data[0].likeStatus, true)
            equal(res.data[0].folderId.toString(), folderId.toString())
            equal(res.data[0].likes, 1)
        })

        it("should be return folder list & page info (sort: LikeDesc)", async () => {
            const res = await service.searchFolder("test", "", 1, "LikeDesc")
            equal(res.pageInfo.count, 2)
            equal(res.data[0].likeStatus, false)
            equal(res.data[0].likes, 1)
            equal(res.data[0].folderId.toString(), folderId.toString())
        })

        it("should be return folder list & page info (sort: LikeAsc)", async () => {
            const res = await service.searchFolder(
                "test",
                "",
                1,
                "LikeAsc",
                "pukuba@kakao.com",
            )
            equal(res.pageInfo.count, 2)
            equal(res.data[1].likeStatus, true)
            equal(res.data[1].likes, 1)
            equal(res.data[1].folderId.toString(), folderId.toString())
        })
    })

    describe("Add Audio to Folder", () => {
        it("should be return status: ok", async () => {
            const res = await service.addAudioToFolder(
                "pukuba@kakao.com",
                folderId.toString(),
                audioId.toString(),
            )
            equal(res.status, "ok")
        })
    })

    describe("Get Folder", () => {
        it("should be return folder info", async () => {
            const res = await service.getFolder(
                folderId.toString(),
                "pukuba@kakao.com",
            )
            equal(res.creator, "pukuba@kakao.com")
            equal(res.folderId.toString(), folderId.toString())
            equal(res.folderName, "test-FolderName")
            equal(res.likes, 1)
            equal(res.likeStatus, true)
            equal(res.audioList.length, 1)
            equal(res.audioList[0].audioId.toString(), audioId.toString())
        })
    })

    describe("Get like folder list", () => {
        it("should be return folder list", async () => {
            const res = await service.getLikeFolders("pukuba@kakao.com", 1)
            equal(res.data[0].likeStatus, true)
            equal(res.data[0].creator, "pukuba@kakao.com")
            equal(res.data[0].folderName, "test-FolderName")
            equal(res.data[0].likes, 1)
            equal(res.pageInfo.count, 1)
        })
    })

    describe("Del Audio to Folder", () => {
        it("should be return status: ok", async () => {
            const res = await service.delAudioToFolder(
                "pukuba@kakao.com",
                folderId.toString(),
                audioId.toString(),
            )
            equal(res.status, "ok")
        })
    })

    describe("Del Folder", () => {
        it("should be return status: ok", async () => {
            const res = await service.delFolder(
                "pukuba@kakao.com",
                folderId.toString(),
            )
            equal(res.status, "ok")
        })
    })

    after(async () => {
        await userDb.deleteUser({
            email: "pukuba@kakao.com",
            password: "testtest1@@",
        })
    })
})
