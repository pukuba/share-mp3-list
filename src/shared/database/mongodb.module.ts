import { Module } from "@nestjs/common"
import { MongoClient, Db } from "mongodb"
import { configService } from "../services/config.service"

@Module({
    providers: [
        {
            provide: "DATABASE_CONNECTION",
            useFactory: async (): Promise<Db> => {
                try {
                    const client = await MongoClient.connect(
                        configService.getEnv("DB_HOST"),
                    )

                    const db = client.db()

                    await Promise.all([
                        db
                            .collection("user")
                            .createIndex({ email: 1 }, { unique: true }),
                        db
                            .collection("user")
                            .createIndex({ username: 1 }, { unique: true }),
                        db
                            .collection("folder")
                            .createIndex(
                                { userId: 1, folderName: 1 },
                                { unique: true },
                            ),
                        db
                            .collection("file")
                            .createIndex(
                                { folderId: 1, audioId: 1 },
                                { unique: true },
                            ),
                        db
                            .collection("like")
                            .createIndex(
                                { folderId: 1, userId: 1 },
                                { unique: true },
                            ),
                        db
                            .collection("audio")
                            .createIndex({ title: "text", userId: "text" }),
                    ])

                    return db
                } catch (e) {
                    throw e
                }
            },
        },
    ],
    exports: ["DATABASE_CONNECTION"],
})
export class DatabaseModule {}
