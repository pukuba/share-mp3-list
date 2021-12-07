import { InjectRepository } from "@nestjs/typeorm"
import { PassportStrategy } from "@nestjs/passport"
import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    ConsoleLogger,
    Inject,
} from "@nestjs/common"

import { ExtractJwt, Strategy } from "passport-jwt"

import { UserRepository } from "src/shared/repositories/user.repository"
import { configService } from "src/shared/services/config.service"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private userRepository: UserRepository) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.getEnv("JWT_TOKEN"),
            ignoreExpiration: false,
        })
    }

    async validate({ iat, exp, id }): Promise<any> {
        const timeDiff = exp - iat
        if (timeDiff <= 0) {
            throw new UnauthorizedException("토큰이 만료되었습니다")
        }
        try {
            const user = await this.userRepository.getUserByEmail(id)
            return {
                id: user.id,
                username: user.username,
            }
        } catch (e) {
            console.log(e)
            throw new UnauthorizedException("계정이 존재하지 않습니다")
        }
    }
}
