// ====== CONFIG ======
const API = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// ====== STATE ======
let currentUser = null;
let token = null;
let socket = null;
let currentFilter = 'all';
let currentRoomId = null;
let searchTimer = null;

// Category emoji map
const catEmoji = {
  'Phone': '📱', 'Wallet': '👜', 'Keys': '🔑', 'ID/Documents': '🪪',
  'Bag': '🎒', 'Jewellery': '💍', 'Electronics': '💻', 'Other': '📦'
};

// ====== INIT ======
window.onload = () => {
  token = localStorage.getItem('lf_token');
  currentUser = JSON.parse(localStorage.getItem('lf_user') || 'null');
  if (token && currentUser) {
    showApp();
  }
  // Set today's date as default
  const dateInput = document.getElementById('postDate');
  if (dateInput) dateInput.valueAsDate = new Date();
};

// ====== AUTH ======
function toggleAuth() {
  const login = document.getElementById('loginPage');
  const reg = document.getElementById('registerPage');
  if (login.style.display === 'none') {
    login.style.display = 'flex';
    reg.style.display = 'none';
  } else {
    login.style.display = 'none';
    reg.style.display = 'flex';
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) return toast('Please fill all fields', 'error');

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return toast(data.msg || 'Login failed', 'error');

    saveAuth(data.token, data.user);
    toast(`Welcome back, ${data.user.name}! 🎉`, 'success');
    showApp();
  } catch (e) {
    toast('Cannot connect to server. Make sure backend is running!', 'error');
  }
}

async function register() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  if (!name || !email || !password) return toast('Please fill all fields', 'error');
  if (password.length < 6) return toast('Password must be 6+ characters', 'error');

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) return toast(data.msg || 'Registration failed', 'error');

    saveAuth(data.token, data.user);
    toast(`Account created! Welcome, ${data.user.name}! 🚀`, 'success');
    showApp();
  } catch (e) {
    toast('Cannot connect to server. Make sure backend is running!', 'error');
  }
}

function saveAuth(t, user) {
  token = t;
  currentUser = user;
  localStorage.setItem('lf_token', t);
  localStorage.setItem('lf_user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('lf_token');
  localStorage.removeItem('lf_user');
  token = null;
  currentUser = null;
  if (socket) socket.disconnect();
  document.getElementById('authPage').style.display = 'block';
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('navbar').style.display = 'none';
  toast('Logged out successfully', 'info');
}

function showApp() {
  document.getElementById('authPage').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
  document.getElementById('navbar').style.display = 'flex';

  // Init socket
  socket = io(SOCKET_URL);
  socket.on('receive_message', (data) => {
    appendMessage(data.sender, data.message, data.time, data.sender === currentUser.name);
  });

  loadStats();
  loadRecentItems();
  updateProfileUI();
}

// ====== PAGES ======
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  if (page === 'home') {
    document.getElementById('homePage').classList.add('active');
    loadRecentItems();
    loadStats();
  } else if (page === 'items') {
    document.getElementById('itemsPage').classList.add('active');
    loadItems();
  } else if (page === 'profile') {
    document.getElementById('profilePage').classList.add('active');
    loadMyItems();
  }
}

// ====== STATS ======
async function loadStats() {
  try {
    const res = await fetch(`${API}/items`);
    const items = await res.json();
    document.getElementById('statTotal').textContent = items.length;
    document.getElementById('statLost').textContent = items.filter(i => i.type === 'lost').length;
    document.getElementById('statFound').textContent = items.filter(i => i.type === 'found').length;
    document.getElementById('statResolved').textContent = items.filter(i => i.status === 'resolved').length;
  } catch (e) {}
}

// ====== LOAD ITEMS ======
async function loadRecentItems() {
  const container = document.getElementById('recentItems');
  container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const res = await fetch(`${API}/items?`);
    const items = await res.json();
    const recent = items.slice(0, 6);
    container.innerHTML = recent.length ? recent.map(renderCard).join('') : emptyState('No items yet. Be the first to post!');
  } catch (e) {
    container.innerHTML = emptyState('⚠️ Cannot connect to server.');
  }
}

