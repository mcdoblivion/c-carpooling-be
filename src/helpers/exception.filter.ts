import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  LoggerService,
} from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  catch(exception: HttpException | Error, host: ArgumentsHost): void {
    this.logger.error(exception)

    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost

    const ctx = host.switchToHttp()

    let httpStatus: number, message: string | object, info: string | Error
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus()
      info = exception.name

      if (typeof exception.getResponse() === 'string') {
        message = exception.getResponse()
      } else {
        const response = exception.getResponse() as { message: string }
        message = response?.message
      }
    } else {
      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR
      message = exception.toString()
      info = exception
    }

    const stack = exception.stack

    const responseBody = {
      isSuccess: false,
      statusCode: httpStatus,
      message,
      info,
      stack,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus)
  }
}
