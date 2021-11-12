import {
    BadRequestException,
    UnprocessableEntityException,
    NotFoundException,
    Inject,
    ForbiddenException,
    Injectable,
    Module,
} from "@nestjs/common"

import { Repository, EntityRepository } from "typeorm"
import * as crypto from "bcryptjs"
import { Db } from "mongodb"

import {
    CreateUserDto,
    CreateAuthCodeDto,
    CheckAuthCodeDto,
    DeleteUserDto,
    LoginDto,
} from "src/app/auth/dto"

export class UserRepository {
    constructor(
        @Inject("DATABASE_CONNECTION")
        private db: Db,
    ) {}

    async isExist(dto: CreateUserDto) {
        const has = await this.db.collection("user").findOne({
            $or: [
                { id: dto.id },
                { username: dto.username },
                { phoneNumber: dto.phoneNumber },
            ],
        })
        if (has === null) {
            return true
        }
        return false
    }

    async validateUser(dto: LoginDto) {
        let user
        try {
            user = await this.db.collection("user").findOne({ id: dto.id })
        } catch {
            throw new BadRequestException("계정이 존재하지 않습니다.")
        }
        const isValidPassword = crypto.compareSync(dto.password, user.password)
        if (!isValidPassword)
            throw new BadRequestException("비밀번호가 올바르지 않습니다.")
        return user
    }

    async createUser(dto: CreateUserDto): Promise<void> {
        const newUser = {
            username: dto.username,
            password: crypto.hashSync(dto.password, crypto.genSaltSync(10)),
            phoneNumber: dto.phoneNumber,
            id: dto.id,
        }
        try {
            await this.db.collection("user").insertOne(newUser)
        } catch (error) {
            throw new UnprocessableEntityException(error.errmsg)
        }
    }

    async getUserByPhoneNumber(phoneNumber: string) {
        try {
            return await this.db.collection("user").findOne({ phoneNumber })
        } catch (err) {
            throw new NotFoundException("계정이 존재하지 않습니다.")
        }
    }

    async getUserById(id: string) {
        try {
            return await this.db.collection("user").findOne({
                id,
            })
        } catch (err) {
            throw new NotFoundException("계정이 존재하지 않습니다")
        }
    }

    async updateUserPassword(phoneNumber: string, password: string) {
        let user
        try {
            user = await this.db.collection("user").findOne({
                phoneNumber: phoneNumber,
            })
        } catch (error) {
            throw new NotFoundException("계정이 존재하지 않습니다")
        }
        const hashedPassword = crypto.hashSync(password, crypto.genSaltSync(10))
        await this.db
            .collection("user")
            .updateOne(
                { phoneNumber: phoneNumber },
                { $set: { password: hashedPassword } },
            )
        return user
    }

    async deleteUser(dto: DeleteUserDto) {
        try {
            const user = await this.validateUser(dto)
            const { deletedCount } = await this.db
                .collection("user")
                .deleteOne({ id: user.id })

            if (deletedCount === 0) throw new Error()
        } catch (e) {
            throw new NotFoundException("계정이 존재하지 않습니다")
        }
    }
}
