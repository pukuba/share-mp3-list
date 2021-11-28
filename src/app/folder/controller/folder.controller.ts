// Nest dependencies
import {
    Get,
    Post,
    Body,
    Patch,
    UseGuards,
    Delete,
    Param,
    Headers,
    Query,
    Controller,
    UsePipes,
} from "@nestjs/common"
import {
    ApiBearerAuth,
    ApiTags,
    ApiOperation,
    ApiQuery,
    ApiBody,
} from "@nestjs/swagger"
import { AuthGuard } from "@nestjs/passport"

// Local files
import { FolderService } from "../service/folder.service"
import { JwtAuthGuard } from "src/shared/guards/role.guard"
import { ValidationPipe } from "../../../shared/pipes/validation.pipe"
import { CreateFolderDto, UpdateFolderDto, SearchFolderDto } from "../dto"
import { jwtManipulationService } from "src/shared/services/jwt.manipulation.service"

@ApiTags("v1/folder")
@Controller("v1/folder")
export class FolderController {
    constructor(private readonly folderService: FolderService) {}

    @Post("")
    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "폴더를 생성" })
    @ApiBody({ type: CreateFolderDto })
    async createFolder(
        @Headers("authorization") bearer: string,
        @Body() data: CreateFolderDto,
    ) {
        return await this.folderService.createFolder(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            data.folderName,
        )
    }

    @Get("/search")
    @ApiQuery({ type: SearchFolderDto })
    @ApiOperation({ summary: "폴더를 검색하기" })
    async searchFolder(
        @Query() { keyword, creator, page, sort },
        @Headers("authorization") bearer: string,
    ) {
        let id
        try {
            id = jwtManipulationService.decodeJwtToken(bearer, "id")
        } catch {
            id = undefined
        }
        return await this.folderService.searchFolder(
            keyword || "",
            creator || "",
            page || 1,
            sort || "DateLatest",
            id,
        )
    }

    @Post("/like/:folderId")
    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "폴더에 좋아요 표시 or 좋아요 취소" })
    async likeFolder(
        @Headers("authorization") bearer: string,
        @Param("folderId") folderId: string,
    ) {
        return await this.folderService.like(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            folderId,
        )
    }

    @Get("/like/:page")
    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "좋아요 리스트 가져오기" })
    async getLikeFolders(
        @Headers("authorization") bearer: string,
        @Param("page") page: number,
    ) {
        return await this.folderService.getLikeFolders(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            page || 1,
        )
    }

    @Delete("/:folderId")
    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "폴더를 삭제" })
    async delFolder(
        @Headers("authorization") bearer: string,
        @Param("folderId") folderId: string,
    ) {
        return await this.folderService.delFolder(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            folderId,
        )
    }

    @Get("/:folderId")
    @ApiOperation({ summary: "폴더의 정보 가져오기" })
    async getFolder(
        @Headers("authorization") bearer: string,
        @Param("folderId") folderId: string,
    ) {
        let id
        try {
            id = jwtManipulationService.decodeJwtToken(bearer, "id")
        } catch {
            id = undefined
        }
        return await this.folderService.getFolder(folderId, id)
    }

    @Patch("/:folderId")
    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "폴더를 수정" })
    async updateFolder(
        @Headers("authorization") bearer: string,
        @Param("folderId") folderId: string,
        @Body() data: UpdateFolderDto,
    ) {
        return await this.folderService.updateFolder(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            folderId,
            data,
        )
    }

    @Post("/:folderId/:audioId")
    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "음원을 폴더에 추가" })
    async addAudioToFolder(
        @Headers("authorization") bearer: string,
        @Param("folderId") folderId: string,
        @Param("audioId") audioId: string,
    ) {
        return await this.folderService.addAudioToFolder(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            folderId,
            audioId,
        )
    }

    @Delete("/:folderId/:audioId")
    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "폴더에서 음원을 삭제" })
    async delAudioToFolder(
        @Headers("authorization") bearer: string,
        @Param("folderId") folderId: string,
        @Param("audioId") audioId: string,
    ) {
        return await this.folderService.delAudioToFolder(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            folderId,
            audioId,
        )
    }
}
