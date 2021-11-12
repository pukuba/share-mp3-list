import { ApiProperty } from "@nestjs/swagger"

import { IsNotEmpty, Length, Matches } from "class-validator"

enum Filter {
    NightCore,
    Stereo,
    Default,
}

export class UploadAudioByLinkDto {
    @ApiProperty({
        required: true,
        example: "https://www.youtube.com/watch?v=mImuQrNuDdM",
    })
    youtubeLink: string

    @ApiProperty({
        required: true,
        example: "filter option",
    })
    @IsNotEmpty()
    @Matches(
        `^${Object.values(Filter)
            .filter((v) => typeof v !== "number")
            .join("|")}$`,
        "i",
    )
    filter: string
}
