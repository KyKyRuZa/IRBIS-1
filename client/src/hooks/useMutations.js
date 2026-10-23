import { useMutation, useQueryClient } from '@tanstack/react-query'
import { showError, showSuccess, handleValidationError } from '@/lib/toast.js'

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
      handleValidationError(err)
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
      handleValidationError(err)
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
      handleValidationError(err)
    },
  })
}
