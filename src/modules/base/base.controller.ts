import { SearchDto } from 'src/helpers/search.dto'
import { UserEntity } from 'src/typeorm/entities'
import { SearchResult } from 'src/types'

export interface BaseController<T> {
  search?(searchDto: SearchDto, searchBy?: UserEntity): Promise<SearchResult<T>>

  getAll?(getBy?: UserEntity): Promise<T[]>

  getOneById?(id: number, getBy?: UserEntity): Promise<T>

  create?(createDto: Record<string, any>, createBy?: UserEntity): Promise<T>

  updateOneById?(
    id: number,
    updateDto: Record<string, any>,
    updateBy?: UserEntity,
  ): Promise<T>

  deleteOneById?(id: number, deletedBy?: UserEntity): Promise<any>

  deleteMany?({ IDs }: { IDs: number[] }, deletedBy?: UserEntity): Promise<any>
}