async function loadItems() {
  const container = document.getElementById('allItems');
  container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const search = document.getElementById('searchInput')?.value || '';
  const category = document.getElementById('categoryFilter')?.value || '';
  const typeFilter = currentFilter !== 'all' ? `&type=${currentFilter}` : '';

  try {
    const res = await fetch(`${API}/items?search=${search}&category=${category}${typeFilter}`);
    const items = await res.json();
    container.innerHTML = items.length ? items.map(renderCard).join('') : emptyState('No items found. Try different filters.');
  } catch (e) {
    container.innerHTML = emptyState('⚠️ Cannot connect to server.');
  }
}

async function loadMyItems() {
  const container = document.getElementById('myItems');
  container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const res = await fetch(`${API}/items/user/my`, { headers: { Authorization: `Bearer ${token}` } });
    const items = await res.json();
    container.innerHTML = items.length ? items.map(i => renderCard(i, true)).join('') : emptyState('You haven\'t posted anything yet.');
  } catch (e) {
    container.innerHTML = emptyState('⚠️ Error loading your posts.');
  }
}

// ====== RENDER CARD ======
function renderCard(item, isOwner = false) {
  const emoji = catEmoji[item.category] || '📦';
  const badgeClass = item.status === 'resolved' ? 'badge-resolved' : (item.type === 'lost' ? 'badge-lost' : 'badge-found');
  const badgeText = item.status === 'resolved' ? '✅ Resolved' : (item.type === 'lost' ? '🔴 Lost' : '🟢 Found');
  const imgHtml = item.image
    ? `<div class="item-card-img"><img src="http://localhost:5000${item.image}" alt="${item.title}" /></div>`
    : `<div class="item-card-img">${emoji}</div>`;

  const ownerBtns = isOwner && item.status === 'active' ? `
    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();markResolved('${item._id}')">✅ Mark Resolved</button>
    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteItem('${item._id}')">🗑</button>
  ` : '';

  return `
    <div class="item-card" onclick="openDetail('${item._id}')">
      ${imgHtml}
      <div class="item-card-body">
        <div class="item-type-badge ${badgeClass}">${badgeText}</div>
        <div class="item-card-title">${item.title}</div>
        <div class="item-card-desc">${item.description}</div>
        <div class="item-card-meta">
          <span>📁 ${item.category}</span>
          <span>📍 ${item.location}</span>
          <span>📅 ${new Date(item.date).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="item-card-footer">
        <div class="poster-info">By <strong>${item.postedBy?.name || 'Unknown'}</strong></div>
        <div style="display:flex;gap:0.5rem;align-items:center">
          ${ownerBtns}
          ${!isOwner && item.postedBy?._id !== currentUser?.id ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openChat('${item._id}', '${item.postedBy?.name}', '${item.title}')">💬 Chat</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function emptyState(msg) {
  return `<div class="empty-state" style="grid-column:1/-1">
    <div class="empty-icon">🔍</div>
    <div class="empty-title">${msg}</div>
  </div>`;
}

// ====== FILTERS ======
function setFilter(type, btn) {
  currentFilter = type;
  document.querySelectorAll('.filter-tab').forEach(t => {
    t.className = 'filter-tab';
  });
  btn.className = `filter-tab active-${type}`;
  loadItems();
}

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadItems, 400);
}

// ====== POST MODAL ======
function openPostModal(defaultType = '') {
  resetPostForm();
  if (defaultType) selectType(defaultType);
  openModal('postModal');
}

function selectType(type) {
  document.getElementById('selectedType').value = type;
  document.getElementById('typeOptionLost').className = 'type-option' + (type === 'lost' ? ' selected-lost' : '');
  document.getElementById('typeOptionFound').className = 'type-option' + (type === 'found' ? ' selected-found' : '');
}

function previewImage(input) {
  const preview = document.getElementById('imgPreview');
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; };
    reader.readAsDataURL(input.files[0]);
  }
}

async function submitPost() {
  const type = document.getElementById('selectedType').value;
  const title = document.getElementById('postTitle').value.trim();
  const category = document.getElementById('postCategory').value;
  const date = document.getElementById('postDate').value;
  const location = document.getElementById('postLocation').value.trim();
  const description = document.getElementById('postDescription').value.trim();
  const contact = document.getElementById('postContact').value.trim();
  const image = document.getElementById('postImage').files[0];

  if (!type) return toast('Please select Lost or Found', 'error');
  if (!title || !category || !date || !location || !description) return toast('Please fill all required fields', 'error');

  const formData = new FormData();
  formData.append('type', type);
  formData.append('title', title);
  formData.append('category', category);
  formData.append('date', date);
  formData.append('location', location);
  formData.append('description', description);
  formData.append('contact', contact);
  if (image) formData.append('image', image);

  try {
    const res = await fetch(`${API}/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) return toast(data.msg || 'Failed to post', 'error');

    closeModal('postModal');
    toast('Item posted successfully! 🎉', 'success');
    loadRecentItems();
    loadStats();

    // Check for smart matches
    setTimeout(() => checkMatches(data._id), 500);
  } catch (e) {
    toast('Error posting item. Check server connection.', 'error');
  }
}

