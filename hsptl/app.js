/* app.js - doctor-optimized hospital panel
   Features:
   - Rooms and beds overview
   - Click bed -> modal quick edit
   - Auto-fill register date when creating
   - Live stay time update (every minute)
   - Discharge button (moves patient to history and clears bed)
   - Export/Import JSON and Clear All
   - Autosave to localStorage
*/

const STORAGE_KEY = 'hpms_v2_data';
const $ = id => document.getElementById(id);
const uid = () => (crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2,9);

let data = { rooms: [], history: [] }; // history stores discharged patients
let currentEditing = { roomId: null, bedId: null };

// --- Init / load
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) data = JSON.parse(raw);
  } catch (e) { console.error('Failed to load data', e); }
  if (!Array.isArray(data.rooms)) data.rooms = [];
  if (!Array.isArray(data.history)) data.history = [];
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  renderRooms();
}

// --- Render rooms & beds
function renderRooms() {
  const container = $('roomsContainer');
  container.innerHTML = '';
  data.rooms.forEach(room => {
    const rEl = document.createElement('div');
    rEl.className = 'room';

    const head = document.createElement('div'); head.className = 'room-head';
    head.innerHTML = `<div class="room-title">${escapeHtml(room.name)}</div>
                      <div class="room-count muted">${room.beds.length} beds</div>`;
    rEl.appendChild(head);

    const bedsEl = document.createElement('div'); bedsEl.className = 'beds';
    room.beds.forEach(bed => {
      const bedEl = document.createElement('div'); bedEl.className = 'bed';
      const left = document.createElement('div'); left.className = 'left';
      const title = document.createElement('div'); title.className = 'title';
      title.textContent = bed.label;
      left.appendChild(title);

      const meta = document.createElement('div'); meta.className = 'meta';
      if (bed.patient) {
        const stay = stayString(bed.patient.registerDate, bed.patient.leavingDate);
        meta.innerHTML = `<strong>${escapeHtml(bed.patient.name)}</strong> • ${stay}`;
      } else {
        meta.textContent = 'empty';
      }
      left.appendChild(meta);

      const right = document.createElement('div');
      right.innerHTML = `<button class="btn ghost">Edit</button>`;
      if (bed.patient) {
        // quick visual: add small discharge button inline (optional)
        const d = document.createElement('button'); d.className='btn ghost'; d.textContent='Discharge';
        d.onclick = (ev)=>{ ev.stopPropagation(); dischargeBed(room.id, bed.id); };
        right.appendChild(d);
      }

      bedEl.appendChild(left);
      bedEl.appendChild(right);

      // click opens modal for edit/create
      bedEl.onclick = () => openModalForBed(room.id, bed.id);

      bedsEl.appendChild(bedEl);
    });

    const roomActions = document.createElement('div');
    roomActions.className = 'room-actions';
    const addBedBtn = document.createElement('button'); addBedBtn.className='btn ghost'; addBedBtn.textContent = '+ Bed';
    addBedBtn.onclick = ()=> { addBed(room.id); };
    const renameBtn = document.createElement('button'); renameBtn.className='btn ghost'; renameBtn.textContent='Rename';
    renameBtn.onclick = ()=> { renameRoom(room.id); };
    const delBtn = document.createElement('button'); delBtn.className='btn ghost'; delBtn.textContent='Delete Room';
    delBtn.onclick = ()=> { deleteRoom(room.id); };

    roomActions.appendChild(addBedBtn);
    roomActions.appendChild(renameBtn);
    roomActions.appendChild(delBtn);

    rEl.appendChild(bedsEl);
    rEl.appendChild(roomActions);

    container.appendChild(rEl);
  });

  // If no rooms exist, show a helpful start state
  if (data.rooms.length === 0) {
    const hint = document.createElement('div'); hint.className='room muted';
    hint.style.padding='16px'; hint.textContent = 'No rooms yet. Click "+ Add Room" to start.';
    container.appendChild(hint);
  }

  populateFormRoomSelect();
}

// --- Helpers
function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

