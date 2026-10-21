import { useQuery } from '@tanstack/react-query'

export function useResource(service, params = {}, options = {}) {
  const isDynamic = typeof params === 'function'
  const paramsKey = isDynamic ? 'dynamic' : JSON.stringify(params)
  const serviceKey = service?.name || 'unknown'

  const { queryKey: customQueryKey, ...restOptions } = options

  const queryKey = customQueryKey || ['resource', serviceKey, paramsKey]

  const {
    data: rawData,
    isLoading: loading,
    error: queryError,
    refetch: rqRefetch,
    ...rest
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (isDynamic) {
        return params()
      }
      return service(params)
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...restOptions,
  })

  let data = []
  let pagination = null

  if (rawData) {
    if (
      rawData &&
      typeof rawData === 'object' &&
      !Array.isArray(rawData) &&
      'pagination' in rawData
    ) {
      data = rawData.data || []
      pagination = rawData.pagination || null
    } else {
      data = Array.isArray(rawData) ? rawData : [rawData]
    }
  }

  const error = queryError
    ? queryError.message || (queryError.error && queryError.error.message) || 'Ошибка загрузки'
    : ''

  const refetch = async () => {
    return rqRefetch()
  }

  return { data, loading, error, pagination, refetch, ...rest }
}
