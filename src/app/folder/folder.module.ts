// Nest dependencies
import { APP_GUARD } from "@nestjs/core"
import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"

// Local files
import { FolderController } from "./controller/folder.controller"
import { FolderService } from "./service/folder.service"
import { UserRepository } from "src/shared/repositories/user.repository"
import { JwtManipulationService } from "src/shared/services/jwt.manipulation.service"
import { AwsService } from "src/shared/services/aws.service"
import { JwtAuthGuard } from "src/shared/guards/role.guard"
import { AudioRepository } from "src/shared/repositories/audio.repository"
import { RedisService } from "src/shared/services/redis.service"
import { configService } from "src/shared/services/config.service"
import { BlacklistMiddleware } from "src/shared/middleware/blacklist.middleware"
import { DatabaseModule } from "../../shared/database/mongodb.module"
import { FolderRepository } from "src/shared/repositories/folder.repository"
@Module({
    imports: [DatabaseModule],
    controllers: [FolderController],
    providers: [
        FolderService,
        AwsService,
        AudioRepository,
        UserRepository,
        FolderRepository,
    ],
    exports: [FolderService],
})
export class FolderModule {
    // configure(consumer: MiddlewareConsumer) {
    //     consumer.apply(BlacklistMiddleware).forRoutes({
    //         path: "v1/auth/sign-out",
    //         method: RequestMethod.DELETE,
    //     })
    // }
}
