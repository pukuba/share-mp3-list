import { ObjectId } from "mongodb"

/**
 * @description 음원의 도큐먼트 인터페이스
 * @prop {ObjectId} audioId Document의 고유 아이디
 * @prop {string} userId 유저 아이디
 * @prop {string} url 음원 경로
 * @prop {string} title 음원 제목
 * @prop {string} filter 음원 필터
 * @prop {number} views 음원 조회수
 * @prop {number} duration 음원 길이
 */
export interface AudioEntity {
    audioId: ObjectId
    userId: string
    url: string
    title: string
    filter: "Default" | "NightCore" | "Stereo" | "NoiseFilter"
    views: number
    duration: number
}

/**
 * @description 폴더의 도큐먼트 인터페이스
 * @prop {ObjectId} folderId Document의 고유 아이디
 * @prop {string} userId 유저 아이디
 * @prop {string} folderName 폴더 이름
 * @prop {number} like 좋아요 수
 * @prop {Date} updatedAt 최근 업데이트 날짜
 * @prop {Date} createdAt 생성 날짜
 *
 */
export interface FolderEntity {
    folderId: ObjectId
    userId: string
    folderName: string
    like: number
    updatedAt: Date
    createdAt: Date
}

/**
 * @description 폴더내에 파일의 도큐먼트 인터페이스
 * @prop {ObjectId} _id Document의 고유 아이디
 * @prop {ObjectId} folderId 폴더 아이디
 * @prop {ObjectId} audioId 음원 아이디
 */
interface FileEntity {
    _id: ObjectId
    folderId: ObjectId
    audioId: ObjectId
}
