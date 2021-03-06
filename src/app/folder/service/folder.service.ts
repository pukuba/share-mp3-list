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
import { ObjectId } from "mongodb"
import { getRepository, Repository } from "typeorm"
import { validate } from "class-validator"
import { JwtPayload } from "jsonwebtoken"

// Local files
import { UpdateFolderDto } from "../dto"
import { TSort } from "src/shared/types"
import { JwtManipulationService } from "src/shared/services/jwt.manipulation.service"
import { UserRepository } from "src/shared/repositories/user.repository"
import { FolderRepository } from "src/shared/repositories/folder.repository"
import { StatusOk } from "src/shared/types"

@Injectable()
export class FolderService {
    constructor(private readonly folderRepository: FolderRepository) {}

    async like(userId: string, folderId: string) {
        const getFolder = await this.folderRepository.getFolderByFolderId(
            folderId,
        )
        if (!getFolder) {
            throw new BadRequestException("폴더가 존재하지 않습니다")
        }
        const res = await this.folderRepository.like(folderId, userId)
        return {
            status: "ok",
            message: `정상적으로 좋아요를 ${
                res === true ? "눌렀습니다" : "취소했습니다"
            }`,
        }
    }

    async createFolder(
        userId: string,
        folderName: string,
    ): Promise<StatusOk & { folderId: ObjectId }> {
        const isHas = await this.folderRepository.getFolderByFolderName(
            folderName,
        )
        if (isHas) {
            throw new BadRequestException("Folder name is existed")
        }
        const res = await this.folderRepository.createFolder(userId, folderName)
        return {
            status: "ok",
            message: "정상적으로 폴더를 생성하였습니다",
            folderId: res.folderId,
        }
    }

    async updateFolder(
        userId: string,
        folderId: string,
        dto: UpdateFolderDto,
    ): Promise<StatusOk> {
        dto.folderName
        const getFolder = await this.folderRepository.getFolderByFolderId(
            folderId,
        )
        if (!getFolder || getFolder?.creator !== userId) {
            throw new BadRequestException(
                "폴더가 존재하지 않거나 본인의 폴더가 아닙니다",
            )
        }
        await this.folderRepository.updateFolder(
            getFolder._id.toString(),
            dto.folderName,
        )
        return {
            status: "ok",
            message: "정상적으로 폴더를 수정하였습니다",
        }
    }

    async addAudioToFolder(
        userId: string,
        folderId: string,
        audioId: string,
    ): Promise<StatusOk> {
        const getFolder = await this.folderRepository.getFolderByFolderId(
            folderId,
        )
        if (!getFolder || getFolder?.creator !== userId) {
            throw new BadRequestException(
                "폴더가 존재하지 않거나 본인의 폴더가 아닙니다",
            )
        }
        await this.folderRepository.addAudioToFolder(folderId, audioId)
        return {
            status: "ok",
            message: "정상적으로 음원이 폴더에 추가되었습니다",
        }
    }

    async delAudioToFolder(
        userId: string,
        folderId: string,
        audioId: string,
    ): Promise<StatusOk> {
        const getFolder = await this.folderRepository.getFolderByFolderId(
            folderId,
        )

        if (!getFolder || getFolder?.creator !== userId) {
            throw new BadRequestException(
                "폴더가 존재하지 않거나 본인의 폴더가 아닙니다",
            )
        }

        await this.folderRepository.delAudioToFolder(folderId, audioId)

        return {
            status: "ok",
            message: "정상적으로 음원이 폴더에서 삭제되었습니다",
        }
    }

    async delFolder(userId: string, folderId: string): Promise<StatusOk> {
        await this.folderRepository.delFolder(folderId, userId)

        return {
            status: "ok",
            message: "정상적으로 폴더가 삭제되었습니다",
        }
    }

    async getFolder(folderId: string, userId?: string) {
        const getFolder = await this.folderRepository.getFolderInfo(
            folderId,
            userId,
        )
        if (!getFolder) {
            throw new BadRequestException("폴더가 존재하지 않습니다")
        }
        return getFolder
    }

    async searchFolder(
        keyword: string,
        creator: string,
        page: number,
        sort: TSort,
        userId?: string,
    ) {
        const res = await this.folderRepository.searchFolder(
            keyword,
            creator,
            page,
            sort || "DateLatest",
            userId,
        )
        return {
            pageInfo: {
                count: res.count,
                page: page,
            },
            data: res.data,
        }
    }

    async getLikeFolders(userId: string, page: number) {
        const res = await this.folderRepository.getLikeFolders(userId, page)
        return {
            pageInfo: {
                count: res.count,
                page: page,
            },
            data: res.data,
        }
    }
}
