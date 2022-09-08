import { SearchDto } from 'src/helpers/search.dto'
import { SearchResult } from 'src/types'

export interface BaseController<T> {
  search(searchDto: SearchDto): Promise<SearchResult<T>>

  getAll(): Promise<T[]>

  getOneById(id: number): Promise<T>

  create(createDto: Record<string, any>): Promise<T>

  updateOneById(id: number, updateDto: Record<string, any>): Promise<T>

  deleteOneById(id: number): Promise<any>

  deleteMany({ IDs }: { IDs: number[] }): Promise<any>
}
