import './style.css'

interface ItineraryItem {
  id: string
  title: string
  location: string
  date: string
  time: string
  cost: number
  category: 'Aktivitas' | 'Makan' | 'Transportasi' | 'Penginapan'
}

interface SavedPlanner {
  items: ItineraryItem[]
  budget: number
}

const storageKey = 'jalan-jalan-planner-v1'
const today = new Date()
const tripDates = [0, 1, 2].map((offset) => {
  const date = new Date(today)
  date.setDate(today.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
})

const starterItems: ItineraryItem[] = [
  { id: 'start-1', title: 'Sarapan di Pasar Ubud', location: 'Pasar Seni Ubud', date: tripDates[0], time: '08:00', cost: 85000, category: 'Makan' },
  { id: 'start-2', title: 'Jalan pagi di Campuhan Ridge', location: 'Jalan Raya Campuhan', date: tripDates[0], time: '09:30', cost: 0, category: 'Aktivitas' },
  { id: 'start-3', title: 'Makan siang & kopi', location: 'Seniman Coffee Studio', date: tripDates[0], time: '12:30', cost: 160000, category: 'Makan' },
  { id: 'start-4', title: 'Pindah ke Canggu', location: 'Ubud → Canggu', date: tripDates[1], time: '10:00', cost: 180000, category: 'Transportasi' },
  { id: 'start-5', title: 'Kelas selancar sore', location: 'Batu Bolong Beach', date: tripDates[1], time: '15:30', cost: 350000, category: 'Aktivitas' },
  { id: 'start-6', title: 'Makan malam di tepi pantai', location: 'Echo Beach', date: tripDates[2], time: '19:00', cost: 240000, category: 'Makan' },
]

function loadPlanner(): SavedPlanner {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const parsed = JSON.parse(saved) as SavedPlanner
      if (Array.isArray(parsed.items) && typeof parsed.budget === 'number') return parsed
    }
  } catch {
    localStorage.removeItem(storageKey)
  }
  return { items: starterItems, budget: 5000000 }
}

let planner = loadPlanner()
let activeDate = 'all'
let formIsOpen = false

const app = document.querySelector<HTMLDivElement>('#app')!
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const weekdayFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long' })
const dateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long' })

