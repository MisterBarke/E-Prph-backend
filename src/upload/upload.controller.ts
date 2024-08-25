import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { diskStorage } from 'multer';
import { createReadStream } from 'fs';
import { join } from 'path';
import { Response } from 'express';

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

  @Get('files')
  public async getFiles(
    // @Query('type') fileType: string,
    @Req() request,
  ) {
    const user = request.user;
    return this.uploadService.getFiles(user.id);
  }

  @Get('files/:id')
  public async getSingleFile(
    // @Query('type') fileType: string,
    @Param('id') id: string,
    @Req() request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = request.user;
    const file = await this.uploadService.getSingleFile(user.id);
    const stream = createReadStream(join(process.cwd(), file.path));

    response.set({
      'Content-Disposition': `inline; filename="${file.filename}"`,
      'Content-Type': file.mimetype,
    });
    return new StreamableFile(stream);
  }

  @Post('signature')
  @UseInterceptors(FileInterceptor('file'))
  public async getFile(@UploadedFile() file, @Req() request) {
    const user = request.user;
    return this.uploadService.uploadFile(file, true, user.id);
  }
}
