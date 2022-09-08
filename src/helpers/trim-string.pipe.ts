import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common'

@Injectable()
export class TrimStringPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      return value.trim()
    }

    if (typeof value === 'object') {
      for (const key in value) {
        if (typeof value[key] === 'string') {
          value[key] = value[key].trim()
        }
      }
    }

    return value
  }
}
