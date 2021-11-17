import {
    MiddlewareConsumer,
    Module,
    NestModule,
    RequestMethod,
} from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtModule } from "@nestjs/jwt"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AuthController } from "./controller/auth.controller"
import { AuthService } from "./service/auth.service"
import { PassportModule } from "@nestjs/passport"
import { UserRepository } from "src/shared/repositories/user.repository"
import { JwtManipulationService } from "src/shared/services/jwt.manipulation.service"
import { configService } from "src/shared/services/config.service"
import { MailService } from "src/shared/services/mail.service"
import { RedisService } from "src/shared/services/redis.service"
import { JwtStrategy } from "./strategy/jwt.strategy"
import { JwtAuthGuard } from "src/shared/guards/role.guard"
import { BlacklistMiddleware } from "src/shared/middleware/blacklist.middleware"
import { DatabaseModule } from "../../shared/database/mongodb.module"
@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: configService.getEnv("JWT_TOKEN"),
        }),
        DatabaseModule,
    ],
    providers: [
        AuthService,
        RedisService,
        MailService,
        JwtManipulationService,
        JwtStrategy,
        UserRepository,
    ],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(BlacklistMiddleware).forRoutes({
            path: "v1/auth/sign-out",
            method: RequestMethod.DELETE,
        })
    }
}
