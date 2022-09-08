import { Transform } from 'class-transformer'
import { IsInt, IsOptional, IsPositive } from 'class-validator'

export class CropImageDto {
  @Transform((transformFunctionParams) =>
    parseInt(transformFunctionParams.value),
  )
  @IsInt()
  @IsOptional()
  x: number

  @Transform((transformFunctionParams) =>
    parseInt(transformFunctionParams.value),
  )
  @IsInt()
  @IsOptional()
  y: number

  @Transform((transformFunctionParams) =>
    parseInt(transformFunctionParams.value),
  )
  @IsInt()
  @IsPositive()
  @IsOptional()
  width: number

  @Transform((transformFunctionParams) =>
    parseInt(transformFunctionParams.value),
  )
  @IsInt()
  @IsPositive()
  @IsOptional()
  height: number
}
