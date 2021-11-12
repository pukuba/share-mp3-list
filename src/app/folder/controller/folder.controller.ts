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
import { ApiBearerAuth, ApiTags, ApiOperation } from "@nestjs/swagger"
import { AuthGuard } from "@nestjs/passport"

// Local files
import { FolderService } from "../service/folder.service"
import { JwtAuthGuard } from "src/shared/guards/role.guard"
import { ValidationPipe } from "../../../shared/pipes/validation.pipe"
import { CreateFolderDto, UpdateFolderDto } from "../dto"
import { jwtManipulationService } from "src/shared/services/jwt.manipulation.service"

@ApiTags("v1/folder")
@Controller("v1/folder")
export class AuthController {
    constructor(private readonly folderService: FolderService) {}

    @Post("")
    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "Create folder" })
    async createFolder(
        @Headers("authorization") bearer: string,
        @Body() data: CreateFolderDto,
    ) {
        return this.folderService.createFolder(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            data.folderName,
        )
    }

    @Patch("/:folderId")
    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "Create folder" })
    async updateFolder(
        @Headers("authorization") bearer: string,
        @Param("folderId") folderId: string,
        @Body() data: UpdateFolderDto,
    ) {
        return this.folderService.updateFolder(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            folderId,
            data,
        )
    }

    @Post("/:folderId/:audioId")
    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "Add audio to folder" })
    async addAudioToFolder(
        @Headers("authorization") bearer: string,
        @Param("folderId") folderId: string,
        @Param("audioId") audioId: string,
    ) {
        return this.folderService.addAudioToFolder(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            folderId,
            audioId,
        )
    }

    @Delete("/:folderId/:audioId")
    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "Delete audio to folder" })
    async delAudioToFolder(
        @Headers("authorization") bearer: string,
        @Param("folderId") folderId: string,
        @Param("audioId") audioId: string,
    ) {
        return this.folderService.delAudioToFolder(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            folderId,
            audioId,
        )
    }

    @Delete("/:folderId")
    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "Delete audio to folder" })
    async delFolder(
        @Headers("authorization") bearer: string,
        @Param("folderId") folderId: string,
    ) {
        return this.folderService.delFolder(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            folderId,
        )
    }

    @Get("/:folderId")
    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "Create folder" })
    async getFolder(
        @Headers("authorization") bearer: string,
        @Param("folderId") folderId: string,
    ) {
        return this.folderService.getFolder(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            folderId,
        )
    }
}