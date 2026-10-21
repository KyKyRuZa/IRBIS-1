import { useMutation, useQueryClient } from '@tanstack/react-query'
import { showError, showSuccess } from '@/lib/toast.js'

export function useCreateMutation(service, queryKey, successMsg) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload) => service.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey })
      if (successMsg) showSuccess(successMsg)
      return data
    },
    onError: (err) => {
      showError(err.response?.data?.error || 'Не удалось создать запись')
    },
  })
}

export function useUpdateMutation(service, queryKey, successMsg) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...payload }) => service.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey })
      if (successMsg) showSuccess(successMsg)
      return data
    },
    onError: (err) => {
      showError(err.response?.data?.error || 'Не удалось обновить запись')
    },
  })
}

export function useDeleteMutation(service, queryKey, successMsg) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      if (successMsg) showSuccess(successMsg)
    },
    onError: (err) => {
      showError(err.response?.data?.error || 'Не удалось удалить запись')
    },
  })
}