function stayString(regISO, leaveISO){
  if(!regISO) return '';
  const start = new Date(regISO);
  const end = leaveISO ? new Date(leaveISO) : new Date();
  const diff = end - start;
  if (diff < 0) return 'invalid';
  const days = Math.floor(diff / (1000*60*60*24));
  const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
  const mins = Math.floor((diff % (1000*60*60)) / (1000*60));
  return `${days}d ${hours}h ${mins}m`;
}

// --- Rooms / beds operations
function addRoom() {
  const name = prompt('Room name (e.g. A - General)') || `Room ${data.rooms.length+1}`;
  const room = { id: uid(), name, beds: [] };
  // start with 2 beds for convenience
  room.beds.push({ id: uid(), label: 'Bed 1', patient: null });
  room.beds.push({ id: uid(), label: 'Bed 2', patient: null });
  data.rooms.push(room);
  save();
}

function renameRoom(roomId){
  const room = data.rooms.find(r=>r.id===roomId);
  if(!room) return;
  const name = prompt('New room name', room.name);
  if(name) { room.name = name; save(); }
}

function deleteRoom(roomId){
  if (!confirm('Delete room and all its beds?')) return;
  data.rooms = data.rooms.filter(r=>r.id!==roomId);
  save();
}

function addBed(roomId){
  const room = data.rooms.find(r=>r.id===roomId);
  if(!room) return;
  const label = `Bed ${room.beds.length+1}`;
  room.beds.push({ id: uid(), label, patient: null });
  save();
}

function removeBed(roomId, bedId){
  const room = data.rooms.find(r=>r.id===roomId);
  if(!room) return;
  room.beds = room.beds.filter(b=>b.id!==bedId);
  save();
}

// --- Modal & patient editing
const modal = $('modal');
const form = $('patientForm');

function openModalForBed(roomId, bedId){
  currentEditing = { roomId, bedId };
  // fill selects and fields
  populateFormRoomSelect();
  $('formRoom').value = roomId;
  populateFormBedSelect();
  $('formBed').value = bedId;

  // load patient if exists
  const bed = findBed(roomId, bedId);
  if (bed && bed.patient) {
    $('modalTitle').textContent = `Edit — ${bed.patient.name}`;
    $('formName').value = bed.patient.name || '';
    $('formAge').value = bed.patient.age || '';
    $('formGender').value = bed.patient.gender || '';
    $('formDiagnosis').value = bed.patient.diagnosis || '';
    $('formMeds').value = (bed.patient.medications || []).join(', ');
    $('formNotes').value = bed.patient.notes || '';
    $('formRegister').value = bed.patient.registerDate || '';
    $('formLeave').value = bed.patient.leavingDate || '';
  } else {
    $('modalTitle').textContent = 'New patient';
    form.reset();
    // auto-set register to now in local datetime-local format
    $('formRegister').value = localDatetimeLocal(new Date());
    $('formLeave').value = '';
  }

  modal.classList.remove('hidden');
  setTimeout(()=> $('formName').focus(),80);
}

function closeModal(){ modal.classList.add('hidden'); currentEditing = { roomId:null, bedId:null }; }

function findBed(roomId, bedId){
  const room = data.rooms.find(r=>r.id===roomId);
  if(!room) return null;
  return room.beds.find(b=>b.id===bedId) || null;
}

// populate selects for form
function populateFormRoomSelect(){
  const sel = $('formRoom'); if(!sel) return;
  sel.innerHTML = '';
  data.rooms.forEach(r => {
    const o = document.createElement('option'); o.value = r.id; o.textContent = r.name;
    sel.appendChild(o);
  });
}

function populateFormBedSelect(){
  const sel = $('formBed'); sel.innerHTML = '';
  const roomId = $('formRoom').value;
  const room = data.rooms.find(r=>r.id===roomId);
  if(!room) return;
  room.beds.forEach(b => {
    const o = document.createElement('option'); o.value = b.id; o.textContent = b.label + (b.patient ? ` — ${b.patient.name}` : '');
    sel.appendChild(o);
  });
}

