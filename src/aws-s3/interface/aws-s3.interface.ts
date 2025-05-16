export interface UploadedFileServiceInterface {
    uploadFileToPublicBucket(
        file: Express.Multer.File
    ): Promise<{ url: string; key: string }>
}