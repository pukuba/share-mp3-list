// Nest dependencies
import { TypeOrmModule } from "@nestjs/typeorm"
import { Test, TestingModule } from "@nestjs/testing"

// Other dependencies

import { Connection, Repository } from "typeorm"
import { deepStrictEqual as equal } from "assert"
import * as fs from "fs"
// Local files
import { AudioService } from "./audio.service"
import { AudioController } from "../controller/audio.controller"
import { jwtManipulationService } from "src/shared/services/jwt.manipulation.service"
import { MessageService } from "src/shared/services/message.service"
import { RedisService } from "src/shared/Services/redis.service"
import { AudioModule } from "../audio.module"
import { UserRepository } from "src/shared/repositories/user.repository"
import { AudioRepository } from "src/shared/repositories/audio.repository"
import { ObjectId } from "bson"
describe("Audio Service", () => {
    let service: AudioService
    let userDb: UserRepository
    let audioDb: AudioRepository
    let token: string
    let audioId: ObjectId
    before(async () => {
        const module = await Test.createTestingModule({
            imports: [AudioModule],
        }).compile()
        service = module.get<AudioService>(AudioService)
        userDb = module.get<UserRepository>(UserRepository)
        audioDb = module.get<AudioRepository>(AudioRepository)
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
    })
    describe("upload Audio", () => {
        it("should be return AudioInfo", async () => {
            const file = {
                buffer: fs.readFileSync("test/church.mp3"),
                fieldname: "file",
                originalname: "chruch.mp3",
                encoding: "",
                mimetype: "audio/mpeg",
                name: "chruch.mp3",
                size: 1024,
            }
            const { title, audioId: id } = await service.uploadAudioByFile(
                "test",
                file,
                {
                    name: "test",
                    filter: "Default",
                },
            )
            equal(title, "test")
            audioId = id
        })
    })

    describe("getAudio", () => {
        it("should be return AudioInfo", async () => {
            const media = await service.getAudio(audioId.toString(), "::1")
            equal(media.userId, "test")
            equal(media._id.toString(), audioId.toString())
        })
        it("should be return BadRequestException Error", async () => {
            try {
                await service.getAudio("111111111111111111111111", "::1")
            } catch (e) {
                equal(e.message, "해당 음원이 존재하지가 않습니다")
            }
        })
    })

    describe("searchAudio", () => {
        it("should be return pageInfo", async () => {
            const pageInfo = await service.searchAudio(1, "t")
            equal(pageInfo.count, 1)
            equal(pageInfo.data[0].title.includes("t"), true)
        })
    })

    describe("deleteAudio", () => {
        it("should be return void", async () => {
            const res = await service.deleteAudio("test", audioId.toString())
            equal(res, undefined)
        })
    })

    after(async () => {
        await userDb.deleteUser({ id: "test", password: "testtest1@@" })
    })
})