// form submit: save patient into selected bed
form.onsubmit = (e) => {
  e.preventDefault();
  const roomId = $('formRoom').value;
  const bedId = $('formBed').value;
  if(!roomId || !bedId) { alert('Choose room and bed'); return; }
  const room = data.rooms.find(r=>r.id===roomId);
  const bed = room.beds.find(b=>b.id===bedId);
  const patient = {
    id: bed.patient && bed.patient.id ? bed.patient.id : uid(),
    name: $('formName').value.trim(),
    age: $('formAge').value ? Number($('formAge').value) : null,
    gender: $('formGender').value || null,
    diagnosis: $('formDiagnosis').value.trim(),
    medications: $('formMeds').value.split(',').map(s=>s.trim()).filter(Boolean),
    notes: $('formNotes').value.trim(),
    registerDate: $('formRegister').value || localDatetimeLocal(new Date()),
    leavingDate: $('formLeave').value || null,
    lastUpdated: new Date().toISOString()
  };
  bed.patient = patient;
  save();
  closeModal();
};

// reset form button
$('resetForm').onclick = ()=> {
  const bed = findBed(currentEditing.roomId, currentEditing.bedId);
  if (bed && bed.patient) {
    // reload existing
    openModalForBed(currentEditing.roomId, currentEditing.bedId);
  } else {
    form.reset();
    $('formRegister').value = localDatetimeLocal(new Date());
  }
};

// discharge button: confirm, store to history, clear bed
$('dischargeBtn').onclick = ()=> {
  if (!confirm('Discharge patient and clear bed (keeps record in history)?')) return;
  const roomId = $('formRoom').value;
  const bedId = $('formBed').value;
  const bed = findBed(roomId, bedId);
  if (!bed || !bed.patient) { alert('No patient in this bed'); return; }
  const discharged = Object.assign({}, bed.patient);
  // if leaving not set, set to now
  if(!discharged.leavingDate) discharged.leavingDate = new Date().toISOString();
  discharged.dischargedAt = new Date().toISOString();
  data.history = data.history || [];
  data.history.push(discharged);
  // clear bed
  bed.patient = null;
  save();
  closeModal();
};

// quick discharge from inline button
function dischargeBed(roomId, bedId){
  if (!confirm('Discharge patient and clear bed (keeps record in history)?')) return;
  const bed = findBed(roomId, bedId);
  if(!bed || !bed.patient) return;
  const discharged = Object.assign({}, bed.patient);
  if(!discharged.leavingDate) discharged.leavingDate = new Date().toISOString();
  discharged.dischargedAt = new Date().toISOString();
  data.history = data.history || [];
  data.history.push(discharged);
  bed.patient = null;
  save();
}

// helper: produce datetime-local string from Date
function localDatetimeLocal(date){
  // returns YYYY-MM-DDTHH:MM (no seconds) which fits input[type=datetime-local]
  const pad = n => n.toString().padStart(2,'0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// --- Export / Import / Clear
$('exportBtn').onclick = ()=> {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `hospital_export_${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(url);
};

$('importFile').onchange = (e)=> {
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=> {
    try {
      const imported = JSON.parse(r.result);
      if(!imported || !Array.isArray(imported.rooms)) {
        alert('Invalid file format');
        return;
      }
      if(confirm('Import will replace current data. Continue?')) {
        data = imported;
        if(!data.history) data.history = [];
        save();
        renderRooms();
      }
    } catch(err){ alert('Invalid JSON'); }
  };
  r.readAsText(f); e.target.value='';
};

$('clearAllBtn').onclick = ()=> {
  if (!confirm('Clear ALL data including history?')) return;
  data = { rooms: [], history: [] };
  save();
};

// attach addRoom button
$('addRoomBtn').onclick = addRoom;

// close modal events
$('closeModal').onclick = closeModal;
modal.onclick = (e)=> { if(e.target === modal) closeModal(); };

// keep selects synchronized
$('formRoom').onchange = ()=> { populateFormBedSelect(); };

// live update every 30 seconds (fast but light)
setInterval(()=> {
  // re-render stay times while modal remains as-is
  renderRooms();
  // if modal open update selected bed info (no need to change form inputs)
}, 30*1000);

// initial load + seed
load();
if(data.rooms.length === 0){
  data.rooms.push({ id: uid(), name: 'A - General', beds: [{ id: uid(), label: 'Bed 1', patient: null }, { id: uid(), label: 'Bed 2', patient: null }]});
  data.rooms.push({ id: uid(), name: 'B - ICU', beds: [{ id: uid(), label: 'Bed 1', patient: null }]});
  save();
}
renderRooms();