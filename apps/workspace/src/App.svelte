<script lang="ts">
  import { api, ApiError, type Agent, type Event, type Exhibitor, type Organizer, type Participation, type Venue } from './lib/api'

  type View = 'dashboard' | 'events' | 'masters'
  let view: View = 'dashboard'
  let events: Event[] = []
  let organizers: Organizer[] = []
  let venues: Venue[] = []
  let exhibitors: Exhibitor[] = []
  let agents: Agent[] = []
  let selectedEvent: Event | null = null
  let participations: Participation[] = []
  let loading = true
  let saving = false
  let error = ''
  let notice = ''
  let apiOnline = false
  let eventFormOpen = false
  let masterForm: 'organizer' | 'venue' | 'exhibitor' | null = null
  let eventForm = { name: '', alias: '', startOn: '', endOn: '', eventOrganizerId: '', venueId: '', notes: '' }
  let organizerForm = { name: '', npwp: '', address: '', website: '' }
  let venueForm = { name: '', npwp: '', address: '', website: '', loadingAccessNotes: '' }
  let exhibitorForm = { legalName: '', alias: '', kind: 'LOCAL' as Exhibitor['kind'], countryCode: 'ID', npwp: '', address: '', website: '' }
  let participationForm = { exhibitorId: '', agentId: '', hall: '', booth: '', notes: '' }

  const nil = (value: string) => value.trim() || null
  const date = (value: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))

  async function load() {
    loading = true
    error = ''
    try {
      const [health, eventPage, organizerPage, venuePage, exhibitorPage, agentPage] = await Promise.all([
        api.health(), api.events(), api.organizers(), api.venues(), api.exhibitors(), api.agents(),
      ])
      apiOnline = health.status === 'ok'
      events = eventPage.data
      organizers = organizerPage.data
      venues = venuePage.data
      exhibitors = exhibitorPage.data
      agents = agentPage.data
    } catch (caught) {
      apiOnline = false
      error = message(caught)
    } finally { loading = false }
  }

  function message(caught: unknown) {
    if (caught instanceof ApiError && caught.details.length) return `${caught.message} ${caught.details.map((detail) => detail.message).join(' ')}`
    return caught instanceof Error ? caught.message : 'Terjadi kesalahan yang tidak diketahui.'
  }

  async function submitEvent() {
    saving = true; error = ''; notice = ''
    try {
      await api.createEvent({ ...eventForm, alias: nil(eventForm.alias), notes: nil(eventForm.notes) })
      eventForm = { name: '', alias: '', startOn: '', endOn: '', eventOrganizerId: '', venueId: '', notes: '' }
      eventFormOpen = false; notice = 'Event dibuat dan jejak auditnya dicatat oleh API.'; await load()
    } catch (caught) { error = message(caught) } finally { saving = false }
  }

  async function submitMaster() {
    saving = true; error = ''; notice = ''
    try {
      if (masterForm === 'organizer') {
        await api.createOrganizer({ name: organizerForm.name, npwp: nil(organizerForm.npwp), address: nil(organizerForm.address), website: nil(organizerForm.website) })
        organizerForm = { name: '', npwp: '', address: '', website: '' }
      }
      if (masterForm === 'venue') {
        await api.createVenue({ name: venueForm.name, npwp: nil(venueForm.npwp), address: nil(venueForm.address), website: nil(venueForm.website), loadingAccessNotes: nil(venueForm.loadingAccessNotes) })
        venueForm = { name: '', npwp: '', address: '', website: '', loadingAccessNotes: '' }
      }
      if (masterForm === 'exhibitor') {
        await api.createExhibitor({ legalName: exhibitorForm.legalName, alias: nil(exhibitorForm.alias), kind: exhibitorForm.kind, countryCode: exhibitorForm.kind === 'LOCAL' ? 'ID' : nil(exhibitorForm.countryCode)?.toUpperCase() ?? null, npwp: exhibitorForm.kind === 'LOCAL' ? nil(exhibitorForm.npwp) : null, address: nil(exhibitorForm.address), website: nil(exhibitorForm.website) })
        exhibitorForm = { legalName: '', alias: '', kind: 'LOCAL', countryCode: 'ID', npwp: '', address: '', website: '' }
      }
      masterForm = null; notice = 'Data master dibuat.'; await load()
    } catch (caught) { error = message(caught) } finally { saving = false }
  }

  async function openEvent(event: Event) {
    selectedEvent = event; participations = []; error = ''
    try { participations = (await api.participations(event.id)).data } catch (caught) { error = message(caught) }
  }

  async function submitParticipation() {
    if (!selectedEvent) return
    saving = true; error = ''; notice = ''
    try {
      const exhibitor = exhibitors.find((item) => item.id === participationForm.exhibitorId)
      await api.addParticipation(selectedEvent.id, { ...participationForm, agentId: exhibitor?.kind === 'LOCAL' ? null : nil(participationForm.agentId), hall: nil(participationForm.hall), booth: nil(participationForm.booth), notes: nil(participationForm.notes) })
      participationForm = { exhibitorId: '', agentId: '', hall: '', booth: '', notes: '' }
      participations = (await api.participations(selectedEvent.id)).data
      notice = 'Exhibitor ditambahkan ke event.'; await load()
    } catch (caught) { error = message(caught) } finally { saving = false }
  }

  async function changeStatus(event: Event) {
    const reason = window.prompt(event.status === 'ACTIVE' ? 'Alasan pembatalan event:' : 'Alasan mengaktifkan kembali event:')
    if (!reason?.trim()) return
    saving = true; error = ''; notice = ''
    try {
      if (event.status === 'ACTIVE') await api.cancelEvent(event.id, reason)
      else await api.reactivateEvent(event.id, reason)
      notice = event.status === 'ACTIVE' ? 'Event dibatalkan dengan alasan yang tercatat.' : 'Event diaktifkan kembali.'
      await load(); selectedEvent = events.find((item) => item.id === event.id) || null
    } catch (caught) { error = message(caught) } finally { saving = false }
  }

  $: activeEvents = events.filter((event) => event.status === 'ACTIVE')
  $: upcomingEvents = [...activeEvents].filter((event) => event.startOn >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.startOn.localeCompare(b.startOn))
  $: selectedExhibitor = exhibitors.find((item) => item.id === participationForm.exhibitorId)
  load()
