import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as Minio from 'minio';
import * as sharp from 'sharp';
import { Express } from 'express';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private minioClient: Minio.Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    const endpoint = new URL(this.configService.get('MINIO_ENDPOINT', 'http://localhost:9000'));
    this.minioClient = new Minio.Client({
      endPoint: endpoint.hostname,
      port: parseInt(endpoint.port) || (endpoint.protocol === 'https:' ? 443 : 9000),
      useSSL: endpoint.protocol === 'https:',
      accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get('MINIO_SECRET_KEY', 'minioadmin123'),
    });
    this.bucket = this.configService.get('MINIO_BUCKET', 'supervisor-visits');
    this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucket, 'us-east-1');
        await this.minioClient.setBucketPolicy(this.bucket, JSON.stringify({
          Version: '2012-10-17',
          Statement: [{ Effect: 'Allow', Principal: { AWS: ['*'] }, Action: ['s3:GetObject'], Resource: [`arn:aws:s3:::${this.bucket}/*`] }],
        }));
        this.logger.log(`Bucket ${this.bucket} created`);
      }
    } catch (err) {
      this.logger.warn('Could not initialize MinIO bucket:', err.message);
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string, userId: string) {
    try {
      const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
      const key = `${folder}/${userId}/${uuidv4()}.${ext}`;

      let buffer = file.buffer;
      if (file.mimetype.startsWith('image/')) {
        buffer = await sharp(file.buffer)
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
      }

      await this.minioClient.putObject(this.bucket, key, buffer, buffer.length, {
        'Content-Type': file.mimetype,
        'x-amz-meta-uploaded-by': userId,
        'x-amz-meta-original-name': file.originalname,
      });

      const endpoint = this.configService.get('MINIO_ENDPOINT', 'http://localhost:9000');
      const url = `${endpoint}/${this.bucket}/${key}`;

      return { url, key, size: buffer.length, mimeType: file.mimetype, originalName: file.originalname };
    } catch (err) {
      this.logger.error('File upload failed', err);
      throw new InternalServerErrorException('File upload failed');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucket, key);
    } catch (err) {
      this.logger.error(`Failed to delete file ${key}`, err);
    }
  }
}
