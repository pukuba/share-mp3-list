// Nest dependencies
import { APP_GUARD } from "@nestjs/core"
import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common"

// Local files
import { AudioController } from "./controller/audio.controller"
import { AudioService } from "./service/audio.service"
import { UserRepository } from "src/shared/repositories/user.repository"
import { AwsService } from "src/shared/services/aws.service"
import { AudioRepository } from "src/shared/repositories/audio.repository"
import { RedisService } from "src/shared/services/redis.service"
import { FFmpegService } from "src/shared/services/ffmpeg.service"
import { DatabaseModule } from "../../shared/database/mongodb.module"
@Module({
    imports: [DatabaseModule],
    controllers: [AudioController],
    providers: [
        AudioService,
        AwsService,
        RedisService,
        FFmpegService,
        AudioRepository,
        UserRepository,
    ],
    exports: [AudioService],
})
export class AudioModule {
    // configure(consumer: MiddlewareConsumer) {
    //     consumer.apply(BlacklistMiddleware).forRoutes({
    //         path: "v1/auth/sign-out",
    //         method: RequestMethod.DELETE,
    //     })
    // }
}
