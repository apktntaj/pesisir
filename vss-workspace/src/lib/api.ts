const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const baseUrl = configuredBaseUrl || ''
const actorRef = import.meta.env.VITE_ACTOR_REF || 'web:local-operator'

export type Page<T> = { data: T[]; meta: { limit: number; offset: number; total: number } }
export type Organizer = { id: string; name: string; npwp: string | null; address: string | null; website: string | null; archivedAt: string | null }
export type Venue = { id: string; name: string; npwp: string | null; address: string | null; website: string | null; loadingAccessNotes: string | null; archivedAt: string | null }
export type Event = { id: string; name: string; alias: string | null; notes: string | null; startOn: string; endOn: string; status: 'ACTIVE' | 'CANCELLED'; eventOrganizerId: string; venueId: string; eventOrganizer?: { id: string; name: string }; venue?: { id: string; name: string }; activeExhibitorCount?: number; withdrawnExhibitorCount?: number }
export type Exhibitor = { id: string; legalName: string; alias: string | null; kind: 'LOCAL' | 'INTERNATIONAL'; countryCode: string | null; npwp: string | null; address: string | null; website: string | null; archivedAt: string | null }
export type Agent = { id: string; name: string; countryCode: string | null; archivedAt: string | null }
export type Participation = { id: string; hall: string | null; booth: string | null; status: 'ACTIVE' | 'WITHDRAWN'; exhibitor: Exhibitor; agent: Agent | null }

type ApiErrorBody = { error?: { message?: string; details?: Array<{ field: string; message: string }> } }

export class ApiError extends Error {
  constructor(message: string, readonly details: Array<{ field: string; message: string }> = []) { super(message) }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.method && init.method !== 'GET') {
    headers.set('Content-Type', 'application/json')
    headers.set('X-Actor-Ref', actorRef)
    headers.set('Idempotency-Key', crypto.randomUUID())
  }
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers })
  const body = await response.json().catch(() => null) as ApiErrorBody & T
  if (!response.ok) throw new ApiError(body?.error?.message || 'Permintaan ke API gagal.', body?.error?.details || [])
  return body as T
}

export const api = {
  health: () => request<{ status: string; database: string }>('/health'),
  events: () => request<Page<Event>>('/api/v1/events?limit=100&offset=0'),
  organizers: () => request<Page<Organizer>>('/api/v1/event-organizers?limit=100&offset=0'),
  venues: () => request<Page<Venue>>('/api/v1/venues?limit=100&offset=0'),
  exhibitors: () => request<Page<Exhibitor>>('/api/v1/exhibitors?limit=100&offset=0'),
  agents: () => request<Page<Agent>>('/api/v1/agents?limit=100&offset=0'),
  participations: (eventId: string) => request<{ data: Participation[] }>(`/api/v1/events/${eventId}/exhibitors`),
  createOrganizer: (payload: Partial<Organizer> & { name: string }) => request<{ data: Organizer }>('/api/v1/event-organizers', { method: 'POST', body: JSON.stringify(payload) }),
  createVenue: (payload: Partial<Venue> & { name: string }) => request<{ data: Venue }>('/api/v1/venues', { method: 'POST', body: JSON.stringify(payload) }),
  createEvent: (payload: Pick<Event, 'name' | 'alias' | 'notes' | 'startOn' | 'endOn' | 'eventOrganizerId' | 'venueId'>) => request<{ data: Event }>('/api/v1/events', { method: 'POST', body: JSON.stringify(payload) }),
  createExhibitor: (payload: Partial<Exhibitor> & { legalName: string; kind: Exhibitor['kind'] }) => request<{ data: Exhibitor }>('/api/v1/exhibitors', { method: 'POST', body: JSON.stringify(payload) }),
  addParticipation: (eventId: string, payload: { exhibitorId: string; agentId: string | null; hall: string | null; booth: string | null; notes: string | null }) => request<{ data: Participation }>(`/api/v1/events/${eventId}/exhibitors`, { method: 'POST', body: JSON.stringify(payload) }),
  cancelEvent: (id: string, reason: string) => request<{ data: Event }>(`/api/v1/events/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  reactivateEvent: (id: string, reason: string) => request<{ data: Event }>(`/api/v1/events/${id}/reactivate`, { method: 'POST', body: JSON.stringify({ reason }) }),
}
