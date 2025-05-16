import { Controller, HttpStatus, ParseFilePipeBuilder, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AwsS3Service } from './aws-s3.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

@Controller('aws-s3')
export class AwsS3Controller {
    constructor(
        private readonly awsS3Service: AwsS3Service
    ) {}

    /**
     * Upload một ảnh lên S3 (bucket public).
     * 
     * @param file - Tệp ảnh (multipart/form-data)
     * @param path - Thư mục lưu trong bucket (query string)
     */
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
    async uploadFile(
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator(
                    {
                        fileType: /^(image\/(jpeg|png|jpg)|application\/pdf)$/,
                    }
                )
                .build({
                    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
                })
        ) file: Express.Multer.File,
    ): Promise<{ url: string; key: string }> {
        if (!file) {
            throw new Error('File is required');
        }

        const fileName = file.originalname;

        return this.awsS3Service.uploadFileToPublicBucket(
            'upload',
            {
                file,
                fileName,
            }
        );
    }
}