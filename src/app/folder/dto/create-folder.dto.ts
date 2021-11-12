import { ApiProperty } from "@nestjs/swagger"

import { IsNotEmpty, Length } from "class-validator"

export class CreateFolderDto {
    @ApiProperty({
        required: true,
        example: "즐겨찾기",
    })
    @IsNotEmpty()
    @Length(1, 75)
    folderName: string
}
