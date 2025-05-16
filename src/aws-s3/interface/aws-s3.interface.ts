export interface UploadedFileServiceInterface {
    uploadFileToPublicBucket(
        path: string,
        { file, fileName }: { file: Express.Multer.File; fileName: string }
    ): Promise<{ url: string; key: string }>
}