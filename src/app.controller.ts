import {
  Controller,
  Get,
  Inject,
  LoggerService,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { Auth } from './modules/auth/decorators/auth.decorator'
import { CloudinaryService } from './services/cloudinary/cloudinary.service'

@ApiTags('Utilities')
@Controller()
export class AppController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}
  @Get()
  index() {
    return 'c-carpooling-be is working properly!'
  }

  @Auth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'file',
        },
      },
    },
  })
  @Post('upload-file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ fileUrl: string }> {
    try {
      const { originalname, buffer, mimetype } = file

      return this.cloudinaryService.uploadFile(buffer, mimetype, originalname)
    } catch (error) {
      this.logger.error('Error when uploading file!')
      throw error
    }
  }
}
