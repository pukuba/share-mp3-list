import { NestFactory } from "@nestjs/core"
import { ApplicationModule } from "./app.module"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
async function bootstrap(): Promise<void> {
    const appOptions = { cors: true }
    const app = await NestFactory.create(ApplicationModule, appOptions)
    app.setGlobalPrefix("api")

    const options = new DocumentBuilder()
        .setTitle("Share Mp3 List API")
        .setDescription("The Share-Mp3-List API description")
        .setVersion("1.3")
        .setBasePath("api")
        .addBearerAuth()
        .build()

    const document = SwaggerModule.createDocument(app, options)
    SwaggerModule.setup("/docs", app, document)
    await app.listen(3000)
}
bootstrap()
