import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search, PackageOpen, CalendarDays, ShieldCheck, Plus, X, Check, Clock3, MapPin, Leaf, RefreshCw } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const categories = ['All resources', 'Camera', 'Electronics', 'Computing', 'Maker Space'];

export default function App() {
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All resources');
  const [activeTab, setActiveTab] = useState('discover');
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);
  const [form, setForm] = useState({ requesterName: '', startTime: '', endTime: '', purpose: '' });

  async function loadData() {
    setLoading(true);
    try {
      const [r, b] = await Promise.all([fetch(`${API}/api/resources`), fetch(`${API}/api/bookings`)]);
      if (!r.ok || !b.ok) throw new Error('API unavailable');
      setResources(await r.json()); setBookings(await b.json()); setApiOnline(true);
    } catch {
      setApiOnline(false); setNotice('Could not reach the API. Start the backend, then refresh.');
    } finally { setLoading(false); }
  }
  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => resources.filter((r) => {
    const matchCategory = category === 'All resources' || r.category === category;
    const text = `${r.name} ${r.category} ${r.location} ${r.description}`.toLowerCase();
    return matchCategory && text.includes(query.toLowerCase());
  }), [resources, category, query]);

  async function requestBooking(e) {
    e.preventDefault();
    try {
      const response = await fetch(`${API}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, resourceId: selected.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create booking');
      setNotice('Request submitted! The resource owner can now review it.'); setSelected(null); setForm({ requesterName: '', startTime: '', endTime: '', purpose: '' }); setActiveTab('bookings'); await loadData();
    } catch (err) { setNotice(err.message); }
  }
  async function reviewBooking(id, status) {
    try {
      const response = await fetch(`${API}/api/bookings/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not update booking');
      setNotice(`Booking ${status}.`); await loadData();
    } catch (err) { setNotice(err.message); }
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" onClick={() => setActiveTab('discover')}><span className="brand-mark"><RefreshCw size={19}/></span><span>resource<span className="brand-accent">loop</span></span></a>
      <nav className="main-nav"><button className={activeTab === 'discover' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveTab('discover')}>Discover</button><button className={activeTab === 'bookings' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveTab('bookings')}>My bookings <span className="count">{bookings.length}</span></button><button className={activeTab === 'owner' ? 'nav-link active' : 'nav-link'} onClick={() => setActiveTab('owner')}>Owner desk</button></nav>
      <div className="top-actions"><span className={apiOnline ? 'api-status' : 'api-status offline'}><span/> {apiOnline ? 'System online' : 'API offline'}</span><button className="avatar" title="Demo profile">RL</button></div>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><Leaf size={15}/> A CAMPUS THAT SHARES</div><h1>Good things deserve<br/><em>more than one owner.</em></h1><p>Find the equipment and spaces sitting idle around campus. Borrow what you need, share what you have, and make more happen together.</p><div className="hero-actions"><button className="button primary" onClick={() => { setActiveTab('discover'); document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' }); }}>Explore resources <ArrowRight size={17}/></button><div className="trust-note"><ShieldCheck size={18}/><span>Built for fair, accountable sharing</span></div></div></div>
        <div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-card art-card-main"><div className="art-icon">📷</div><div><span className="mini-label">AVAILABLE TO BORROW</span><strong>Creator kit</strong><small>Media Lab · Today</small></div><span className="available-dot"/></div><div className="art-card art-card-small"><span className="art-small-icon">💻</span><div><strong>Tech, shared.</strong><small>Less idle. More ideas.</small></div></div><div className="art-sticker"><RefreshCw size={24}/><span>USE<br/>AGAIN</span></div></div>
        <div className="hero-bottom"><span>MADE FOR CAMPUS COMMUNITIES</span><div><span>01 / DISCOVER</span><span>02 / REQUEST</span><span>03 / SHARE</span></div></div>
      </section>

      {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={17}/></button></div>}

      {activeTab === 'discover' && <section className="catalogue section-wrap" id="catalogue">
        <div className="section-heading"><div><div className="eyebrow muted">THE RESOURCE LIBRARY</div><h2>Find your next <em>possibility.</em></h2><p>Useful things, already here. Ready when you are.</p></div><div className="resource-total"><strong>{resources.length.toString().padStart(2, '0')}</strong><span>RESOURCES<br/>LISTED</span></div></div>
        <div className="search-row"><label className="search-box"><Search size={19}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cameras, laptops, spaces..." /></label><button className="button outline" onClick={loadData}><RefreshCw size={16}/> Refresh</button></div>
        <div className="category-row">{categories.map((c) => <button key={c} className={category === c ? 'category active' : 'category'} onClick={() => setCategory(c)}>{c}</button>)}</div>
        {loading ? <div className="empty-state">Loading resources…</div> : <div className="resource-grid">{filtered.map((r, i) => <article className="resource-card" key={r.id}><div className={`resource-visual visual-${i % 4}`}><span className="resource-emoji">{r.image || '🧰'}</span><span className="available-tag"><span/> Available</span><span className="resource-number">RL / {String(i + 1).padStart(2, '0')}</span></div><div className="resource-body"><div className="resource-meta"><span>{r.category}</span><span><MapPin size={13}/>{r.location}</span></div><h3>{r.name}</h3><p>{r.description}</p><div className="resource-foot"><span className="eligibility"><ShieldCheck size={14}/>{r.eligibility}</span><button className="icon-button" onClick={() => setSelected(r)} aria-label={`Request ${r.name}`}><ArrowRight size={19}/></button></div></div></article>)}</div>}
        {!loading && filtered.length === 0 && <div className="empty-state">No resources match that search. Try another keyword or category.</div>}
      </section>}

      {activeTab === 'bookings' && <section className="section-wrap dashboard-section"><div className="eyebrow muted">YOUR ACTIVITY</div><h2>My <em>requests.</em></h2><p className="section-intro">Track the resources you have requested.</p>{bookings.length === 0 ? <div className="empty-state"><CalendarDays size={28}/><strong>No bookings yet</strong><span>Discover a resource and send your first request.</span><button className="button primary" onClick={() => setActiveTab('discover')}>Browse resources</button></div> : <div className="booking-list">{bookings.map((b) => <BookingRow key={b.id} booking={b} resources={resources}/>)}</div>}</section>}

      {activeTab === 'owner' && <section className="section-wrap dashboard-section"><div className="eyebrow muted">RESOURCE MANAGEMENT</div><h2>Owner <em>desk.</em></h2><p className="section-intro">Review requests and keep shared resources moving.</p>{bookings.length === 0 ? <div className="empty-state"><PackageOpen size={28}/><strong>Nothing to review</strong><span>New booking requests will appear here.</span></div> : <div className="booking-list">{bookings.map((b) => <div className="booking-row" key={b.id}><div className="booking-symbol">{resources.find((r) => r.id === b.resourceId)?.image || '🧰'}</div><div className="booking-main"><div className="booking-title-row"><h3>{b.resourceName}</h3><Status status={b.status}/></div><p>{b.requesterName} · {b.purpose}</p><small><Clock3 size={13}/> {new Date(b.startTime).toLocaleString()} — {new Date(b.endTime).toLocaleString()}</small></div>{b.status === 'pending' && <div className="review-actions"><button className="approve-button" onClick={() => reviewBooking(b.id, 'approved')}><Check size={15}/> Approve</button><button className="reject-button" onClick={() => reviewBooking(b.id, 'rejected')}>Reject</button></div>}</div>)}</div>}</section>}

      <section className="impact-strip"><div><span className="impact-icon"><Leaf size={20}/></span><div><strong>Make use of what we have.</strong><p>Every shared resource is one more opportunity unlocked.</p></div></div><span className="impact-tag">SHARE MORE. WASTE LESS.</span></section>
    </main>
    <footer><a className="brand footer-brand" href="#top"><span className="brand-mark"><RefreshCw size={16}/></span><span>resource<span className="brand-accent">loop</span></span></a><span>Built for a more resourceful campus.</span><span>HACKATHON MVP · 2026</span></footer>

    {selected && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="booking-title"><div className="modal-top"><div><div className="eyebrow muted">BOOKING REQUEST</div><h2 id="booking-title">Request a <em>resource.</em></h2></div><button className="icon-button close-button" onClick={() => setSelected(null)} aria-label="Close"><X size={20}/></button></div><div className="selected-resource"><span>{selected.image || '🧰'}</span><div><strong>{selected.name}</strong><small>{selected.location} · {selected.eligibility}</small></div></div><form onSubmit={requestBooking} className="booking-form"><label>Your name<input required value={form.requesterName} onChange={(e) => setForm({ ...form, requesterName: e.target.value })} placeholder="e.g. Aditi Sharma"/></label><div className="form-pair"><label>Start time<input required type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}/></label><label>End time<input required type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}/></label></div><label>What will you use it for?<textarea required rows="3" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Briefly describe your project or need"/></label><p className="form-note"><ShieldCheck size={15}/> Your request will be reviewed by the resource owner.</p><button className="button primary submit-button" type="submit">Send booking request <ArrowRight size={17}/></button></form></section></div>}
  </div>;
}

function Status({ status }) { return <span className={`status status-${status}`}>{status}</span>; }
function BookingRow({ booking, resources }) { const resource = resources.find((r) => r.id === booking.resourceId); return <article className="booking-row"><div className="booking-symbol">{resource?.image || '🧰'}</div><div className="booking-main"><div className="booking-title-row"><h3>{booking.resourceName}</h3><Status status={booking.status}/></div><p>{booking.purpose}</p><small><CalendarDays size={13}/> {new Date(booking.startTime).toLocaleString()} — {new Date(booking.endTime).toLocaleString()}</small>{booking.history?.length > 0 && <div className="history-line">{booking.history.map((h, i) => <span key={i}><Check size={12}/>{h.action}</span>)}</div>}</div></article>; }
