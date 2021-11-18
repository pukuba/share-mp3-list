import { ApiProperty, ApiQuery } from "@nestjs/swagger"

export class SearchAudioDto {
    @ApiProperty({
        description: "신호등",
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
}
