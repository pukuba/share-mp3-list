import { ApiProperty, ApiQuery } from "@nestjs/swagger"

import { IsNotEmpty, Length } from "class-validator"

export class SearchFolderDto {
    @ApiProperty({
        description: "노래모음1",
        required: false,
        name: "keyword",
    })
    keyword: string

    @ApiProperty({
        required: false,
        default: 1,
        name: "page",
    })
    page: number

    @ApiProperty({
        description: "pukuba",
        required: false,
        name: "creator",
    })
    creator: string
}
