import { IsString } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class FindIdDto {
    @ApiProperty({
        type: String,
        description: "본인확인 인증번호",
        required: true,
    })
    @IsString()
    readonly verificationToken: string
}
