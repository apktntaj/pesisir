import type { Config } from './config'

export interface EventSummary {
  id: string
  name: string
  startOn: string
  endOn: string
  eventOrganizerId: string
  venueId: string
  createdAt: string
  updatedAt: string
  eventOrganizer?: { id: string; name: string }
  venue?: { id: string; name: string }
}

export interface EventList {
  data: EventSummary[]
  meta: { limit: number; offset: number; total: number }
}

interface ApiData<T> {
  data: T
}

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown }
}

export class VssApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'VssApiError'
  }
}

export type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

export class VssClient {
  constructor(
    private readonly config: Config,
    private readonly fetcher: Fetcher = (input, init) => fetch(input, init),
  ) {}

  async listEvents(limit = 50, offset = 0): Promise<EventList> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    return this.request<EventList>(`/api/v1/events?${params}`)
  }

  async getEvent(id: string): Promise<EventSummary> {
    const response = await this.request<ApiData<EventSummary>>(`/api/v1/events/${encodeURIComponent(id)}`)
    return response.data
  }

  async createEvent(input: { name: string; startOn: string; endOn: string }): Promise<EventSummary> {
    const response = await this.request<ApiData<EventSummary>>('/api/v1/events', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        eventOrganizerId: this.config.VSS_DEFAULT_EVENT_ORGANIZER_ID,
        venueId: this.config.VSS_DEFAULT_VENUE_ID,
      }),
    })
    return response.data
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    if (init.body) headers.set('Content-Type', 'application/json')
    if (this.config.VSS_API_TOKEN) headers.set('Authorization', `Bearer ${this.config.VSS_API_TOKEN}`)

    let response: Response
    try {
      response = await this.fetcher(`${this.config.VSS_API_BASE_URL}${path}`, { ...init, headers })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new VssApiError(`VSS API is unreachable: ${message}`, 0, 'API_UNREACHABLE')
    }

    const body = await response.json().catch(() => null) as T | ApiErrorBody | null
    if (!response.ok) {
      const apiError = body as ApiErrorBody | null
      throw new VssApiError(
        apiError?.error?.message ?? `VSS API returned HTTP ${response.status}.`,
        response.status,
        apiError?.error?.code,
        apiError?.error?.details,
      )
    }
    if (body === null) throw new VssApiError('VSS API returned an empty or invalid JSON response.', response.status, 'INVALID_RESPONSE')
    return body as T
  }
}
