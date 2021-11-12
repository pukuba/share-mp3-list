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
// import {
//     CreateUserDto,
//     CreateAuthCodeDto,
//     CheckAuthCodeDto,
//     LoginDto,
//     FindIdDto,
//     ResetPasswordDto,
//     DeleteUserDto,
// } from "../dto"
import { JwtManipulationService } from "src/shared/services/jwt.manipulation.service"
import { UserRepository } from "src/shared/repositories/user.repository"
import { FolderRepository } from "src/shared/repositories/folder.repository"
import { StatusOk } from "src/shared/types"

@Injectable()
export class FolderService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly folderRepository: FolderRepository,
    ) {}

    async createFolder(userId: string, folderName: string): Promise<StatusOk> {
        const isHas = await this.folderRepository.getFolderByFolderName(
            folderName,
        )
        if (isHas) {
            throw new BadRequestException("Folder name is existed")
        }
        await this.folderRepository.createFolder(userId, folderName)
        return {
            status: "ok",
            message: "정상적으로 폴더를 생성하였습니다",
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
        if (!getFolder || getFolder?.userId !== userId) {
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

        if (!getFolder || getFolder?.userId !== userId) {
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
}
