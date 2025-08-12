// ---------- Sample data ----------
const chatData = {
  chats: [
    { id: 1, name: 'Asap Ramy', preview: 'Tap to chat', time: '12:01', unread: 0, isFavorite:false, isGroup:false, isOnline:true },
    { id: 2, name: 'Ngeima Group', preview: 'No messages yet', time: 'Yesterday', unread: 2, isFavorite:false, isGroup:true, isOnline:false },
    { id: 3, name: 'John Public', preview: 'Say hi!', time: 'Mon', unread: 0, isFavorite:true, isGroup:false, isOnline:false }
  ],
  unread: [],
  favorites: [],
  groups: [],
  status: [],
  calls: []
};

let currentTab = 'chats';
let activeChat = null;
let deferredPrompt = null;

// ---------- INIT ----------
function init(){
  updateChatData();
  renderChatList();
  attachGlobalHandlers();
}
document.addEventListener('DOMContentLoaded', init);

// ---------- CHAT LIST + TABS ----------
function updateChatData(){
  chatData.unread = chatData.chats.filter(c => c.unread > 0);
  chatData.favorites = chatData.chats.filter(c => c.isFavorite);
  chatData.groups = chatData.chats.filter(c => c.isGroup);
}

function renderChatList(){
  const list = document.getElementById('chatList');
  list.innerHTML = '';
  const data = chatData[currentTab] && chatData[currentTab].length ? chatData[currentTab] : (currentTab === 'chats' ? chatData.chats : []);
  if(!data.length){
    const empty = document.createElement('div');
    empty.style.textAlign='center'; empty.style.padding='40px 20px'; empty.style.color='#8696a0';
    empty.innerHTML = `<p>No ${currentTab} found</p>`;
    list.appendChild(empty);
    return;
  }
  data.forEach(chat => list.appendChild(createChatItem(chat)));
}

function createChatItem(chat){
  const div = document.createElement('div');
  div.className = 'chat-item';
  const initials = chat.name.split(' ').map(n=>n[0]).join('').toUpperCase();
  const avatarClass = chat.isGroup ? 'chat-avatar group-indicator' : 'chat-avatar';
  div.innerHTML = `
    <div class="${avatarClass}">${initials}${chat.isOnline ? '<div class="status-indicator"></div>' : ''}</div>
    <div class="chat-content">
      <div class="chat-header">
        <div class="chat-name">${chat.name}</div>
        <div class="chat-meta"><div class="chat-time">${chat.time}</div></div>
      </div>
      <div class="chat-preview">${chat.preview}</div>
    </div>
    ${chat.unread>0?`<div class="unread-count">${chat.unread}</div>`:''}
  `;
  div.addEventListener('click', () => openChat(chat));
  return div;
}

function switchTab(tabName, event){
  currentTab = tabName;
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  if(event && event.target) event.target.classList.add('active');
  renderChatList();
}

// ---------- OPEN / CLOSE CHAT ----------
function openChat(chat){
  activeChat = chat;
  document.getElementById('homeView').style.display = 'none';
  document.getElementById('chatView').classList.remove('hidden');
  document.getElementById('chatName').textContent = chat.name;
  document.getElementById('chatStatus').textContent = chat.isOnline ? 'online' : 'last seen recently';
  document.getElementById('chatAvatar').textContent = chat.name.split(' ').map(n=>n[0]).join('').toUpperCase();

  // clear messages area (no conversation history by default)
  const messages = document.getElementById('messages');
  messages.querySelectorAll('.msg-row, .message-row').forEach(n => {
    if(!n.id || n.id !== 'typingIndicator') n.remove();
  });

  // mark as read
  chat.unread = 0;
  updateChatData();
  renderChatList();

  // focus input
  const input = document.getElementById('msgInput');
  input.value = '';
  autoResize(input);
  input.focus();
}

function closeChat(){
  document.getElementById('chatView').classList.add('hidden');
  document.getElementById('homeView').style.display = '';
  activeChat = null;
}

// ---------- SENDING MESSAGES ----------
function sendMessage(){
  const ta = document.getElementById('msgInput');
  const text = ta.value.trim();
  if(!text) return;
  appendOutgoingMessage(text);
  ta.value = '';
  autoResize(ta);
  simulateReply(); // small demo: simulate remote reply & typing
}

function appendOutgoingMessage(text){
  const messages = document.getElementById('messages');
  const row = document.createElement('div');
  row.className = 'message-row outgoing';
  row.innerHTML = `
    <div class="bubble outgoing">
      <div class="text">${escapeHtml(text)}</div>
      <div class="msg-time">${shortTime()}</div>
    </div>
  `;
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
}

function appendIncomingMessage(text){
  const messages = document.getElementById('messages');
  const row = document.createElement('div');
  row.className = 'message-row incoming';
  row.innerHTML = `
    <div class="bubble incoming">
      <div class="text">${escapeHtml(text)}</div>
      <div class="msg-time">${shortTime()}</div>
    </div>
  `;
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
}

