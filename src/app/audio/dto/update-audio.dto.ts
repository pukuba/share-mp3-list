import { ApiProperty } from "@nestjs/swagger"

import { IsNotEmpty, Length } from "class-validator"

export class UpdateAudioDto {
    @ApiProperty({
        required: false,
        example: "audio name",
    })
    @IsNotEmpty()
    @Length(3, 75)
    name: string
}
