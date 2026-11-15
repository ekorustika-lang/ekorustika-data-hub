'use strict';
/* EKORUSTIKA DATA HUB 1.0 — MVP. Tekst: localStorage. Mediji: IndexedDB (odvojeno). Bez tajni i naplate. */
const KEY = 'ekorustika-datahub-v1';
const VIDEO_CATS = ['Montaže', 'Digitalni alati', 'EKORUSTIKA GROUP', 'Ostalo'];
const GAL_CATS = ['SPC', 'MDF / akustika', 'TV zidovi', 'WPC', 'Ostali radovi'];
const PLATFORMS = ['Facebook', 'LinkedIn', 'Facebook grupe', 'WhatsApp'];
const BRANDS = ['EKORUSTIKA MONTAŽE', 'EKORUSTIKA DIGITALNI ALATI', 'EKORUSTIKA GROUP', 'Ostale poslovne ponude'];
const LINK_TYPES = ['Web stranica', 'Aplikacija', 'Društveni profil', 'Ostalo'];
const SEEDS = [
  { name: 'Montaže – zidne obloge (NACRT)', brand: BRANDS[0], platform: 'Facebook', text: 'Montaža zidnih obloga: SPC, MDF i akustični paneli, TV zidovi.\nPogledajte naše izvedene radove i javite se za upit.\n\n[NACRT – provjeri i dopuni prije objave]', links: 'https://ekorustika-lang.github.io/ekorustika-montaze-test/' },
  { name: 'Digitalni alati – AI asistenti (NACRT)', brand: BRANDS[1], platform: 'LinkedIn', text: 'EKORUSTIKA DIGITALNI ALATI: AI asistenti, digitalni alati i personalizirane igre.\n\n[NACRT – provjeri i dopuni prije objave]', links: 'https://ekorustika-lang.github.io/ekorustika-digital-test/' },
  { name: 'EKORUSTIKA GROUP – predstavljanje (NACRT)', brand: BRANDS[2], platform: 'Facebook', text: 'EKORUSTIKA GROUP: montaže i digitalni alati na jednom mjestu.\n\n[NACRT – provjeri i dopuni prije objave]', links: 'https://ekorustika-lang.github.io/ekorustika-montaze-test/\nhttps://ekorustika-lang.github.io/ekorustika-digital-test/' },
  { name: 'Ostala ponuda (NACRT)', brand: BRANDS[3], platform: 'WhatsApp', text: '[NACRT – upiši ponudu]', links: '' }
];
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
function setSaved(ok, msg) { const e = document.getElementById('sv'); if (!e) return; e.className = ok ? 'ok' : 'bad'; e.textContent = ok ? '✅ Spremljeno lokalno ' + new Date().toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' }) : '❌ ' + (msg || 'Spremanje nije uspjelo'); }
function save() { try { const s = JSON.stringify(db); localStorage.setItem(KEY, s); const ok = localStorage.getItem(KEY) === s; setSaved(ok); if (!ok) alert('Spremanje nije uspjelo.'); return ok; } catch (e) { setSaved(false); alert('Spremanje nije uspjelo: ' + e); return false; } }
/* Migracija 1.0 -> 1.1: ništa se ne briše, samo se dodaju polja */
function migrate() {
  db.templates.forEach(t => { t.brand ??= ''; t.links ??= ''; t.mediaIds ??= []; });
  db.links.forEach(l => { l.type ??= /obloga|montaze|digital/.test(l.url) ? 'Web stranica' : 'Ostalo'; });
  const add = (name, url, type) => { if (!db.links.some(l => l.url === url)) db.links.push({ id: uid(), name, url, type }); };
  add('EKORUSTIKA DATA HUB', 'https://ekorustika-lang.github.io/ekorustika-data-hub/', 'Aplikacija');
  add('DataVision v3.0', 'https://ekorustika-lang.github.io/datavision-test/', 'Aplikacija');
  if (!db.seeded11) { db.seeded11 = true; SEEDS.forEach(x => db.templates.push({ id: uid(), mediaIds: [], updated: Date.now(), ...x })); }
  db.version = 2;
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = s => document.querySelector(s);
const app = $('#app');
function toast(t) { const x = $('#toast'); x.textContent = t; x.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => x.style.display = 'none', 2200); }
migrate(); save();
const fmt = d => new Date(d).toLocaleString('hr-HR');
const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '';

/* IndexedDB */
let idb;
function openIDB() { return new Promise((res, rej) => { if (idb) return res(idb); const r = indexedDB.open('ekorustika-datahub-media', 1); r.onupgradeneeded = () => r.result.createObjectStore('media', { keyPath: 'id' }); r.onsuccess = () => { idb = r.result; res(idb); }; r.onerror = () => rej(r.error); }); }
async function mPut(o) { const d = await openIDB(); return new Promise((res, rej) => { const t = d.transaction('media', 'readwrite'); t.objectStore('media').put(o); t.oncomplete = res; t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || 'prekinuto'); }).then(() => mGet(o.id)).then(x => { if (!x) throw 'provjera nije uspjela'; setSaved(true); }).catch(e => { setSaved(false, 'Medij nije spremljen'); throw e; }); }
async function mGet(id) { const d = await openIDB(); return new Promise((res, rej) => { const r = d.transaction('media').objectStore('media').get(id); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
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
    <button class="tile g" onclick="go('posts')"><span>📝</span>Objave<em>Biblioteka i evidencija</em></button>
    <button class="tile b" onclick="go('gallery')"><span>🖼️</span>Galerija<em>SPC · MDF · TV · WPC</em></button>
    <button class="tile g" onclick="go('links')"><span>🔗</span>Poveznice<em>Web, aplikacije, profili</em></button>
    <button class="tile b" onclick="go('projects')"><span>📂</span>Projekti<em>Statusi i bilješke</em></button>
    <button class="tile g" onclick="go('data')"><span>💾</span>Podaci<em>Sigurnosna kopija</em></button>
  </div>
  ${!db.lastBackup || Date.now() - db.lastBackup > 7 * 864e5 ? `<div class="warn" style="margin-top:12px">🛟 ${db.lastBackup ? 'Zadnja potpuna kopija: ' + fmt(db.lastBackup) : 'Još nema potpune sigurnosne kopije'}. <a href="#data">Napravi je</a>.</div>` : ''}
  <button class="btn o full" onclick="go('install')">📲 Kako instalirati aplikaciju</button>
  <p class="muted" style="text-align:center;margin-top:18px">Izradio EKORUSTIKA DIGITAL</p>`;
}

/* PROMO CENTAR */
async function promo() {
  app.innerHTML = `<h2>🎬 Promo centar</h2>
  <div class="card"><label>Dodaj video s mobitela ili računala (npr. završni promo EKORUSTIKA GROUP)</label>
  <input type="file" id="vf" accept="video/mp4,video/*" multiple>
  <label>Naziv (neobavezno, inače naziv datoteke)</label><input id="vt" placeholder="npr. EKORUSTIKA GROUP – završni promo">
  <label>Kategorija</label><select id="vc">${VIDEO_CATS.map(c => `<option ${c === 'EKORUSTIKA GROUP' ? 'selected' : ''}>${c}</option>`).join('')}</select>
  <label>Opis</label><textarea id="vd" style="min-height:70px"></textarea>
  <label><input type="checkbox" id="vfeat" style="width:auto"> ⭐ Označi kao glavni / završni promo</label>
  <button class="btn full" onclick="addVideos()">➕ Spremi video</button>
  <p class="muted">Video se sprema samo na ovom uređaju (IndexedDB), ne u oblak.</p></div>
  <div class="chips" id="vchips"></div><div id="vlist"><p class="muted">Učitavanje…</p></div>`;
  const all = (await mAll()).filter(m => m.kind === 'video').sort((a, b) => (b.featured | 0) - (a.featured | 0) || b.created - a.created);
  const f = promo.filter || 'Sve';
  $('#vchips').innerHTML = ['Sve', ...VIDEO_CATS].map(c => `<button class="chip ${c === f ? 'on' : ''}" onclick="promo.filter='${c}';promo()">${c}</button>`).join('');
  const list = all.filter(v => f === 'Sve' || v.category === f);
  $('#vlist').innerHTML = list.length ? list.map(v => { const pub = safeUrl(v.publicUrl); return `<div class="card" ${v.featured ? 'style="border-color:#00d4ff"' : ''}>
    ${v.featured ? '<div class="tag" style="position:static;display:inline-block;margin-bottom:6px">⭐ GLAVNI PROMO</div>' : ''}
    <video controls playsinline preload="metadata" src="${objUrl(v.blob)}"></video>
    <div class="muted">${esc(v.name)} · ${(v.blob.size / 1048576).toFixed(1)} MB · dodano ${fmt(v.created)}</div>
    <label>Naziv</label><input id="t_${v.id}" value="${esc(v.title || v.name)}">
    <label>Datum</label><input type="date" id="d_${v.id}" value="${esc(v.date || new Date(v.created).toISOString().slice(0, 10))}">
    <label>Opis</label><textarea id="o_${v.id}" style="min-height:70px">${esc(v.desc)}</textarea>
    <label>Kategorija</label><select id="c_${v.id}">${VIDEO_CATS.map(c => `<option ${c === v.category ? 'selected' : ''}>${c}</option>`).join('')}</select>
    <label>Javna poveznica videa (neobavezno, npr. YouTube ili Facebook) – za dijeljenje poveznicom</label><input id="u_${v.id}" value="${esc(v.publicUrl)}" placeholder="https://...">
    <label><input type="checkbox" id="f_${v.id}" style="width:auto" ${v.featured ? 'checked' : ''}> ⭐ Glavni / završni promo</label>
    <button class="btn g full" onclick="saveVideo('${v.id}')">💾 Spremi izmjene</button>
    <div class="row"><button class="btn" onclick="shareMedia('${v.id}')">📤 Podijeli video</button>
    <a class="btn g" href="https://wa.me/?text=${encodeURIComponent((v.title || v.name) + (v.desc ? '\n' + v.desc : '') + (pub ? '\n' + pub : ''))}" target="_blank" rel="noopener">WhatsApp</a>
    ${pub ? `<a class="btn o" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pub)}" target="_blank" rel="noopener">Facebook</a><a class="btn o" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pub)}" target="_blank" rel="noopener">LinkedIn</a>` : ''}
    <button class="btn o" onclick="downloadMedia('${v.id}')">⬇️ Preuzmi</button><button class="btn r" onclick="delMedia('${v.id}','promo')">🗑️</button></div>
    <p class="muted">„Podijeli video” šalje datoteku preko izbornika mobitela (Facebook, LinkedIn, WhatsApp…). Facebook i LinkedIn gumbi pojavljuju se kad upišeš javnu poveznicu.</p></div>`; }).join('')
    : '<p class="muted">Još nema videa. Dodaj prvu reklamu gore.</p>';
}
async function addVideos() {
  const files = [...$('#vf').files]; if (!files.length) return toast('Odaberi video');
  const feat = $('#vfeat').checked;
  try { if (feat) await clearFeatured();
    for (const f of files) await mPut({ id: uid(), kind: 'video', name: f.name, title: files.length === 1 && $('#vt').value.trim() || f.name.replace(/\.[^.]+$/, ''), desc: $('#vd').value, date: new Date().toISOString().slice(0, 10), publicUrl: '', featured: feat, type: f.type || 'video/mp4', category: $('#vc').value, blob: f, created: Date.now() });
    toast('✅ Spremljeno: ' + files.length); }
  catch (e) { alert('❌ Spremanje nije uspjelo (moguće premalo prostora): ' + e); }
  promo();
}
async function clearFeatured() { for (const m of (await mAll()).filter(m => m.kind === 'video' && m.featured)) { m.featured = false; await mPut(m); } }
async function saveVideo(id) {
  try { const feat = $('#f_' + id).checked; if (feat) await clearFeatured();
    const m = await mGet(id); Object.assign(m, { title: $('#t_' + id).value.trim(), date: $('#d_' + id).value, desc: $('#o_' + id).value, category: $('#c_' + id).value, publicUrl: $('#u_' + id).value.trim(), featured: feat });
    await mPut(m); toast('✅ Izmjene spremljene'); promo(); }
  catch (e) { alert('❌ Spremanje nije uspjelo: ' + e); }
}
async function getMedia(id) { return mGet(id); }
async function setMedia(id, k, v) { const m = await getMedia(id); m[k] = v; await mPut(m); toast('Spremljeno'); if (k === 'tag') gallery(); }
async function delMedia(id, back) { if (!confirm('Obrisati s ovog uređaja?')) return; await mDel(id); VIEWS[back](); }
async function downloadMedia(id) { const m = await getMedia(id); const a = document.createElement('a'); a.href = objUrl(m.blob); a.download = m.name; a.click(); }
async function shareMedia(id) {
  const m = await getMedia(id); const file = new File([m.blob], m.name, { type: m.type || m.blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: m.title || m.name }); } catch (e) { } }
  else { toast('Dijeljenje nije podržano — preuzimam'); downloadMedia(id); }
}

/* OBJAVE – biblioteka */
async function posts() {
  const ed = posts.edit ? db.templates.find(t => t.id === posts.edit) : null;
  if (posts.sel === undefined || posts.selFor !== posts.edit) { posts.sel = new Set(ed?.mediaIds || []); posts.selFor = posts.edit; }
  const media = await mAll(); const byId = Object.fromEntries(media.map(m => [m.id, m]));
  const bf = posts.brand || 'Sve';
  const list = db.templates.filter(t => bf === 'Sve' || t.brand === bf);
  const thumb = (m, small) => m.kind === 'video' ? `<video src="${objUrl(m.blob)}" preload="metadata" muted playsinline style="width:${small ? 70 : 110}px;height:${small ? 70 : 110}px;object-fit:cover;border-radius:8px"></video>` : `<img src="${objUrl(m.blob)}" alt="" style="width:${small ? 70 : 110}px;height:${small ? 70 : 110}px;object-fit:cover;border-radius:8px">`;
  app.innerHTML = `<h2>📝 Objave</h2>
  <div class="warn">Aplikacija ne objavljuje automatski. Kopiraj ili podijeli objavu, objavi ručno, zatim je upiši u evidenciju.</div>
  <div class="chips">${['Sve', ...BRANDS].map(c => `<button class="chip ${c === bf ? 'on' : ''}" onclick="posts.brand='${c}';posts()">${c}</button>`).join('')}</div>
  <h3>Biblioteka objava (${list.length})</h3>
  ${list.map(t => { const ms = (t.mediaIds || []).map(i => byId[i]).filter(Boolean); const ls = (t.links || '').split('\n').map(x => x.trim()).filter(safeUrl); return `<div class="card"><b>${esc(t.name || 'Bez naziva')}</b> <span class="status">${esc(t.brand || 'Bez kategorije')}</span> <span class="status">${esc(t.platform)}</span>
   <p style="white-space:pre-wrap">${esc(t.text)}</p>
   ${ms.length ? `<div class="row" style="gap:6px">${ms.map(m => thumb(m)).join('')}</div>` : ''}
   ${ls.map(l => `<div><a href="${esc(l)}" target="_blank" rel="noopener">${esc(l)}</a></div>`).join('')}
   ${(t.mediaIds || []).length > ms.length ? '<div class="muted">⚠️ Neki mediji više nisu na ovom uređaju.</div>' : ''}
   <button class="btn full" onclick="copyTpl('${t.id}')">📋 KOPIRAJ OBJAVU</button>
   <div class="row"><button class="btn g" onclick="shareTpl('${t.id}')">📤 Podijeli${ms.length ? ' s medijima' : ''}</button>
   <a class="btn o" href="https://wa.me/?text=${encodeURIComponent(postText(t))}" target="_blank" rel="noopener">WhatsApp</a>
   <button class="btn o" onclick="posts.edit='${t.id}';posts()">✏️</button><button class="btn o" onclick="logFrom('${t.id}')">➕ U evidenciju</button><button class="btn r" onclick="delTpl('${t.id}')">🗑️</button></div></div>`; }).join('') || '<p class="muted">Nema objava u ovoj kategoriji.</p>'}
  <div class="card" id="editor"><h3>${ed ? 'Uredi objavu' : 'Nova objava'}</h3>
  <label>Naziv</label><input id="tn" value="${esc(ed?.name)}">
  <label>Kategorija</label><select id="tb">${BRANDS.map(p => `<option ${(ed ? ed.brand : bf) === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
  <label>Platforma</label><select id="tp">${PLATFORMS.map(p => `<option ${ed?.platform === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
  <label>Tekst objave</label><textarea id="tt">${esc(ed?.text)}</textarea>
  <label>Poveznice (jedna po retku)</label><textarea id="tl" style="min-height:70px">${esc(ed?.links)}</textarea>
  <label>Fotografije / video iz Promo centra i Galerije (dodirni za odabir)</label>
  <div class="row" style="gap:6px;max-height:240px;overflow:auto">${media.map(m => `<div onclick="togSel('${m.id}',this)" style="border:2px solid ${posts.sel.has(m.id) ? 'var(--g)' : 'transparent'};border-radius:10px;padding:2px;cursor:pointer">${thumb(m, true)}</div>`).join('') || '<span class="muted">Još nema medija.</span>'}</div>
  <label>…ili dodaj nove fotografije / video s uređaja</label><input type="file" id="tf" accept="image/*,video/*" multiple>
  <button class="btn g full" onclick="saveTpl()">💾 Spremi objavu</button>${ed ? '<button class="btn o full" onclick="posts.edit=null;posts()">Odustani</button>' : ''}</div>
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
  if (ed) $('#editor').scrollIntoView();
}
function togSel(id, el) { posts.sel.has(id) ? posts.sel.delete(id) : posts.sel.add(id); el.style.borderColor = posts.sel.has(id) ? 'var(--g)' : 'transparent'; }
async function saveTpl() {
  const o = { name: $('#tn').value.trim(), brand: $('#tb').value, platform: $('#tp').value, text: $('#tt').value, links: $('#tl').value.trim(), updated: Date.now() };
  if (!o.text.trim()) return toast('Upiši tekst');
  try { for (const f of [...$('#tf').files]) { const id = uid(); const isV = f.type.startsWith('video');
      await mPut(isV ? { id, kind: 'video', name: f.name, title: f.name.replace(/\.[^.]+$/, ''), desc: '', date: new Date().toISOString().slice(0, 10), publicUrl: '', featured: false, type: f.type, category: 'Ostalo', blob: f, created: Date.now() }
        : { id, kind: 'photo', name: f.name, type: f.type, category: 'Ostali radovi', project: 'Za objave', tag: '', blob: await shrink(f), created: Date.now() });
      posts.sel.add(id); } }
  catch (e) { return alert('❌ Mediji nisu spremljeni: ' + e); }
  o.mediaIds = [...posts.sel];
  if (posts.edit) Object.assign(db.templates.find(t => t.id === posts.edit), o); else db.templates.unshift({ id: uid(), ...o });
  posts.edit = null; posts.sel = undefined; if (save()) toast('✅ Objava spremljena'); posts();
}
function postText(t) { return [t.text, ...(t.links || '').split('\n').map(x => x.trim()).filter(Boolean)].join('\n\n').trim(); }
async function copyText(t) { try { await navigator.clipboard.writeText(t); toast('📋 Kopirano'); } catch (e) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); toast('📋 Kopirano'); } }
function copyTpl(id) { copyText(postText(db.templates.find(t => t.id === id))); }
async function shareTpl(id) {
  const t = db.templates.find(x => x.id === id); const text = postText(t);
  const files = []; for (const mid of t.mediaIds || []) { const m = await mGet(mid); if (m) files.push(new File([m.blob], m.name, { type: m.type || m.blob.type })); }
  try { if (files.length && navigator.canShare && navigator.canShare({ files })) { await copyText(text); await navigator.share({ files, text }); toast('Tekst je i kopiran – zalijepi ga ako ga aplikacija ne preuzme'); }
    else if (navigator.share) await navigator.share({ text }); else copyText(text); } catch (e) { }
}
function delTpl(id) { if (!confirm('Obrisati objavu? (mediji ostaju u Promo centru/Galeriji)')) return; db.templates = db.templates.filter(t => t.id !== id); save(); posts(); }
function logFrom(id) { const t = db.templates.find(x => x.id === id); $('#lp').value = t.platform; $('#lnote').value = t.name; $('#ll').scrollIntoView(); $('#ll').focus(); }
function addLog() { db.postLog.push({ id: uid(), platform: $('#lp').value, where: $('#lw').value.trim(), date: $('#ld').value, link: $('#ll').value.trim(), note: $('#lnote').value.trim() }); if (save()) toast('✅ Upisano'); posts(); }
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
  app.innerHTML = `<h2>🔗 Poveznice</h2><p class="muted">Web stranice, aplikacije i društveni profili. Promjene se spremaju čim izađeš iz polja.</p>
  ${LINK_TYPES.map(ty => { const ls = db.links.map((l, i) => [l, i]).filter(([l]) => (l.type || 'Ostalo') === ty); return ls.length ? `<h3>${ty} (${ls.length})</h3>` + ls.map(([l, i]) => `<div class="card"><label>Naziv</label><input value="${esc(l.name)}" onchange="db.links[${i}].name=this.value;save()">
  <label>Adresa</label><input value="${esc(l.url)}" onchange="db.links[${i}].url=this.value.trim();save();links()">
  <label>Vrsta</label><select onchange="db.links[${i}].type=this.value;save();links()">${LINK_TYPES.map(t => `<option ${t === ty ? 'selected' : ''}>${t}</option>`).join('')}</select>
  <div class="row">${safeUrl(l.url) ? `<a class="btn ${i % 2 ? 'g' : ''}" href="${esc(l.url)}" target="_blank" rel="noopener">Otvori</a>` : '<span class="muted">Adresa mora početi s https://</span>'}<button class="btn o" onclick="copyText(db.links[${i}].url)">📋 Kopiraj</button><button class="btn r" onclick="delLink(${i})">🗑️</button></div></div>`).join('') : ''; }).join('')}
  <div class="card"><h3>➕ Nova poveznica</h3><label>Naziv</label><input id="nn" placeholder="npr. Facebook stranica">
  <label>Adresa</label><input id="nu" placeholder="https://..."><label>Vrsta</label><select id="nt">${LINK_TYPES.map(t => `<option>${t}</option>`).join('')}</select>
  <button class="btn full" onclick="addLink()">➕ Dodaj poveznicu</button></div>`;
}
function addLink() { const url = $('#nu').value.trim(); if (!safeUrl(url)) return toast('Adresa mora početi s https://'); db.links.push({ id: uid(), name: $('#nn').value.trim() || url, url, type: $('#nt').value }); if (save()) toast('✅ Poveznica spremljena'); links(); }
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

/* PODACI + SIGURNOSNA KOPIJA + INTEGRACIJA */
async function data() {
  const media = await mAll(); const size = media.reduce((s, m) => s + (m.blob?.size || 0), 0);
  let est = '', pers = '';
  try { if (navigator.storage?.estimate) { const e = await navigator.storage.estimate(); est = `Zauzeto ${(e.usage / 1048576).toFixed(0)} MB od dopuštenih ~${(e.quota / 1048576).toFixed(0)} MB.`; } } catch (e) { }
  try { if (navigator.storage?.persisted) pers = (await navigator.storage.persisted()) ? '🔒 Preglednik je odobrio trajnu pohranu.' : '⚠️ Preglednik još nije odobrio trajnu pohranu (instalirana aplikacija to obično dobije). Radi redovite kopije.'; } catch (e) { }
  app.innerHTML = `<h2>💾 Podaci i sigurnost</h2>
  <div class="warn">Sve je spremljeno <b>samo lokalno na ovom uređaju</b>, ne u oblaku. Uređaji nisu sinkronizirani. Brisanje podataka preglednika ili deinstalacija briše i podatke aplikacije.</div>
  <div class="card"><b>Tekst</b> (localStorage)<div class="muted">${db.templates.length} objava · ${db.postLog.length} zapisa u evidenciji · ${db.links.length} poveznica · ${db.projects.length} projekata</div>
  <b>Mediji</b> (IndexedDB, odvojeno)<div class="muted">${media.filter(m => m.kind === 'video').length} videa · ${media.filter(m => m.kind === 'photo').length} fotografija · ${(size / 1048576).toFixed(1)} MB</div>
  <div class="muted">${est}</div><div class="muted">${pers}</div></div>
  <div class="card"><h3>🛟 Potpuna sigurnosna kopija (tekst + videi + fotografije)</h3>
  <button class="btn full" onclick="exportFull()">⬇️ Izvezi potpunu kopiju (.ekhub)</button>
  <label>Uvoz potpune kopije</label><input type="file" id="ff">
  <button class="btn g full" onclick="importFull()">⬆️ Uvezi potpunu kopiju</button>
  <p class="muted">Uvoz zamjenjuje tekst na ovom uređaju, a medije dodaje (postojeći mediji se ne brišu). Datoteka može biti velika jer sadrži sve videe. Spremi je i izvan mobitela (npr. računalo ili Google Drive).</p>
  <div id="bkst" class="muted"></div></div>
  <div class="card"><h3>📄 Samo tekst (JSON)</h3>
  <button class="btn o full" onclick="exportJSON()">⬇️ JSON izvoz</button>
  <label>JSON uvoz (zamjenjuje tekst na ovom uređaju)</label><input type="file" id="jf" accept="application/json,.json">
  <button class="btn o full" onclick="importJSON()">⬆️ Uvezi JSON</button></div>
  <div class="card"><h3>🔌 Priprema integracije s DATA CORE</h3>
  <p class="muted">Status: <b>nije spojeno</b>. Aplikacija ne šalje nikakve podatke Workeru. Nema AI asistenta ni zajedničke memorije. Kasnije se spaja preko sigurnog Cloudflare Worker API-ja; ključevi ostaju na Workeru, nikad u aplikaciji.</p>
  <label>Adresa Workera (budućnost, samo javni URL)</label><input id="wu" value="${esc(db.integration.workerUrl)}" placeholder="https://...workers.dev">
  <label>Bilješka</label><input id="wn" value="${esc(db.integration.note)}">
  <button class="btn o full" onclick="db.integration={workerUrl:$('#wu').value.trim(),note:$('#wn').value.trim()};if(save())toast('✅ Spremljeno')">💾 Spremi</button></div>`;
}
function dl(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000); }
const stamp = () => new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
/* Format .ekhub: "EKHUB1\n" + 12 znamenki duljine zaglavlja + JSON zaglavlje + binarni mediji redom */
function buildBackup(dbObj, media) {
  const meta = media.map(m => { const { blob, ...r } = m; return { ...r, size: blob.size, btype: blob.type }; });
  const head = new TextEncoder().encode(JSON.stringify({ app: 'EKORUSTIKA DATA HUB', format: 1, exported: new Date().toISOString(), data: dbObj, media: meta }));
  return new Blob([new TextEncoder().encode('EKHUB1\n' + String(head.length).padStart(12, '0')), head, ...media.map(m => m.blob)], { type: 'application/octet-stream' });
}
async function parseBackup(file) {
  const magic = new TextDecoder().decode(await file.slice(0, 19).arrayBuffer());
  if (!magic.startsWith('EKHUB1\n')) throw 'Ovo nije DATA HUB sigurnosna kopija';
  const hl = parseInt(magic.slice(7), 10); const head = JSON.parse(new TextDecoder().decode(await file.slice(19, 19 + hl).arrayBuffer()));
  let off = 19 + hl; const media = head.media.map(m => { const { size, btype, ...r } = m; const blob = file.slice(off, off + size, btype || r.type); off += size; return { ...r, blob }; });
  if (off !== file.size) throw 'Datoteka je nepotpuna ili oštećena';
  return { data: head.data, media };
}
async function exportFull() {
  try { $('#bkst').textContent = 'Pripremam kopiju…'; const b = buildBackup(db, await mAll()); dl(b, 'ekorustika-datahub-kopija-' + stamp() + '.ekhub');
    db.lastBackup = Date.now(); save(); $('#bkst').textContent = `✅ Kopija pripremljena (${(b.size / 1048576).toFixed(1)} MB). Provjeri da je datoteka u mapi Preuzimanja.`; }
  catch (e) { $('#bkst').textContent = '❌ Izvoz nije uspio: ' + e; }
}
async function importFull() {
  const f = $('#ff').files[0]; if (!f) return toast('Odaberi .ekhub datoteku');
  try { const r = await parseBackup(f); if (!Array.isArray(r.data?.templates)) throw 'Neispravna datoteka';
    if (!confirm(`Uvesti kopiju? Tekst se zamjenjuje, a dodaje se ${r.media.length} medija.`)) return;
    $('#bkst').textContent = 'Uvozim…'; for (const m of r.media) await mPut(m);
    db = Object.assign(structuredClone(DEFAULT), r.data); migrate(); if (!save()) throw 'tekst nije spremljen';
    toast('✅ Kopija uvezena'); data(); }
  catch (e) { $('#bkst').textContent = '❌ Uvoz nije uspio: ' + e; }
}
function exportJSON() { dl(new Blob([JSON.stringify({ app: 'EKORUSTIKA DATA HUB', exported: new Date().toISOString(), data: db }, null, 2)], { type: 'application/json' }), 'ekorustika-datahub-' + new Date().toISOString().slice(0, 10) + '.json'); }
async function importJSON() {
  const f = $('#jf').files[0]; if (!f) return toast('Odaberi JSON');
  try { const j = JSON.parse(await f.text()); const d = j.data || j; if (!Array.isArray(d.templates) || !Array.isArray(d.projects)) throw 'Neispravna datoteka';
    if (!confirm('Zamijeniti tekst na ovom uređaju?')) return; db = Object.assign(structuredClone(DEFAULT), d); migrate(); if (save()) toast('✅ Uvezeno'); data(); }
  catch (e) { alert('Uvoz nije uspio: ' + e); }
}

/* INSTALACIJA */
function install() {
  app.innerHTML = `<h2>📲 Instalacija (Samsung / Android i računalo)</h2>
  <div class="card">${deferred ? '<button class="btn full" onclick="deferred.prompt()">📲 Instaliraj sada</button>' : ''}
  <ol><li>Otvori aplikaciju u <b>Chromeu</b> ili <b>Samsung Internetu</b>.</li><li>Dodirni izbornik ⋮ (ili ☰).</li><li>Odaberi <b>Instaliraj aplikaciju</b> / <b>Dodaj na početni zaslon</b>.</li><li>Ikona EKORUSTIKA DATA HUB pojavit će se na početnom zaslonu.</li></ol>
  <p class="muted">Računalo (Chrome / Edge): ikona ⊕ u adresnoj traci ili izbornik ⋮ → Instaliraj EKORUSTIKA DATA HUB. iPhone: Safari → Dijeli → Dodaj na početni zaslon. Osnovni zaslon radi i bez interneta; vanjske poveznice trebaju internet.</p></div>`;
}
let deferred = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });

const VIEWS = { home, promo, posts, gallery, links, projects, data, install };
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
setSaved(true);
render();
