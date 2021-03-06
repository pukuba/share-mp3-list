import { IsNotEmpty, IsString, Length, Matches } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class LoginDto {
    @ApiProperty({ type: String, description: "유저 Email", required: true })
    @IsString()
    @Matches(
        /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
        { message: "이메일은 RFC 5322에 맞춰야합니다. eg. pukuba@kakao.com" },
    )
    readonly email: string

    @ApiProperty({ type: String, description: "유저 Password", required: true })
    @IsString()
    @Matches(
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,40}$/,
        {
            message:
                "비밀번호는 6자 이상 40자 이하이며 하나 이상의 숫자 및 문자, 특수문자가 필요합니다.",
        },
    )
    readonly password: string
}