function resetPostForm() {
  ['postTitle', 'postLocation', 'postDescription', 'postContact'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('postCategory').value = '';
  document.getElementById('selectedType').value = '';
  document.getElementById('typeOptionLost').className = 'type-option';
  document.getElementById('typeOptionFound').className = 'type-option';
  document.getElementById('postImage').value = '';
  document.getElementById('imgPreview').style.display = 'none';
  document.getElementById('postDate').valueAsDate = new Date();
}

// ====== ITEM DETAIL ======
async function openDetail(itemId) {
  try {
    const res = await fetch(`${API}/items/${itemId}`);
    const item = await res.json();
    const emoji = catEmoji[item.category] || '📦';
    const isOwner = item.postedBy?._id === currentUser?.id;

    const imgHtml = item.image
      ? `<img src="http://localhost:5000${item.image}" style="width:100%;max-height:280px;object-fit:cover;border-radius:10px;margin-bottom:1rem" />`
      : `<div class="detail-img">${emoji}</div>`;

    document.getElementById('detailModalTitle').textContent = item.title;
    document.getElementById('detailModalBody').innerHTML = `
      ${imgHtml}
      <div class="item-type-badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}" style="margin-bottom:0.8rem">
        ${item.type === 'lost' ? '🔴 Lost Item' : '🟢 Found Item'}
      </div>
      <p style="color:var(--text-mid);line-height:1.7;margin-bottom:1rem">${item.description}</p>
      <div class="detail-meta">
        <div class="detail-meta-item">
          <div class="detail-meta-label">CATEGORY</div>
          <div class="detail-meta-value">${emoji} ${item.category}</div>
        </div>
        <div class="detail-meta-item">
          <div class="detail-meta-label">LOCATION</div>
          <div class="detail-meta-value">📍 ${item.location}</div>
        </div>
        <div class="detail-meta-item">
          <div class="detail-meta-label">DATE</div>
          <div class="detail-meta-value">📅 ${new Date(item.date).toLocaleDateString()}</div>
        </div>
        <div class="detail-meta-item">
          <div class="detail-meta-label">POSTED BY</div>
          <div class="detail-meta-value">👤 ${item.postedBy?.name || 'Unknown'}</div>
        </div>
        ${item.contact ? `<div class="detail-meta-item" style="grid-column:1/-1">
          <div class="detail-meta-label">CONTACT</div>
          <div class="detail-meta-value">📞 ${item.contact}</div>
        </div>` : ''}
      </div>
      <div style="display:flex;gap:0.8rem;margin-top:1.2rem;flex-wrap:wrap">
        ${!isOwner ? `<button class="btn btn-primary" onclick="openChat('${item._id}','${item.postedBy?.name}','${item.title}');closeModal('detailModal')">💬 Chat with Finder/Owner</button>` : ''}
        <button class="btn btn-gold btn-sm" onclick="checkMatches('${item._id}');closeModal('detailModal')">🤖 Find Smart Matches</button>
        ${isOwner && item.status === 'active' ? `<button class="btn btn-sm" style="background:var(--success);color:white" onclick="markResolved('${item._id}');closeModal('detailModal')">✅ Mark Resolved</button>` : ''}
      </div>
    `;
    openModal('detailModal');
  } catch (e) {
    toast('Error loading item details', 'error');
  }
}

// ====== SMART MATCHES ======
async function checkMatches(itemId) {
  try {
    const res = await fetch(`${API}/matches/${itemId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const matches = await res.json();
    if (!res.ok || !matches.length) {
      toast('No smart matches found yet.', 'info');
      return;
    }

    document.getElementById('matchesModalBody').innerHTML = `
      <p style="color:var(--text-mid);margin-bottom:1rem">🤖 Found <strong>${matches.length}</strong> potential match(es) for your item!</p>
      <div style="display:flex;flex-direction:column;gap:0.8rem">
        ${matches.map(m => `
          <div class="match-card" onclick="openChat('${m._id}','${m.postedBy?.name}','${m.title}');closeModal('matchesModal')">
            <div class="match-card-img">${m.image ? `<img src="http://localhost:5000${m.image}" style="width:100%;height:100%;object-fit:cover;border-radius:8px" />` : catEmoji[m.category] || '📦'}</div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;color:var(--navy);font-size:0.95rem">${m.title}</div>
              <div style="font-size:0.8rem;color:var(--text-mid)">📍 ${m.location} • ${m.category}</div>
              <div style="margin-top:0.5rem">
                <div style="font-size:0.75rem;color:var(--mid-gray);margin-bottom:0.2rem">Match Score: <strong style="color:var(--teal)">${m.matchScore}%</strong></div>
                <div class="match-score-bar"><div class="match-score-fill" style="width:${m.matchScore}%"></div></div>
              </div>
            </div>
            <div class="item-type-badge ${m.type === 'lost' ? 'badge-lost' : 'badge-found'}">${m.type === 'lost' ? '🔴' : '🟢'}</div>
          </div>
        `).join('')}
      </div>
    `;
    openModal('matchesModal');
  } catch (e) {
    toast('Error checking matches', 'error');
  }
}

// ====== CHAT ======
function openChat(itemId, personName, itemTitle) {
  currentRoomId = `room_${itemId}`;
  document.getElementById('chatModalTitle').textContent = `💬 Chat about: ${itemTitle}`;
  document.getElementById('chatModalSub').textContent = `Chatting with ${personName}`;
  document.getElementById('chatMessages').innerHTML = '';

  socket.emit('join_room', currentRoomId);
  loadChatHistory(currentRoomId);
  openModal('chatModal');

  setTimeout(() => document.getElementById('chatInput').focus(), 300);
}

async function loadChatHistory(roomId) {
  try {
    const res = await fetch(`${API}/chat/history/${roomId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const messages = await res.json();
    messages.forEach(m => {
      appendMessage(m.senderName || m.sender?.name, m.message,
        new Date(m.createdAt).toLocaleTimeString(), m.senderName === currentUser.name);
    });
    scrollChat();
  } catch (e) {}
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message || !currentRoomId) return;

  socket.emit('send_message', {
    roomId: currentRoomId,
    sender: currentUser.name,
    message
  });

  // Save to DB
  fetch(`${API}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ roomId: currentRoomId, message })
  });

  input.value = '';
}

function appendMessage(sender, message, time, isMine) {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = `chat-msg ${isMine ? 'mine' : 'theirs'}`;
  div.innerHTML = `
    <div class="chat-bubble">${message}</div>
    <div class="chat-meta">${isMine ? 'You' : sender} • ${time}</div>
  `;
  container.appendChild(div);
  scrollChat();
}

function scrollChat() {
  const c = document.getElementById('chatMessages');
  if (c) c.scrollTop = c.scrollHeight;
}

// ====== OWNER ACTIONS ======
async function markResolved(itemId) {
  if (!confirm('Mark this item as resolved?')) return;
  try {
    const res = await fetch(`${API}/items/${itemId}/resolve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return toast('Error updating item', 'error');
    toast('Item marked as resolved! 🎉', 'success');
    loadMyItems();
    loadStats();
  } catch (e) {
    toast('Error connecting to server', 'error');
  }
}

async function deleteItem(itemId) {
  if (!confirm('Delete this item permanently?')) return;
  try {
    const res = await fetch(`${API}/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return toast('Error deleting item', 'error');
    toast('Item deleted', 'info');
    loadMyItems();
    loadStats();
  } catch (e) {
    toast('Error connecting to server', 'error');
  }
}

// ====== PROFILE ======
function updateProfileUI() {
  if (!currentUser) return;
  const avatar = document.getElementById('profileAvatar');
  const name = document.getElementById('profileName');
  const email = document.getElementById('profileEmail');
  if (avatar) avatar.textContent = currentUser.name[0].toUpperCase();
  if (name) name.textContent = currentUser.name;
  if (email) email.textContent = currentUser.email;
}

// ====== MODAL HELPERS ======
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Close on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// ====== TOAST ======
function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
