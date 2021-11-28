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
            $or: [{ email: dto.email }, { username: dto.username }],
        })
        if (has === null) {
            return true
        }
        return false
    }

    async validateUser(dto: LoginDto) {
        let user
        user = await this.db.collection("user").findOne({ email: dto.email })
        if (user === null) {
            throw new NotFoundException("계정이 존재하지 않습니다")
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
            email: dto.email,
        }
        try {
            await this.db.collection("user").insertOne(newUser)
        } catch (error) {
            throw new UnprocessableEntityException(
                "아이디 혹은 이메일이 다른유저와 중복됩니다",
            )
        }
    }

    async getUserByEmail(email: string) {
        const res = await this.db.collection("user").findOne({ email })
        if (res === null) {
            throw new NotFoundException("계정이 존재하지 않습니다.")
        }
        return res
    }

    async getUserByUsername(username: string) {
        const res = await this.db.collection("user").findOne({
            username,
        })

        if (res === null)
            throw new NotFoundException("계정이 존재하지 않습니다")
        return res
    }

    async updateUserPassword(email: string, password: string) {
        const user = await this.db.collection("user").findOne({ email })
        if (user === null)
            throw new NotFoundException("계정이 존재하지 않습니다")

        const hashedPassword = crypto.hashSync(password, crypto.genSaltSync(10))
        await this.db
            .collection("user")
            .updateOne({ email }, { $set: { password: hashedPassword } })
        return user
    }

    async deleteUser(dto: DeleteUserDto) {
        try {
            const user = await this.validateUser(dto)
            const { deletedCount } = await this.db
                .collection("user")
                .deleteOne({ email: user.email })

            if (deletedCount === 0) throw new Error()
            const folderList = await this.db
                .collection("folder")
                .find({ creator: dto.email })
                .toArray()

            await Promise.all([
                this.db.collection("audio").deleteMany({ userId: dto.email }),
                this.db.collection("folder").deleteMany({ creator: dto.email }),
                this.db.collection("file").deleteMany({
                    folderId: {
                        $in: folderList.map((folder) => folder._id),
                    },
                }),
                this.db.collection("like").deleteMany({ userId: dto.email }),
            ])
        } catch (e) {
            throw new NotFoundException("계정이 존재하지 않습니다")
        }
    }
}