function formatDay(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`)
  return `${weekdayFormatter.format(date)}, ${dateFormatter.format(date)}`
}

function persist(): void {
  localStorage.setItem(storageKey, JSON.stringify(planner))
}

function getSortedItems(): ItineraryItem[] {
  return [...planner.items].sort((first, second) =>
    new Date(`${first.date}T${first.time}`).getTime() - new Date(`${second.date}T${second.time}`).getTime(),
  )
}

function render(): void {
  const sortedItems = getSortedItems()
  const totalCost = planner.items.reduce((total, item) => total + item.cost, 0)
  const remaining = planner.budget - totalCost
  const progress = planner.budget > 0 ? Math.min((totalCost / planner.budget) * 100, 100) : 0
  const dates = [...new Set(sortedItems.map((item) => item.date))].sort()
  const visibleItems = activeDate === 'all' ? sortedItems : sortedItems.filter((item) => item.date === activeDate)
  const groups = [...new Set(visibleItems.map((item) => item.date))]

  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#" aria-label="Rencana jalan-jalan">
        <span class="brand-mark" aria-hidden="true">J</span><span>jalan<span class="brand-dot">.</span></span>
      </a>
      <div class="topbar-right"><span class="saved-label"><span class="saved-dot"></span> Tersimpan otomatis</span><span class="avatar" aria-label="Profil">A</span></div>
    </header>

    <main class="page-shell">
      <section class="trip-heading">
        <div>
          <p class="eyebrow">RENCANA PERJALANAN <span>·</span> BALI</p>
          <h1>Ubud <span class="route-arrow">→</span> Canggu</h1>
          <p class="trip-subtitle">${dates.length ? `${formatDay(dates[0])} – ${formatDay(dates[dates.length - 1])}` : 'Atur tanggal perjalananmu'} <span class="subtitle-separator">/</span> ${dates.length} hari</p>
        </div>
        <button class="primary-button" id="toggle-form" type="button" aria-expanded="${formIsOpen}">
          <span class="plus-icon" aria-hidden="true">+</span> Tambah kegiatan
        </button>
      </section>

      ${formIsOpen ? renderForm() : ''}

      <div class="content-grid">
        <section class="itinerary-panel" aria-labelledby="itinerary-title">
          <div class="section-heading">
            <div><p class="eyebrow">SUSUNAN PERJALANAN</p><h2 id="itinerary-title">Itinerary <span class="item-count">${sortedItems.length}</span></h2></div>
            <label class="sort-indicator"><span class="sort-icon" aria-hidden="true">↕</span> Urut berdasarkan waktu</label>
          </div>
          <nav class="day-tabs" aria-label="Filter hari">
            <button type="button" class="day-tab ${activeDate === 'all' ? 'is-active' : ''}" data-date="all">Semua hari</button>
            ${dates.map((date, index) => `<button type="button" class="day-tab ${activeDate === date ? 'is-active' : ''}" data-date="${date}">Hari ${index + 1}<span>${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(`${date}T00:00:00`))}</span></button>`).join('')}
          </nav>
          <div class="agenda">
            ${groups.length ? groups.map((date) => `
              <section class="day-group">
                <div class="day-heading"><span class="day-marker"></span><h3>${formatDay(date)}</h3><span class="day-line"></span></div>
                <div class="schedule-list">
                  ${visibleItems.filter((item) => item.date === date).map((item) => renderItem(item)).join('')}
                </div>
              </section>
            `).join('') : '<div class="empty-state"><span class="empty-icon">✳</span><h3>Belum ada kegiatan</h3><p>Tambahkan rencana pertama untuk hari ini.</p><button class="text-button" id="empty-add" type="button">+ Tambah kegiatan</button></div>'}
          </div>
        </section>

        <aside class="budget-panel" aria-labelledby="budget-title">
          <div class="budget-heading"><div><p class="eyebrow">RINGKASAN</p><h2 id="budget-title">Anggaran</h2></div><span class="budget-icon" aria-hidden="true">↗</span></div>
          <label class="budget-label" for="budget-input">Batas anggaran perjalanan</label>
          <div class="budget-input-wrap"><span>Rp</span><input id="budget-input" type="number" min="0" step="50000" value="${planner.budget}" aria-label="Batas anggaran dalam rupiah" /></div>
          <div class="budget-progress" role="progressbar" aria-label="Penggunaan anggaran" aria-valuenow="${Math.round(progress)}" aria-valuemin="0" aria-valuemax="100"><span style="width: ${progress}%"></span></div>
          <div class="budget-usage"><span>${Math.round(progress)}% terpakai</span><span>${rupiah.format(Math.max(remaining, 0))} tersisa</span></div>
          <div class="budget-divider"></div>
          <div class="total-row"><span>Total estimasi</span><strong>${rupiah.format(totalCost)}</strong></div>
          <div class="total-row budget-limit-row"><span>Batas anggaran</span><span>${rupiah.format(planner.budget)}</span></div>
          <div class="budget-status ${remaining < 0 ? 'is-over' : ''}"><span class="status-icon" aria-hidden="true">${remaining < 0 ? '!' : '✓'}</span><div><strong>${remaining < 0 ? 'Melebihi anggaran' : 'Masih dalam anggaran'}</strong><p>${remaining < 0 ? `Kurangi ${rupiah.format(Math.abs(remaining))} dari rencana.` : `${rupiah.format(remaining)} masih bisa digunakan.`}</p></div></div>
          <p class="budget-note">Estimasi dapat berubah. Sisakan ruang untuk hal tak terduga.</p>
        </aside>
      </div>
      <footer class="page-footer"><span>Perjalanan yang baik dimulai dari rencana yang ringan.</span><span>RUPIAH · IDR</span></footer>
    </main>
  `

  bindEvents()
}

