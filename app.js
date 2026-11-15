'use strict';
/* EKORUSTIKA DATA HUB 1.0 — MVP. Tekst: localStorage. Mediji: IndexedDB (odvojeno). Bez tajni i naplate. */
const KEY = 'ekorustika-datahub-v1';
const VIDEO_CATS = ['Montaže', 'Digitalni alati', 'EKORUSTIKA GROUP', 'Ostalo'];
const GAL_CATS = ['SPC', 'MDF / akustika', 'TV zidovi', 'WPC', 'Ostali radovi'];
const PLATFORMS = ['Facebook', 'LinkedIn', 'Facebook grupe'];
const STATUSES = ['Ideja', 'U izradi', 'Test', 'Objavljeno', 'Pauza'];
const DEFAULT = {
  version: 1, templates: [], postLog: [],
  links: [
    { id: 'l1', name: 'EKORUSTIKA MONTAŽE', url: 'https://ekorustika-lang.github.io/ekorustika-montaze-test/' },
    { id: 'l2', name: 'EKORUSTIKA DIGITALNI ALATI', url: 'https://ekorustika-lang.github.io/ekorustika-digital-test/' },
    { id: 'l3', name: 'obloga.hr', url: 'https://obloga.hr/' }
  ],
  projects: [
    { id: 'p1', name: 'Montaže', status: 'Objavljeno', desc: '', notes: '', link: 'https://ekorustika-lang.github.io/ekorustika-montaze-test/' },
    { id: 'p2', name: 'Digitalni alati', status: 'Objavljeno', desc: '', notes: '', link: 'https://ekorustika-lang.github.io/ekorustika-digital-test/' },
    { id: 'p3', name: 'DataVision', status: 'U izradi', desc: '', notes: '', link: '' },
    { id: 'p4', name: 'DATA CORE / DATA OS', status: 'Ideja', desc: '', notes: '', link: '' },
    { id: 'p5', name: 'Ostali', status: 'Ideja', desc: '', notes: '', link: '' }
  ],
  integration: { workerUrl: '', note: '' }
};
let db = load();
function load() { try { return Object.assign(structuredClone(DEFAULT), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return structuredClone(DEFAULT); } }
function save() { localStorage.setItem(KEY, JSON.stringify(db)); }
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = s => document.querySelector(s);
const app = $('#app');
function toast(t) { const x = $('#toast'); x.textContent = t; x.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => x.style.display = 'none', 2200); }
const fmt = d => new Date(d).toLocaleString('hr-HR');
const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '';

