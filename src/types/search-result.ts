export type SearchResult<T> = {
  records: T[]
  page: number
  limit: number
  search?: string
  filters?: Record<string, any>
  sort: string
  order: string
  total: number
  totalPages: number
}
