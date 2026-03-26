import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js';

const galleryEl = document.getElementById('gallery');
const emptyStateEl = document.getElementById('emptyState');
const statusBarEl = document.getElementById('statusBar');
const modePillEl = document.getElementById('modePill');
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const nameInput = document.getElementById('nameInput');
const titleInput = document.getElementById('titleInput');
const customActionWrap = document.getElementById('customActionWrap');
const customActionInput = document.getElementById('customActionInput');
const sentenceBox = document.getElementById('sentenceBox');
const previewStage = document.getElementById('previewStage');
const submitBtn = document.getElementById('submitBtn');
const cardTemplate = document.getElementById('cardTemplate');
const actionGrid = document.getElementById('actionGrid');
const seedDemoBtn = document.getElementById('seedDemoBtn');

const DEMO_KEY = 'paper-cuts-demo-artworks-v2';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DEFAULT_ACTION = 'fly';
const SAMPLE_ARTWORKS = [
  {
    id: `sample-${crypto.randomUUID()}`,
    nickname: 'Amy',
    title: 'Star Bird',
    action: 'fly',
    customAction: '',
    sentence: 'My paper-cut can fly.',
    imageUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280"><g fill="none" fill-rule="evenodd"><path fill="#FFD84A" d="M139 20l23 56 61 4-47 39 15 58-52-32-52 32 15-58-47-39 61-4z"/><circle cx="108" cy="120" r="10" fill="#5A4A1A"/><path d="M142 104c16 0 30 7 43 20-17 3-31 11-42 25-6-19-6-34-1-45z" fill="#FF8AA7"/></g></svg>`)
  },
  {
    id: `sample-${crypto.randomUUID()}`,
    nickname: 'Leo',
    title: 'Happy Rabbit',
    action: 'jump',
    customAction: '',
    sentence: 'My paper-cut can jump.',
    imageUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280"><g fill="none" fill-rule="evenodd"><ellipse cx="140" cy="163" rx="56" ry="64" fill="#FFFFFF" stroke="#D0D7E8" stroke-width="6"/><ellipse cx="115" cy="74" rx="18" ry="48" fill="#FFFFFF" stroke="#D0D7E8" stroke-width="6" transform="rotate(-12 115 74)"/><ellipse cx="165" cy="74" rx="18" ry="48" fill="#FFFFFF" stroke="#D0D7E8" stroke-width="6" transform="rotate(12 165 74)"/><circle cx="120" cy="150" r="7" fill="#4B5A7B"/><circle cx="160" cy="150" r="7" fill="#4B5A7B"/><ellipse cx="140" cy="178" rx="15" ry="10" fill="#FF9CB8"/></g></svg>`)
  },
  {
    id: `sample-${crypto.randomUUID()}`,
    nickname: 'Mia',
    title: 'Wheel Flower',
    action: 'spin',
    customAction: '',
    sentence: 'My paper-cut can spin.',
    imageUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280"><g fill="none" fill-rule="evenodd"><circle cx="140" cy="140" r="24" fill="#FFD84A"/><g fill="#FF86B1"><circle cx="140" cy="64" r="34"/><circle cx="140" cy="216" r="34"/><circle cx="64" cy="140" r="34"/><circle cx="216" cy="140" r="34"/><circle cx="86" cy="86" r="28"/><circle cx="194" cy="86" r="28"/><circle cx="86" cy="194" r="28"/><circle cx="194" cy="194" r="28"/></g></g></svg>`)
  }
];

let selectedAction = DEFAULT_ACTION;
let previewResult = null;
let isFirebaseMode = false;
let db = null;
let storage = null;
let auth = null;
let authReady = null;

setupActionButtons();
updateSentence();

fileInput.addEventListener('change', handleFilePreview);
uploadForm.addEventListener('submit', handleSubmit);
seedDemoBtn.addEventListener('click', handleSeedDemo);

init();

async function init() {
  if (hasFirebaseConfig(firebaseConfig)) {
    try {
      isFirebaseMode = true;
      modePillEl.textContent = 'Shared gallery mode';
      showStatus('Connecting to Firebase…');
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      storage = getStorage(app);
      auth = getAuth(app);
      authReady = signInAnonymously(auth);
      await authReady;
      listenToFirebaseGallery();
      showStatus('Shared gallery is ready. Uploads will sync across devices.');
    } catch (error) {
      console.error(error);
      isFirebaseMode = false;
      modePillEl.textContent = 'Local demo mode';
      showStatus('Firebase could not connect. Running in local demo mode instead.');
      loadLocalGallery();
    }
  } else {
    isFirebaseMode = false;
    modePillEl.textContent = 'Local demo mode';
    showStatus('Firebase config is empty. Running in local demo mode.');
    loadLocalGallery();
  }
}

