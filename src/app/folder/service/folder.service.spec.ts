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
            id: "test",
            phoneNumber: "01000000000",
            verificationToken: "01010101010",
        })
        token = jwtManipulationService.generateJwtToken({
            id: "test",
            exp: Math.floor(Date.now() / 1000) + 60 * 60,
        })

        audioId = (
            await audioDb.uploadAudio(
                "test",
                { name: "raw" },
                "https://youtu.be/sU02JH6uZMc",
            )
        ).audioId
    })
    describe("Create Folder", () => {
        it("should be return status: 'ok'", async () => {
            const res = await service.createFolder("test", "test-FolderName")
            equal(res.status, "ok")
        })

        it("should be return BadRequestException error", async () => {
            try {
                await service.createFolder("test", "test-FolderName")
            } catch (e) {
                equal(e.message, "Folder name is existed")
            }
        })
    })

    describe("Search Folder", () => {
        it("should be return folder list & page info", async () => {
            const res = await service.searchFolder("test", "", 1)
            equal(res.pageInfo.count, 1)
            folderId = res.data[0]._id
        })
    })

    describe("Add Audio to Folder", () => {
        it("should be return status: ok", async () => {
            const res = await service.addAudioToFolder(
                "test",
                folderId.toString(),
                audioId.toString(),
            )
            equal(res.status, "ok")
        })
    })

    describe("Get Folder", () => {
        it("should be return folder info", async () => {
            const res = await service.getFolder(folderId.toString())
            equal(res.creator, "test")
            equal(res.folderId.toString(), folderId.toString())
            equal(res.folderName, "test-FolderName")
            equal(res.likeCount, 0)
            equal(res.audioList.length, 1)
            equal(res.audioList[0].audioId.toString(), audioId.toString())
        })
    })

    describe("Del Audio to Folder", () => {
        it("should be return status: ok", async () => {
            const res = await service.delAudioToFolder(
                "test",
                folderId.toString(),
                audioId.toString(),
            )
            equal(res.status, "ok")
        })
    })

    describe("Del Folder", () => {
        it("should be return status: ok", async () => {
            const res = await service.delFolder("test", folderId.toString())
            equal(res.status, "ok")
        })
    })

    after(async () => {
        await userDb.deleteUser({ id: "test", password: "testtest1@@" })
    })
})
