import { Module } from '@nestjs/common';
import { AwsS3Controller } from './aws-s3.controller';
import { AwsS3Service } from './aws-s3.service';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UPLOADED_FILE_SERVICE } from './const/consts';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        dest: configService.get<string>('MULTER_DEST')
      }),
      inject: [ConfigService]
    })
  ],
  controllers: [AwsS3Controller],
  providers: [
    AwsS3Service,
    {
      provide: UPLOADED_FILE_SERVICE,
      useExisting: AwsS3Service
    }
  ],
  exports: [UPLOADED_FILE_SERVICE]
})
export class AwsS3Module {}
