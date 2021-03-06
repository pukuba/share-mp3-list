// Nest dependencies
import {
    Injectable,
    HttpStatus,
    BadRequestException,
    UnauthorizedException,
    Inject,
} from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"

// Other dependencies
import { getRepository, Repository } from "typeorm"
import { validate } from "class-validator"
import { JwtPayload } from "jsonwebtoken"

// Local files
import {
    CreateUserDto,
    CreateAuthCodeDto,
    CheckAuthCodeDto,
    LoginDto,
    FindIdDto,
    ResetPasswordDto,
    DeleteUserDto,
} from "../dto"
import { randNumber } from "src/shared/lib"
import { JwtManipulationService } from "src/shared/services/jwt.manipulation.service"
import { RedisService } from "src/shared/services/redis.service"
import { MailService } from "src/shared/services/mail.service"
import { UserRepository } from "src/shared/repositories/user.repository"
import { StatusOk } from "src/shared/types"

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtManipulationService,
        private readonly redisService: RedisService,
        private readonly mailService: MailService,
        private readonly userRepository: UserRepository,
    ) {}

    async signUp(dto: CreateUserDto) {
        const { username, email, verificationToken } = dto

        const has = await this.userRepository.isExist(dto)
        if (has === false)
            throw new BadRequestException(
                "이미 중복된 이메일, 혹은 닉네임, 휴대번호가 있습니다.",
            )

        const jwtResult =
            this.jwtService.decodeVerifyJwtToken(verificationToken)
        if (jwtResult.id !== email)
            throw new UnauthorizedException(
                "이메일 인증이 만료되었거나 휴대번호 인증절차가 이루어지지 않았습니다.",
            )

        const isBlackList = await this.redisService.getData(
            `blacklist-${verificationToken}`,
        )
        if (isBlackList !== null)
            throw new UnauthorizedException("해당 토큰은 블랙리스트입니다")
        const exp = jwtResult.exp - Math.floor(Date.now() / 1000)
        await Promise.all([
            this.userRepository.createUser(dto),
            this.redisService.setOnlyKey(`blacklist-${verificationToken}`, exp),
        ])
        const token = this.jwtService.generateJwtToken({
            id: dto.email,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        })
        const responseData = {
            accessToken: token,
            user: {
                email,
            },
        }
        return responseData
    }

    async signOut(bearer: string) {
        const decodedToken = this.jwtService.decodeJwtToken(bearer)
        const expireDate: number = decodedToken.exp
        const remainingSeconds = Math.round(expireDate - Date.now() / 1000)
        await this.redisService.setOnlyKey(
            `blacklist-${bearer.split(" ")[1]}`,
            remainingSeconds,
        )
        return { status: "ok", message: "토큰을 블랙리스트에 추가하였습니다" }
    }

    async createAuthCode(dto: CreateAuthCodeDto): Promise<StatusOk> {
        const { email } = dto
        const verificationCode = randNumber(100000, 999999).toString()
        const requestResult = await this.mailService.sendVerificationMail({
            email,
            verificationCode,
        })
        if (requestResult.count === 1) {
            this.redisService.setData(email, verificationCode, 900)
            return {
                status: "ok",
                message: "본인확인 인증번호를 발송하였습니다",
            }
        } else {
            throw new BadRequestException("NCP SENS transport failed")
        }
    }

    async checkAuthCode(dto: CheckAuthCodeDto) {
        const { email, verificationCode } = dto
        const authorizationCode = await this.redisService.getData(email)
        if (authorizationCode !== verificationCode) {
            throw new BadRequestException("이메일 인증에 실패하였습니다")
        }
        await this.redisService.deleteData(email)
        const responseData = {
            verificationToken: `${this.jwtService.generateJwtToken({
                id: email,
                exp: Math.floor(Date.now() / 1000) + 60 * 15,
            })}`,
        }
        return responseData
    }

    async findId(dto: FindIdDto): Promise<StatusOk> {
        const { verificationToken } = dto
        const jwtData = this.jwtService.decodeJwtToken(verificationToken)
        const isBlackList = this.redisService.getData(
            `blacklist-${verificationToken}`,
        )
        if (isBlackList !== null) {
            throw new UnauthorizedException("해당 토큰은 블랙리스트입니다")
        }
        const exp = jwtData.exp - Math.floor(Date.now() / 1000)
        const [user] = await Promise.all([
            this.userRepository.getUserByEmail(jwtData.id),
            this.redisService.setOnlyKey(`blacklist-${verificationToken}`, exp),
        ])
        return { status: "ok", message: `id는 ${user.id} 입니다` }
    }

    async signIn(dto: LoginDto) {
        const token: string = this.jwtService.generateJwtToken({
            id: dto.email,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        })
        const responseData = {
            accessToken: token,
            user: {
                email: dto.email,
            },
        }
        return responseData
    }

    async validateUser(dto: LoginDto) {
        return await this.userRepository.validateUser(dto)
    }

    async resetPassword(dto: ResetPasswordDto): Promise<StatusOk> {
        const { verificationToken, password } = dto
        const jwtResult = this.jwtService.decodeJwtToken(verificationToken)
        const isBlackList = await this.redisService.getData(
            `blacklist-${verificationToken}`,
        )
        if (isBlackList !== null)
            throw new UnauthorizedException("해당 토큰은 블랙리스트입니다")
        const exp = jwtResult.exp - Math.floor(Date.now() / 1000)
        await this.userRepository.updateUserPassword(jwtResult.id, password)
        await this.redisService.setOnlyKey(
            `blacklist-${verificationToken}`,
            exp,
        )
        return { status: "ok", message: `비밀번호 초기화가 완료되었습니다` }
    }

    async deleteAccount(dto: DeleteUserDto, bearer: string): Promise<StatusOk> {
        const { password, email } = dto
        const decodedToken = this.jwtService.decodeJwtToken(bearer)
        if (email !== decodedToken.id) {
            throw new UnauthorizedException("계정정보가 일치하지 않습니다")
        }
        await this.userRepository.deleteUser({
            email,
            password,
        })
        return { status: "ok", message: `계정이 삭제되었습니다` }
    }
}
