import { SearchResult } from 'src/types'

export const formatSearchResult = (
  records: any[],
  page: number,
  limit: number,
  search: string,
  filters: Record<string, any>,
  sort: string,
  order: string,
  total: number,
): SearchResult<any> => {
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
