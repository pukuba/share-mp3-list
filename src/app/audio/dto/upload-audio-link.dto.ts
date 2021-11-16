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
        example: "Default",
        enum: ["Default", "NightCore", "Stereo", "NoiseFilter"],
    })
    @IsNotEmpty()
    @Matches(
        `^${Object.values(Filter)
            .filter((v) => typeof v !== "number")
            .join("|")}$`,
        "i",
    )
    filter: "Default" | "NightCore" | "Stereo" | "NoiseFilter"
}
