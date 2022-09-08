import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  LoggerService,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { AnyFilesInterceptor } from '@nestjs/platform-express'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import * as sharp from 'sharp'
import { v4 as uuid } from 'uuid'
import { CropImageDto } from './helpers/crop-image.dto'
import { Auth } from './modules/auth/decorators/auth.decorator'
import { S3Service } from './services/aws/s3.service'

@Controller()
export class AppController {
  constructor(
    private readonly s3Service: S3Service,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}
  @Get()
  index() {
    return 'c-carpooling-be is working properly!'
  }

  @Auth()
  @Post('upload-file')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
    try {
      const { originalname, buffer, mimetype } = files?.[0]

      return await this.s3Service.uploadFile(
        `${uuid()}/${originalname}`,
        buffer,
        mimetype,
        true,
      )
    } catch (error) {
      this.logger.error('Error when uploading files!')
      throw error
    }
  }

  @Post('upload-image')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadImage(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() cropImageDto: CropImageDto,
  ) {
    try {
      const file = files?.[0]
      if (!file) {
        throw new BadRequestException('File is required!')
      }

      const { mimetype, originalname } = file
      if (!['image/png', 'image/jpeg'].includes(mimetype)) {
        throw new BadRequestException('Only png/jpeg files are allowed!')
      }

      const { x, y, width, height } = cropImageDto
      let buffer = file.buffer
      if (
        typeof x === 'number' &&
        typeof y === 'number' &&
        typeof width === 'number' &&
        typeof height === 'number'
      ) {
        buffer = await sharp(buffer)
          .extract({ width, height, top: y, left: x })
          .toBuffer()
      }

      const { filePath } = await this.s3Service.uploadFile(
        `${uuid()}/${originalname}`,
        buffer,
        mimetype,
        true,
      )

      const { fileUrl } = await this.s3Service.getFileUrl(filePath)

      return { filePath, fileUrl }
    } catch (error) {
      this.logger.error('Error when uploading image!')
      throw error
    }
  }

  @Auth()
  @Get('file-url')
  async getFileUrl(@Query() { filePath }) {
    try {
      return await this.s3Service.getFileUrl(filePath)
    } catch (error) {
      this.logger.error('Error when getting file URL!')
      throw error
    }
  }
}
