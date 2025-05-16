import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { UploadedFileServiceInterface } from './interface/aws-s3.interface';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import { createReadStream, promises as fs } from 'fs';
import { Upload } from '@aws-sdk/lib-storage';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileType } from 'generated/prisma';

@Injectable()
export class AwsS3Service implements UploadedFileServiceInterface {
    private readonly s3Client: S3Client

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService
    ) {
        const region = this.configService.get<string>('AWS_S3_REGION');
        const accessKeyId = this.configService.get<string>('AWS_S3_ACCESS_KEY');
        const secretAccessKey = this.configService.get<string>('AWS_S3_SECRET_ACCESS_KEY');

        if (!region || !accessKeyId || !secretAccessKey) {
            throw new Error('Missing AWS S3 configuration values');
        }

        this.s3Client = new S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey
            }
        })
    }


    /**
     * Tải tệp lên bucket S3 công khai.
     *
     * @param path - Đường dẫn (prefix) trong bucket nơi tệp sẽ được lưu trữ, ví dụ: 'uploads/images'.
     * @param param1 - Đối tượng chứa thông tin tệp:
     *    @property file - Tệp cần tải lên, là một đối tượng Express.Multer.File.
     *    @property fileName - Tên tệp mong muốn khi lưu trên S3.
     * @returns Một Promise trả về đối tượng bao gồm:
     *    @property url - URL truy cập công khai của tệp đã tải lên.
     *    @property key - Khóa (key) của tệp trong bucket S3.
     */
    async uploadFileToPublicBucket(
       file: Express.Multer.File
    ): Promise<{ url: string; key: string }> {
       try {
        const bucketName = this.configService.get<string>('AWS_S3_PUBLIC_BUCKET');
        const key = `${Date.now()}-${file.originalname}`;


        const readStream = createReadStream(file.path);
        const transform = sharp()
            .jpeg({ quality: 100 }) 
        
        const upload = new Upload({
            client: this.s3Client,
            params: {
                Bucket: bucketName,
                Key: key,
                Body: readStream.pipe(transform),
                ContentType: 'image/jpeg',
                ACL: 'public-read',
            },
        });

        await upload.done();

        await fs.unlink(file.path)

        const url = `https://${bucketName}.s3.amazonaws.com/${key}`;

        await this.prisma.$transaction(async (tx) => {
            await tx.file.create({
              data: {
                key,
                url,
                name: file.originalname,
                size: file.size,
                mimeType: file.mimetype,
                type: this.getFileType(file.mimetype)
              },
            });
        });

        return { url, key };
       } catch (error) {
            console.error('S3 upload error:', error);
            throw new InternalServerErrorException('Failed to upload image');
       }
    }

    private getFileType(mime: string): FileType {
        if (mime.startsWith('image/')) return FileType.IMAGE;
        if (mime.startsWith('video/')) return FileType.VIDEO;
        if (mime.startsWith('audio/')) return FileType.AUDIO;
        if (
          mime === 'application/pdf' ||
          mime.startsWith('application/')
        )
          return FileType.DOCUMENT;
        return FileType.OTHER;
    }
}
