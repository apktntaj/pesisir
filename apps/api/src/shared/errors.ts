export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly details?: unknown) {
    super(message)
  }
}

export function notFound(resource: string): ApiError {
  return new ApiError(404, 'NOT_FOUND', `${resource} tidak ditemukan.`)
}

export function resourceInUse(resource: string): ApiError {
  return new ApiError(409, 'RESOURCE_IN_USE', `${resource} masih digunakan oleh Event.`)
}
