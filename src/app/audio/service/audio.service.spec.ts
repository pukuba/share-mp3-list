// Nest dependencies
import { Test } from "@nestjs/testing"

// Other dependencies

import { deepStrictEqual as equal } from "assert"
import * as fs from "fs"
// Local files
import { AudioService } from "./audio.service"
import { jwtManipulationService } from "src/shared/services/jwt.manipulation.service"
import { AudioModule } from "../audio.module"
import { UserRepository } from "src/shared/repositories/user.repository"
import { AudioRepository } from "src/shared/repositories/audio.repository"
import { ObjectId } from "mongodb"

describe("Audio Service", () => {
    let service: AudioService
    let userDb: UserRepository
    let audioDb: AudioRepository
    let token: string
    let audioId: ObjectId
    let audioId2: ObjectId
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
            email: "pukuba@kakao.com",
            verificationToken: "01010101010",
        })
        token = jwtManipulationService.generateJwtToken({
            id: "pukuba@kakao.com",
            exp: Math.floor(Date.now() / 1000) + 60 * 60,
        })
    })

    describe("upload AudioByFile", () => {
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
                "pukuba@kakao.com",
                file,
                {
                    name: "test",
                    filter: "Default",
                    file,
                },
            )
            equal(title, "test")
            audioId = id
        })
    })

    describe("upload AudioByYoutubeLink", () => {
        it("should be return AudioInfo", async () => {
            const { title, audioId: id } = await service.uploadAudioByLink(
                "pukuba@kakao.com",
                {
                    youtubeLink: "https://youtu.be/ivxgd9jp6kM",
                    filter: "NightCore",
                },
            )
            equal(
                title,
                "The Kid LAROI, Justin Bieber - STAY (Cover by SeoRyoung 박서령)",
            )
            audioId2 = id
        })
    })

    describe("getAudio", () => {
        it("should be return AudioInfo", async () => {
            const audio = await service.getAudio(audioId.toString(), "::1")
            equal(audio.userId, "pukuba@kakao.com")
            equal(audio.audioId.toString(), audioId.toString())
            equal(audio.views, 1)
            equal(audio.filter, "Default")
            equal(typeof audio.duration, "number")
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
        it("should be return pageInfo - 1", async () => {
            const pageInfo = await service.searchAudio(1, "test")
            equal(pageInfo.count, 1)
            equal(pageInfo.data[0].title.includes("test"), true)
        })

        it("should be return pageInfo - 2", async () => {
            const pageInfo = await service.searchAudio(1, "stay")
            equal(pageInfo.count, 1)
            equal(pageInfo.data[0].title.includes("STAY"), true)
        })
    })

    describe("randomAudio", () => {
        it("should be return random Audios", async () => {
            const audios = await service.randomAudio()
            equal(audios.length, 2)
        })
    })

    describe("deleteAudio", () => {
        it("should be return void", async () => {
            const res = await service.deleteAudio(
                "pukuba@kakao.com",
                audioId.toString(),
            )
            equal(res, undefined)
        })
    })

    after(async () => {
        await userDb.deleteUser({
            email: "pukuba@kakao.com",
            password: "testtest1@@",
        })
    })
})
