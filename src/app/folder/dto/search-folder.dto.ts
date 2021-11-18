import { ApiProperty, ApiQuery } from "@nestjs/swagger"

import { IsNotEmpty, Length, Matches } from "class-validator"

enum Sort {
    DateLatest,
    DateLast,
    /**오름차 */
    LikeAsc,
    /**내림차 */
    LikeDesc,
}

export class SearchFolderDto {
    @ApiProperty({
        description: "검색할 키워드",
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
        description: "작성자 검색",
        required: false,
        name: "creator",
    })
    creator: string

    @ApiProperty({
        description: "정렬옵션",
        required: false,
        name: "sort",
        example: "DateLatest",
        enum: Sort,
    })
    @Matches(
        `^${Object.values(Sort)
            .filter((v) => typeof v !== "number")
            .join("|")}$`,
        "i",
    )
    sort: "DateLatest" | "DateLast" | "LikeAsc" | "LikeDesc"
}
