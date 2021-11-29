import { ApiProperty, ApiQuery } from "@nestjs/swagger"
import { IsNotEmpty, Length, Matches } from "class-validator"

enum Filter {
    ViewsDesc,
    ViewsAsc,
    Latest,
    Last,
}

export class FilterAudioDto {
    @ApiProperty({
        required: false,
        default: 1,
        name: "page",
    })
    page: number

    @ApiProperty({
        required: true,
        example: "Latest",
        enum: ["Latest", "Last", "ViewsDesc", "ViewsAsc"],
    })
    @IsNotEmpty()
    @Matches(
        `^${Object.values(Filter)
            .filter((v) => typeof v !== "number")
            .join("|")}$`,
        "i",
    )
    filter: "Latest" | "Last" | "ViewsDesc" | "ViewsAsc"
}
