import {
    Module,
    Global,
    MiddlewareConsumer,
    RequestMethod,
} from "@nestjs/common"
import { AppController } from "./app.controller"
import { AuthModule } from "./app/auth/auth.module"
import { ConfigModule } from "@nestjs/config"
import { AuthService } from "./app/auth/service/auth.service"
import { RedisService } from "./shared/services/redis.service"
import { DatabaseModule } from "./shared/database/mongodb.module"
import { AudioModule } from "./app/audio/audio.module"
@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ".env",
            isGlobal: true,
        }),
        AuthModule,
        AudioModule,
    ],
    controllers: [AppController],
    providers: [RedisService],
})
export class ApplicationModule {}