/* IndexedDB */
let idb;
function openIDB() { return new Promise((res, rej) => { if (idb) return res(idb); const r = indexedDB.open('ekorustika-datahub-media', 1); r.onupgradeneeded = () => r.result.createObjectStore('media', { keyPath: 'id' }); r.onsuccess = () => { idb = r.result; res(idb); }; r.onerror = () => rej(r.error); }); }
async function mPut(o) { const d = await openIDB(); return new Promise((res, rej) => { const t = d.transaction('media', 'readwrite'); t.objectStore('media').put(o); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
async function mAll() { const d = await openIDB(); return new Promise((res, rej) => { const r = d.transaction('media').objectStore('media').getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function mDel(id) { const d = await openIDB(); return new Promise(res => { const t = d.transaction('media', 'readwrite'); t.objectStore('media').delete(id); t.oncomplete = res; }); }
const urls = []; function objUrl(b) { const u = URL.createObjectURL(b); urls.push(u); return u; }
function freeUrls() { while (urls.length) URL.revokeObjectURL(urls.pop()); }

/* Navigacija */
function go(v) { freeUrls(); if (location.hash.slice(1) === v) render(); else location.hash = v; }
window.addEventListener('hashchange', render);
function render() { const v = location.hash.slice(1) || 'home'; $('#back').style.display = v === 'home' ? 'none' : 'inline-block'; (VIEWS[v] || home)(); window.scrollTo(0, 0); }

function home() {
  app.innerHTML = `<div class="warn">⚠️ Podaci se spremaju samo na ovom uređaju. Uređaji nisu sinkronizirani — za prijenos koristi <b>Podaci → JSON izvoz/uvoz</b>.</div>
  <div class="grid">
    <button class="tile b" onclick="go('promo')"><span>🎬</span>Promo centar<em>MP4 reklame</em></button>
    <button class="tile g" onclick="go('posts')"><span>📝</span>Objave<em>Predlošci i evidencija</em></button>
    <button class="tile b" onclick="go('gallery')"><span>🖼️</span>Galerija<em>SPC · MDF · TV · WPC</em></button>
    <button class="tile g" onclick="go('links')"><span>🔗</span>Poveznice<em>Web stranice</em></button>
    <button class="tile b" onclick="go('projects')"><span>📂</span>Projekti<em>Statusi i bilješke</em></button>
    <button class="tile g" onclick="go('data')"><span>💾</span>Podaci<em>Izvoz, uvoz, integracija</em></button>
  </div>
  <button class="btn o full" onclick="go('install')">📲 Kako instalirati aplikaciju</button>
  <p class="muted" style="text-align:center;margin-top:18px">Izradio EKORUSTIKA DIGITAL</p>`;
}

/* PROMO CENTAR */
async function promo() {
  app.innerHTML = `<h2>🎬 Promo centar</h2>
  <div class="card"><label>Dodaj MP4 video (npr. EKORUSTIKA-GROUP-promo-v6-final.mp4)</label>
  <input type="file" id="vf" accept="video/mp4,video/*" multiple>
  <label>Kategorija</label><select id="vc">${VIDEO_CATS.map(c => `<option>${c}</option>`).join('')}</select>
  <button class="btn full" onclick="addVideos()">➕ Spremi video</button>
  <p class="muted">Video ostaje samo na ovom uređaju.</p></div>
  <div class="chips" id="vchips"></div><div id="vlist"><p class="muted">Učitavanje…</p></div>`;
  const all = (await mAll()).filter(m => m.kind === 'video').sort((a, b) => b.created - a.created);
  const f = promo.filter || 'Sve';
  $('#vchips').innerHTML = ['Sve', ...VIDEO_CATS].map(c => `<button class="chip ${c === f ? 'on' : ''}" onclick="promo.filter='${c}';promo()">${c}</button>`).join('');
  const list = all.filter(v => f === 'Sve' || v.category === f);
  $('#vlist').innerHTML = list.length ? list.map(v => `<div class="card">
    <video controls playsinline preload="metadata" src="${objUrl(v.blob)}"></video>
    <b>${esc(v.name)}</b><div class="muted">${esc(v.category)} · ${(v.blob.size / 1048576).toFixed(1)} MB · ${fmt(v.created)}</div>
    <select onchange="setMedia('${v.id}','category',this.value)">${VIDEO_CATS.map(c => `<option ${c === v.category ? 'selected' : ''}>${c}</option>`).join('')}</select>
    <div class="row"><button class="btn" onclick="downloadMedia('${v.id}')">⬇️ Preuzmi</button><button class="btn g" onclick="shareMedia('${v.id}')">📤 Podijeli</button><button class="btn r" onclick="delMedia('${v.id}','promo')">🗑️</button></div></div>`).join('')
    : '<p class="muted">Još nema videa. Dodaj prvu reklamu gore.</p>';
}
async function addVideos() {
  const files = [...$('#vf').files]; if (!files.length) return toast('Odaberi video');
  try { for (const f of files) await mPut({ id: uid(), kind: 'video', name: f.name, type: f.type || 'video/mp4', category: $('#vc').value, blob: f, created: Date.now() }); toast('Spremljeno: ' + files.length); }
  catch (e) { alert('Spremanje nije uspjelo (moguće premalo prostora): ' + e); }
  promo();
}
async function getMedia(id) { return (await mAll()).find(m => m.id === id); }
async function setMedia(id, k, v) { const m = await getMedia(id); m[k] = v; await mPut(m); toast('Spremljeno'); if (k === 'tag') gallery(); }
async function delMedia(id, back) { if (!confirm('Obrisati s ovog uređaja?')) return; await mDel(id); VIEWS[back](); }
async function downloadMedia(id) { const m = await getMedia(id); const a = document.createElement('a'); a.href = objUrl(m.blob); a.download = m.name; a.click(); }
async function shareMedia(id) {
  const m = await getMedia(id); const file = new File([m.blob], m.name, { type: m.type || m.blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: m.name }); } catch (e) { } }
  else { toast('Dijeljenje nije podržano — preuzimam'); downloadMedia(id); }
}

/* OBJAVE */
function posts() {
  const ed = posts.edit ? db.templates.find(t => t.id === posts.edit) : null;
  app.innerHTML = `<h2>📝 Objave</h2>
  <div class="warn">Aplikacija ne objavljuje automatski. Kopiraj ili podijeli tekst, objavi ručno, zatim upiši objavu u evidenciju.</div>
  <div class="card"><h3>${ed ? 'Uredi predložak' : 'Novi predložak'}</h3>
  <label>Naziv</label><input id="tn" value="${esc(ed?.name)}">
  <label>Platforma</label><select id="tp">${PLATFORMS.map(p => `<option ${ed?.platform === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
  <label>Tekst objave</label><textarea id="tt">${esc(ed?.text)}</textarea>
  <button class="btn g full" onclick="saveTpl()">💾 Spremi predložak</button>${ed ? '<button class="btn o full" onclick="posts.edit=null;posts()">Odustani</button>' : ''}</div>
  <h3>Predlošci (${db.templates.length})</h3>
  ${db.templates.map(t => `<div class="card"><b>${esc(t.name || 'Bez naziva')}</b> <span class="status">${esc(t.platform)}</span>
   <p style="white-space:pre-wrap">${esc(t.text)}</p>
   <div class="row"><button class="btn" onclick="copyTpl('${t.id}')">📋 Kopiraj tekst</button><button class="btn g" onclick="shareTpl('${t.id}')">📤 Podijeli</button>
   <button class="btn o" onclick="posts.edit='${t.id}';posts()">✏️</button><button class="btn o" onclick="logFrom('${t.id}')">➕ U evidenciju</button><button class="btn r" onclick="delTpl('${t.id}')">🗑️</button></div></div>`).join('') || '<p class="muted">Nema predložaka.</p>'}
  <h3>Evidencija objava (${db.postLog.length})</h3>
  <div class="card"><label>Platforma</label><select id="lp">${PLATFORMS.map(p => `<option>${p}</option>`).join('')}</select>
  <label>Gdje / grupa</label><input id="lw" placeholder="npr. naziv FB grupe">
  <label>Datum objave</label><input type="date" id="ld" value="${new Date().toISOString().slice(0, 10)}">
  <label>Poveznica na objavu</label><input id="ll" placeholder="https://...">
  <label>Bilješka</label><input id="lnote">
  <button class="btn full" onclick="addLog()">➕ Upiši objavu</button></div>
  ${[...db.postLog].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(l => `<div class="card"><b>${esc(l.date)}</b> · ${esc(l.platform)} ${l.where ? '· ' + esc(l.where) : ''}
   ${safeUrl(l.link) ? `<br><a href="${esc(l.link)}" target="_blank" rel="noopener">${esc(l.link)}</a>` : ''}<div class="muted">${esc(l.note)}</div>
   <button class="btn r" onclick="delLog('${l.id}')">🗑️</button></div>`).join('')}`;
}
function saveTpl() {
  const o = { name: $('#tn').value.trim(), platform: $('#tp').value, text: $('#tt').value, updated: Date.now() };
  if (!o.text.trim()) return toast('Upiši tekst');
  if (posts.edit) Object.assign(db.templates.find(t => t.id === posts.edit), o); else db.templates.unshift({ id: uid(), ...o });
  posts.edit = null; save(); toast('Predložak spremljen'); posts();
}
async function copyText(t) { try { await navigator.clipboard.writeText(t); toast('Tekst kopiran'); } catch (e) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); toast('Tekst kopiran'); } }
function copyTpl(id) { copyText(db.templates.find(t => t.id === id).text); }
async function shareTpl(id) { const t = db.templates.find(x => x.id === id); if (navigator.share) { try { await navigator.share({ text: t.text }); } catch (e) { } } else copyText(t.text); }
function delTpl(id) { if (!confirm('Obrisati predložak?')) return; db.templates = db.templates.filter(t => t.id !== id); save(); posts(); }
function logFrom(id) { const t = db.templates.find(x => x.id === id); $('#lp').value = t.platform; $('#lnote').value = t.name; $('#ll').focus(); }
function addLog() { db.postLog.push({ id: uid(), platform: $('#lp').value, where: $('#lw').value.trim(), date: $('#ld').value, link: $('#ll').value.trim(), note: $('#lnote').value.trim() }); save(); toast('Upisano'); posts(); }
function delLog(id) { if (!confirm('Obrisati zapis?')) return; db.postLog = db.postLog.filter(l => l.id !== id); save(); posts(); }

/* GALERIJA */
async function gallery() {
  const f = gallery.filter || GAL_CATS[0];
  app.innerHTML = `<h2>🖼️ Galerija radova</h2>
  <div class="muted" style="margin-bottom:8px">Zidne obloge i ostali radovi. Kuhinje se ne prikazuju u promociji zidnih obloga.</div>
  <div class="chips">${GAL_CATS.map(c => `<button class="chip ${c === f ? 'on' : ''}" onclick="gallery.filter='${c}';gallery()">${c}</button>`).join('')}</div>
  <div class="card"><label>Dodaj fotografije u: <b>${f}</b></label><input type="file" id="pf" accept="image/*" multiple>
  <label>Projekt (neobavezno, za grupiranje)</label><input id="pproj" placeholder="npr. Projekt 1">
  <button class="btn full" onclick="addPhotos()">➕ Spremi fotografije</button></div>
  <div id="plist"><p class="muted">Učitavanje…</p></div>`;
  const list = (await mAll()).filter(m => m.kind === 'photo' && m.category === f).sort((a, b) => a.created - b.created);
  if (!list.length) { $('#plist').innerHTML = '<p class="muted">Nema fotografija u ovoj kategoriji.</p>'; return; }
  const groups = {}; list.forEach(p => (groups[p.project || 'Bez projekta'] ||= []).push(p));
  $('#plist').innerHTML = Object.entries(groups).map(([g, ps]) => `<h3>${esc(g)} (${ps.length})</h3><div class="photos">${ps.map(p => { const u = objUrl(p.blob); return `<div class="ph">
    <img src="${u}" alt="" loading="lazy" onclick="$('#lbimg').src=this.src;$('#lb').style.display='flex'">
    ${p.tag ? `<span class="tag ${p.tag === 'POSLIJE' ? 'p' : ''}">${p.tag}</span>` : ''}
    <select onchange="setMedia('${p.id}','tag',this.value)"><option value="">Bez oznake</option>${['PRIJE', 'POSLIJE'].map(t => `<option ${p.tag === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <div class="row"><button class="btn o" style="padding:8px" onclick="shareMedia('${p.id}')">📤</button><button class="btn o" style="padding:8px" onclick="downloadMedia('${p.id}')">⬇️</button><button class="btn r" style="padding:8px" onclick="delMedia('${p.id}','gallery')">🗑️</button></div></div>`; }).join('')}</div>`).join('');
}
async function addPhotos() {
  const files = [...$('#pf').files]; if (!files.length) return toast('Odaberi fotografije');
  const cat = gallery.filter || GAL_CATS[0], proj = $('#pproj').value.trim();
  try { for (const f of files) await mPut({ id: uid(), kind: 'photo', name: f.name, type: f.type, category: cat, project: proj, tag: '', blob: await shrink(f), created: Date.now() }); toast('Spremljeno: ' + files.length); }
  catch (e) { alert('Spremanje nije uspjelo: ' + e); }
  gallery();
}
function shrink(file, max = 1800) {
  return new Promise(res => { const img = new Image(); img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); if (s === 1 && file.size < 1.5e6) return res(file);
    const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); c.toBlob(b => res(b || file), 'image/jpeg', 0.85); };
    img.onerror = () => res(file); img.src = URL.createObjectURL(file); });
}

/* POVEZNICE */
function links() {
  app.innerHTML = `<h2>🔗 Poveznice</h2>
  ${db.links.map((l, i) => `<div class="card"><label>Naziv</label><input value="${esc(l.name)}" onchange="db.links[${i}].name=this.value;save()">
  <label>Adresa</label><input value="${esc(l.url)}" onchange="db.links[${i}].url=this.value.trim();save()">
  <div class="row">${safeUrl(l.url) ? `<a class="btn ${i % 2 ? 'g' : ''}" href="${esc(l.url)}" target="_blank" rel="noopener">Otvori</a>` : ''}<button class="btn o" onclick="copyText(db.links[${i}].url)">📋 Kopiraj</button><button class="btn r" onclick="delLink(${i})">🗑️</button></div></div>`).join('')}
  <button class="btn full" onclick="db.links.push({id:uid(),name:'Nova poveznica',url:'https://'});save();links()">➕ Dodaj poveznicu</button>`;
}
function delLink(i) { if (!confirm('Obrisati poveznicu?')) return; db.links.splice(i, 1); save(); links(); }

/* PROJEKTI */
function projects() {
  app.innerHTML = `<h2>📂 Projekti</h2>
  ${db.projects.map((p, i) => `<div class="card"><label>Naziv</label><input value="${esc(p.name)}" onchange="db.projects[${i}].name=this.value;save()">
  <label>Status</label><select onchange="db.projects[${i}].status=this.value;save()">${STATUSES.map(s => `<option ${s === p.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
  <label>Opis</label><textarea style="min-height:70px" onchange="db.projects[${i}].desc=this.value;save()">${esc(p.desc)}</textarea>
  <label>Bilješke</label><textarea style="min-height:70px" onchange="db.projects[${i}].notes=this.value;save()">${esc(p.notes)}</textarea>
  <label>Poveznica</label><input value="${esc(p.link)}" onchange="db.projects[${i}].link=this.value.trim();save()">
  <div class="row">${safeUrl(p.link) ? `<a class="btn" href="${esc(p.link)}" target="_blank" rel="noopener">Otvori</a>` : ''}<button class="btn r" onclick="delProj(${i})">🗑️</button></div></div>`).join('')}
  <button class="btn g full" onclick="db.projects.push({id:uid(),name:'Novi projekt',status:'Ideja',desc:'',notes:'',link:''});save();projects()">➕ Dodaj projekt</button>`;
}
function delProj(i) { if (!confirm('Obrisati projekt?')) return; db.projects.splice(i, 1); save(); projects(); }

/* PODACI + INTEGRACIJA */
async function data() {
  const media = await mAll();
  app.innerHTML = `<h2>💾 Podaci</h2>
  <div class="warn">Sve je spremljeno lokalno na ovom uređaju. Brisanje podataka preglednika briše i podatke aplikacije. Redovito radi JSON izvoz.</div>
  <div class="card"><b>Tekstualna baza</b><div class="muted">${db.templates.length} predložaka · ${db.postLog.length} objava · ${db.links.length} poveznica · ${db.projects.length} projekata</div>
  <b>Mediji (odvojeno)</b><div class="muted">${media.filter(m => m.kind === 'video').length} videa · ${media.filter(m => m.kind === 'photo').length} fotografija</div>
  <button class="btn full" onclick="exportJSON()">⬇️ JSON izvoz</button>
  <label>JSON uvoz (zamjenjuje tekstualnu bazu na ovom uređaju)</label><input type="file" id="jf" accept="application/json,.json">
  <button class="btn g full" onclick="importJSON()">⬆️ Uvezi JSON</button>
  <p class="muted">JSON sadrži samo tekst (predloške, evidenciju, poveznice, projekte). Video i fotografije prenose se zasebno, preuzimanjem datoteka.</p></div>
  <div class="card"><h3>🔌 Priprema integracije s DATA CORE</h3>
  <p class="muted">Status: <b>nije spojeno</b>. Ovdje nema AI asistenta ni zajedničke memorije. Kasnije se spaja preko sigurnog Cloudflare Worker API-ja; ključevi ostaju na Workeru, nikad u aplikaciji.</p>
  <label>Adresa Workera (budućnost, samo javni URL)</label><input id="wu" value="${esc(db.integration.workerUrl)}" placeholder="https://...workers.dev">
  <label>Bilješka</label><input id="wn" value="${esc(db.integration.note)}">
  <button class="btn o full" onclick="db.integration={workerUrl:$('#wu').value.trim(),note:$('#wn').value.trim()};save();toast('Spremljeno')">💾 Spremi</button></div>`;
}
function exportJSON() {
  const blob = new Blob([JSON.stringify({ app: 'EKORUSTIKA DATA HUB', exported: new Date().toISOString(), data: db }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ekorustika-datahub-' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
}
async function importJSON() {
  const f = $('#jf').files[0]; if (!f) return toast('Odaberi JSON');
  try { const j = JSON.parse(await f.text()); const d = j.data || j; if (!Array.isArray(d.templates) || !Array.isArray(d.projects)) throw 'Neispravna datoteka';
    if (!confirm('Zamijeniti tekstualnu bazu na ovom uređaju?')) return; db = Object.assign(structuredClone(DEFAULT), d); save(); toast('Uvezeno'); data(); }
  catch (e) { alert('Uvoz nije uspio: ' + e); }
}

/* INSTALACIJA */
function install() {
  app.innerHTML = `<h2>📲 Instalacija na Android</h2>
  <div class="card">${deferred ? '<button class="btn full" onclick="deferred.prompt()">📲 Instaliraj sada</button>' : ''}
  <ol><li>Otvori aplikaciju u <b>Chromeu</b> ili <b>Samsung Internetu</b>.</li><li>Dodirni izbornik ⋮ (ili ☰).</li><li>Odaberi <b>Instaliraj aplikaciju</b> / <b>Dodaj na početni zaslon</b>.</li><li>Ikona EKORUSTIKA DATA HUB pojavit će se na početnom zaslonu.</li></ol>
  <p class="muted">iPhone: Safari → Dijeli → Dodaj na početni zaslon. Osnovni zaslon radi i bez interneta; vanjske poveznice trebaju internet.</p></div>`;
}
let deferred = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });

const VIEWS = { home, promo, posts, gallery, links, projects, data, install };
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
render();
