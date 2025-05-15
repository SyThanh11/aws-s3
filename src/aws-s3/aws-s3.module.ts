import { Module } from '@nestjs/common';
import { AwsS3Controller } from './aws-s3.controller';
import { AwsS3Service } from './aws-s3.service';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
  providers: [AwsS3Service]
})
export class AwsS3Module {}
