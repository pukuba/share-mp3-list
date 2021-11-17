import fetch from "node-fetch"
import * as crypto from "crypto-js"
import { Injectable } from "@nestjs/common"
import { ISendVerificationMail } from "./type/index"
import { configService } from "./config.service"

@Injectable()
export class MessageService {
    async sendVerificationMessage(bodyData: ISendVerificationMail) {
        const { verificationCode, email } = bodyData

        const timeStamp = Date.now().toString()

        return await fetch(`https://mail.apigw.ntruss.com/api/v1/mails`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "x-ncp-iam-access-key": configService.getEnv("NCP_ACCESS_KEY"),
                "x-ncp-apigw-timestamp": timeStamp,
                "x-ncp-apigw-signature-v2": this.getSignature(timeStamp),
            },
            body: JSON.stringify({
                senderAddress: configService.getEnv("NCP_SENDER_ADDRESS"),
                senderName: "Share Mp3 List",
                title: this.getTitle(verificationCode),
                body: this.getBody(verificationCode),
                recipients: [{ address: email, type: "R" }],
            }),
        }).then((x) => x.json())
    }

    private getSignature(timeStamp: string) {
        const hmac = crypto.algo.HMAC.create(
            crypto.algo.SHA256,
            configService.getEnv("NCP_SECRET_KEY"),
        )
        hmac.update("POST")
        hmac.update(" ")
        hmac.update(`/api/v1/mails`)
        hmac.update("\n")
        hmac.update(timeStamp)
        hmac.update("\n")
        hmac.update(configService.getEnv("NCP_ACCESS_KEY"))
        return hmac.finalize().toString(crypto.enc.Base64)
    }

    private getTitle(verificationCode: string) {
        return `[Share Mp3 List] 이메일 인증번호 : ${verificationCode}`
    }

    private getBody(verificationCode: string) {
        return `
        <tbody>
    <tr>
        <td
            style="
                padding: 5% 3%;
                border-top: 0;
                background-color: #1f1f1f;
                font-size: 14px;
                color: #b3b3b5;
            "먀
        >
            <table
                cellspacing="0"
                cellpadding="0"
                style="
                    width: 100%;
                    max-width: 800px;
                    border-collapse: collapse;
                    margin: 0 auto;
                    text-align: center;
                "
            >
                <tbody>
                    <tr>
                        <td style="padding: 0; margin: 0">
                            <img
                                style="
                                    vertical-align: middle;
                                    border: 2px indigo solid;
                                    border-radius: 25%;
                                "
                                src="https://cdn.discordapp.com/attachments/817461127574716488/910613314323750952/logo.png"
                                alt="로고"
                                loading="lazy"
                                height="50px"
                                width="50px"
                            />
                            <span
                                style="
                                    vertical-align: middle;
                                    font-family: 'Dotum';
                                    color: #b8b8b8;
                                    letter-spacing: -2px;
                                    font-size: 20px;
                                    margin-left: 10px;
                                    font-weight: bold;
                                "
                                >Share Mp3 List 이메일 인증</span
                            >
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0; margin: 0">
                            <div
                                style="
                                    font-family: 'Dotum';
                                    letter-spacing: 0px;
                                    text-align: left;
                                "
                            >
                                <p
                                    style="
                                        padding: 0;
                                        margin: 6% 0 0;
                                        letter-spacing: -1px;
                                        text-align: center;
                                        line-height: 20px;
                                        font-size: 14px;
                                        color: #838383;
                                    "
                                >
                                    Share Mp3 List 계정에 등록한 이메일 주소가
                                    올바른지 확인하기 위한 인증번호입니다.<br />아래의
                                    인증번호를 복사하여 이메일 인증을 완료해
                                    주세요.
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0; margin: 0">
                            <p
                                style="
                                    padding: 0;
                                    margin: 6% 0 0;
                                    letter-spacing: -1px;
                                    text-align: center;
                                    line-height: 40px;
                                    font-size: 40px;
                                    color: #1cb3cc;
                                "
                            >
                                ${verificationCode}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0; margin: 0">
                            <div
                                style="
                                    font-family: 'Dotum';
                                    letter-spacing: 0px;
                                    text-align: left;
                                "
                            >
                                <p
                                    style="
                                        padding: 0;
                                        margin: 6% 0 0;
                                        letter-spacing: -1px;
                                        text-align: center;
                                        line-height: 20px;
                                        font-size: 14px;
                                        color: #838383;
                                    "
                                >
                                    개인정보 보호를 위해 인증번호는 10분 동안만
                                    유효합니다.<br />향후 비정상적인 계정 접속
                                    등 보안 문제가 발생할 경우 해당 이메일
                                    주소로 알려드릴 예정입니다.
                                </p>
                                <p
                                    style="
                                        padding: 0;
                                        margin: 3% 0 0;
                                        letter-spacing: -1px;
                                        text-align: center;
                                        line-height: 20px;
                                        font-size: 14px;
                                        color: #838383;
                                    "
                                >
                                    발신전용 메일입니다. 궁금하신 사항은
                                    홈페이지에 있는 1대 1문의를 사용해주세요
                                </p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </td>
    </tr>
    <!--//cont--><!--footer-->
    <tr></tr>
    <!--//footer-->
</tbody>

        `
    }
}
