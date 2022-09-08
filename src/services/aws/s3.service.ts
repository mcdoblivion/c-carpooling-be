import {
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  GetObjectCommand,
  GetObjectCommandOutput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3'
import {
  BadRequestException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
@Injectable()
export class S3Service {
  private readonly s3: S3Client
  private readonly bucket: string
  private readonly region: string

  constructor(
    private readonly config: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    this.bucket = this.config.get<string>('AWS_BUCKET_NAME')
    this.region = this.config.get<string>('AWS_REGION')

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    })

    this.s3
      .send(new CreateBucketCommand({ Bucket: this.bucket }))
      .then(() => {
        this.logger.log(`Bucket ${this.bucket} has created successfully!`)
      })
      .catch(() => {
        this.logger.log(`Bucket ${this.bucket} already exists!`)
      })
  }

  async uploadFile(
    filePath: string,
    fileBuffer: Buffer,
    contentType?: string,
    replaceExisting?: boolean,
  ) {
    if (!replaceExisting) {
      let file: GetObjectCommandOutput
      try {
        file = await this.s3.send(
          new GetObjectCommand({ Bucket: this.bucket, Key: filePath }),
        )
      } catch (error) {}

      if (file) {
        throw new BadRequestException(`File ${filePath} already exists!`)
      }
    }

    const bucketParams: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: filePath,
      Body: fileBuffer,
      ...(contentType && { ContentType: contentType }),
    }

    await this.s3.send(new PutObjectCommand(bucketParams))

    return {
      filePath,
    }
  }

  async getFileUrl(filePath: string) {
    const fileUrl = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: filePath }),
      { expiresIn: 600 },
    )
    return { fileUrl }
  }

  async deleteS3File() {
    try {
      const bucketParams: DeleteObjectCommandInput = {
        Bucket: this.bucket,
        Key: 'file name',
      }

      await this.s3.send(new DeleteObjectCommand(bucketParams))
    } catch (error) {
      this.logger.error('Error when deleting S3 file!')
      throw error
    }
  }
}
