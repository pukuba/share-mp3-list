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
    Req,
    UseInterceptors,
    Ip,
    UploadedFile,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { AuthGuard } from "@nestjs/passport"
import {
    ApiBearerAuth,
    ApiTags,
    ApiOperation,
    ApiBody,
    ApiConsumes,
} from "@nestjs/swagger"

// Other dependencies
import * as concat from "concat-stream"

// Local files
import { JwtAuthGuard } from "src/shared/guards/role.guard"
import { jwtManipulationService } from "src/shared/services/jwt.manipulation.service"
import { ValidationPipe } from "../../../shared/pipes/validation.pipe"
import { AudioService } from "../service/audio.service"
import { UploadAudioDto, UpdateAudioDto } from "../dto"

@ApiTags("v1/audio")
@Controller("v1/audio")
export class AudioController {
    constructor(private readonly audioService: AudioService) {}

    // @ApiBearerAuth()
    // @UseGuards(AuthGuard("jwt"))
    @Post("")
    @UseInterceptors(FileInterceptor("file"))
    @ApiOperation({ summary: "음원 업로드" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({ type: UploadAudioDto })
    async uploadAudio(
        // @Headers("authorization") bearer: string,
        @UploadedFile() file,
        @Body() body: UploadAudioDto,
    ) {
        return this.audioService.uploadAudio("test", file, body)
    }

    @Get(":audioId")
    @ApiOperation({ summary: "음원 가져오기" })
    async getAudio(
        @Ip() ip: string,
        @Param("audioId") audioId: string,
        @Headers("authorization") bearer: string,
    ) {
        let userId: string | undefined = undefined
        try {
            userId = jwtManipulationService.decodeJwtToken(bearer, "id")
        } catch {
            userId = undefined
        }
        return this.audioService.getAudio(audioId, ip, userId)
    }

    @Get("/search")
    @ApiOperation({ summary: "음원을 검색" })
    async searchAudio(@Query() { page, keyword }) {
        return this.audioService.searchAudio(page, keyword)
    }

    @Delete(":audioId")
    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "음원을 삭제" })
    async deleteMedia(
        @Headers("authorization") bearer: string,
        @Param("audioId") audioId: string,
    ) {
        return this.audioService.deleteAudio(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            audioId,
        )
    }

    @Patch(":audioId")
    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @ApiOperation({ summary: "음원 제목을 수정" })
    async updateMedia(
        @Headers("authorization") bearer: string,
        @Param("audioId") audioId: string,
        @Body() body: UpdateAudioDto,
    ) {
        return this.audioService.updateAudio(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            audioId,
            body,
        )
    }
}
