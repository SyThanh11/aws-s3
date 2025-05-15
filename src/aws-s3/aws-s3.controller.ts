import { Controller, HttpStatus, ParseFilePipeBuilder, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AwsS3Service } from './aws-s3.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('aws-s3')
export class AwsS3Controller {
    constructor(
        private readonly awsS3Service: AwsS3Service
    ) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile(
        new ParseFilePipeBuilder()
            .addFileTypeValidator(
                {
                    fileType: /^image\/(jpeg|png)$|^application\/pdf$/,
                }
            )
            .build({
                errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
            })
    ) file: Express.Multer.File) {
        console.log(file);
    }
}