function hasFirebaseConfig(config) {
  return Object.values(config).every((value) => typeof value === 'string' && value.trim() !== '');
}

function setupActionButtons() {
  actionGrid.querySelectorAll('.action-btn').forEach((button) => {
    button.addEventListener('click', () => {
      selectedAction = button.dataset.action;
      actionGrid.querySelectorAll('.action-btn').forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      customActionWrap.classList.toggle('hidden', selectedAction !== 'custom');
      if (selectedAction !== 'custom') {
        customActionInput.value = '';
      }
      updateSentence();
    });
  });

  customActionInput.addEventListener('input', updateSentence);
}

function updateSentence() {
  const actionText = getActionText();
  sentenceBox.textContent = `My paper-cut can ${actionText}.`;
}

function getActionText() {
  if (selectedAction === 'custom') {
    return (customActionInput.value || 'do something amazing').trim();
  }
  return selectedAction;
}

async function handleFilePreview() {
  const file = fileInput.files?.[0];
  if (!file) {
    previewResult = null;
    previewStage.innerHTML = '<span class="preview-hint">Your paper-cut preview will appear here.</span>';
    return;
  }

  if (!file.type.startsWith('image/')) {
    showStatus('Please choose an image file.');
    fileInput.value = '';
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    showStatus('Please choose an image smaller than 5 MB.');
    fileInput.value = '';
    return;
  }

  showStatus('Removing the light background…');
  submitBtn.disabled = true;

  try {
    previewResult = await cutoutImage(file);
    previewStage.innerHTML = '';
    const img = document.createElement('img');
    img.src = previewResult.dataUrl;
    img.alt = 'paper-cut preview';
    previewStage.appendChild(img);
    showStatus('Preview is ready.');
  } catch (error) {
    console.error(error);
    previewResult = null;
    previewStage.innerHTML = '<span class="preview-hint">Preview failed. Please try another image.</span>';
    showStatus('Preview failed. Use a brighter photo with a cleaner background.');
  } finally {
    submitBtn.disabled = false;
  }
}

