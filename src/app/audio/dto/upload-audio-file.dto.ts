import { ApiProperty } from "@nestjs/swagger"
import { File } from "src/shared/services/type"
import { IsNotEmpty, Length, Matches } from "class-validator"

enum Filter {
    NightCore,
    Stereo,
    Default,
}

export class UploadAudioByFileDto {
    @ApiProperty({
        required: false,
        example: "이무진 신호등 ㅇㅅㅇ",
    })
    @IsNotEmpty()
    @Length(3, 75)
    name: string

    @ApiProperty({
        required: true,
        example: "Default",
        enum: ["Default", "NightCore", "Stereo"],
    })
    @IsNotEmpty()
    @Matches(
        `^${Object.values(Filter)
            .filter((v) => typeof v !== "number")
            .join("|")}$`,
        "i",
    )
    filter: "Default" | "NightCore" | "Stereo"

    @ApiProperty({
        required: true,
        type: "string",
        format: "binary",
    })
    file: File
}