</script>

<svelte:head><meta name="description" content="Workspace operasional VSS untuk data event PPJK." /></svelte:head>

<div class="shell">
  <aside>
    <div class="brand"><span>V</span><div><strong>VSS</strong><small>Operations Workspace</small></div></div>
    <nav aria-label="Navigasi utama">
      <button class:current={view === 'dashboard'} on:click={() => view = 'dashboard'}><i>▦</i> Ringkasan</button>
      <button class:current={view === 'events'} on:click={() => view = 'events'}><i>◫</i> Event</button>
      <button class:current={view === 'masters'} on:click={() => view = 'masters'}><i>◇</i> Data master</button>
    </nav>
    <div class="api-status"><span class:online={apiOnline}></span>{apiOnline ? 'API terhubung' : 'API belum terhubung'}</div>
  </aside>

  <main>
    <header><div><p class="eyebrow">OPERASIONAL PPJK</p><h1>{view === 'dashboard' ? 'Ringkasan kerja' : view === 'events' ? 'Event' : 'Data master'}</h1></div><button class="quiet" on:click={load} disabled={loading}>↻ Muat ulang</button></header>
    {#if error}<div class="banner error">{error}<button on:click={() => error = ''}>×</button></div>{/if}
    {#if notice}<div class="banner success">{notice}<button on:click={() => notice = ''}>×</button></div>{/if}

    {#if loading}<div class="loading">Memuat data operasional…</div>
    {:else if view === 'dashboard'}
      <section class="metrics">
        <article><span>Event aktif</span><strong>{activeEvents.length}</strong><small>dari {events.length} event tercatat</small></article>
        <article><span>Exhibitor</span><strong>{exhibitors.length}</strong><small>master aktif tersedia</small></article>
        <article><span>Organizer</span><strong>{organizers.length}</strong><small>mitra penyelenggara</small></article>
        <article><span>Venue</span><strong>{venues.length}</strong><small>lokasi terdaftar</small></article>
      </section>
      <section class="panel"><div class="panel-head"><div><h2>Event mendatang</h2><p>Event aktif diurutkan berdasarkan tanggal mulai.</p></div><button class="primary" on:click={() => { view = 'events'; eventFormOpen = true }}>+ Buat event</button></div>
        {#if upcomingEvents.length}<div class="event-list">{#each upcomingEvents.slice(0, 6) as event}<button class="event-row" on:click={() => { view = 'events'; openEvent(event) }}><span class="calendar"><b>{new Date(`${event.startOn}T00:00:00`).getDate()}</b><small>{new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(`${event.startOn}T00:00:00`))}</small></span><span><strong>{event.name}</strong><small>{event.eventOrganizer?.name || 'Organizer belum tersedia'} · {event.venue?.name || 'Venue belum tersedia'}</small></span><span class="arrow">→</span></button>{/each}</div>
        {:else}<div class="empty">Belum ada event mendatang. Tambahkan event setelah organizer dan venue tersedia.</div>{/if}
      </section>
    {:else if view === 'events'}
      <section class="panel"><div class="panel-head"><div><h2>Daftar event</h2><p>Perubahan status memakai perintah lifecycle eksplisit dan alasan tercatat.</p></div><button class="primary" on:click={() => eventFormOpen = !eventFormOpen}>+ Buat event</button></div>
      {#if eventFormOpen}<form class="form grid" on:submit|preventDefault={submitEvent}><label>Nama event<input required bind:value={eventForm.name} placeholder="Contoh: Manufacturing Indonesia 2026" /></label><label>Alias<input bind:value={eventForm.alias} placeholder="Opsional" /></label><label>Tanggal mulai<input required type="date" bind:value={eventForm.startOn} /></label><label>Tanggal selesai<input required type="date" min={eventForm.startOn} bind:value={eventForm.endOn} /></label><label>Organizer<select required bind:value={eventForm.eventOrganizerId}><option value="" disabled>Pilih organizer</option>{#each organizers as item}<option value={item.id}>{item.name}</option>{/each}</select></label><label>Venue<select required bind:value={eventForm.venueId}><option value="" disabled>Pilih venue</option>{#each venues as item}<option value={item.id}>{item.name}</option>{/each}</select></label><label class="wide">Catatan<textarea bind:value={eventForm.notes} placeholder="Catatan operasional opsional"></textarea></label><div class="form-actions wide"><button type="button" class="quiet" on:click={() => eventFormOpen = false}>Batal</button><button class="primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan event'}</button></div></form>{/if}
      <div class="table-wrap"><table><thead><tr><th>Event</th><th>Periode</th><th>Organizer</th><th>Venue</th><th>Status</th><th></th></tr></thead><tbody>{#each events as event}<tr class:selected={selectedEvent?.id === event.id}><td><button class="link" on:click={() => openEvent(event)}>{event.name}<small>{event.alias || '—'}</small></button></td><td>{date(event.startOn)}<small>s.d. {date(event.endOn)}</small></td><td>{event.eventOrganizer?.name || '—'}</td><td>{event.venue?.name || '—'}</td><td><span class:cancelled={event.status === 'CANCELLED'} class="badge">{event.status === 'ACTIVE' ? 'Aktif' : 'Dibatalkan'}</span></td><td><button class="icon-button" title="Lihat detail" on:click={() => openEvent(event)}>→</button></td></tr>{/each}</tbody></table></div>
      </section>
    {:else}
      <section class="master-grid"><article class="panel"><div class="panel-head"><div><h2>Organizer</h2><p>{organizers.length} aktif</p></div><button class="quiet" on:click={() => masterForm = masterForm === 'organizer' ? null : 'organizer'}>+ Tambah</button></div>{#if masterForm === 'organizer'}<form class="form" on:submit|preventDefault={submitMaster}><label>Nama<input required bind:value={organizerForm.name} /></label><label>NPWP<input bind:value={organizerForm.npwp} /></label><label>Alamat<textarea bind:value={organizerForm.address}></textarea></label><div class="form-actions"><button class="primary" disabled={saving}>Simpan organizer</button></div></form>{/if}<ul>{#each organizers as item}<li><strong>{item.name}</strong><small>{item.address || 'Alamat belum dicatat'}</small></li>{/each}</ul></article>
      <article class="panel"><div class="panel-head"><div><h2>Venue</h2><p>{venues.length} aktif</p></div><button class="quiet" on:click={() => masterForm = masterForm === 'venue' ? null : 'venue'}>+ Tambah</button></div>{#if masterForm === 'venue'}<form class="form" on:submit|preventDefault={submitMaster}><label>Nama<input required bind:value={venueForm.name} /></label><label>Alamat<textarea bind:value={venueForm.address}></textarea></label><label>NPWP<input bind:value={venueForm.npwp} /></label><label>Catatan akses muat<textarea bind:value={venueForm.loadingAccessNotes}></textarea></label><div class="form-actions"><button class="primary" disabled={saving}>Simpan venue</button></div></form>{/if}<ul>{#each venues as item}<li><strong>{item.name}</strong><small>{item.address || 'Alamat belum dicatat'}</small></li>{/each}</ul></article>
      <article class="panel"><div class="panel-head"><div><h2>Exhibitor</h2><p>{exhibitors.length} aktif</p></div><button class="quiet" on:click={() => masterForm = masterForm === 'exhibitor' ? null : 'exhibitor'}>+ Tambah</button></div>{#if masterForm === 'exhibitor'}<form class="form" on:submit|preventDefault={submitMaster}><label>Nama legal<input required bind:value={exhibitorForm.legalName} /></label><label>Jenis<select bind:value={exhibitorForm.kind}><option value="LOCAL">Lokal</option><option value="INTERNATIONAL">Internasional</option></select></label>{#if exhibitorForm.kind === 'INTERNATIONAL'}<label>Kode negara<input required maxlength="2" bind:value={exhibitorForm.countryCode} placeholder="KR" /></label>{:else}<label>NPWP<input bind:value={exhibitorForm.npwp} /></label>{/if}<label>Alamat<textarea bind:value={exhibitorForm.address}></textarea></label><div class="form-actions"><button class="primary" disabled={saving}>Simpan exhibitor</button></div></form>{/if}<ul>{#each exhibitors as item}<li><strong>{item.legalName}</strong><small>{item.kind === 'LOCAL' ? 'Lokal · Indonesia' : `Internasional · ${item.countryCode || 'negara belum diketahui'}`}</small></li>{/each}</ul></article></section>
    {/if}
  </main>
</div>

{#if selectedEvent}<div class="overlay" role="presentation" on:click={() => selectedEvent = null}></div><aside class="drawer"><div class="drawer-head"><div><p class="eyebrow">DETAIL EVENT</p><h2>{selectedEvent.name}</h2><p>{date(selectedEvent.startOn)} — {date(selectedEvent.endOn)}</p></div><button class="icon-button" on:click={() => selectedEvent = null}>×</button></div><div class="detail"><span class:cancelled={selectedEvent.status === 'CANCELLED'} class="badge">{selectedEvent.status === 'ACTIVE' ? 'Aktif' : 'Dibatalkan'}</span><p><strong>Organizer</strong>{selectedEvent.eventOrganizer?.name || '—'}</p><p><strong>Venue</strong>{selectedEvent.venue?.name || '—'}</p>{#if selectedEvent.notes}<p><strong>Catatan</strong>{selectedEvent.notes}</p>{/if}<button class="danger" disabled={saving} on:click={() => selectedEvent && changeStatus(selectedEvent)}>{selectedEvent.status === 'ACTIVE' ? 'Batalkan event' : 'Aktifkan kembali'}</button></div><section class="participants"><div class="panel-head"><div><h3>Exhibitor</h3><p>{participations.length} partisipasi tercatat</p></div></div><ul>{#each participations as item}<li><strong>{item.exhibitor.legalName}</strong><small>{item.hall || '—'} {item.booth ? `· Booth ${item.booth}` : ''} {item.agent ? `· ${item.agent.name}` : ''}</small></li>{/each}</ul>{#if selectedEvent.status === 'ACTIVE'}<details><summary>+ Tambah exhibitor</summary><form class="form" on:submit|preventDefault={submitParticipation}><label>Exhibitor<select required bind:value={participationForm.exhibitorId}><option value="" disabled>Pilih exhibitor</option>{#each exhibitors as item}<option value={item.id}>{item.legalName}</option>{/each}</select></label>{#if selectedExhibitor?.kind === 'INTERNATIONAL'}<label>Agent (opsional)<select bind:value={participationForm.agentId}><option value="">Tanpa agent</option>{#each agents as item}<option value={item.id}>{item.name}</option>{/each}</select></label>{/if}<div class="split"><label>Hall<input bind:value={participationForm.hall} /></label><label>Booth<input bind:value={participationForm.booth} /></label></div><button class="primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Tambahkan'}</button></form></details>{/if}</section></aside>{/if}
