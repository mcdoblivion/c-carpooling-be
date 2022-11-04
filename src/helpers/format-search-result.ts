import { SearchResult } from 'src/types'

type TSearchResult = {
  records: any[]
  page: number
  limit: number
  search?: string
  filters?: Record<string, any>
  sort: string
  order: string
  total: number
}

export const formatSearchResult = ({
  records,
  page,
  limit,
  search,
  filters,
  sort,
  order,
  total,
}: TSearchResult): SearchResult<any> => {
  return {
    records,
    page,
    limit,
    search,
    filters,
    sort,
    order,
    total,
    totalPages: Math.ceil(total / limit),
  }
}
