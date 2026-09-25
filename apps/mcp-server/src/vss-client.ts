import type { Config } from './config'

export interface MutationContext { actorRef: string; sourceMessageId?: string; idempotencyKey: string }
export interface EventSummary {
  id: string; name: string; alias?: string | null; notes?: string | null; startOn: string; endOn: string;
  status: 'ACTIVE' | 'CANCELLED'; eventOrganizerId: string; venueId: string; createdAt: string; updatedAt: string;
  eventOrganizer?: { id: string; name: string }; venue?: { id: string; name: string }
}
export interface EventList { data: EventSummary[]; meta: { limit: number; offset: number; total: number } }
export interface MasterSummary { id: string; name?: string; legalName?: string; kind?: 'LOCAL' | 'INTERNATIONAL'; archivedAt?: string | null }
export interface ListResult<T> { data: T[]; meta?: { limit: number; offset: number; total: number } }
export interface EventExhibitor {
  id: string; eventId: string; exhibitorId: string; agentId: string | null; primaryContactId: string | null;
  hall: string | null; booth: string | null; notes: string | null; status: 'ACTIVE' | 'WITHDRAWN';
  exhibitor?: MasterSummary; agent?: MasterSummary | null;
}

interface ApiData<T> { data: T }
interface ApiErrorBody { error?: { code?: string; message?: string; details?: unknown } }

export class VssApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string, readonly details?: unknown) {
    super(message); this.name = 'VssApiError'
  }
}

export type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

export class VssClient {
  constructor(private readonly config: Config, private readonly fetcher: Fetcher = (input, init) => fetch(input, init)) {}

  listEvents(limit = 50, offset = 0) { return this.request<EventList>(`/api/v1/events?limit=${limit}&offset=${offset}`) }
  async getEvent(id: string) { return (await this.request<ApiData<EventSummary>>(`/api/v1/events/${encodeURIComponent(id)}`)).data }
  listEventOrganizers() { return this.request<ListResult<MasterSummary>>('/api/v1/event-organizers?limit=100&offset=0') }
  listVenues() { return this.request<ListResult<MasterSummary>>('/api/v1/venues?limit=100&offset=0') }
  listExhibitors(kind?: 'LOCAL' | 'INTERNATIONAL') { return this.request<ListResult<MasterSummary>>(`/api/v1/exhibitors?limit=100&offset=0${kind ? `&kind=${kind}` : ''}`) }
  listAgents() { return this.request<ListResult<MasterSummary>>('/api/v1/agents?limit=100&offset=0') }
  async listEventExhibitors(eventId: string) { return (await this.request<ApiData<EventExhibitor[]>>(`/api/v1/events/${encodeURIComponent(eventId)}/exhibitors`)).data }

  async createEventOrganizer(input: { name: string; npwp?: string | null; address?: string | null; website?: string | null }, meta: MutationContext) {
    const { name, npwp, address, website } = input
    return (await this.mutate<ApiData<MasterSummary>>('/api/v1/event-organizers', 'POST', { name, npwp, address, website }, meta)).data
  }
  async createVenue(input: { name: string; npwp?: string | null; address?: string | null; website?: string | null; loadingAccessNotes?: string | null }, meta: MutationContext) {
    const { name, npwp, address, website, loadingAccessNotes } = input
    return (await this.mutate<ApiData<MasterSummary>>('/api/v1/venues', 'POST', { name, npwp, address, website, loadingAccessNotes }, meta)).data
  }

