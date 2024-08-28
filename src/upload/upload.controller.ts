import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { diskStorage } from 'multer';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './storage',
        filename: (req, file, callback) => {
          const name = `ph_${Math.ceil(
            Math.random() * 1000,
          )}ph_${Date.now()}ph_${file.originalname}`;
          return callback(null, name);
        },
      }),
    }),
  )
  public async uploadFile(
    @UploadedFile() file,
    // @Query('type') fileType: string,
    @Req() request,
  ) {
    const user = request.user;
    return this.uploadService.uploadFile(file, false, user.id);
  }

  @Post('file/client')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './storage',
        filename: (req, file, callback) => {
          const name = `ph_${Math.ceil(
            Math.random() * 1000,
          )}ph_${Date.now()}ph_${file.originalname}`;
          return callback(null, name);
        },
      }),
    }),
  )
  public async uploadClientFile(
    @UploadedFile() file,
    // @Query('type') fileType: string,
    @Req() request,
  ) {
    const user = request.user;
    return this.uploadService.uploadClientFile(file,user.id);
  }

  @Get('files')
  public async getFiles(
    // @Query('type') fileType: string,
    @Req() request,
  ) {
    const user = request.user;
    return this.uploadService.getFiles(user.id);
  }

  @Post('signature')
  @UseInterceptors(FileInterceptor('file'))
  public async getFile(@UploadedFile() file, @Req() request) {
    const user = request.user;
    return this.uploadService.uploadFile(file, true, user.id);
  }
}
