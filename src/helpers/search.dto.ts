import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class SearchDto {
  @Transform((transformFunctionParams) =>
    parseInt(transformFunctionParams.value, 10),
  )
  @IsInt()
  @IsOptional()
  page?: number = 1

  @Transform((transformFunctionParams) =>
    parseInt(transformFunctionParams.value, 10),
  )
  @IsInt()
  @IsOptional()
  limit?: number = 10

  @IsString()
  @IsOptional()
  search?: string

  @ApiPropertyOptional({
    type: 'json',
  })
  @Transform((transformFunctionParams) =>
    JSON.parse(transformFunctionParams.value || '{}'),
  )
  @IsOptional()
  filters?: Record<string, any> = {}

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  sort?: string = 'updatedAt'

  @IsIn(['DESC', 'ASC'])
  @IsOptional()
  order?: 'DESC' | 'ASC' = 'DESC'
}
