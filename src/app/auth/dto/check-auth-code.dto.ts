import {
    IsNotEmpty,
    IsString,
    Length,
    Matches,
    Min,
    Max,
    IsNumber,
    IsNumberString,
} from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class CheckAuthCodeDto {
    @ApiProperty({
        type: String,
        description: "유저 Email",
        required: true,
    })
    @IsString()
    @Matches(
        /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
        { message: "이메일은 RFC 5322에 맞춰야합니다. eg. pukuba@kakao.com" },
    )
    readonly email: string

    @ApiProperty({
        type: Number,
        description: "인증번호",
        required: true,
    })
    @IsNumberString()
    @Min(100000)
    @Max(999999)
    readonly verificationCode: string
}