// ---------- STICKERS ----------
function toggleStickerPicker(){
  const p = document.getElementById('stickerPicker');
  p.classList.toggle('hidden');
}
function sendSticker(st){
  // stickers are small emoji in this implementation
  const messages = document.getElementById('messages');
  const row = document.createElement('div');
  row.className = 'message-row outgoing';
  row.innerHTML = `
    <div class="bubble outgoing">
      <div class="text" style="font-size:28px">${escapeHtml(st)}</div>
      <div class="msg-time">${shortTime()}</div>
    </div>
  `;
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
  document.getElementById('stickerPicker').classList.add('hidden');
  // small reply demo
  setTimeout(()=>{ simulateReply(); }, 800);
}

// ---------- TYPING INDICATOR (demo) ----------
function showTyping(on=true){
  const t = document.getElementById('typingIndicator');
  if(on) t.classList.remove('hidden'); else t.classList.add('hidden');
}

// simulate remote typing then reply (demo only)
function simulateReply(){
  showTyping(true);
  setTimeout(()=>{ showTyping(false); appendIncomingMessage('Thanks — got your message!'); }, 1200);
}

// ---------- AUTO RESIZE TEXTAREA ----------
function autoResize(el){
  el.style.height = 'auto';
  const max = 180; // px
  el.style.height = Math.min(el.scrollHeight, max) + 'px';
}

// ---------- CAMERA (basic use-case: take a photo & add as outgoing message) ----------
let cameraStream = null;
const cameraOverlay = document.getElementById ? document.getElementById('cameraOverlay') : null;
const cameraVideo = document.getElementById ? document.getElementById('cameraVideo') : null;
const cameraCanvas = document.getElementById ? document.getElementById('cameraCanvas') : null;

async function openCamera(){
  try{
    cameraOverlay.classList.add('show');
    if(!cameraStream){
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if(cameraVideo) cameraVideo.srcObject = cameraStream;
      if(cameraVideo) cameraVideo.style.display = 'block';
    }
  }catch(e){
    alert('Camera not available or permission denied.');
    cameraOverlay.classList.remove('show');
  }
}
function closeCamera(){
  cameraOverlay.classList.remove('show');
  if(cameraStream){
    cameraStream.getTracks().forEach(t=>t.stop());
    cameraStream = null;
    if(cameraVideo) cameraVideo.style.display = 'none';
  }
}
document.addEventListener('click', (e) => {
  if(e.target && e.target.id === 'takePhotoBtn'){
    takePhoto();
  }
});

function takePhoto(){
  if(!cameraVideo || !cameraCanvas) return;
  cameraCanvas.width = cameraVideo.videoWidth;
  cameraCanvas.height = cameraVideo.videoHeight;
  const ctx = cameraCanvas.getContext('2d');
  ctx.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);
  const data = cameraCanvas.toDataURL('image/png');
  // append image as outgoing bubble
  const messages = document.getElementById('messages');
  const row = document.createElement('div');
  row.className = 'message-row outgoing';
  row.innerHTML = `
    <div class="bubble outgoing">
      <img src="${data}" style="max-width:220px;border-radius:12px;display:block"/>
      <div class="msg-time">${shortTime()}</div>
    </div>
  `;
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
  closeCamera();
}

// ---------- UTILITIES ----------
function shortTime(){
  const d = new Date();
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}
function escapeHtml(s){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// ---------- dropdown + menu actions (home) ----------
function toggleDropdown(){ document.getElementById('dropdownMenu').classList.toggle('show'); }
function newGroup(){ alert('New group placeholder'); closeDropdown(); }
function newBroadcast(){ alert('New broadcast placeholder'); closeDropdown(); }
function linkDevice(){ alert('Link device placeholder'); closeDropdown(); }
function markAllRead(){ chatData.chats.forEach(c=>c.unread=0); updateChatData(); renderChatList(); closeDropdown(); }
function openSettings(){ alert('Settings placeholder'); closeDropdown(); }
function closeDropdown(){ document.getElementById('dropdownMenu').classList.remove('show'); }

function newChat(){ alert('New chat placeholder'); }

// ---------- search + handlers ----------
function attachGlobalHandlers(){
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.chat-item').forEach(node=>{
      const name = node.querySelector('.chat-name').textContent.toLowerCase();
      const preview = node.querySelector('.chat-preview') ? node.querySelector('.chat-preview').textContent.toLowerCase() : '';
      node.style.display = (name.includes(q) || preview.includes(q)) ? 'flex' : 'none';
    });
  });

  // hide dropdown when clicking outside
  window.addEventListener('click', (e) => {
    if(!e.target.closest('.dropdown')) closeDropdown();
  });

  // install prompt handling (if present)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const ip = document.getElementById('installPrompt');
    if(ip) ip.style.display = 'block';
  });
  const installButton = document.getElementById('installButton');
  if(installButton) installButton.addEventListener('click', async () => {
    if(deferredPrompt){
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      console.log('Install result', choice);
      deferredPrompt = null;
      document.getElementById('installPrompt').style.display = 'none';
    }
  });
  const dismissButton = document.getElementById('dismissButton');
  if(dismissButton) dismissButton.addEventListener('click', ()=>{ document.getElementById('installPrompt').style.display = 'none'; });
}
