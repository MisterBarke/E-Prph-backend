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

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
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

  @Post('signature')
  @UseInterceptors(FileInterceptor('file'))
  public async getFile(@UploadedFile() file, @Req() request) {
    const user = request.user;
    return this.uploadService.uploadFile(file, true, user.id);
  }
}
