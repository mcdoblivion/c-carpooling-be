import { Inject, Injectable, LoggerService } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as Cloudinary } from 'cloudinary'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'

@Injectable()
export class CloudinaryService {
  constructor(
    private readonly config: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME')
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY')
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET')

    Cloudinary.config({
      secure: true,
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    })
  }

  async uploadFile(
    buffer: Buffer,
    mimetype: string,
    fileName: string,
  ): Promise<{ fileUrl: string }> {
    fileName = this._getRandomFileNameWithoutExtension(fileName)

    const uploadResponse = await Cloudinary.uploader.upload(
      this._bufferToBase64Uri(buffer, mimetype),
      {
        public_id: fileName,
      },
    )

    const { secure_url: fileUrl } = uploadResponse

    return {
      fileUrl,
    }
  }

  private _bufferToBase64Uri(buffer: Buffer, mimetype: string) {
    const base64 = buffer.toString('base64')

    return `data:${mimetype};base64,${base64}`
  }

  private _getRandomFileNameWithoutExtension(fileName: string) {
    return `${new Date().getTime()}_${fileName
      .split('.')
      .slice(0, -1)
      .join('.')}`
  }
}