async function cutoutImage(file) {
  const imageBitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const maxSide = 900;
  const scale = Math.min(1, maxSide / Math.max(imageBitmap.width, imageBitmap.height));
  canvas.width = Math.max(1, Math.round(imageBitmap.width * scale));
  canvas.height = Math.max(1, Math.round(imageBitmap.height * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  const removeThreshold = 238;
  const softRange = 30;
  const lowSaturationLimit = 45;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const avg = (r + g + b) / 3;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);

    if (avg >= removeThreshold && saturation <= lowSaturationLimit) {
      pixels[i + 3] = 0;
      continue;
    }

    if (avg >= removeThreshold - softRange && saturation <= lowSaturationLimit + 10) {
      const strength = Math.max(0, removeThreshold - avg) / softRange;
      pixels[i + 3] = Math.min(pixels[i + 3], Math.round(strength * 255));
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const trimmedCanvas = trimTransparentEdges(canvas);
  const blob = await new Promise((resolve) => trimmedCanvas.toBlob(resolve, 'image/png'));
  const dataUrl = trimmedCanvas.toDataURL('image/png');
  return { blob, dataUrl };
}

function trimTransparentEdges(sourceCanvas) {
  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = sourceCanvas;
  const data = ctx.getImageData(0, 0, width, height).data;

  let top = height;
  let left = width;
  let right = 0;
  let bottom = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }

  if (right <= left || bottom <= top) {
    return sourceCanvas;
  }

  const padding = 8;
  const cropX = Math.max(0, left - padding);
  const cropY = Math.max(0, top - padding);
  const cropWidth = Math.min(width - cropX, right - left + padding * 2);
  const cropHeight = Math.min(height - cropY, bottom - top + padding * 2);

  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = cropWidth;
  targetCanvas.height = cropHeight;
  const targetCtx = targetCanvas.getContext('2d');
  targetCtx.drawImage(sourceCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  return targetCanvas;
}

async function handleSubmit(event) {
  event.preventDefault();

  const file = fileInput.files?.[0];
  const nickname = nameInput.value.trim();
  const title = titleInput.value.trim();
  const customAction = customActionInput.value.trim();
  const action = selectedAction;
  const actionText = action === 'custom' ? customAction || 'do something amazing' : action;
  const sentence = `My paper-cut can ${actionText}.`;

  if (!nickname || !title || !file) {
    showStatus('Please fill in your name, title, and image.');
    return;
  }

  if (action === 'custom' && !customAction) {
    showStatus('Please type your own action.');
    return;
  }

  submitBtn.disabled = true;

  try {
    showStatus('Preparing your paper-cut…');
    const prepared = previewResult ?? (await cutoutImage(file));

    const artwork = {
      id: crypto.randomUUID(),
      nickname,
      title,
      action,
      customAction,
      sentence,
      imageUrl: prepared.dataUrl,
      createdAtMs: Date.now()
    };

    if (isFirebaseMode) {
      await authReady;
      const uid = auth.currentUser?.uid || 'anonymous';
      const objectRef = ref(storage, `artworks/${uid}/${Date.now()}-${slugify(title)}.png`);
      await uploadBytes(objectRef, prepared.blob, { contentType: 'image/png' });
      const imageUrl = await getDownloadURL(objectRef);
      await addDoc(collection(db, 'artworks'), {
        nickname,
        title,
        action,
        customAction,
        sentence,
        imageUrl,
        createdAt: serverTimestamp(),
        createdBy: uid
      });
      showStatus('Uploaded to the shared gallery.');
    } else {
      saveLocalArtwork(artwork);
      loadLocalGallery();
      showStatus('Saved in local demo mode on this browser.');
    }

    resetForm();
  } catch (error) {
    console.error(error);
    showStatus('Upload failed. Check Firebase settings or try another photo.');
  } finally {
    submitBtn.disabled = false;
  }
}

function listenToFirebaseGallery() {
  const artworksQuery = query(collection(db, 'artworks'), orderBy('createdAt', 'desc'), limit(60));
  onSnapshot(
    artworksQuery,
    (snapshot) => {
      const artworks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderGallery(artworks);
    },
    (error) => {
      console.error(error);
      showStatus('Gallery sync failed. Please check Firestore indexes and rules.');
    }
  );
}

function saveLocalArtwork(artwork) {
  const list = JSON.parse(localStorage.getItem(DEMO_KEY) || '[]');
  list.unshift(artwork);
  localStorage.setItem(DEMO_KEY, JSON.stringify(list.slice(0, 40)));
}

function loadLocalGallery() {
  const saved = JSON.parse(localStorage.getItem(DEMO_KEY) || '[]');
  renderGallery(saved);
}

function renderGallery(artworks) {
  galleryEl.innerHTML = '';

  if (!artworks.length) {
    emptyStateEl.classList.remove('hidden');
    return;
  }

  emptyStateEl.classList.add('hidden');
  artworks.forEach((artwork) => {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    const image = card.querySelector('.art-image');
    image.src = artwork.imageUrl;
    image.classList.add(getAnimationClass(artwork.action));
    image.alt = artwork.title;
    card.querySelector('.art-title').textContent = artwork.title;
    card.querySelector('.art-author').textContent = `By ${artwork.nickname}`;
    card.querySelector('.art-sentence').textContent = artwork.sentence;
    card.querySelector('.art-action-tag').textContent = artwork.action === 'custom'
      ? artwork.customAction || 'custom'
      : artwork.action;
    galleryEl.appendChild(card);
  });
}

function getAnimationClass(action) {
  switch (action) {
    case 'jump':
      return 'is-jump';
    case 'run':
      return 'is-run';
    case 'spin':
      return 'is-spin';
    case 'custom':
      return 'is-custom';
    case 'fly':
    default:
      return 'is-fly';
  }
}

function resetForm() {
  uploadForm.reset();
  selectedAction = DEFAULT_ACTION;
  actionGrid.querySelectorAll('.action-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.action === DEFAULT_ACTION);
  });
  customActionWrap.classList.add('hidden');
  previewResult = null;
  previewStage.innerHTML = '<span class="preview-hint">Your paper-cut preview will appear here.</span>';
  updateSentence();
}

function handleSeedDemo() {
  if (isFirebaseMode) {
    showStatus('Demo works are meant for local demo mode. Add them manually if needed.');
    return;
  }
  localStorage.setItem(DEMO_KEY, JSON.stringify(SAMPLE_ARTWORKS));
  loadLocalGallery();
  showStatus('Demo artworks added to local demo mode.');
}

function showStatus(message) {
  statusBarEl.textContent = message;
  statusBarEl.classList.remove('hidden');
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'paper-cut';
}
