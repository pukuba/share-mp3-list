import { ApiProperty } from "@nestjs/swagger"

import { IsNotEmpty, Length } from "class-validator"

export class UploadAudioDto {
    @ApiProperty({
        required: true,
        example: "audio name",
    })
    @IsNotEmpty()
    @Length(3, 75)
    name: string

    @ApiProperty({
        required: false,
        example: "https://www.youtube.com/watch?v=mImuQrNuDdM",
    })
    youtubeURL?: string
}
