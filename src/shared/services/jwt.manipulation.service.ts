import { UnauthorizedException, BadRequestException } from "@nestjs/common"

import * as jwt from "jsonwebtoken"

import { configService } from "./config.service"
import { IGenerateJwtToken } from "../types"
export class JwtManipulationService {
    decodeJwtToken(token: string, property = "all") {
        try {
            if (!token) throw new Error()
            try {
                const decodedJwtData = jwt.verify(
                    token.split(" ")[1],
                    configService.getEnv("JWT_TOKEN"),
                ) as jwt.JwtPayload
                if (property === "all") return decodedJwtData
                else return decodedJwtData[property]
            } catch (err) {
                throw new BadRequestException("Token signature is not valid")
            }
        } catch {
            throw new UnauthorizedException()
        }
    }

    generateJwtToken(tokenInfo: IGenerateJwtToken) {
        return jwt.sign(tokenInfo, configService.getEnv("JWT_TOKEN"))
    }

    decodeVerifyJwtToken(token: string) {
        if (!token) throw new Error()
        try {
            const decodedJwtData = jwt.verify(
                token,
                configService.getEnv("JWT_TOKEN"),
            ) as jwt.JwtPayload
            return decodedJwtData
        } catch (e) {
            throw new UnauthorizedException(
                "이메일 인증 토큰이 올바르지 않습니다",
            )
        }
    }
}

const jwtManipulationService = new JwtManipulationService()

export { jwtManipulationService }
