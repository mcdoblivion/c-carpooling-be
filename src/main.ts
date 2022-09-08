import { RequestMethod, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpAdapterHost, NestFactory } from '@nestjs/core'
import { json, urlencoded } from 'express'
import helmet from 'helmet'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import 'reflect-metadata'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './helpers/exception.filter'
import { TransformResponseInterceptor } from './helpers/transform-response.interceptor'
import { TrimStringPipe } from './helpers/trim-string.pipe'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))

  app.use(helmet())
  app.enableCors()
  app.use(json({ limit: '50mb' }))
  app.use(urlencoded({ extended: true, limit: '50mb' }))

  const httpAdapterHost = app.get(HttpAdapterHost)
  app.useGlobalFilters(
    new AllExceptionsFilter(
      httpAdapterHost,
      app.get(WINSTON_MODULE_NEST_PROVIDER),
    ),
  )

  app.useGlobalInterceptors(new TransformResponseInterceptor())

  app.useGlobalPipes(
    new TrimStringPipe(),
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )

  app.setGlobalPrefix('api', {
    exclude: [
      {
        path: '/',
        method: RequestMethod.ALL,
      },
    ],
  })

  const config = new ConfigService()
  const port = parseInt(config.get('PORT'))

  if (isNaN(port)) {
    throw new Error(`Port must be a number. Got ${port}`)
  }

  await app.listen(port)
  console.log(`Server is listening on port: ${port}`)
}

bootstrap()