function renderItem(item: ItineraryItem): string {
  const categoryClass = item.category.toLowerCase().replaceAll(' ', '-')
  return `<article class="schedule-item">
    <time class="schedule-time" datetime="${item.date}T${item.time}">${item.time}</time>
    <span class="timeline-pin ${categoryClass}" aria-hidden="true"></span>
    <div class="activity-content"><div class="activity-title-row"><h4>${escapeHtml(item.title)}</h4><span class="category-tag ${categoryClass}">${item.category}</span></div><p class="activity-location"><span aria-hidden="true">⌖</span> ${escapeHtml(item.location || 'Lokasi belum diisi')}</p></div>
    <div class="activity-cost">${rupiah.format(item.cost)}</div>
    <button class="delete-button" type="button" data-delete="${item.id}" aria-label="Hapus ${escapeHtml(item.title)}" title="Hapus kegiatan">×</button>
  </article>`
}

function renderForm(): string {
  return `<form class="activity-form" id="activity-form">
    <div class="form-heading"><div><p class="eyebrow">TAMBAHKAN KE RENCANA</p><h2>Kegiatan baru</h2></div><button class="close-form" id="close-form" type="button" aria-label="Tutup form">×</button></div>
    <div class="form-fields">
      <label class="field field-wide">Nama kegiatan<input name="title" type="text" placeholder="Contoh: Mengunjungi Pura Tirta Empul" required maxlength="70" /></label>
      <label class="field">Lokasi<input name="location" type="text" placeholder="Nama tempat" maxlength="70" /></label>
      <label class="field">Kategori<select name="category"><option>Aktivitas</option><option>Makan</option><option>Transportasi</option><option>Penginapan</option></select></label>
      <label class="field">Tanggal<input name="date" type="date" value="${activeDate === 'all' ? (datesForInput()[0] ?? tripDates[0]) : activeDate}" required /></label>
      <label class="field">Jam<input name="time" type="time" value="09:00" required /></label>
      <label class="field">Estimasi biaya<input name="cost" type="number" min="0" step="1000" value="0" required /></label>
    </div>
    <div class="form-actions"><button class="secondary-button" id="cancel-form" type="button">Batal</button><button class="primary-button" type="submit">Simpan kegiatan <span aria-hidden="true">→</span></button></div>
  </form>`
}

function datesForInput(): string[] {
  return [...new Set(planner.items.map((item) => item.date))].sort()
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

function bindEvents(): void {
  document.querySelector('#toggle-form')?.addEventListener('click', () => {
    formIsOpen = !formIsOpen
    render()
    if (formIsOpen) document.querySelector<HTMLInputElement>('[name="title"]')?.focus()
  })
  document.querySelector('#empty-add')?.addEventListener('click', () => {
    formIsOpen = true
    render()
    document.querySelector<HTMLInputElement>('[name="title"]')?.focus()
  })
  document.querySelector('#close-form')?.addEventListener('click', closeForm)
  document.querySelector('#cancel-form')?.addEventListener('click', closeForm)
  document.querySelectorAll<HTMLButtonElement>('[data-date]').forEach((button) => {
    button.addEventListener('click', () => {
      activeDate = button.dataset.date ?? 'all'
      render()
    })
  })
  document.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach((button) => {
    button.addEventListener('click', () => {
      planner.items = planner.items.filter((item) => item.id !== button.dataset.delete)
      persist()
      render()
    })
  })
  document.querySelector<HTMLInputElement>('#budget-input')?.addEventListener('change', (event) => {
    const value = Number((event.currentTarget as HTMLInputElement).value)
    planner.budget = Number.isFinite(value) ? Math.max(value, 0) : 0
    persist()
    render()
  })
  document.querySelector<HTMLFormElement>('#activity-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const form = event.currentTarget as HTMLFormElement
    const data = new FormData(form)
    planner.items.push({
      id: crypto.randomUUID(),
      title: String(data.get('title')).trim(),
      location: String(data.get('location')).trim(),
      category: String(data.get('category')) as ItineraryItem['category'],
      date: String(data.get('date')),
      time: String(data.get('time')),
      cost: Math.max(Number(data.get('cost')) || 0, 0),
    })
    activeDate = 'all'
    formIsOpen = false
    persist()
    render()
  })
}

function closeForm(): void {
  formIsOpen = false
  render()
}

render()