  async createEvent(input: { name: string; alias?: string | null; notes?: string | null; startOn: string; endOn: string; eventOrganizerId: string; venueId: string }, meta: MutationContext) {
    const { name, alias, notes, startOn, endOn, eventOrganizerId, venueId } = input
    return (await this.mutate<ApiData<EventSummary>>('/api/v1/events', 'POST', { name, alias, notes, startOn, endOn, eventOrganizerId, venueId }, meta)).data
  }
  async createExhibitor(input: { legalName: string; alias?: string | null; kind: 'LOCAL' | 'INTERNATIONAL'; npwp?: string | null; countryCode?: string | null; address?: string | null; website?: string | null }, meta: MutationContext) {
    const { legalName, alias, kind, npwp, countryCode, address, website } = input
    return (await this.mutate<ApiData<MasterSummary>>('/api/v1/exhibitors', 'POST', { legalName, alias, kind, npwp, countryCode, address, website }, meta)).data
  }
  async createAgent(input: { name: string; countryCode?: string | null; address?: string | null; website?: string | null }, meta: MutationContext) {
    const { name, countryCode, address, website } = input
    return (await this.mutate<ApiData<MasterSummary>>('/api/v1/agents', 'POST', { name, countryCode, address, website }, meta)).data
  }
  async addEventExhibitor(eventId: string, input: { exhibitorId: string; agentId?: string | null; primaryContactId?: string | null; hall?: string | null; booth?: string | null; notes?: string | null }, meta: MutationContext) {
    const { exhibitorId, agentId, primaryContactId, hall, booth, notes } = input
    return (await this.mutate<ApiData<EventExhibitor>>(`/api/v1/events/${encodeURIComponent(eventId)}/exhibitors`, 'POST', { exhibitorId, agentId, primaryContactId, hall, booth, notes }, meta)).data
  }
  async updateEventExhibitor(id: string, input: { agentId?: string | null; primaryContactId?: string | null; hall?: string | null; booth?: string | null; notes?: string | null }, meta: MutationContext) {
    const { agentId, primaryContactId, hall, booth, notes } = input
    return (await this.mutate<ApiData<EventExhibitor>>(`/api/v1/event-exhibitors/${encodeURIComponent(id)}`, 'PATCH', { agentId, primaryContactId, hall, booth, notes }, meta)).data
  }
  async eventCommand(id: string, command: 'cancel' | 'reactivate', reason: string, meta: MutationContext) {
    return (await this.mutate<ApiData<EventSummary>>(`/api/v1/events/${encodeURIComponent(id)}/${command}`, 'POST', { reason }, meta)).data
  }
  async participationCommand(id: string, command: 'withdraw' | 'reactivate', reason: string, meta: MutationContext) {
    return (await this.mutate<ApiData<EventExhibitor>>(`/api/v1/event-exhibitors/${encodeURIComponent(id)}/${command}`, 'POST', { reason }, meta)).data
  }

  private mutate<T>(path: string, method: 'POST' | 'PATCH', body: unknown, meta: MutationContext) {
    return this.request<T>(path, { method, body: JSON.stringify(body), headers: {
      'X-Actor-Ref': meta.actorRef, 'Idempotency-Key': meta.idempotencyKey,
      ...(meta.sourceMessageId ? { 'X-Source-Message-Id': meta.sourceMessageId } : {}),
    } })
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    if (init.body) headers.set('Content-Type', 'application/json')
    if (this.config.VSS_API_TOKEN) headers.set('Authorization', `Bearer ${this.config.VSS_API_TOKEN}`)
    let response: Response
    try { response = await this.fetcher(`${this.config.VSS_API_BASE_URL}${path}`, { ...init, headers }) }
    catch (error) { throw new VssApiError(`VSS API is unreachable: ${error instanceof Error ? error.message : String(error)}`, 0, 'API_UNREACHABLE') }
    const responseBody = await response.json().catch(() => null) as T | ApiErrorBody | null
    if (!response.ok) {
      const apiError = responseBody as ApiErrorBody | null
      throw new VssApiError(apiError?.error?.message ?? `VSS API returned HTTP ${response.status}.`, response.status, apiError?.error?.code, apiError?.error?.details)
    }
    if (responseBody === null) throw new VssApiError('VSS API returned an empty or invalid JSON response.', response.status, 'INVALID_RESPONSE')
    return responseBody as T
  }
}
