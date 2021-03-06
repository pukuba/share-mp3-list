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
    ApiQuery,
} from "@nestjs/swagger"

// Other dependencies
import * as concat from "concat-stream"

// Local files
import { JwtAuthGuard } from "src/shared/guards/role.guard"
import { jwtManipulationService } from "src/shared/services/jwt.manipulation.service"
import { ValidationPipe } from "../../../shared/pipes/validation.pipe"
import { AudioService } from "../service/audio.service"
import {
    UploadAudioByFileDto,
    UpdateAudioDto,
    FilterAudioDto,
    UploadAudioByLinkDto,
    SearchAudioDto,
} from "../dto"

@ApiTags("v1/audio")
@Controller("v1/audio")
export class AudioController {
    constructor(private readonly audioService: AudioService) {}

    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @Post("/file")
    @UseInterceptors(FileInterceptor("file"))
    @ApiOperation({ summary: "음원 업로드" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({ type: UploadAudioByFileDto })
    async uploadAudioByFile(
        @Headers("authorization") bearer: string,
        @UploadedFile() file,
        @Body() body: UploadAudioByFileDto,
    ) {
        return this.audioService.uploadAudioByFile(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            file,
            body,
        )
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard("jwt"))
    @Post("/link")
    @ApiOperation({ summary: "음원 업로드" })
    @ApiBody({ type: UploadAudioByLinkDto })
    async uploadAudioByLink(
        @Headers("authorization") bearer: string,
        @Body() body: UploadAudioByLinkDto,
    ) {
        return this.audioService.uploadAudioByLink(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
            body,
        )
    }

    @Get("/search")
    @ApiQuery({ type: SearchAudioDto })
    @ApiOperation({ summary: "음원을 검색" })
    async searchAudio(@Query() { page, keyword }) {
        return this.audioService.searchAudio(page, keyword)
    }

    @Get("/random")
    @ApiOperation({ summary: "랜덤 음원 추천" })
    async randomAudio() {
        return this.audioService.randomAudio()
    }

    @Get("/main")
    @ApiQuery({ type: FilterAudioDto })
    @ApiOperation({ summary: "메인 음원 가져오기" })
    async filterAudio(@Query() { page, filter }) {
        return this.audioService.getFilterAudio(page, filter)
    }

    @Get("/my-audios")
    @ApiBearerAuth()
    @ApiOperation({ summary: "업로더로 음원 가져오기" })
    async getUploaderByAudio(@Headers("authorization") bearer: string) {
        return this.audioService.getUploaderByAudio(
            jwtManipulationService.decodeJwtToken(bearer, "id"),
        )
    }

    @Get(":audioId")
    @ApiOperation({ summary: "음원 가져오기" })
    async getAudio(
        @Headers("cf-connecting-ip") ip1: string,
        @Headers("x-forwarded-for") ip2: string,
        @Param("audioId") audioId: string,
    ) {
        console.log(ip1 || ip2)
        return this.audioService.getAudio(audioId, ip1 || ip2)
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
}
