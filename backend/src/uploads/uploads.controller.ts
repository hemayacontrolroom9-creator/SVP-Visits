import {
  Controller, Post, UseInterceptors, UploadedFile, UploadedFiles,
  UseGuards, Body, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Uploads')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('photo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single photo' })
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, folder: { type: 'string' } } } })
  async uploadPhoto(
    @UploadedFile(new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
        new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)/ }),
      ],
    })) file: Express.Multer.File,
    @Body('folder') folder: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.uploadsService.uploadFile(file, folder || 'photos', userId);
  }

  @Post('photos/multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple photos (max 10)' })
  async uploadMultiplePhotos(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder: string,
    @CurrentUser('id') userId: string,
  ) {
    const uploads = await Promise.all(
      files.map((file) => this.uploadsService.uploadFile(file, folder || 'photos', userId)),
    );
    return { urls: uploads.map((u) => u.url), files: uploads };
  }
}
