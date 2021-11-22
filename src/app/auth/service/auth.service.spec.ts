import { Test, TestingModule } from "@nestjs/testing"
import { AuthService } from "./auth.service"

import { deepStrictEqual as equal } from "assert"

import { jwtManipulationService } from "src/shared/services/jwt.manipulation.service"
import { RedisService } from "src/shared/Services/redis.service"
import { AuthModule } from "../auth.module"
import { UserRepository } from "src/shared/repositories/user.repository"

describe("UserService", () => {
    let service: AuthService
    let db: UserRepository
    let token: string
    before(async () => {
        const module = await Test.createTestingModule({
            imports: [AuthModule],
        }).compile()
        service = module.get<AuthService>(AuthService)
        db = module.get<UserRepository>(UserRepository)
    })
    describe("createAuthCode", () => {
        it("should return void", async () => {
            const res = await service.createAuthCode({
                email: "pukuba@kakao.com",
            })
            equal(res.status, "ok")
        })
    })
    let verificationToken
    describe("checkAuthCode", () => {
        it("should return jwt token", async () => {
            const verificationCode = await new RedisService().getData(
                "pukuba@kakao.com",
            )
            const res = await service.checkAuthCode({
                email: "pukuba@kakao.com",
                verificationCode: verificationCode,
            })
            verificationToken = res.verificationToken
            equal("verificationToken" in res, true)
            equal(
                jwtManipulationService.decodeVerifyJwtToken(verificationToken)
                    .id,
                "pukuba@kakao.com",
            )
        })
    })

    describe("signUp", () => {
        it("should return jwt token", async () => {
            const res = await service.signUp({
                email: "pukuba@kakao.com",
                password: "test1234!",
                verificationToken,
                username: "pukuba",
            })
            equal(res.user.email, "pukuba@kakao.com")
        })
        it("should return error status 401", async () => {
            await db.deleteUser({
                email: "pukuba@kakao.com",
                password: "test1234!",
            })
            try {
                await service.signUp({
                    email: "pukuba@kakao.com",
                    password: "test1234!",
                    verificationToken,
                    username: "pukuba",
                })
            } catch (e) {
                equal(e.status, 401)
            }
        })
    })
    describe("signIn", () => {
        it("Should be return jwt token", async () => {
            await db.createUser({
                email: "pukuba@kakao.com",
                password: "test1234!",
                username: "pukuba",
                verificationToken: "01010101010",
            })
            const res = await service.signIn({
                email: "pukuba@kakao.com",
                password: "test1234!",
            })
            equal(typeof res.accessToken, "string")
            equal(res.user.email, "pukuba@kakao.com")
            token = res.accessToken
        })
    })
    describe("deleteAccount", () => {
        it("Should be return status ok", async () => {
            const res = await service.deleteAccount(
                {
                    email: "pukuba@kakao.com",
                    password: "test1234!",
                },
                `Bearer ${token}`,
            )
            equal(res.status, "ok")
            equal(res.message, "계정이 삭제되었습니다")
        })
    })
})
