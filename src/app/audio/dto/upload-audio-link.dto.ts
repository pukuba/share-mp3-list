import { ApiProperty } from "@nestjs/swagger"

import { IsNotEmpty, Length, Matches, IsEnum } from "class-validator"

enum Filter {
    NightCore,
    Stereo,
    Default,
    NoiseFilter,
}

export class UploadAudioByLinkDto {
    @ApiProperty({
        required: false,
        example: "Stay NightCore Version",
    })
    name?: string

    @ApiProperty({
        required: true,
        example: "https://www.youtube.com/watch?v=mImuQrNuDdM",
    })
    youtubeLink: string

    @ApiProperty({
        required: true,
        example: "Default",
        enum: ["Default", "NightCore", "Stereo", "NoiseFilter"],
    })
    @Matches(
        `^${Object.values(Filter)
            .filter((v) => typeof v !== "number")
            .join("|")}$`,
        "i",
    )
    filter: "Default" | "NightCore" | "Stereo" | "NoiseFilter"
}
