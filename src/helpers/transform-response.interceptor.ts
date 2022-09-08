import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp()

    const rawResponse = http.getResponse()
    const statusCode = rawResponse.statusCode

    return next.handle().pipe(
      map((response) => {
        return {
          isSuccess: true,
          statusCode,
          message:
            typeof response === 'string'
              ? response
              : response?.message || 'Success',
          data: typeof response !== 'string' ? response : true,
        }
      }),
    )
  }
}
