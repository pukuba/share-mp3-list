import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import { deepStrictEqual as deepEqual } from "assert"
import * as request from "supertest"
import { ApplicationModule } from "./../src/app.module"
import { RedisService } from "src/shared/services/redis.service"
import { jwtManipulationService } from "src/shared/services/jwt.manipulation.service"
describe("AppController (e2e)", () => {
    let app: INestApplication
    let token: string
    const redisService = new RedisService()
    before(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ApplicationModule],
        }).compile()

        app = moduleFixture.createNestApplication()
        await app.init()
    })

    after(async () => {
        await request(app.getHttpServer())
            .delete("/v1/auth/account")
            .set("Content-Type", "application/json")
            .set("Authorization", token)
            .send({
                email: "pukuba@kakao.com",
                password: "test1234!@",
            })
            .expect(200)
    })

    describe("Auth Module", () => {
        it("method: POST /v1/auth/sign-up", async () => {
            const accessToken = jwtManipulationService.generateJwtToken({
                id: "pukuba@kakao.com",
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
            })
            await redisService.setOnlyKey(token)
            const { body } = await request(app.getHttpServer())
                .post("/v1/auth/sign-up")
                .set("Content-Type", "application/json")
                .send({
                    email: "pukuba@kakao.com",
                    password: "test1234!@",
                    username: "pukuba",
                    verificationToken: accessToken,
                })
                .expect(201)
            token = `bearer ${body.accessToken}`
        })
    })

    describe("Audio Module", () => {
        let audioId: string
        it("method: POST /v1/audio/link", async () => {
            const { body } = await request(app.getHttpServer())
                .post("/v1/audio/link")
                .set("Content-Type", "application/json")
                .set("Authorization", token)
                .send({
                    name: "Stay NightCore",
                    filter: "NightCore",
                    youtubeLink: "https://youtu.be/q8V9Ha9biKA",
                })
                .expect(201)
            deepEqual(body.title, "Stay NightCore")
        })

        it("method: GET /v1/audio/search", async () => {
            const { body } = await request(app.getHttpServer())
                .get(`/v1/audio/search?page=1&keyword=stay`)
                .set("Content-Type", "application/json")
                .set("Authorization", token)
                .expect(200)
            deepEqual(body.count, 1)
            deepEqual(body.data[0].title, "Stay NightCore")
            audioId = body.data[0].audioId
        })

        it("method: GET /v1/audio/:audioId", async () => {
            const { body } = await request(app.getHttpServer())
                .get(`/v1/audio/${audioId}`)
                .set("Content-Type", "application/json")
                .set("Authorization", token)
                .expect(200)
            deepEqual(body.title, "Stay NightCore")
        })
    })
})
