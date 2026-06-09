'use strict';

// ============================================================
// [1] UTILITIES & GLOBALS
// ============================================================
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/`/g, '&#x60;');
const escJS = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n').replace(/\r/g, '');

const clean = html => {
  if (window.DOMPurify) return DOMPurify.sanitize(html);
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML.replace(/&lt;(\/?)(b|i|u|strong|em|br|p|ul|li|h[1-6]|span|div|table|thead|tbody|tr|th|td)(.*?)&gt;/gi, '<$1$2$3>');
};

const safeSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const safeGet = (k, fb) => { try { const s = localStorage.getItem(k); return s !== null ? JSON.parse(s) : fb; } catch (e) { return fb; } };

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

const extractJSON = t => {
  try {
    const match = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let cleanStr = match ? match[1] : t;
    const firstBrace = cleanStr.indexOf('{');
    const firstBracket = cleanStr.indexOf('[');
    let startIdx = -1;
    if (firstBrace !== -1 && firstBracket !== -1) startIdx = Math.min(firstBrace, firstBracket);
    else if (firstBrace !== -1) startIdx = firstBrace;
    else if (firstBracket !== -1) startIdx = firstBracket;
    
    if (startIdx !== -1) {
      cleanStr = cleanStr.substring(startIdx);
      const lastBrace = cleanStr.lastIndexOf('}');
      const lastBracket = cleanStr.lastIndexOf(']');
      let endIdx = Math.max(lastBrace, lastBracket);
      if (endIdx !== -1) cleanStr = cleanStr.substring(0, endIdx + 1);
    }
    // 改行やタブを保持しつつ、制御文字のみを削除するよう修正
    cleanStr = cleanStr.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, "");
    return JSON.parse(cleanStr);
  } catch (err) {
    console.error('JSON解析エラー', err);
    return null;
  }
};

let toastQueue = [];
let isToastShowing = false;
const showToast = msg => {
  toastQueue.push(msg);
  if (!isToastShowing) processToastQueue();
};
const processToastQueue = () => {
  if (toastQueue.length === 0) { isToastShowing = false; return; }
  isToastShowing = true;
  const msg = toastQueue.shift();
  const t = $('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(processToastQueue, 300);
  }, 2200);
};

// Undo (元に戻す) 機能
let undoTimeout = null;
let pendingUndoAction = null;
const showUndoSnackbar = (msg, undoFn, commitFn) => {
  if (pendingUndoAction && pendingUndoAction.commit) pendingUndoAction.commit();
  pendingUndoAction = { undo: undoFn, commit: commitFn };
  const sb = $('undo-snackbar');
  if (!sb) return;
  $('undo-message').textContent = msg;
  sb.classList.add('show');
  clearTimeout(undoTimeout);
  undoTimeout = setTimeout(() => {
    if (pendingUndoAction && pendingUndoAction.commit) pendingUndoAction.commit();
    pendingUndoAction = null;
    sb.classList.remove('show');
  }, 5000);
};
window.addEventListener('DOMContentLoaded', () => {
  const undoBtn = $('undo-btn');
  if (undoBtn) {
    undoBtn.onclick = () => {
      if (pendingUndoAction && pendingUndoAction.undo) {
        pendingUndoAction.undo();
        pendingUndoAction = null;
      }
      clearTimeout(undoTimeout);
      $('undo-snackbar').classList.remove('show');
    };
  }
});

const autoResize = el => { 
  if (!el) return; 
  const scrollY = window.scrollY;
  el.style.height = 'auto'; 
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'; 
  window.scrollTo(0, scrollY);
};

const printHtml = (html) => {
  let iframe = $('print-iframe');
  if (!iframe) { iframe = document.createElement('iframe'); iframe.id = 'print-iframe'; iframe.style.display = 'none'; document.body.appendChild(iframe); }
  const doc = iframe.contentWindow.document; doc.open(); doc.write(html); doc.close();
  iframe.onload = () => { iframe.contentWindow.focus(); setTimeout(() => iframe.contentWindow.print(), 500); };
};

const getTodayWeekIdx = () => (new Date().getDay() + 6) % 7;

const todayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const copyText = (txt, btn) => { navigator.clipboard.writeText(txt).then(() => { if (btn) { btn.classList.add('copied'); const old = btn.textContent; btn.textContent = customTexts['copied'] || 'コピー済'; setTimeout(() => btn.textContent = old, 1800); } showToast(customTexts['copied'] || 'コピー済'); }).catch(() => showToast('失敗')); };

const getTotalStudySeconds = () => studyLogs.reduce((a, l) => a + l.seconds, 0);

const openModal = id => { 
  $(id).classList.add('open'); 
  document.body.classList.add('modal-open-locked');
  history.pushState({ modal: id }, ''); 
};
const closeModal = id => { 
  $(id).classList.remove('open'); 
  if (!document.querySelector('.modal-overlay.open')) {
    document.body.classList.remove('modal-open-locked');
  }
  // Cropper.jsのメモリリーク対策
  if (id === 'image-crop-modal' && cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
    cropTargetCallback = null;
  }
  if (history.state && history.state.modal === id) history.back(); 
};
window.addEventListener('popstate', () => { 
  document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open')); 
  document.body.classList.remove('modal-open-locked');
});

const resizeImage = (file, maxWidth = 1024, maxHeight = 1024, skipResize = false) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (skipResize) {
        resolve(e.target.result);
        return;
      }
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
        if (h > maxHeight) { w = Math.round((w * maxHeight) / h); h = maxHeight; }
        const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Cropper.js 連携
let cropperInstance = null;
let cropTargetCallback = null;
window.openImageCropper = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const imgEl = $('image-crop-target');
    if (!imgEl) return;
    imgEl.src = e.target.result;
    openModal('image-crop-modal');
    if (cropperInstance) cropperInstance.destroy();
    cropperInstance = new Cropper(imgEl, {
      viewMode: 1,
      autoCropArea: 1,
      background: false
    });
    cropTargetCallback = callback;
  };
  reader.readAsDataURL(file);
};
window.applyImageCrop = () => {
  if (!cropperInstance || !cropTargetCallback) return;
  const canvas = cropperInstance.getCroppedCanvas({ maxWidth: 1024, maxHeight: 1024 });
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  cropTargetCallback(dataUrl);
  closeModal('image-crop-modal');
  cropperInstance.destroy();
  cropperInstance = null;
  cropTargetCallback = null;
};

// KaTeX レンダリング
const renderMath = (el) => {
  if (window.renderMathInElement && el) {
    renderMathInElement(el, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\(', right: '\\)', display: false},
        {left: '\\[', right: '\\]', display: true}
      ],
      throwOnError: false
    });
  }
};

const handleApiError = (e, containerId) => {
  const c = $(containerId); if (!c) return;
  let msg = '通信エラーが発生しました。';
  if (!navigator.onLine) msg = 'オフラインです。ネットワーク接続を確認してください。';
  else if (e.message.includes('API Key') || e.message.includes('401')) msg = 'API Keyが設定されていないか、無効です。Settingsタブから設定してください。';
  else if (e.message.includes('429')) msg = 'APIの利用制限に達しました。しばらく待ってからお試しください。';
  else if (e.message.includes('400')) msg = 'リクエストが不正です。画像サイズが大きすぎるか、プロンプトが長すぎます。';
  c.innerHTML = `<div class="card text-danger font-bold">${esc(msg)}</div>`;
};

let customTexts = safeGet('study_custom_texts', {});

const applyCustomTexts = () => {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (customTexts[key]) {
      if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
        el.textContent = customTexts[key];
      }
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (customTexts[key]) {
      el.setAttribute('placeholder', customTexts[key]);
    }
  });
};

const loadCustomTexts = () => {
  customTexts = safeGet('study_custom_texts', {});
  applyCustomTexts();
};

window.openTextCustomizerModal = () => {
  const list = $('text-customizer-list');
  if (!list) return;
  
  const keys = new Set();
  const map = {};
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    keys.add(k);
    if (!map[k]) map[k] = el.textContent.trim();
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const k = el.getAttribute('data-i18n-placeholder');
    keys.add(k);
    if (!map[k]) map[k] = el.getAttribute('placeholder');
  });

  let html = '';
  keys.forEach(k => {
    const currentVal = customTexts[k] || map[k] || '';
    html += `<div class="mb-2">
      <label class="text-xs font-bold text-muted mb-1 block">${k}</label>
      <input type="text" class="score-input custom-text-input" data-key="${k}" value="${esc(currentVal)}">
    </div>`;
  });
  list.innerHTML = html;
  openModal('text-customizer-modal');
};

window.saveCustomTexts = () => {
  document.querySelectorAll('.custom-text-input').forEach(input => {
    const k = input.getAttribute('data-key');
    const v = input.value.trim();
    if (v) customTexts[k] = v;
    else delete customTexts[k];
  });
  safeSet('study_custom_texts', customTexts);
  applyCustomTexts();
  closeModal('text-customizer-modal');
  showToast('テキストを保存しました');
};

window.resetCustomTexts = () => {
  if(!confirm('すべてのテキストを初期値に戻しますか？')) return;
  customTexts = {};
  localStorage.removeItem('study_custom_texts');
  location.reload();
};

// ============================================================
// [2] CONSTANTS & STATE
// ============================================================
const TABS = ['Dashboard', 'Timer', 'ImportSearch', 'Vocab', 'Cards', 'SkillUp', 'CustomCards', 'Subject', 'Plan', 'Mistakes', 'Manage'];
const ACCENTS = ['en_US', 'en_GB', 'en_AU'];
const ACCENT_LABELS = { en_US: 'アメリカ英語', en_GB: 'イギリス英語', en_AU: 'オーストラリア英語' };
const SCORE_SUBJECTS = { japanese: { label: '国語', details: ['現代文', '古文', '漢文', '総合'] }, math: { label: '数学', details: ['数学I・A', '数学II・B', '数学III・C', '総合'] }, english: { label: '英語', details: ['リーディング', 'リスニング', 'ライティング', '総合'] }, science: { label: '理科', details: ['物理', '化学', '生物', '地学', '基礎', '総合'] }, social: { label: '社会', details: ['歴史', '地理', '公共', '倫理', '政経', '総合'] }, total: { label: '総合', details: ['文系', '理系', '全体'] } };
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const ACADEMIC_YEAR_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
const VOCAB_PER_PAGE = 50;

const THEMES = {
  default: { accent: '#2D2B27', streak: '#E67E22' },
  red: { accent: '#C0392B', streak: '#E74C3C' },
  blue: { accent: '#2980B9', streak: '#3498DB' },
  green: { accent: '#27AE60', streak: '#2ECC71' },
  orange: { accent: '#E67E22', streak: '#F39C12' },
  purple: { accent: '#8E44AD', streak: '#9B59B6' },
  teal: { accent: '#16A085', streak: '#1ABC9C' },
  indigo: { accent: '#3F51B5', streak: '#5C6BC0' },
  gray: { accent: '#7F8C8D', streak: '#95A5A6' }
};

let ALL_WORDS = [], savedWords = [], plans = {}, events = {}, writingHistory = [], subjectSaved = [], subjectQuizzes = [], examScores = [], textbooks = [], srsData = {}, userProfile = { targetUniv: '', grade: '', courses: '', xp: 0, autoSync: false, reminderTime: '', aiNotificationTiming: false, freezeItems: 0, themeColor: 'default', customThemeColor: '' }, customDecks = [], wordProgress = {}, vocabMeta = {}, dailyChallenges = [], syntaxList = [], listenHistory = [], studyLogs = [], freezeLogs = [];
let examMistakes = [], calcMistakes = [], otherMistakes = [], subjectFolders = [];
let goalTimes = safeGet('study_goal_times', { english: 0, math: 0, japanese: 0, science: 0, social: 0, other: 0 });
let yearlyPlan = { year: new Date().getFullYear(), goal: '', months: {} };
let countdownData = safeGet('study_countdown', { name: '', date: '' });
let quickCaptures = safeGet('study_quick_captures', []);
let currentTabIndex = 0;
let timerPresets = safeGet('study_timer_presets', [1500, 3000]);
let darkThemeMode = safeGet('study_dark_mode', 'auto');
let fsrsRetention = safeGet('study_fsrs_retention', 90);
let cachedWotd = safeGet('study_wotd_cache', { date: '', word: null, exampleHtml: '', meaning: '' });
let cachedQuote = safeGet('study_quote_cache', { date: '', text: '', author: '', explanation: '' });
let activeWidgets = safeGet('study_active_widgets', ['wotd', 'hero', 'quote', 'countdown', 'yearly', 'actions', 'streak', 'weekly-chart', 'radar-chart', 'srs-chart', 'srs-scatter', 'stability-chart', 'subj-chart', 'heatmap', 'calendar', 'quick-capture-inbox', 'today-plan', 'today-log']);
let widgetColumnMode = safeGet('study_widget_column_mode', '1');
let shuffleSettings = safeGet('study_shuffle_settings', { mode: 'random' });

let reminderCheckInt = null;
let swipeStartX = 0, swipeStartY = 0;
let _audioUnlocked = false;
let mBtn = null, rec = null, aInp = null;
let wotdIndex = -1;
let dashSubjChart = null, dashSrsChart = null, dashSrsScatter = null, wordRetentionChart = null, dashWeeklyChart = null, simulationChart = null, dashRadarChart = null, dashStabilityChart = null, mistakeRadarChart = null;
let weaknessWords = [];
let vocabPosFilter = 'all', vocabProgFilter = 'all', vocabTagFilter = 'all', vocabPrefixFilter = '';
let vocabPage = 1;
let timerInt = null, timerTime = 25 * 60, timerInitial = 25 * 60, timerRunning = false, timerEndTime = 0; 
let isPomodoroMode = false, isPomodoroBreak = false;

let audioCtx = null;
let masterCompressor = null;
let activeNoises = { rain: false, forest: false, ocean: false };
let noiseNodes = { rain: null, forest: null, ocean: null };
let noiseVolumes = { rain: 0.5, forest: 0.5, ocean: 0.5 };

let planMode = 'calendar', currentPlanMonth = new Date().getMonth() + 1, currentWeekDay = 0;
let pCalYear = new Date().getFullYear(), pCalMonth = new Date().getMonth(), selectedPlanDate = todayDateStr();
let dashCalYear = new Date().getFullYear(), dashCalMonth = new Date().getMonth();
let dashWeeklyOffset = 0;
let planAiHistory = [];
let scoreLineChart = null, scoreChartMode = 'dev';
let wInputMode = 'text', wPhotoData = null, currentDailyTab = 'comp';
let currentListenMode = 'mc';
let activeQuizList = [], activeQuizIndex = 0, quizScore = 0;
let ccDeckId = null, ccMode = 'study', ccList = [], ccIdx = 0;
let ccAiMode = 'text', ccAiFileData = '', ccAiPhotoData = null;
let curSubj = 'japanese', subjHist = {}, sqMode = 'text', sqFileData = '', sqPhotoData = null; const subjConf = { japanese: '国語', math: '数学', english: '英語', science: '理科', social: '社会', other: 'その他' };
let curImpTab = 'file', impWords = [];
let currentLogDate = null;
let cardList = [], currentCardIdx = 0, cardsMode = 'all';
let cardVoiceRec = null, cardVoiceActive = false;
let autoPlayInt = null, apState = 0;
let availableVoices = [];
let searchMicRec = null;

let autoListenInt = null;
let autoListenWords = [];
let autoListenIdx = 0;
let autoListenState = 0;
let shadowingAudioCtx = null;
let shadowingAnalyser = null;
let shadowingDataArray = null;
let shadowingReqAnimFrame = null;

let mistakeTab = 'saved';

// ============================================================
// [3] STORAGE & SYNC
// ============================================================
let _saveQueue = Promise.resolve();
const safeSave = (key, data) => { _saveQueue = _saveQueue.then(() => localforage.setItem(key, data)).catch(e => console.error(e)); return _saveQueue; };

const imageStore = localforage.createInstance({ name: 'StudyApp', storeName: 'images' });
const saveImageToDB = async (base64Data) => {
  if (!base64Data) return null;
  const id = 'img_' + generateId();
  await imageStore.setItem(id, base64Data);
  return id;
};
const getImageFromDB = async (id) => {
  if (!id || !id.startsWith('img_')) return id;
  return await imageStore.getItem(id);
};

const save = {
  words: () => safeSave('study_words', ALL_WORDS),
  saved: () => safeSave('study_saved', savedWords),
  plans: () => safeSave('study_plans', plans),
  events: () => safeSave('study_events', events),
  writing: () => safeSave('study_writing', writingHistory.slice(0, 100)),
  subSaved: () => safeSave('study_subject_saved', subjectSaved),
  subQuiz: () => safeSave('study_subject_quizzes', subjectQuizzes),
  exams: () => safeSave('study_exam_scores', examScores),
  books: () => safeSave('study_textbooks', textbooks),
  srs: () => safeSave('study_srs', srsData),
  profile: () => safeSave('study_profile', userProfile),
  decks: () => safeSave('study_custom_decks', customDecks),
  prog: () => safeSave('study_word_progress', wordProgress),
  meta: () => safeSave('study_vocab_meta', vocabMeta),
  daily: () => safeSave('study_daily', dailyChallenges.slice(0, 100)),
  syntax: () => safeSave('study_syntax', syntaxList),
  listen: () => safeSave('study_listen', listenHistory.slice(0, 100)),
  logs: () => safeSave('study_logs', studyLogs),
  yearly: () => safeSave('study_yearly_plan', yearlyPlan),
  freezeLogs: () => safeSave('study_freeze_logs', freezeLogs),
  examMistakes: () => safeSave('study_exam_mistakes', examMistakes),
  calcMistakes: () => safeSave('study_calc_mistakes', calcMistakes),
  otherMistakes: () => safeSave('study_other_mistakes', otherMistakes),
  subjectFolders: () => safeSave('study_subject_folders', subjectFolders)
};

const createAutoBackup = async () => {
  const today = todayDateStr();
  const lastBackup = localStorage.getItem('study_last_backup_date');
  if (lastBackup !== today) {
    const data = { ALL_WORDS, savedWords, plans, events, writingHistory, subjectSaved, subjectQuizzes, examScores, textbooks, srsData, userProfile, customDecks, wordProgress, vocabMeta, dailyChallenges, syntaxList, listenHistory, studyLogs, yearlyPlan, examMistakes, calcMistakes, otherMistakes, subjectFolders };
    await localforage.setItem('backup_' + today, data);
    localStorage.setItem('study_last_backup_date', today);
    
    const keys = await localforage.keys();
    const backupKeys = keys.filter(k => k.startsWith('backup_')).sort((a, b) => {
      return a.localeCompare(b);
    });
    
    if (backupKeys.length > 7) {
      for (let i = 0; i < backupKeys.length - 7; i++) {
        await localforage.removeItem(backupKeys[i]);
      }
    }
  }
};

window.createManualBackup = async () => {
  await createAutoBackup();
  showToast('バックアップを作成しました');
  renderBackupList();
};

window.renderBackupList = async () => {
  const sel = $('backup-restore-select');
  if (!sel) return;
  const keys = await localforage.keys();
  const backupKeys = keys.filter(k => k.startsWith('backup_')).sort((a, b) => b.localeCompare(a));
  sel.innerHTML = '<option value="">復元ポイントを選択...</option>' + backupKeys.map(k => `<option value="${k}">${k.replace('backup_', '')}</option>`).join('');
};

window.restoreBackup = async () => {
  const sel = $('backup-restore-select');
  if (!sel || !sel.value) return showToast('復元ポイントを選択してください');
  if (!confirm('現在のデータは上書きされます。復元しますか？')) return;
  
  const data = await localforage.getItem(sel.value);
  if (data) {
    ALL_WORDS = data.ALL_WORDS || []; savedWords = data.savedWords || []; plans = data.plans || {}; events = data.events || {}; writingHistory = data.writingHistory || []; subjectSaved = data.subjectSaved || []; subjectQuizzes = data.subjectQuizzes || []; examScores = data.examScores || []; textbooks = data.textbooks || []; srsData = data.srsData || {}; userProfile = data.userProfile || userProfile; customDecks = data.customDecks || []; wordProgress = data.wordProgress || {}; vocabMeta = data.vocabMeta || {}; dailyChallenges = data.dailyChallenges || []; syntaxList = data.syntaxList || []; listenHistory = data.listenHistory || []; studyLogs = data.studyLogs || []; yearlyPlan = data.yearlyPlan || yearlyPlan; examMistakes = data.examMistakes || []; calcMistakes = data.calcMistakes || []; otherMistakes = data.otherMistakes || []; subjectFolders = data.subjectFolders || [];
    Object.values(save).forEach(f => f());
    showToast('復元しました。再読み込みします。');
    setTimeout(() => location.reload(), 1500);
  } else {
    showToast('バックアップデータの読み込みに失敗しました');
  }
};

const initFirebaseSafe = () => {
  try {
    const firebaseConfig = { apiKey: "AIzaSyBbIaem_gtmb9Qjt95loeAAa-ymBwP6rSM", authDomain: "study-app-faf25.firebaseapp.com", projectId: "study-app-faf25", storageBucket: "study-app-faf25.firebasestorage.app", messagingSenderId: "282913543801", appId: "1:282913543801:web:8e5f73aa46bcce613ca6a8" };
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    window._db = firebase.firestore(); window._auth = firebase.auth();
    const login = () => window._auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(() => showToast('ログイン完了')).catch((e) => { console.error(e); showToast('ログインエラー: ' + e.message); });
    const logout = () => window._auth.signOut().then(() => showToast('ログアウト完了'));
    window._auth.onAuthStateChanged(u => {
      const st = $('firebase-login-status'), btn = $('firebase-auth-btn');
      if (st && btn) {
        if (u) {
          st.textContent = 'ログイン中: ' + u.email; btn.textContent = 'ログアウト'; btn.onclick = logout;
          btn.className = 'action-btn mb-0 btn-auto-width btn-sm-pad btn-outline';
          if (userProfile.autoSync) {
            window._db.collection('users').doc(u.uid).collection('data').doc('misc').onSnapshot(doc => {
              if (doc.exists && doc.data().updatedAt) {
                const localTime = localStorage.getItem('study_last_sync_time');
                const remoteTime = doc.data().updatedAt.toMillis();
                if (!localTime || remoteTime > parseInt(localTime)) cloudSync('pull', true);
              }
            });
          }
        } else {
          st.textContent = '未ログイン'; btn.textContent = 'Googleログイン'; btn.onclick = login;
          btn.className = 'action-btn mb-0 btn-auto-width btn-sm-pad bg-accent';
        }
      }
    });
  } catch (e) { const st = $('firebase-login-status'); if (st) st.textContent = '無効'; }
};
initFirebaseSafe();

const chunkArray = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

const mergeWords = (local, remote) => {
  const map = new Map();
  local.forEach(w => map.set(w.word.toLowerCase(), w));
  remote.forEach(w => {
    const key = w.word.toLowerCase();
    if (!map.has(key)) {
      map.set(key, w);
    } else {
      const existing = map.get(key);
      existing.meaning = w.meaning || existing.meaning;
      existing.example = w.example || existing.example;
      existing.tags = [...new Set([...(existing.tags||[]), ...(w.tags||[])])];
      if(w.detailHtml) existing.detailHtml = w.detailHtml;
    }
  });
  return Array.from(map.values());
};

const mergeHistory = (local, remote) => {
  const map = new Map();
  local.forEach(h => map.set(h.id, h));
  remote.forEach(h => map.set(h.id, h));
  return Array.from(map.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
};

const cloudSync = async (m, isAuto = false) => {
  if (!window._auth) return !isAuto && showToast('無効'); const u = window._auth.currentUser; if (!u) return !isAuto && showToast('ログイン必須');
  const c = window._db.collection('users').doc(u.uid).collection('data');
  try {
    if (m === 'push') {
      if (!isAuto) showToast('Push中...');
      const batch = window._db.batch();
      
      const wordChunks = chunkArray(ALL_WORDS, 300);
      batch.set(c.doc('words_meta'), { chunks: wordChunks.length, savedWords: JSON.stringify(savedWords), srsData: JSON.stringify(srsData), wordProgress: JSON.stringify(wordProgress), vocabMeta: JSON.stringify(vocabMeta) });
      
      const oldMetaSn = await c.doc('words_meta').get();
      if (oldMetaSn.exists) {
        const oldChunksCount = oldMetaSn.data().chunks || 0;
        for (let i = wordChunks.length; i < oldChunksCount; i++) {
          batch.delete(c.doc(`words_chunk_${i}`));
        }
      }

      wordChunks.forEach((chunk, i) => { batch.set(c.doc(`words_chunk_${i}`), { data: JSON.stringify(chunk) }); });
      
      batch.set(c.doc('history'), { writingHistory: JSON.stringify(writingHistory.slice(0, 50)), listenHistory: JSON.stringify(listenHistory.slice(0, 50)), dailyChallenges: JSON.stringify(dailyChallenges.slice(0, 50)) });
      batch.set(c.doc('qa'), { subjectSaved: JSON.stringify(subjectSaved.slice(0, 50)), subjectQuizzes: JSON.stringify(subjectQuizzes.slice(0, 50)), subjectFolders: JSON.stringify(subjectFolders) });
      batch.set(c.doc('plans'), { plans: JSON.stringify(plans), events: JSON.stringify(events), studyLogs: JSON.stringify(studyLogs), textbooks: JSON.stringify(textbooks), yearlyPlan: JSON.stringify(yearlyPlan) });
      batch.set(c.doc('misc'), { examScores: JSON.stringify(examScores), customDecks: JSON.stringify(customDecks), syntaxList: JSON.stringify(syntaxList), userProfile: JSON.stringify(userProfile), freezeLogs: JSON.stringify(freezeLogs), examMistakes: JSON.stringify(examMistakes), calcMistakes: JSON.stringify(calcMistakes), otherMistakes: JSON.stringify(otherMistakes), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      
      await batch.commit();
      localStorage.setItem('study_last_sync_time', Date.now().toString());
      if (!isAuto) showToast('Push完了');
    } else {
      if (!isAuto) showToast('Pull中...'); let found = false;
      
      const metaSn = await c.doc('words_meta').get();
      if (metaSn.exists) {
        found = true; const r = metaSn.data(), ps = (data, fb) => { if (typeof data === 'string') { try { return JSON.parse(data); } catch (e) { return fb; } } return data || fb; };
        if (r.savedWords) savedWords = [...new Set([...savedWords, ...ps(r.savedWords, [])])]; 
        if (r.srsData) srsData = { ...srsData, ...ps(r.srsData, {}) }; 
        if (r.wordProgress) wordProgress = { ...wordProgress, ...ps(r.wordProgress, {}) }; 
        if (r.vocabMeta) vocabMeta = { ...vocabMeta, ...ps(r.vocabMeta, {}) };
        
        let pulledWords = [];
        for (let i = 0; i < (r.chunks || 0); i++) {
          const chunkSn = await c.doc(`words_chunk_${i}`).get();
          if (chunkSn.exists) pulledWords = pulledWords.concat(ps(chunkSn.data().data, []));
        }
        if (pulledWords.length > 0) ALL_WORDS = mergeWords(ALL_WORDS, pulledWords);
      }

      for (const d of ['history', 'qa', 'plans', 'misc']) {
        const sn = await c.doc(d).get();
        if (sn.exists) {
          found = true; const r = sn.data(), ps = (data, fb) => { if (typeof data === 'string') { try { return JSON.parse(data); } catch (e) { return fb; } } return data || fb; };
          if (r.writingHistory) writingHistory = mergeHistory(writingHistory, ps(r.writingHistory, []));
          if (r.listenHistory) listenHistory = mergeHistory(listenHistory, ps(r.listenHistory, []));
          if (r.dailyChallenges) dailyChallenges = mergeHistory(dailyChallenges, ps(r.dailyChallenges, []));
          if (r.subjectSaved) subjectSaved = mergeHistory(subjectSaved, ps(r.subjectSaved, [])); 
          if (r.subjectQuizzes) subjectQuizzes = mergeHistory(subjectQuizzes, ps(r.subjectQuizzes, []));
          if (r.subjectFolders) subjectFolders = ps(r.subjectFolders, []);
          
          if (r.plans) plans = { ...plans, ...ps(r.plans, {}) }; 
          if (r.events) events = { ...events, ...ps(r.events, {}) }; 
          if (r.studyLogs) {
            const remLogs = ps(r.studyLogs, []);
            const map = new Map();
            studyLogs.forEach(l => map.set(l.ts, l));
            remLogs.forEach(l => map.set(l.ts, l));
            studyLogs = Array.from(map.values());
          }
          if (r.textbooks) textbooks = [...new Set([...textbooks, ...ps(r.textbooks, [])])]; 
          if (r.yearlyPlan) yearlyPlan = ps(r.yearlyPlan, yearlyPlan);
          if (r.examScores) examScores = mergeHistory(examScores, ps(r.examScores, [])); 
          if (r.customDecks) customDecks = mergeHistory(customDecks, ps(r.customDecks, [])); 
          if (r.syntaxList) syntaxList = mergeHistory(syntaxList, ps(r.syntaxList, [])); 
          if (r.userProfile) userProfile = { ...userProfile, ...ps(r.userProfile, {}) }; 
          if (r.freezeLogs) freezeLogs = [...new Set([...freezeLogs, ...ps(r.freezeLogs, [])])];
          if (r.examMistakes) examMistakes = mergeHistory(examMistakes, ps(r.examMistakes, []));
          if (r.calcMistakes) calcMistakes = mergeHistory(calcMistakes, ps(r.calcMistakes, []));
          if (r.otherMistakes) otherMistakes = mergeHistory(otherMistakes, ps(r.otherMistakes, []));
        }
      }
      if (found) { 
        Object.values(save).forEach(f => f()); 
        localStorage.setItem('study_last_sync_time', Date.now().toString());
        if (!isAuto) { showToast('Pull完了'); setTimeout(() => location.reload(), 1000); }
        else { showToast('データを同期しました'); triggerTabEffects(TABS[currentTabIndex]); }
      } else if (!isAuto) showToast('データなし');
    }
  } catch (e) { if (!isAuto) showToast('通信エラー'); console.error(e); }
};
const toggleAutoSync = () => { userProfile.autoSync = !userProfile.autoSync; save.profile(); updateAutoSyncBtn(); };
const updateAutoSyncBtn = () => { const b = $('auto-sync-btn'); if (b) b.textContent = (customTexts['manage_sync_btn'] || '自動同期(リアルタイム):') + ` ${userProfile.autoSync ? 'ON' : 'OFF'}`; };

window.addEventListener('online', async () => { 
  if (userProfile.autoSync && window._auth && window._auth.currentUser) { 
    await cloudSync('pull', true);
    cloudSync('push', true); 
  } 
});

// ============================================================
// [4] THEME & SETTINGS
// ============================================================
const applyTheme = () => {
  let isD = false;
  if (darkThemeMode === 'auto') isD = window.matchMedia('(prefers-color-scheme: dark)').matches;
  else isD = darkThemeMode === 'dark';
  
  const scheduleEnabled = safeGet('study_dark_schedule_enabled', false);
  if (scheduleEnabled && darkThemeMode === 'auto') {
    const start = safeGet('study_dark_schedule_start', '20:00');
    const end = safeGet('study_dark_schedule_end', '06:00');
    const now = new Date();
    const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (start < end) {
      isD = currentHM >= start && currentHM <= end;
    } else {
      isD = currentHM >= start || currentHM <= end;
    }
  }

  document.documentElement.setAttribute('data-theme', isD ? 'dark' : '');
  const b = $('dark-toggle-btn'); if (b) b.textContent = darkThemeMode === 'auto' ? 'AUTO' : isD ? 'LIGHT' : 'DARK';
  Chart.defaults.color = isD ? '#A8A49E' : '#5C5952';
  Chart.defaults.borderColor = isD ? '#3E3C37' : '#E2DFD8';
  
  if (currentTabIndex === 0) renderDashboard();
  if (currentTabIndex === 8 && planMode === 'score') renderScoreChart();
  if (currentTabIndex === 9 && mistakeTab === 'exam') renderMistakeRadarChart();
};
const toggleDark = () => { darkThemeMode = darkThemeMode === 'auto' ? 'dark' : darkThemeMode === 'dark' ? 'light' : 'auto'; safeSet('study_dark_mode', darkThemeMode); applyTheme(); };
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (darkThemeMode === 'auto') applyTheme(); });

window.setThemeColor = (colorKey) => { 
  userProfile.themeColor = colorKey; 
  save.profile(); 
  applyThemeColor(); 
};

window.applyCustomThemeColor = () => {
  const color = $('custom-theme-bg').value;
  userProfile.customThemeColor = color;
  userProfile.themeColor = 'custom';
  save.profile();
  applyThemeColor();
};

const applyThemeColor = () => { 
  if (userProfile.themeColor === 'custom' && userProfile.customThemeColor) {
    document.documentElement.style.setProperty('--accent', userProfile.customThemeColor);
    document.documentElement.style.setProperty('--streak', userProfile.customThemeColor);
  } else {
    const t = THEMES[userProfile.themeColor || 'default']; 
    if (t) { 
      document.documentElement.style.setProperty('--accent', t.accent); 
      document.documentElement.style.setProperty('--streak', t.streak); 
    } 
  }
};

window.changeUiFontSize = () => {
  const s = $('ui-font-size-select').value;
  document.documentElement.setAttribute('data-font-size', s);
  localStorage.setItem('study_ui_font_size', s);
};

window.toggleDarkModeSchedule = () => {
  const toggle = $('dark-mode-schedule-toggle');
  const times = $('dark-mode-schedule-times');
  if (!toggle || !times) return;
  
  const enabled = toggle.checked;
  safeSet('study_dark_schedule_enabled', enabled);
  if (enabled) {
    times.classList.remove('hidden');
  } else {
    times.classList.add('hidden');
  }
  applyTheme();
};

window.saveDarkModeSchedule = () => {
  const start = $('dark-mode-start').value;
  const end = $('dark-mode-end').value;
  safeSet('study_dark_schedule_start', start);
  safeSet('study_dark_schedule_end', end);
  applyTheme();
};

const updateFsrsRetention = (val) => { fsrsRetention = Math.min(99, parseInt(val)); const lbl = $('fsrs-retention-label'); if (lbl) lbl.textContent = fsrsRetention + '%'; safeSet('study_fsrs_retention', fsrsRetention); };

const saveGeminiModel = () => { localStorage.setItem('study_gemini_model', $('gemini-model-select').value); showToast('変更済'); };
const initModelSelect = () => { const s = $('gemini-model-select'); if (s) s.value = localStorage.getItem('study_gemini_model') || 'gemini-2.5-flash'; };

window.saveApiKey = () => {
  const input = $('gemini-api-key-input');
  if (!input) return;
  const val = input.value.trim();
  if (val) {
    localStorage.setItem('study_gemini_api_key', val);
    showToast('API Keyを保存しました');
  } else {
    localStorage.removeItem('study_gemini_api_key');
    showToast('API Keyを削除しました');
  }
};

// ============================================================
// [5] FSRS ALGORITHM
// ============================================================
const srsNextDate = r => { if (!r || !r.lastReview) return null; const d = new Date(r.lastReview); d.setDate(d.getDate() + (r.interval || 1)); return d; };
const srsDaysDiff = d => { if (!d) return 0; const t = new Date(); t.setHours(0,0,0,0); const n = new Date(d); n.setHours(0,0,0,0); return Math.round((n.getTime() - t.getTime()) / 86400000); };

const srsReview = (w, rt) => {
  const k = w.toLowerCase();
  const r = srsData[k] || { difficulty: 5, stability: 1, lastReview: null, reviews: 0, repetition: 0 };
  r.reviews++;
  const now = new Date();
  let g = rt === 0 ? 1 : rt === 1 ? 2 : rt === 2 ? 3 : 4;

  if (!r.lastReview) {
    r.difficulty = g === 1 ? 7 : g === 2 ? 6 : g === 3 ? 5 : 4;
    r.stability = g === 1 ? 1 : g === 2 ? 2 : g === 3 ? 3 : 4;
    r.repetition = g > 1 ? 1 : 0;
  } else {
    const d = (now - new Date(r.lastReview)) / 86400000;
    const safeStability = Math.max(0.1, r.stability);
    const ret = Math.exp(Math.log(0.9) * d / safeStability);
    r.difficulty = Math.max(1, Math.min(10, r.difficulty + (8 - r.difficulty) * 0.2 * (3 - g)));
    
    if (g === 1) {
      r.stability = Math.max(0.1, safeStability * 0.3);
      r.repetition = 0;
    } else {
      const f = 1 + Math.exp(1) * (11 - r.difficulty) * Math.pow(safeStability, -0.2) * (Math.exp(1 - ret) - 1);
      r.stability = safeStability * (g === 2 ? f * 0.8 : g === 3 ? f : f * 1.2);
      r.repetition++;
    }
  }
  
  const retentionFactor = Math.max(0.01, Math.log(fsrsRetention / 100) / Math.log(0.9));
  r.interval = Math.max(1, Math.round(r.stability * 9 * (1 / retentionFactor)));
  
  srsData[k] = { lastReview: now.toISOString(), interval: r.interval, stability: r.stability, difficulty: r.difficulty, reviews: r.reviews, repetition: r.repetition, rating: rt };
  save.srs();
};

const srsRateCurrentCard = r => {
  if (!cardList.length) return;
  const w = cardList[currentCardIdx].word;
  srsReview(w, r);
  
  if (r >= 2) {
    setWordProgress(w, 'mastered');
    if (navigator.vibrate) navigator.vibrate(30);
    if (window.confetti) confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
  } else if (r === 1) {
    setWordProgress(w, 'learning');
  } else {
    setWordProgress(w, 'learning');
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  }
  
  showToast(w + ' 記録'); changeCard(1);
};
const srsReviewItem = (key, rt) => { srsReview(key, rt); showToast('記録完了'); };

const srsGetDueItems = () => {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const dueWords = [], dueSyntax = [], dueDaily = [];
  Object.keys(srsData).forEach(k => {
    const r = srsData[k], n = srsNextDate(r);
    if (n && n <= t) {
      if (k.startsWith('syntax_')) dueSyntax.push(k.replace('syntax_', ''));
      else if (k.startsWith('daily_')) dueDaily.push(k.replace('daily_', ''));
      else dueWords.push(k);
    }
  });
  return { dueWords, dueSyntax, dueDaily };
};
const srsGetDueWords = () => srsGetDueItems().dueWords.map(w => ALL_WORDS.find(x => x.word.toLowerCase() === w)).filter(Boolean);
const srsGetNewWords = () => ALL_WORDS.filter(w => !srsData[w.word.toLowerCase()]).slice(0, 15);

// ============================================================
// [6] GEMINI API
// ============================================================
window.callGemini = async (msgs, maxT = 8192, sys = '', expectJson = false) => {
  if (!navigator.onLine) throw new Error('Offline');
  const apiKey = localStorage.getItem('study_gemini_api_key');
  if (!apiKey) throw new Error('API Key未設定');
  const mod = localStorage.getItem('study_gemini_model') || 'gemini-2.5-flash';
  const contents = [];
  
  const sanitizePrompt = (text) => {
    if (typeof text !== 'string') return text;
    return text.replace(/ignore previous instructions/gi, '')
               .replace(/system prompt/gi, '')
               .replace(/you are a/gi, '');
  };

  const finalSys = sys || '客観的かつ簡潔な参考書スタイルで出力してください。挨拶や語りかけは一切不要です。';
  if (finalSys) contents.push({ role: 'user', parts: [{ text: finalSys }] }, { role: 'model', parts: [{ text: 'OK' }] });
  
  msgs.slice(-15).forEach(m => {
    const parts = [];
    if (typeof m.content === 'string') parts.push({ text: sanitizePrompt(m.content) });
    else m.content.forEach(p => {
      if (p.type === 'text') parts.push({ text: sanitizePrompt(p.text) });
      else if (p.type === 'image' || p.type === 'inline_data') parts.push({ inlineData: { mimeType: p.source.media_type, data: p.source.data } });
    });
    contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts });
  });
  
  const body = { contents, generationConfig: { maxOutputTokens: maxT } };
  if (expectJson) body.generationConfig.responseMimeType = "application/json";

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${mod}:generateContent?key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (!res.ok) { 
    if (res.status === 429) throw new Error('429'); 
    if (res.status === 400) throw new Error('400');
    if (res.status === 401) throw new Error('401');
    throw new Error(`API Error ${res.status}`); 
  }
  const d = await res.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

// ============================================================
// [7] SPEECH & AUDIO MIXER
// ============================================================
document.addEventListener('touchstart', () => {
  if (!_audioUnlocked && window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance(''); u.volume = 0; speechSynthesis.speak(u); _audioUnlocked = true;
  }
}, { once: true, passive: true });

if (window.speechSynthesis) {
  speechSynthesis.onvoiceschanged = () => { availableVoices = speechSynthesis.getVoices(); };
}

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
  rec = new SR(); rec.lang = 'ja-JP'; rec.continuous = false; rec.interimResults = false;
  rec.onstart = () => { if (mBtn) mBtn.classList.add('listening'); showToast('音声入力中...'); };
  rec.onresult = e => {
    const t = e.results[0][0].transcript;
    if (aInp) { const s = aInp.selectionStart, v = aInp.value; aInp.value = v.slice(0, s) + t + v.slice(aInp.selectionEnd); aInp.dispatchEvent(new Event('input')); }
  };
  rec.onerror = (e) => { console.warn('Speech recognition error', e); showToast('音声認識エラー'); if (mBtn) mBtn.classList.remove('listening'); };
  rec.onend = () => { if (mBtn) mBtn.classList.remove('listening'); };
  window.addEventListener('DOMContentLoaded', () => {
    mBtn = document.createElement('button'); mBtn.className = 'global-mic-btn'; mBtn.innerHTML = '<span class="material-symbols-rounded">mic</span>'; document.body.appendChild(mBtn);
    mBtn.onmousedown = e => { e.preventDefault(); if (rec && aInp) { mBtn.classList.contains('listening') ? rec.stop() : rec.start(); } };
    document.addEventListener('focusin', e => { if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) && e.target.type !== 'checkbox') { aInp = e.target; mBtn.style.display = 'flex'; } });
    document.addEventListener('focusout', () => { setTimeout(() => { if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) { mBtn.style.display = 'none'; aInp = null; } }, 100); });
  });
} else {
  window.addEventListener('DOMContentLoaded', () => {
    const searchMicBtn = $('search-mic-btn');
    if (searchMicBtn) searchMicBtn.style.display = 'none';
  });
}

window.toggleSearchMic = () => {
  const btn = $('search-mic-btn');
  const input = $('word-input');
  if (!btn || !input) return;
  
  if (btn.classList.contains('listening')) {
    if (searchMicRec) searchMicRec.stop();
    btn.classList.remove('listening');
  } else {
    if (!SR) return showToast('ブラウザ非対応');
    searchMicRec = new SR();
    searchMicRec.lang = 'en-US';
    searchMicRec.continuous = false;
    searchMicRec.interimResults = false;
    
    searchMicRec.onstart = () => { btn.classList.add('listening'); showToast('音声入力中...'); };
    searchMicRec.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim();
      input.value = transcript;
      searchWord();
    };
    searchMicRec.onerror = () => { showToast('音声認識エラー'); btn.classList.remove('listening'); };
    searchMicRec.onend = () => { btn.classList.remove('listening'); };
    
    searchMicRec.start();
  }
};

const speakWord = (w, e) => { 
  if (e) e.stopPropagation(); 
  if (!window.speechSynthesis) return; 
  speechSynthesis.cancel(); 
  if (availableVoices.length === 0) availableVoices = speechSynthesis.getVoices();
  
  const sentences = w.match(/[^.!?]+[.!?]+/g) || [w];
  sentences.forEach(sentence => {
    const u = new SpeechSynthesisUtterance(sentence.trim()); 
    u.lang = 'en-US'; 
    speechSynthesis.speak(u); 
  });
};
const speakCurrentCard = () => { if (cardList.length) speakWord(cardList[currentCardIdx].word, null); };

const initAudioCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterCompressor = audioCtx.createDynamicsCompressor();
    masterCompressor.threshold.value = -24;
    masterCompressor.knee.value = 30;
    masterCompressor.ratio.value = 12;
    masterCompressor.attack.value = 0.003;
    masterCompressor.release.value = 0.25;
    masterCompressor.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
};

const createNoiseNode = (type) => {
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = buffer.getChannelData(0);
  
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    let white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179; b1 = 0.99332 * b1 + white * 0.0750759; b2 = 0.96900 * b2 + white * 0.1538520; b3 = 0.86650 * b3 + white * 0.3104856; b4 = 0.55000 * b4 + white * 0.5329522; b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362; output[i] *= 0.11; b6 = white * 0.115926;
  }
  
  const noise = audioCtx.createBufferSource(); noise.buffer = buffer; noise.loop = true;
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  
  if (type === 'rain') { filter.type = 'lowpass'; filter.frequency.value = 1000; }
  else if (type === 'forest') { filter.type = 'lowpass'; filter.frequency.value = 400; }
  else if (type === 'ocean') { filter.type = 'lowpass'; filter.frequency.value = 200; }
  
  gain.gain.value = noiseVolumes[type];
  noise.connect(filter); filter.connect(gain); gain.connect(masterCompressor);
  
  return { source: noise, gainNode: gain };
};

window.toggleNoise = (type) => {
  initAudioCtx();
  const btn = $(`audio-btn-${type}`);
  
  if (activeNoises[type]) {
    if (noiseNodes[type]) {
      noiseNodes[type].source.stop();
      noiseNodes[type].source.disconnect();
      noiseNodes[type] = null;
    }
    activeNoises[type] = false;
    if (btn) btn.classList.remove('active');
  } else {
    noiseNodes[type] = createNoiseNode(type);
    noiseNodes[type].source.start();
    activeNoises[type] = true;
    if (btn) btn.classList.add('active');
  }
};

window.updateNoiseVolume = (type, val) => {
  const vol = parseInt(val) / 100;
  noiseVolumes[type] = vol;
  if (noiseNodes[type] && noiseNodes[type].gainNode) {
    noiseNodes[type].gainNode.gain.value = vol;
  }
};

// ============================================================
// [8] TIMER
// ============================================================
const timerStartStop = () => {
  const pm = $('timer-pomodoro-mode');
  
  if (timerRunning) {
    clearInterval(timerInt); timerRunning = false;
    timerTime = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
    const s = $('timer-status'); if (s) s.textContent = isPomodoroBreak ? (customTexts['timer_status_break_stop'] || '休憩停止中') : (customTexts['timer_status_stopped'] || '停止中');
    const b = $('timer-start-btn'); if (b) b.textContent = customTexts['timer_btn_start'] || 'スタート';
  } else {
    timerRunning = true; timerEndTime = Date.now() + (timerTime * 1000);
    localStorage.setItem('study_timer_end', timerEndTime.toString());
    const s = $('timer-status'); if (s) s.textContent = isPomodoroBreak ? (customTexts['timer_status_break'] || '休憩中') : (customTexts['timer_status_running'] || '実行中');
    const b = $('timer-start-btn'); if (b) b.textContent = customTexts['timer_btn_stop'] || 'ストップ';
    
    timerInt = setInterval(() => {
      const remain = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
      timerTime = remain; updateTimerDisplay();
      if (remain <= 0) {
        clearInterval(timerInt); timerRunning = false;
        if (navigator.vibrate) navigator.vibrate(1000);
        if (Notification.permission === 'granted') {
          new Notification('Study App', { body: isPomodoroBreak ? '休憩終了！学習を再開しましょう。' : '学習終了！お疲れ様でした。' });
        }
        
        if (pm && pm.checked) {
          if (!isPomodoroBreak) {
            showToast('学習終了！5分休憩です');
            studyLogs.push({ date: todayDateStr(), subj: 'other', seconds: 25 * 60, ts: Date.now() });
            save.logs();
            isPomodoroBreak = true; timerInitial = 5 * 60; timerTime = timerInitial; updateTimerDisplay();
            if ($('timer-pomodoro-auto') && $('timer-pomodoro-auto').checked) {
              timerStartStop();
            } else {
              const s = $('timer-status'); if (s) s.textContent = customTexts['timer_status_break_stop'] || '休憩停止中';
              const b = $('timer-start-btn'); if (b) b.textContent = customTexts['timer_btn_start'] || 'スタート';
            }
          } else {
            showToast('休憩終了！学習再開です');
            isPomodoroBreak = false; timerInitial = 25 * 60; timerTime = timerInitial; updateTimerDisplay();
            if ($('timer-pomodoro-auto') && $('timer-pomodoro-auto').checked) {
              timerStartStop();
            } else {
              const s = $('timer-status'); if (s) s.textContent = customTexts['timer_status_stopped'] || '停止中';
              const b = $('timer-start-btn'); if (b) b.textContent = customTexts['timer_btn_start'] || 'スタート';
            }
          }
        } else {
          showToast('終了');
          studyLogs.push({ date: todayDateStr(), subj: 'other', seconds: timerInitial, ts: Date.now() });
          save.logs();
          const s = $('timer-status'); if (s) s.textContent = customTexts['timer_status_stopped'] || '停止中';
          const b = $('timer-start-btn'); if (b) b.textContent = customTexts['timer_btn_start'] || 'スタート';
        }
      }
    }, 1000);
  }
};

window.addEventListener('storage', (e) => {
  if (e.key === 'study_timer_end') {
    const newEnd = parseInt(e.newValue);
    if (newEnd && newEnd > Date.now()) {
      timerEndTime = newEnd;
      if (!timerRunning) {
        timerTime = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
        updateTimerDisplay();
      }
    }
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && timerRunning) {
    const remain = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
    timerTime = remain; updateTimerDisplay();
  }
});

const timerReset = () => { 
  if (timerRunning) timerStartStop(); 
  if (isPomodoroMode) {
    isPomodoroBreak = false;
    timerInitial = 25 * 60;
  }
  timerTime = timerInitial; 
  updateTimerDisplay(); 
};
const timerSetCustom = () => { const m = parseInt($('timer-input-min').value) || 0, s = parseInt($('timer-input-sec').value) || 0; timerInitial = m * 60 + s; timerTime = timerInitial; updateTimerDisplay(); };
const timerSavePreset = () => { if (!timerPresets.includes(timerInitial)) { timerPresets.push(timerInitial); safeSet('study_timer_presets', timerPresets); renderTimerPresets(); } };
const renderTimerPresets = () => {
  const p = $('timer-presets'); if (!p) return;
  p.innerHTML = timerPresets.map(t => {
    const min = Math.floor(t / 60), sec = t % 60;
    return `<div style="display:inline-flex;align-items:center;border:1.5px solid var(--border2);border-radius:50px;background:var(--bg);"><button onclick="timerInitial=${t};timerTime=${t};updateTimerDisplay()" style="padding:6px 12px;border:none;background:transparent;color:var(--text-sub);cursor:pointer;font-size:calc(12px * var(--text-scale));font-weight:700">${min}:${String(sec).padStart(2, '0')}</button><button onclick="timerDeletePreset(${t})" style="padding:6px 10px;border:none;border-left:1.5px solid var(--border2);background:transparent;color:var(--danger);cursor:pointer;font-weight:bold;font-size:calc(10px * var(--text-scale));">✕</button></div>`;
  }).join('');
};
const timerDeletePreset = t => { 
  timerPresets = timerPresets.filter(x => x !== t); 
  safeSet('study_timer_presets', timerPresets); 
  renderTimerPresets(); 
};
const updateTimerDisplay = () => { const min = Math.floor(timerTime / 60), sec = timerTime % 60; const d = $('timer-display'); if (d) d.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`; };

// ============================================================
// [9] DASHBOARD & WIDGETS
// ============================================================
let sortableWidgets = null;

window.toggleWidgetSortMode = () => {
  const container = $('dashboard-widgets');
  const btn = $('toggle-widget-sort-btn');
  if (!container || !btn) return;
  
  if (container.classList.contains('widget-sort-mode')) {
    container.classList.remove('widget-sort-mode');
    btn.textContent = customTexts['dash_sort_btn'] || '並び替え';
    btn.classList.remove('bg-accent', 'text-bg');
    if (sortableWidgets) sortableWidgets.option("disabled", true);
    saveWidgetOrder();
  } else {
    container.classList.add('widget-sort-mode');
    btn.textContent = customTexts['dash_sort_done'] || '完了';
    btn.classList.add('bg-accent', 'text-bg');
    
    if (!sortableWidgets) {
      sortableWidgets = Sortable.create(container, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        disabled: false
      });
    } else {
      sortableWidgets.option("disabled", false);
    }
  }
};

const saveWidgetOrder = () => {
  const container = $('dashboard-widgets');
  if (!container) return;
  const order = Array.from(container.children).map(el => el.getAttribute('data-widget-id')).filter(Boolean);
  safeSet('study_widget_order', order);
  showToast('レイアウトを保存しました');
};

const loadWidgetOrder = () => {
  const order = safeGet('study_widget_order', null);
  const container = $('dashboard-widgets');
  if (!order || !container) return;
  
  const elements = Array.from(container.children);
  order.forEach(id => {
    const el = elements.find(e => e.getAttribute('data-widget-id') === id);
    if (el) container.appendChild(el);
  });
};

window.openWidgetSettingsModal = () => {
  const list = $('widget-settings-list');
  if (!list) return;
  
  const allWidgets = [
    { id: 'wotd', name: '今日の単語' },
    { id: 'hero', name: '総学習時間・ランク' },
    { id: 'quote', name: '今日の名言' },
    { id: 'countdown', name: '目標カウントダウン' },
    { id: 'yearly', name: '今月の目標' },
    { id: 'actions', name: 'アクションボタン (Weekly/Analysis)' },
    { id: 'streak', name: '連続学習日数' },
    { id: 'weekly-chart', name: '週別学習時間グラフ' },
    { id: 'radar-chart', name: '学習バランスレーダーチャート' },
    { id: 'srs-chart', name: '忘却曲線グラフ' },
    { id: 'srs-scatter', name: '記憶の定着度分布' },
    { id: 'stability-chart', name: '平均定着度推移' },
    { id: 'subj-chart', name: '科目別学習時間' },
    { id: 'heatmap', name: '学習ヒートマップ' },
    { id: 'calendar', name: 'カレンダー' },
    { id: 'quick-capture-inbox', name: 'Quick Notes' },
    { id: 'today-plan', name: '今日の予定' },
    { id: 'today-log', name: '今日の学習記録' }
  ];
  
  list.innerHTML = allWidgets.map(w => `
    <label class="flex align-center gap-2 text-sm font-bold cursor-pointer p-10 border radius-sm bg-bg">
      <input type="checkbox" class="widget-toggle-cb" value="${w.id}" ${activeWidgets.includes(w.id) ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--accent);">
      <span>${w.name}</span>
    </label>
  `).join('');
  
  const colSelect = $('widget-column-select');
  if (colSelect) colSelect.value = widgetColumnMode;
  
  openModal('widget-settings-modal');
};

window.saveWidgetSettings = () => {
  const cbs = document.querySelectorAll('.widget-toggle-cb');
  activeWidgets = Array.from(cbs).filter(cb => cb.checked).map(cb => cb.value);
  safeSet('study_active_widgets', activeWidgets);
  
  const colSelect = $('widget-column-select');
  if (colSelect) {
    widgetColumnMode = colSelect.value;
    safeSet('study_widget_column_mode', widgetColumnMode);
  }
  
  closeModal('widget-settings-modal');
  renderDashboard();
  showToast('表示設定を保存しました');
};

const applyWidgetVisibility = () => {
  const container = $('dashboard-widgets');
  if (!container) return;
  
  if (widgetColumnMode === '2') {
    container.classList.add('widget-grid-2col');
  } else {
    container.classList.remove('widget-grid-2col');
  }
  
  Array.from(container.children).forEach(el => {
    const id = el.getAttribute('data-widget-id');
    if (id) {
      if (activeWidgets.includes(id)) el.style.display = '';
      else el.style.display = 'none';
    }
  });
};

const renderQuote = async () => {
  const content = $('dash-quote-content');
  if (!content || !activeWidgets.includes('quote')) return;
  
  const today = todayDateStr();
  if (cachedQuote.date === today && cachedQuote.text) {
    content.innerHTML = `<p class="text-base font-bold italic mb-1">"${esc(cachedQuote.text)}"</p><p class="text-xs text-muted mb-2">- ${esc(cachedQuote.author)}</p><p class="text-xs text-sub line-height-15">${esc(cachedQuote.explanation)}</p>`;
    return;
  }
  
  try {
    const prompt = `英語の著名な名言やことわざを1つ選び、JSONで出力してください。形式: {"text":"英語の名言", "author":"発言者", "explanation":"文法構造や使われている単語の簡潔な解説と和訳"}`;
    const rep = await callGemini([{ role: 'user', content: prompt }], 8192, '', true);
    const json = extractJSON(rep);
    if (json && json.text) {
      cachedQuote = { date: today, text: json.text, author: json.author || 'Unknown', explanation: json.explanation || '' };
      safeSet('study_quote_cache', cachedQuote);
      content.innerHTML = `<p class="text-base font-bold italic mb-1">"${esc(cachedQuote.text)}"</p><p class="text-xs text-muted mb-2">- ${esc(cachedQuote.author)}</p><p class="text-xs text-sub line-height-15">${esc(cachedQuote.explanation)}</p>`;
    }
  } catch (e) {
    content.innerHTML = '<p class="text-xs text-muted">名言の取得に失敗しました。</p>';
  }
};

const renderCountdown = () => {
  const display = $('dash-countdown-display');
  if (!display) return;
  
  if (!countdownData.name || !countdownData.date) {
    display.innerHTML = '<p class="text-sm text-muted" data-i18n="dash_countdown_empty">目標日が設定されていません</p>';
    return;
  }
  
  const targetDate = new Date(countdownData.date);
  targetDate.setHours(0,0,0,0);
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    display.innerHTML = `
      <div class="countdown-label mb-1">${esc(countdownData.name)}まで あと</div>
      <div class="countdown-number">${diffDays}<span style="font-size:16px; color:var(--text-sub); margin-left:4px;">日</span></div>
    `;
  } else if (diffDays === 0) {
    display.innerHTML = `
      <div class="countdown-label mb-1">${esc(countdownData.name)}</div>
      <div class="countdown-number text-danger" style="font-size:32px;">本日当日！</div>
    `;
  } else {
    display.innerHTML = `
      <div class="countdown-label mb-1">${esc(countdownData.name)}から</div>
      <div class="countdown-number text-muted">${Math.abs(diffDays)}<span style="font-size:16px; margin-left:4px;">日経過</span></div>
    `;
  }
};

window.openCountdownSettings = () => {
  $('countdown-name').value = countdownData.name || '';
  $('countdown-date').value = countdownData.date || '';
  openModal('countdown-modal');
};

window.saveCountdown = () => {
  const name = $('countdown-name').value.trim();
  const date = $('countdown-date').value;
  if (!name || !date) return showToast('入力してください');
  countdownData = { name, date };
  safeSet('study_countdown', countdownData);
  renderCountdown();
  closeModal('countdown-modal');
  showToast('保存しました');
};

const dashWeeklyPrev = () => { dashWeeklyOffset++; renderDashboard(); };
const dashWeeklyNext = () => { if (dashWeeklyOffset > 0) dashWeeklyOffset--; renderDashboard(); };

window.openQuickCaptureModal = () => {
  const input = $('qc-text-input');
  if (input) input.value = '';
  openModal('quick-capture-modal');
};

window.saveQuickCapture = () => {
  const input = $('qc-text-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  quickCaptures.unshift({ id: generateId(), text, date: new Date().toLocaleString('ja-JP') });
  safeSet('study_quick_captures', quickCaptures);
  closeModal('quick-capture-modal');
  showToast('メモを保存しました');
  renderQuickCaptures();
};

const renderQuickCaptures = () => {
  const list = $('quick-capture-list');
  if (!list) return;
  if (!quickCaptures.length) {
    list.innerHTML = '<p class="text-xs text-muted text-center">メモはありません</p>';
    return;
  }
  list.innerHTML = quickCaptures.map(qc => `
    <div class="card mb-2 p-10">
      <div class="text-xs text-muted mb-1">${qc.date}</div>
      <div class="text-sm line-height-15">${esc(qc.text).replace(/\n/g, '<br>')}</div>
      <div class="flex justify-end mt-1">
        <button class="btn-clear text-danger text-xs" onclick="deleteQuickCapture('${qc.id}')">削除</button>
      </div>
    </div>
  `).join('');
};

window.deleteQuickCapture = (id) => {
  const qc = quickCaptures.find(q => q.id === id);
  if (!qc) return;
  quickCaptures = quickCaptures.filter(q => q.id !== id);
  safeSet('study_quick_captures', quickCaptures);
  renderQuickCaptures();
  showUndoSnackbar('メモを削除しました', () => {
    quickCaptures.unshift(qc);
    safeSet('study_quick_captures', quickCaptures);
    renderQuickCaptures();
  }, () => {});
};

const renderChartSafe = (canvasId, renderFn) => {
  const cv = $(canvasId);
  if (!cv) return;
  if (cv.offsetParent !== null) {
    renderFn();
  } else {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        renderFn();
        observer.disconnect();
      }
    });
    observer.observe(cv);
  }
};

const renderDashboard = () => {
  applyWidgetVisibility();
  
  const tH = Math.floor(getTotalStudySeconds() / 3600);
  const h = $('dash-hours-text'); if (h) h.textContent = (customTexts['dash_hero_hours'] || '総学習時間: 0時間 | XP: 0').replace('0時間', `${tH}時間`).replace('0', userProfile.xp || 0);
  const curLv = Math.floor(Math.sqrt((userProfile.xp || 0) / 100)) + 1;
  const rN = $('dash-rank-name'); if (rN) rN.textContent = `Lv.${curLv} ${tH >= 100 ? 'Master' : tH >= 50 ? 'Advanced' : tH >= 10 ? 'Intermediate' : 'Beginner'}`;
  
  const avatarEl = $('dash-avatar');
  if (avatarEl) {
    avatarEl.textContent = curLv < 5 ? 'Lv.1' : curLv < 10 ? 'Lv.2' : curLv < 20 ? 'Lv.3' : curLv < 30 ? 'Lv.4' : curLv < 50 ? 'Lv.5' : 'MAX';
    avatarEl.style.fontSize = '18px';
    avatarEl.style.fontWeight = 'bold';
  }

  renderWordOfTheDay(); renderCountdown(); renderQuote(); renderQuickCaptures();

  const studiedDays = new Set(studyLogs.map(l => l.date));
  const tD = $('dash-total-days'); if (tD) tD.textContent = studiedDays.size;
  
  let streak = 0, currentD = new Date(), todayStr = todayDateStr(), lookback = 0;
  while (lookback < 365) {
    const dStr = `${currentD.getFullYear()}-${String(currentD.getMonth() + 1).padStart(2, '0')}-${String(currentD.getDate()).padStart(2, '0')}`;
    if (studiedDays.has(dStr) || freezeLogs.includes(dStr)) { streak++; currentD.setDate(currentD.getDate() - 1); } 
    else if (dStr === todayStr) { currentD.setDate(currentD.getDate() - 1); } 
    else break;
    lookback++;
  }
  const sN = $('dash-streak'); if (sN) sN.textContent = streak;
  
  renderDashboardCalendar();
  
  const ys = $('dash-yearly-summary');
  if (ys && activeWidgets.includes('yearly')) {
    const curMonth = new Date().getMonth() + 1;
    if (yearlyPlan.goal || (yearlyPlan.months && yearlyPlan.months[curMonth])) {
      ys.classList.remove('hidden'); $('dash-yearly-month').textContent = curMonth;
      $('dash-yearly-month-goal').textContent = yearlyPlan.months[curMonth] || '未設定';
      $('dash-yearly-main-goal').textContent = yearlyPlan.goal || '未設定';
    } else ys.classList.add('hidden');
  }

  if (activeWidgets.includes('weekly-chart')) {
    renderChartSafe('dash-weekly-chart', () => {
      const wCv = $('dash-weekly-chart');
      const now = new Date();
      now.setDate(now.getDate() - (dashWeeklyOffset * 7));
      const currentDay = now.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      
      const labels = ['月', '火', '水', '木', '金', '土', '日'];
      const data = [0, 0, 0, 0, 0, 0, 0];
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const logsForDay = studyLogs.filter(l => l.date === dStr);
        const totalSec = logsForDay.reduce((sum, l) => sum + l.seconds, 0);
        data[i] = Math.floor(totalSec / 60);
      }
      
      const lbl = $('dash-weekly-label');
      if (lbl) {
        if (dashWeeklyOffset === 0) lbl.textContent = customTexts['dash_chart_weekly_this'] || '今週';
        else if (dashWeeklyOffset === 1) lbl.textContent = '先週';
        else lbl.textContent = `${dashWeeklyOffset}週前`;
      }

      if (dashWeeklyChart) dashWeeklyChart.destroy();
      dashWeeklyChart = new Chart(wCv, {
        type: 'bar',
        data: { labels, datasets: [{ label: '学習時間(分)', data, backgroundColor: '#2980B9', borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
      });
    });
  }

  const subjTotals = {}; studyLogs.forEach(l => { subjTotals[l.subj] = (subjTotals[l.subj] || 0) + l.seconds; });
  
  if (activeWidgets.includes('subj-chart')) {
    renderChartSafe('dash-subj-chart', () => {
      const cv = $('dash-subj-chart');
      if (Object.keys(subjTotals).length === 0) {
        $('dash-subj-chart-card').classList.add('hidden'); 
      } else {
        $('dash-subj-chart-card').classList.remove('hidden');
        const labels = Object.keys(subjTotals).map(k => SCORE_SUBJECTS[k]?.label || k);
        const data = Object.values(subjTotals).map(v => Math.floor(v / 60));
        const goals = Object.keys(subjTotals).map(k => goalTimes[k] || 0);
        
        if (dashSubjChart) dashSubjChart.destroy();
        dashSubjChart = new Chart(cv, { 
          type: 'bar', 
          data: { 
            labels, 
            datasets: [
              { label: '学習時間(分)', data, backgroundColor: '#2980B9', borderRadius: 4 },
              { label: '目標時間(分)', data: goals, type: 'line', borderColor: '#E67E22', backgroundColor: 'transparent', borderDash: [5, 5], pointRadius: 0 }
            ] 
          }, 
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } 
        });
      }
    });
  }

  if (activeWidgets.includes('radar-chart')) {
    renderChartSafe('dash-radar-chart', () => {
      const rCv = $('dash-radar-chart');
      if (Object.keys(subjTotals).length === 0) {
        $('dash-radar-chart-card').classList.add('hidden');
      } else {
        $('dash-radar-chart-card').classList.remove('hidden');
        const labels = ['英語', '数学', '国語', '理科', '社会', 'その他'];
        const keys = ['english', 'math', 'japanese', 'science', 'social', 'other'];
        const data = keys.map(k => Math.floor((subjTotals[k] || 0) / 60));
        if (dashRadarChart) dashRadarChart.destroy();
        dashRadarChart = new Chart(rCv, {
          type: 'radar',
          data: {
            labels,
            datasets: [{
              label: '学習時間(分)',
              data,
              backgroundColor: 'rgba(45, 43, 39, 0.2)',
              borderColor: '#2D2B27',
              pointBackgroundColor: '#E67E22',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: '#E67E22'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { r: { angleLines: { display: true }, suggestedMin: 0 } }
          }
        });
      }
    });
  }

  if (Object.keys(srsData).length > 0) {
    if(activeWidgets.includes('srs-chart')) $('dash-srs-chart-card').classList.remove('hidden'); 
    if(activeWidgets.includes('srs-scatter')) $('dash-srs-scatter-card').classList.remove('hidden');
    if(activeWidgets.includes('stability-chart') && $('dash-stability-chart-card')) $('dash-stability-chart-card').classList.remove('hidden');
    
    const buckets = { today: 0, d1: 0, d3: 0, d7: 0, d14: 0 }, scatterData = [];
    let totalStability = 0;
    
    Object.values(srsData).forEach(r => {
      const diff = srsDaysDiff(srsNextDate(r));
      if (diff <= 0) buckets.today++; else if (diff === 1) buckets.d1++; else if (diff <= 3) buckets.d3++; else if (diff <= 7) buckets.d7++; else buckets.d14++;
      scatterData.push({ x: r.stability, y: r.difficulty });
      totalStability += r.stability;
    });
    
    if (activeWidgets.includes('srs-chart')) {
      renderChartSafe('dash-srs-chart', () => {
        const srsCv = $('dash-srs-chart');
        if (dashSrsChart) dashSrsChart.destroy();
        dashSrsChart = new Chart(srsCv, { type: 'bar', data: { labels: ['今日', '1日後', '3日以内', '7日以内', '14日以上'], datasets: [{ label: '単語数', data: [buckets.today, buckets.d1, buckets.d3, buckets.d7, buckets.d14], backgroundColor: ['#C0392B', '#E67E22', '#F1C40F', '#2E7D52', '#2980B9'], borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 5 } } } } });
      });
    }
    
    if (activeWidgets.includes('srs-scatter')) {
      renderChartSafe('dash-srs-scatter', () => {
        const srsScatterCv = $('dash-srs-scatter');
        if (dashSrsScatter) dashSrsScatter.destroy();
        dashSrsScatter = new Chart(srsScatterCv, { type: 'scatter', data: { datasets: [{ label: '単語', data: scatterData, backgroundColor: 'rgba(41, 128, 185, 0.5)', pointRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'Stability (定着度)' }, min: 0 }, y: { title: { display: true, text: 'Difficulty (難易度)' }, min: 1, max: 10 } } } });
      });
    }
    
    if (activeWidgets.includes('stability-chart')) {
      renderChartSafe('dash-stability-chart', () => {
        const stabCv = $('dash-stability-chart');
        const avgStability = totalStability / Object.keys(srsData).length;
        if (dashStabilityChart) dashStabilityChart.destroy();
        dashStabilityChart = new Chart(stabCv, {
          type: 'bar',
          data: { labels: ['現在の平均定着度'], datasets: [{ label: 'Stability', data: [avgStability], backgroundColor: '#27AE60', borderRadius: 4 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
      });
    }
  } else {
    if ($('dash-srs-chart-card')) $('dash-srs-chart-card').classList.add('hidden');
    if ($('dash-srs-scatter-card')) $('dash-srs-scatter-card').classList.add('hidden');
    if ($('dash-stability-chart-card')) $('dash-stability-chart-card').classList.add('hidden');
  }

  const hm = $('dash-heatmap');
  if (hm && activeWidgets.includes('heatmap')) {
    const mode = $('heatmap-mode-select') ? $('heatmap-mode-select').value : 'time';
    let html = ''; const td = new Date(); td.setHours(0, 0, 0, 0); const stD = new Date(td); stD.setDate(stD.getDate() - 89);
    for (let i = 0; i < stD.getDay(); i++) html += `<div style="width:12px;height:12px;border-radius:2px;background:transparent;"></div>`;
    
    const sMap = {}; 
    if (mode === 'time') {
      studyLogs.forEach(l => { sMap[l.date] = (sMap[l.date] || 0) + l.seconds; });
    } else if (mode === 'accuracy') {
      const accMap = {};
      dailyChallenges.forEach(d => { if(d.score !== null) { if(!accMap[d.date]) accMap[d.date] = []; accMap[d.date].push(d.score); } });
      Object.keys(accMap).forEach(k => { sMap[k] = accMap[k].reduce((a,b)=>a+b,0) / accMap[k].length; });
    } else if (mode === 'new_words') {
      Object.values(srsData).forEach(r => {
        if(r.lastReview && r.repetition === 0) {
          const d = new Date(r.lastReview);
          const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          sMap[ds] = (sMap[ds] || 0) + 1;
        }
      });
    }

    for (let i = 0; i < 90; i++) {
      const d = new Date(stD); d.setDate(d.getDate() + i); const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const val = sMap[ds] || 0; let bg = 'var(--bg2)'; 
      let title = `${ds}: 0`;
      
      if (val > 0) {
        if (mode === 'time') {
          bg = val < 1800 ? '#a8e6cf' : val < 3600 ? '#3d8361' : '#1c4b27';
          title = `${ds}: ${Math.floor(val / 60)}分`;
        } else if (mode === 'accuracy') {
          bg = val < 50 ? '#fde8e6' : val < 80 ? '#f1c40f' : '#27ae60';
          title = `${ds}: 正答率 ${Math.round(val)}%`;
        } else if (mode === 'new_words') {
          bg = val < 5 ? '#d4e6f1' : val < 15 ? '#2980b9' : '#154360';
          title = `${ds}: 新規 ${val}語`;
        }
      }
      html += `<div style="width:12px;height:12px;border-radius:2px;background:${bg};cursor:pointer;" title="${title}" onclick="openStudyLogModal('${ds}')"></div>`;
    }
    hm.innerHTML = html; hm.scrollLeft = hm.scrollWidth;
  }

  const today = todayDateStr(), evL = $('dash-today-event-list'), plL = $('dash-today-plan-list');
  if (evL && activeWidgets.includes('today-plan')) { const evs = events[today] || []; evL.innerHTML = evs.length ? evs.map(e => `<div class="plan-item-row" style="margin-bottom:6px;border-left:3px solid #3498db;"><div class="pi-text" style="font-size:13px;">${esc(e.text)}</div></div>`).join('') : '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">イベントなし</div>'; }
  if (plL && activeWidgets.includes('today-plan')) { const pls = plans[today] || []; plL.innerHTML = pls.length ? pls.map((p, i) => `<div class="plan-item-row" style="margin-bottom:6px;"><input type="checkbox" ${p.done ? 'checked' : ''} onchange="toggleDashPlan(${i})"><div style="flex:1"><div class="pi-text ${p.done ? 'done' : ''}" style="font-size:13px;">${esc(p.text)}</div></div></div>`).join('') : '<div style="font-size:12px;color:var(--text-muted);">予定なし</div>'; }
  const tdL = $('dash-today-list'); if (tdL && activeWidgets.includes('today-log')) { const logs = studyLogs.filter(l => l.date === today); tdL.innerHTML = logs.length ? logs.map(l => `<div class="study-log-item"><span class="sli-subj">${esc(SCORE_SUBJECTS[l.subj]?.label || l.subj)}</span><span class="sli-dur">${Math.floor(l.seconds / 60)}分</span></div>`).join('') : '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:10px">記録なし</div>'; }
  
  applyCustomTexts();
};

const toggleDashPlan = i => { const today = todayDateStr(); if (plans[today] && plans[today][i]) { plans[today][i].done = !plans[today][i].done; save.plans(); renderDashboard(); if (planMode === 'calendar') renderPlanCalendar(); } };

const dashCalPrev = () => { dashCalMonth--; if (dashCalMonth < 0) { dashCalMonth = 11; dashCalYear--; } renderDashboardCalendar(); };
const dashCalNext = () => { dashCalMonth++; if (dashCalMonth > 11) { dashCalMonth = 0; dashCalYear++; } renderDashboardCalendar(); };

const renderDashboardCalendar = () => {
  if (!activeWidgets.includes('calendar')) return;
  const cl = $('cal-month-label'); if (cl) cl.textContent = `${dashCalYear}年 ${MONTHS[dashCalMonth]}`;
  const firstDay = new Date(dashCalYear, dashCalMonth, 1), lastDay = new Date(dashCalYear, dashCalMonth + 1, 0);
  let startDow = firstDay.getDay() - 1; if (startDow < 0) startDow = 6; let html = '';
  for (let i = 0; i < startDow; i++) html += `<div class="cal-day other-month"></div>`;
  const studiedDays = studyLogs.map(l => l.date), todayStr = todayDateStr();
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const ds = `${dashCalYear}-${String(dashCalMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let cls = 'cal-day'; if (ds === todayStr) cls += ' today'; if (studiedDays.includes(ds) || freezeLogs.includes(ds)) cls += ' studied';
    html += `<div class="${cls}">${d}</div>`;
  }
  const cd = $('cal-days'); if (cd) cd.innerHTML = html;
};

// ============================================================
// [10] VOCAB
// ============================================================
const fetchFreeDictFallback = async (word) => {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data[0]?.meanings[0]?.definitions[0]?.definition || null;
  } catch (e) { return null; }
};

const renderWordOfTheDay = async () => {
  const card = $('word-of-the-day-card'); if (!card || !ALL_WORDS.length || !activeWidgets.includes('wotd')) return;
  card.classList.remove('hidden');
  const today = todayDateStr(); let w;
  if (cachedWotd.date === today && cachedWotd.word && ALL_WORDS.find(x => x.word === cachedWotd.word.word)) { w = cachedWotd.word; } 
  else {
    const seed = parseInt(today.replace(/-/g, ''), 10), sortedWords = [...ALL_WORDS].sort((a, b) => a.word.localeCompare(b.word));
    wotdIndex = seed % sortedWords.length; w = sortedWords[wotdIndex];
    cachedWotd = { date: today, word: w, exampleHtml: '', meaning: '' }; safeSet('study_wotd_cache', cachedWotd);
  }
  
  $('wotd-word').textContent = w.word; 
  $('wotd-meaning').textContent = w.meaning || cachedWotd.meaning || '意味解析中...'; 
  $('wotd-speak').onclick = () => speakWord(w.word);
  
  const isSaved = savedWords.includes(w.word), sBtn = $('wotd-save-btn');
  sBtn.textContent = isSaved ? (customTexts['dash_wotd_saved'] || '保存済') : (customTexts['dash_wotd_save'] || 'Vocabに追加'); 
  sBtn.className = `action-btn mb-0 flex-1 btn-md ${isSaved ? 'btn-secondary' : ''}`;
  sBtn.onclick = () => { toggleWordSave(w.word); renderWordOfTheDay(); };

  const exBox = $('wotd-example');
  if (cachedWotd.exampleHtml) { 
    exBox.innerHTML = cachedWotd.exampleHtml; 
    if(!w.meaning && cachedWotd.meaning) {
       w.meaning = cachedWotd.meaning;
       $('wotd-meaning').textContent = w.meaning;
       save.words();
    }
  } else {
    exBox.innerHTML = '<span class="loading-dots"></span>';
    try {
      const prompt = `英単語「${w.word}」の主要な意味を簡潔に1〜2語で、またシンプルで分かりやすい英語の例文を1つとその自然な和訳を生成し、以下のJSON形式で出力してください。
{"meaning": "主な意味", "exampleHtml": "例文<br>和訳"}`;
      const rep = await callGemini([{ role: 'user', content: prompt }], 8192, '', true);
      const json = extractJSON(rep);
      if (json && json.exampleHtml) {
        const html = clean(json.exampleHtml); 
        exBox.innerHTML = html; 
        cachedWotd.exampleHtml = html; 
        if (json.meaning) {
          cachedWotd.meaning = json.meaning;
          if (!w.meaning) {
            w.meaning = json.meaning;
            $('wotd-meaning').textContent = w.meaning;
            save.words();
          }
        }
        safeSet('study_wotd_cache', cachedWotd);
      } else {
        throw new Error('Invalid JSON');
      }
    } catch (e) { 
      const fallbackMeaning = await fetchFreeDictFallback(w.word);
      if (fallbackMeaning) {
        exBox.innerHTML = `[Fallback] ${esc(fallbackMeaning)}`;
        if (!w.meaning) { w.meaning = fallbackMeaning; $('wotd-meaning').textContent = w.meaning; save.words(); }
      } else {
        exBox.textContent = '例文の取得に失敗しました。'; 
      }
    }
  }
  applyCustomTexts();
};
const nextWordOfTheDay = () => { if (!ALL_WORDS.length) return; const w = ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)]; cachedWotd = { date: todayDateStr(), word: w, exampleHtml: '', meaning: '' }; safeSet('study_wotd_cache', cachedWotd); renderWordOfTheDay(); };

const toggleWordSave = w => { const idx = savedWords.indexOf(w), add = idx === -1; if (add) savedWords.push(w); else savedWords.splice(idx, 1); save.saved(); showToast(add ? '保存' : '解除'); document.querySelectorAll(`[data-word="${CSS.escape(w)}"]`).forEach(b => { b.className = add ? 'save-btn saved' : 'save-btn unsaved'; b.textContent = add ? '保存済' : '保存'; }); };
const getWordProgress = w => wordProgress[w.toLowerCase()] || 'new';
const setWordProgress = (w, p) => { wordProgress[w.toLowerCase()] = p; save.prog(); };
const cycleWordProgress = (w, e) => { if (e) e.stopPropagation(); const o = ['new', 'learning', 'mastered']; setWordProgress(w, o[(o.indexOf(getWordProgress(w)) + 1) % o.length]); renderVocab(true); renderVocabStats(); };

const deleteWord = w => {
  const wordObj = ALL_WORDS.find(x => x.word.toLowerCase() === w.toLowerCase());
  if (!wordObj) return;
  
  ALL_WORDS = ALL_WORDS.filter(x => x.word.toLowerCase() !== w.toLowerCase());
  savedWords = savedWords.filter(x => x.toLowerCase() !== w.toLowerCase());
  delete srsData[w.toLowerCase()]; delete wordProgress[w.toLowerCase()]; delete vocabMeta[w.toLowerCase()];
  customDecks.forEach(deck => { deck.cards = deck.cards.filter(c => c.front.toLowerCase() !== w.toLowerCase()); });
  save.words(); save.saved(); save.srs(); save.prog(); save.meta(); save.decks();
  
  const sr = $('search-result'); if (sr) sr.innerHTML = '';
  closeModal('detail-modal'); renderVocab(true); renderVocabStats(); initCards(); updateTagFilters();

  showUndoSnackbar(`「${w}」を削除しました`, () => {
    ALL_WORDS.unshift(wordObj);
    save.words(); renderVocab(true); renderVocabStats(); initCards(); updateTagFilters();
  }, () => {});
};

const openAddWordModal = (editWord = null) => {
  const t = $('add-word-modal-title'), w = $('manual-word-input'), m = $('manual-meaning-input'), p = $('manual-pos-input'), ex = $('manual-example-input'), nt = $('manual-note-input'), tg = $('manual-tags-input'), old = $('manual-word-old');
  if (editWord) {
    const fd = ALL_WORDS.find(x => x.word === editWord);
    if (fd) {
      t.textContent = '単語を編集'; w.value = fd.word; m.value = fd.meaning || ''; old.value = fd.word;
      const meta = vocabMeta[fd.word.toLowerCase()];
      p.value = meta ? meta.pos : 'other';
      ex.value = fd.example || ''; nt.value = fd.note || ''; tg.value = (fd.tags || []).join(', ');
    }
  } else {
    t.textContent = customTexts['modal_add_word_title'] || '単語を手動追加'; w.value = ''; m.value = ''; old.value = ''; p.value = 'other'; ex.value = ''; nt.value = ''; tg.value = '';
  }
  
  const tags = new Set(); ALL_WORDS.forEach(word => { if (word.tags) word.tags.forEach(tag => tags.add(tag)); });
  const suggestArea = $('tag-suggest-area');
  if (suggestArea) {
    suggestArea.innerHTML = Array.from(tags).map(tag => `<button class="filter-chip" onclick="addTagToInput('${escJS(tag)}')">+ ${esc(tag)}</button>`).join('');
  }
  
  openModal('add-word-modal');
};

window.addTagToInput = (tag) => {
  const input = $('manual-tags-input');
  if (!input) return;
  let current = input.value.split(',').map(t => t.trim()).filter(Boolean);
  if (!current.includes(tag)) { current.push(tag); input.value = current.join(', '); }
};

const addWordManual = () => {
  const w = $('manual-word-input').value.trim(), m = $('manual-meaning-input').value.trim(), p = $('manual-pos-input').value, ex = $('manual-example-input').value.trim(), nt = $('manual-note-input').value.trim(), tg = $('manual-tags-input').value.split(',').map(x=>x.trim()).filter(Boolean), old = $('manual-word-old').value;
  if (!w) return showToast('単語を入力してください');
  
  const newObj = { word: w, meaning: m, example: ex, note: nt, tags: tg };
  let existingIdx = old ? ALL_WORDS.findIndex(x => x.word === old) : ALL_WORDS.findIndex(x => x.word.toLowerCase() === w.toLowerCase());
  
  if (old && old !== w) {
    if (savedWords.includes(old)) { savedWords = savedWords.filter(x => x !== old); savedWords.push(w); }
    if (srsData[old.toLowerCase()]) { srsData[w.toLowerCase()] = srsData[old.toLowerCase()]; delete srsData[old.toLowerCase()]; }
    if (wordProgress[old.toLowerCase()]) { wordProgress[w.toLowerCase()] = wordProgress[old.toLowerCase()]; delete wordProgress[old.toLowerCase()]; }
    if (vocabMeta[old.toLowerCase()]) { vocabMeta[w.toLowerCase()] = vocabMeta[old.toLowerCase()]; delete vocabMeta[old.toLowerCase()]; }
  } else if (!old && existingIdx >= 0) {
    return showToast('既に登録されています');
  }
  
  if (existingIdx >= 0) {
    ALL_WORDS[existingIdx] = { ...ALL_WORDS[existingIdx], ...newObj };
  } else {
    ALL_WORDS.unshift(newObj);
  }
  
  if (!vocabMeta[w.toLowerCase()]) vocabMeta[w.toLowerCase()] = { pos: p, etym: '', affixes: '' };
  else vocabMeta[w.toLowerCase()].pos = p;
  
  save.words(); save.meta(); save.saved(); save.srs(); save.prog();
  showToast(old ? `更新: ${w}` : `追加: ${w}`);
  closeModal('add-word-modal'); renderVocab(true); renderVocabStats(); initCards(); updateTagFilters();
  if (old) { closeModal('detail-modal'); setTimeout(() => showWordModal(w, m), 300); }
};

window.regenerateSearchWord = async (w) => {
  const i = $('word-input');
  if(i) i.value = w;
  searchWord();
};

const searchWord = async (isSuggest = false) => {
  const i = $('word-input'); if (!i) return; const w = i.value.trim();
  const s = $('word-suggest'), ld = $('loading'), sr = $('search-result');
  
  if (isSuggest) {
    if (!w) { if (s) s.innerHTML = ''; return; }
    const hits = ALL_WORDS.filter(x => x.word.toLowerCase().startsWith(w.toLowerCase()) || (x.meaning || '').toLowerCase().includes(w.toLowerCase())).slice(0, 8);
    if (s) s.innerHTML = hits.map(x => `<div class="word-chip" onclick="selectWord('${escJS(x.word)}')"><span class="wc-word">${esc(x.word)}</span><div class="wc-right"><span class="wc-mean">${esc(x.meaning || '')}</span><button class="vocab-speak audio-btn" onclick="speakWord('${escJS(x.word)}',event)">音声</button></div></div>`).join('');
    return;
  }

  if (!w) return;
  if (s) s.innerHTML = ''; if (ld) ld.classList.remove('hidden'); if (sr) sr.innerHTML = '';
  
  const fd = ALL_WORDS.find(x => x.word.toLowerCase() === w.toLowerCase()), hint = fd && fd.meaning ? `（基本意味: ${fd.meaning}）` : '';
  try {
    const prompt = `英単語「${w}」${hint}について、単語帳形式で客観的に解説してください。挨拶や語りかけは一切不要です。HTMLのみで出力し、以下のh4見出しを必ず含めてください。特に「意味・よく使われる表現」と「派生語」については、細かいニュアンスや品詞ごとの意味、考えられるすべての派生語をもれなく網羅して詳細に書き出してください。
見出し:
<h4>意味・よく使われる表現</h4> (多義語の場合は全て網羅し、熟語も詳細に記載)
<h4>語源</h4>
<h4>派生語</h4> (もれなく全て書き出すこと)
<h4>類義語</h4> (語源も簡潔に)
<h4>対義語</h4> (語源も簡潔に)`;
    
    let html = await callGemini([{ role: 'user', content: prompt }], 8192);
    html = clean(html.replace(/```html?/g, '').replace(/```/g, ''));
    if (ld) ld.classList.add('hidden');
    
    let extractMeaning = html.match(/<h4>意味・よく使われる表現<\/h4>\s*<p>(.*?)<\/p>/) || html.match(/<li>([^<]{2,40})<\/li>/);
    let meaningText = (fd && fd.meaning) ? fd.meaning : (extractMeaning ? extractMeaning[1].replace(/<[^>]+>/g, '').trim() : '解析完了');

    if (!fd) { ALL_WORDS.push({ word: w, meaning: meaningText, detailHtml: html }); save.words(); showToast(`追加: ${w}`); updateTagFilters(); } 
    else { fd.detailHtml = html; if(!fd.meaning) fd.meaning = meaningText; save.words(); }
    
    const isSaved = savedWords.includes(w), pt = `${w}\n${meaningText}\n${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`;
    if (sr) sr.innerHTML = `<div class="card result-box"><div class="flex-between mb-1"><div class="result-word-header"><div class="result-word-title">${esc(w)}</div><button class="speak-btn-large btn-pill btn-outline" onclick="speakWord('${escJS(w)}',event)">発音</button></div><div class="flex-gap-8"><button data-word="${esc(w)}" class="save-btn ${isSaved ? 'saved' : 'unsaved'}" onclick="toggleWordSave('${escJS(w)}')">${isSaved ? '保存済' : '保存'}</button><button class="copy-btn" onclick="copyText(\`${pt.replace(/`/g, '\\`')}\`,this)">コピー</button><button class="copy-btn text-danger" style="border-color:#f0d4d0;" onclick="deleteWord('${escJS(w)}')">削除</button></div></div><div class="result-meaning-badge">${esc(meaningText)}</div>${html}<div class="text-center mt-3"><button class="btn-pill btn-outline" onclick="regenerateSearchWord('${escJS(w)}')">途切れた場合は再生成</button></div></div>`;
  } catch (e) { 
    const fallbackMeaning = await fetchFreeDictFallback(w);
    if (ld) ld.classList.add('hidden');
    if (fallbackMeaning) {
      if (!fd) { ALL_WORDS.push({ word: w, meaning: fallbackMeaning, detailHtml: `<p>${esc(fallbackMeaning)}</p>` }); save.words(); showToast(`追加: ${w}`); updateTagFilters(); }
      if (sr) sr.innerHTML = `<div class="card result-box"><div class="result-word-title">${esc(w)}</div><div class="result-meaning-badge">${esc(fallbackMeaning)}</div><p class="text-sm text-muted">※AI解析に失敗したため、無料辞書APIの結果を表示しています。</p></div>`;
    } else {
      handleApiError(e, 'search-result'); 
    }
  }
};
const selectWord = w => { const i = $('word-input'); if (i) { i.value = w; const s = $('word-suggest'); if (s) s.innerHTML = ''; searchWord(); } };

window.regenerateWordDetail = async (w) => {
  const mc = $('modal-detail-content');
  if (!mc) return;
  mc.innerHTML = '<div class="text-center p-20"><span class="loading-dots">AIが再生成中</span></div>';
  try {
    const prompt = `英単語「${w}」について、単語帳形式で客観的に解説してください。挨拶や語りかけは一切不要です。HTMLのみで出力し、以下のh4見出しを必ず含めてください。特に「意味・よく使われる表現」と「派生語」については、細かいニュアンスや品詞ごとの意味、考えられるすべての派生語をもれなく網羅して詳細に書き出してください。
見出し:
<h4>意味・よく使われる表現</h4> (多義語の場合は全て網羅し、熟語も詳細に記載)
<h4>語源</h4>
<h4>派生語</h4> (もれなく全て書き出すこと)
<h4>類義語</h4> (語源も簡潔に)
<h4>対義語</h4> (語源も簡潔に)`;
    const html = await callGemini([{ role: 'user', content: prompt }], 8192);
    const parsedHtml = clean(html.replace(/```html?/g, '').replace(/```/g, ''));
    const fd = ALL_WORDS.find(x => x.word === w);
    if (fd) { fd.detailHtml = parsedHtml; save.words(); }
    mc.innerHTML = `<div class="mt-4">${parsedHtml}</div><div class="text-center mt-3"><button class="btn-pill btn-outline" onclick="regenerateWordDetail('${escJS(w)}')">途切れた場合は再生成</button></div>`;
  } catch (e) { handleApiError(e, 'modal-detail-content'); }
};

window.showWordModal = async (w, m) => {
  const isS = savedWords.includes(w), p = getWordProgress(w), mb = $('modal-body'); if (!mb) return;
  const fd = ALL_WORDS.find(x => x.word === w);
  
  let tagsHtml = '';
  if (fd && fd.tags && fd.tags.length) {
    tagsHtml = `<div class="flex gap-1 mb-2 flex-wrap">${fd.tags.map(t => `<span class="filter-chip" style="font-size:calc(9px * var(--text-scale));padding:2px 6px;">${esc(t)}</span>`).join('')}</div>`;
  }
  
  mb.innerHTML = `<div class="flex-between mb-2"><div class="result-word-header"><div class="result-word-title">${esc(w)}</div><div class="flex-gap-8"><button class="speak-btn-large btn-pill btn-outline" onclick="speakWord('${escJS(w)}',event)">発音</button></div></div><div class="flex-gap-8"><span class="prog-badge ${p}" onclick="cycleWordProgress('${escJS(w)}',event)" style="cursor:pointer;padding:5px 10px">${p}</span><button data-word="${esc(w)}" class="save-btn ${isS ? 'saved' : 'unsaved'}" onclick="toggleWordSave('${escJS(w)}')">${isS ? '保存済' : '保存'}</button><button class="copy-btn" onclick="openAddWordModal('${escJS(w)}')">編集</button><button class="copy-btn text-danger" style="border-color:#f0d4d0;" onclick="deleteWord('${escJS(w)}')">削除</button></div></div>${tagsHtml}<div class="result-meaning-badge">${esc(m || '')}</div><div id="modal-detail-content" class="result-box"><span class="loading-dots"></span></div>`;
  openModal('detail-modal');
  
  const chartContainer = $('word-retention-chart-container');
  const r = srsData[w.toLowerCase()];
  if (r && chartContainer) {
    chartContainer.classList.remove('hidden');
    const ctx = $('word-retention-chart');
    const labels = [], data = [];
    for(let i=0; i<=14; i++) {
      labels.push(i===0 ? '今日' : `${i}日後`);
      const safeStability = Math.max(0.1, r.stability);
      const ret = Math.exp(Math.log(0.9) * i / safeStability) * 100;
      data.push(ret);
    }
    if (wordRetentionChart) wordRetentionChart.destroy();
    wordRetentionChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: '記憶保持率(%)', data, borderColor: '#2980B9', backgroundColor: '#2980B933', fill: true, tension: 0.4 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }
    });
    
    // FSRS Manual Edit Fields
    $('fsrs-edit-stability').value = r.stability.toFixed(2);
    $('fsrs-edit-difficulty').value = r.difficulty.toFixed(2);
    if (r.lastReview) {
      const nextD = new Date(new Date(r.lastReview).getTime() + (r.interval || 1) * 86400000);
      $('fsrs-edit-next').value = nextD.toISOString().split('T')[0];
    }
  } else if (chartContainer) {
    chartContainer.classList.add('hidden');
    $('fsrs-edit-stability').value = '';
    $('fsrs-edit-difficulty').value = '';
    $('fsrs-edit-next').value = '';
  }
  
  const mc = $('modal-detail-content');
  if (!localStorage.getItem('study_gemini_api_key')) { if (mc) mc.innerHTML = 'API Key未設定'; return; }
  
  let customHtml = '';
  if (fd && (fd.example || fd.note)) {
    customHtml = `<div class="mb-3 p-14 bg-main radius-sm border">`;
    if (fd.example) customHtml += `<p class="text-xs font-bold text-muted mb-1">例文</p><p class="text-sm mb-2">${esc(fd.example)} <button class="btn-clear text-accent" onclick="speakWord('${escJS(fd.example)}',event)">発音</button></p>`;
    if (fd.note) customHtml += `<p class="text-xs font-bold text-muted mb-1">メモ</p><p class="text-sm">${esc(fd.note)}</p>`;
    customHtml += `</div>`;
  }
  
  if (fd && fd.detailHtml) {
    mc.innerHTML = customHtml + `<div class="mt-4">${clean(fd.detailHtml)}</div><div class="text-center mt-3"><button class="btn-pill btn-outline" onclick="regenerateWordDetail('${escJS(w)}')">途切れた場合は再生成</button></div>`;
  } else {
    regenerateWordDetail(w);
  }
  
  const imgContainer = $('modal-image-container');
  if (imgContainer) imgContainer.innerHTML = '';
};

window.saveFsrsEdit = () => {
  const titleEl = document.querySelector('#modal-body .result-word-title');
  if (!titleEl) return;
  const w = titleEl.textContent;
  const s = parseFloat($('fsrs-edit-stability').value);
  const d = parseFloat($('fsrs-edit-difficulty').value);
  const n = $('fsrs-edit-next').value;
  if (!w || isNaN(s) || isNaN(d) || !n) return showToast('入力が不正です');
  
  const r = srsData[w.toLowerCase()] || { interval: 1 };
  const nextTime = new Date(n).getTime();
  const lastTime = nextTime - (r.interval * 86400000);
  
  srsData[w.toLowerCase()] = {
    ...r,
    stability: s,
    difficulty: d,
    lastReview: new Date(lastTime).toISOString()
  };
  save.srs(); showToast('FSRSデータを更新しました'); renderVocab(true);
};

window.resetFsrsData = () => {
  const titleEl = document.querySelector('#modal-body .result-word-title');
  if (!titleEl) return;
  const w = titleEl.textContent;
  if (!confirm('この単語の学習履歴をリセットしますか？')) return;
  delete srsData[w.toLowerCase()];
  setWordProgress(w, 'new');
  save.srs(); save.prog(); showToast('リセットしました');
  closeModal('detail-modal'); renderVocab(true);
};

const highlightText = (text, query) => {
  if (!query) return esc(text);
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return esc(text).replace(regex, '<mark style="background:rgba(230,126,34,0.3);color:inherit;padding:0 2px;border-radius:2px;">$1</mark>');
};

const setPosFilter = p => { vocabPosFilter = p; document.querySelectorAll('#pos-filters .filter-chip').forEach(b => b.classList.toggle('active', b.dataset.pos === p)); renderVocab(true); };
const setProgFilter = p => { vocabProgFilter = p; document.querySelectorAll('#prog-filters .filter-chip').forEach(b => b.classList.toggle('active', b.dataset.prog === p)); renderVocab(true); };
const setTagFilter = t => { vocabTagFilter = t; document.querySelectorAll('#tag-filters .filter-chip').forEach(b => b.classList.toggle('active', b.dataset.tag === t)); renderVocab(true); };
const setPrefixFilter = v => { vocabPrefixFilter = v.trim().toLowerCase(); const b = $('prefix-clear-btn'); if (b) { if(vocabPrefixFilter) b.classList.remove('hidden'); else b.classList.add('hidden'); } renderVocab(true); };
const clearPrefixFilter = () => { vocabPrefixFilter = ''; const i = $('prefix-search-input'), b = $('prefix-clear-btn'); if (i) i.value = ''; if (b) b.classList.add('hidden'); renderVocab(true); };

const updateTagFilters = () => {
  const tags = new Set();
  ALL_WORDS.forEach(w => { if (w.tags) w.tags.forEach(t => tags.add(t)); });
  const c = $('tag-filters'), cs = $('cards-tag-select');
  if (c) {
    c.innerHTML = `<button class="filter-chip ${vocabTagFilter==='all'?'active':''}" data-tag="all" onclick="setTagFilter('all')" data-i18n="vocab_filter_tag_all">すべて</button>` + 
      Array.from(tags).map(t => `<button class="filter-chip ${vocabTagFilter===t?'active':''}" data-tag="${esc(t)}" onclick="setTagFilter('${escJS(t)}')">${esc(t)}</button>`).join('');
  }
  if (cs) {
    cs.innerHTML = `<option value="all" data-i18n="cards_tag_all">すべて</option>` + Array.from(tags).map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  }
};

const analyzeVocabMeta = async () => {
  const b = $('analyze-meta-btn'), s = $('meta-status');
  if (!localStorage.getItem('study_gemini_api_key')) return showToast('API Key未設定');
  const u = ALL_WORDS.filter(w => !vocabMeta[w.word.toLowerCase()]); if (!u.length) return showToast('完了済');
  if (b) { b.disabled = true; b.textContent = '解析中...'; }
  let done = 0;
  try {
    for (let i = 0; i < u.length; i += 40) {
      const bt = u.slice(i, i + 40); if (s) s.textContent = `${done}/${u.length} 解析`;
      const raw = await callGemini([{ role: 'user', content: `JSON array:[{"word":"...","pos":"...","etym":"...","affixes":"..."}]. Words: ${bt.map(x => x.word).join(',')}` }], 8192, '', true);
      const parsed = extractJSON(raw);
      if (parsed && Array.isArray(parsed)) { parsed.forEach(x => { if (x.word) vocabMeta[x.word.toLowerCase()] = { pos: x.pos || 'other', etym: x.etym || 'Other', affixes: x.affixes || '' }; }); }
      save.meta(); done += bt.length;
      if (i + 40 < u.length) await sleep(4000);
    }
  } catch (e) { showToast('通信エラー'); } finally { if (b) { b.disabled = false; b.textContent = customTexts['vocab_btn_analyze'] || '品詞・語源解析'; } if (s) s.textContent = '完了'; renderVocab(true); }
};

const renderVocabStats = () => {
  const m = ALL_WORDS.filter(w => getWordProgress(w.word) === 'mastered').length, l = ALL_WORDS.filter(w => getWordProgress(w.word) === 'learning').length, b = $('vocab-stats-bar');
  if (b) b.innerHTML = `<div class="vsb-item"><div class="vsb-num">${ALL_WORDS.length}</div><div class="vsb-label">Total</div></div><div class="vsb-item"><div class="vsb-num text-green">${m}</div><div class="vsb-label">${customTexts['vocab_filter_prog_mastered'] || '習得済'}</div></div><div class="vsb-item"><div class="vsb-num text-streak">${l}</div><div class="vsb-label">${customTexts['vocab_filter_prog_learning'] || '学習中'}</div></div>`;
};

let currentFilteredWords = [];

const renderVocab = (reset = false) => {
  const vi = $('vocab-search'); const q = vi ? vi.value.toLowerCase() : '';
  const sortMode = $('vocab-sort-select') ? $('vocab-sort-select').value : 'newest';
  
  let ls = ALL_WORDS.filter(w => {
    if (q && !w.word.toLowerCase().includes(q) && !(w.meaning || '').toLowerCase().includes(q)) return false;
    const m = vocabMeta[w.word.toLowerCase()];
    if (vocabPosFilter !== 'all' && (!m || m.pos !== vocabPosFilter)) return false;
    if (vocabProgFilter !== 'all' && getWordProgress(w.word) !== vocabProgFilter) return false;
    if (vocabTagFilter !== 'all' && (!w.tags || !w.tags.includes(vocabTagFilter))) return false;
    if (vocabPrefixFilter) { const a = m?.affixes?.toLowerCase() || ''; if (!w.word.toLowerCase().includes(vocabPrefixFilter) && !a.includes(vocabPrefixFilter)) return false; }
    return true;
  });
  
  if (sortMode === 'oldest') {
    ls = ls.reverse();
  } else if (sortMode === 'az') {
    ls.sort((a, b) => a.word.localeCompare(b.word));
  } else if (sortMode === 'za') {
    ls.sort((a, b) => b.word.localeCompare(a.word));
  } else if (sortMode === 'low_retention') {
    ls.sort((a, b) => {
      const rA = srsData[a.word.toLowerCase()]?.stability || 0;
      const rB = srsData[b.word.toLowerCase()]?.stability || 0;
      return rA - rB;
    });
  }
  
  currentFilteredWords = ls;
  
  const vc = $('vocab-count'), vg = $('vocab-grid'), btn = $('vocab-load-more-btn'), bulk = $('vocab-bulk-actions');
  if (vc) vc.textContent = `${ls.length} / ${ALL_WORDS.length} 語`;
  if (bulk) {
    if (ls.length > 0 && ls.length < ALL_WORDS.length) bulk.classList.remove('hidden');
    else bulk.classList.add('hidden');
  }
  
  if (!vg) return;
  if (reset) { vocabPage = 1; vg.innerHTML = ''; }
  if (!ALL_WORDS.length) { vg.innerHTML = '<div class="vocab-empty">空です</div>'; if(btn) btn.classList.add('hidden'); return; }
  
  const posL = { noun: '名', verb: '動', adjective: '形', adverb: '副', other: '他' };
  const itemsToRender = ls.slice((vocabPage - 1) * VOCAB_PER_PAGE, vocabPage * VOCAB_PER_PAGE);
  
  const fragment = document.createDocumentFragment();
  itemsToRender.forEach(w => {
    const m = vocabMeta[w.word.toLowerCase()];
    const pb = m ? `<span class="pos-badge" style="background:var(--bg2);color:var(--text-muted);font-size:10px;padding:2px 4px;border-radius:4px;">${posL[m.pos] || '他'}</span>` : '';
    const p = getWordProgress(w.word);
    const div = document.createElement('div'); div.className = 'vocab-item'; div.setAttribute('role', 'button'); div.tabIndex = 0; div.onclick = () => showWordModal(w.word, w.meaning || '');
    
    const displayWord = highlightText(w.word, q);
    const displayMeaning = highlightText(w.meaning || '', q);
    
    div.innerHTML = `<div class="vi-left"><button class="vocab-speak audio-btn p-8" onclick="speakWord('${escJS(w.word)}',event)">発音</button>${pb}<span class="vi-word">${displayWord}</span></div><div class="vi-right"><span class="prog-badge ${p}" onclick="cycleWordProgress('${escJS(w.word)}',event)">${p}</span><span class="vi-mean">${displayMeaning}</span></div>`;
    fragment.appendChild(div);
  });
  vg.appendChild(fragment);
  if (btn) { if (vocabPage * VOCAB_PER_PAGE < ls.length) btn.classList.remove('hidden'); else btn.classList.add('hidden'); }
  applyCustomTexts();
};
const loadMoreVocab = () => { vocabPage++; renderVocab(false); };

window.bulkTagWords = () => {
  if (!currentFilteredWords.length) return;
  const tag = prompt(`現在表示されている ${currentFilteredWords.length} 語に付与するタグを入力してください:`);
  if (!tag || !tag.trim()) return;
  const t = tag.trim();
  currentFilteredWords.forEach(w => {
    if (!w.tags) w.tags = [];
    if (!w.tags.includes(t)) w.tags.push(t);
  });
  save.words(); updateTagFilters(); renderVocab(true); showToast('一括タグ付け完了');
};

window.bulkResetProgress = () => {
  if (!currentFilteredWords.length) return;
  if (!confirm(`現在表示されている ${currentFilteredWords.length} 語の学習進捗(FSRS)をリセットしますか？`)) return;
  currentFilteredWords.forEach(w => {
    delete srsData[w.word.toLowerCase()];
    setWordProgress(w.word, 'new');
  });
  save.srs(); save.prog(); renderVocab(true); renderVocabStats(); showToast('進捗をリセットしました');
};

window.bulkDeleteWords = () => {
  if (!currentFilteredWords.length) return;
  if (!confirm(`現在表示されている ${currentFilteredWords.length} 語を完全に削除しますか？この操作は元に戻せません。`)) return;
  const wordsToDelete = new Set(currentFilteredWords.map(w => w.word.toLowerCase()));
  ALL_WORDS = ALL_WORDS.filter(w => !wordsToDelete.has(w.word.toLowerCase()));
  wordsToDelete.forEach(w => {
    savedWords = savedWords.filter(x => x.toLowerCase() !== w);
    delete srsData[w]; delete wordProgress[w]; delete vocabMeta[w];
  });
  save.words(); save.saved(); save.srs(); save.prog(); save.meta();
  renderVocab(true); renderVocabStats(); updateTagFilters(); showToast('一括削除完了');
};

const printWordTest = () => {
  const targets = ALL_WORDS.filter(w => getWordProgress(w.word) !== 'mastered'); if (!targets.length) return showToast('要復習なし');
  const words = [...targets].sort(() => 0.5 - Math.random()).slice(0, 50);
  const html = `<!DOCTYPE html><html lang="ja"><head><title>単語テスト</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:10px}th{background:#f9f9f9}.btn{display:block;width:180px;margin:0 auto 20px;padding:10px;text-align:center;background:#2D2B27;color:#fff;border-radius:50px;cursor:pointer}@media print{.btn{display:none}}</style></head><body><button class="btn" onclick="window.print()">印刷</button><h1>英単語 小テスト</h1><table><tr><th>英単語</th><th style="width:60%">意味</th></tr>${words.map(w => `<tr><td>${esc(w.word)}</td><td></td></tr>`).join('')}</table></body></html>`;
  printHtml(html);
};
const exportVocabPDF = () => {
  if (!ALL_WORDS.length) return showToast('単語なし');
  const html = `<!DOCTYPE html><html lang="ja"><head><title>単語リスト</title><style>body{font-family:sans-serif;padding:20px;font-size:13px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:#f5f5f5}.mastered{color:#1a6038;font-weight:bold}.learning{color:#8a6200;font-weight:bold}.new{color:#999}.btn{display:block;width:180px;margin:0 auto 20px;padding:10px;text-align:center;background:#2D2B27;color:#fff;border-radius:50px;cursor:pointer}@media print{.btn{display:none}}</style></head><body><button class="btn" onclick="window.print()">印刷</button><h1>単語リスト（${ALL_WORDS.length}語）</h1><table><tr><th>単語</th><th>意味</th><th>進捗</th></tr>${ALL_WORDS.map(w => { const p = getWordProgress(w.word); return `<tr><td><b>${esc(w.word)}</b></td><td>${esc(w.meaning || '')}</td><td class="${p}">${p}</td></tr>` }).join('')}</table></body></html>`;
  printHtml(html);
};
const toggleVoiceCommand = () => {
  const btn = $('voice-cmd-btn');
  if (cardVoiceActive) {
     cardVoiceActive = false; if (cardVoiceRec) cardVoiceRec.stop();
     btn.textContent = customTexts['cards_btn_voice'] || '音声操作: OFF'; btn.style.background = ''; btn.style.color = '';
  } else {
     if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return showToast('ブラウザ非対応');
     cardVoiceActive = true; btn.textContent = '音声操作: ON'; btn.style.background = 'var(--green)'; btn.style.color = '#fff';
     cardVoiceRec = new SR(); cardVoiceRec.lang = 'ja-JP'; cardVoiceRec.continuous = true; cardVoiceRec.interimResults = false;
     cardVoiceRec.onresult = (e) => {
        const transcript = e.results[e.resultIndex][0].transcript.trim();
        if (transcript.includes('次') || transcript.includes('右')) { changeCard(1); showToast('次へ'); }
        else if (transcript.includes('前') || transcript.includes('左')) { changeCard(-1); showToast('前へ'); }
        else if (transcript.includes('覚え') || transcript.includes('正解')) { srsRateCurrentCard(2); showToast('覚えた'); }
        else if (transcript.includes('忘れ') || transcript.includes('不正解') || transcript.includes('分から')) { srsRateCurrentCard(0); showToast('忘れた'); }
        else if (transcript.includes('発音') || transcript.includes('読')) { speakCurrentCard(); showToast('発音'); }
     };
     cardVoiceRec.onend = () => { 
       if (cardVoiceActive) {
         setTimeout(() => { try { cardVoiceRec.start(); } catch(e){} }, 100);
       } 
     };
     cardVoiceRec.start();
  }
};

const setCardsMode = m => {
  cardsMode = m;
  ['all', 'saved', 'srs', 'weak'].forEach(x => { const el = $('cards-mode-' + x); if (el) { if (x === m) el.classList.add('active'); else el.classList.remove('active'); } });
  initCards();
};

const initCards = () => {
  const tagSel = $('cards-tag-select');
  const tag = tagSel ? tagSel.value : 'all';
  
  let baseList = ALL_WORDS;
  if (cardsMode === 'saved') baseList = ALL_WORDS.filter(w => savedWords.includes(w.word));
  else if (cardsMode === 'srs') { const d = srsGetDueWords(), n = srsGetNewWords(); baseList = d.concat(n.filter(w => !d.find(x => x.word === w.word))); }
  else if (cardsMode === 'weak') { $('cards-mode-weak').classList.remove('hidden'); baseList = ALL_WORDS.filter(w => weaknessWords.includes(w.word)); }
  
  if (tag !== 'all') baseList = baseList.filter(w => w.tags && w.tags.includes(tag));
  
  cardList = baseList.slice();
  if (!cardList.length && cardsMode !== 'srs' && cardsMode !== 'weak') cardList = ALL_WORDS.slice();
  currentCardIdx = 0; renderCard();
};

const renderCard = () => {
  const cInner = $('flip-inner'); if (cInner) { cInner.classList.remove('flipped'); cInner.style.transform = ''; }
  const sb = $('srs-card-buttons'), ss = $('srs-card-status'), cw = $('card-word'), cm = $('card-meaning'), ci = $('card-idx'), ct = $('card-total'), imgC = $('card-image-container');
  
  if (!cardList.length) {
    if (cw) cw.textContent = '—'; if (cm) cm.textContent = 'Empty'; if (ci) ci.textContent = '0'; if (ct) ct.textContent = '0';
    if (sb) sb.classList.add('hidden'); if (imgC) imgC.innerHTML = ''; return;
  }
  const c = cardList[currentCardIdx];
  if (cw) cw.textContent = c.word; 
  
  let backHtml = '';
  if (c.meaning) backHtml += `<div>${esc(c.meaning)}</div>`;
  
  const showEx = $('card-show-example') && $('card-show-example').checked;
  const showImg = $('card-show-image') && $('card-show-image').checked;
  const showNote = $('card-show-note') && $('card-show-note').checked;
  
  if (showEx && c.example) backHtml += `<div class="text-sm text-muted italic mt-2" style="font-weight:400; line-height:1.4;">${esc(c.example)}</div>`;
  if (showNote && c.note) backHtml += `<div class="text-xs text-sub mt-2 pt-2 border-top border-dashed" style="font-weight:400;">${esc(c.note)}</div>`;
  
  if (cm) cm.innerHTML = backHtml || '—';
  if (ci) ci.textContent = currentCardIdx + 1; if (ct) ct.textContent = cardList.length;
  
  if (imgC) {
    if (showImg) {
      imgC.innerHTML = `<img src="https://image.pollinations.io/prompt/${encodeURIComponent(c.word)}?width=300&height=150&nologo=true" style="width:100%; height:auto; border-radius:8px; opacity:0.8;" onerror="this.style.display='none'">`;
    } else {
      imgC.innerHTML = '';
    }
  }

  if (sb) { if (cardsMode === 'srs' || cardsMode === 'weak') sb.classList.remove('hidden'); else sb.classList.add('hidden'); }
  if (ss) {
    const r = srsData[c.word.toLowerCase()];
    if (r) { const nd = srsNextDate(r); ss.textContent = `STB:${r.stability.toFixed(1)} / 連続:${r.repetition}回 / 次回:${srsDaysDiff(nd) <= 0 ? '今日' : srsDaysDiff(nd) + '日後'}`; } 
    else ss.textContent = '初回学習';
  }
};

const flipCard = () => { const cInner = $('flip-inner'); if (cInner) cInner.classList.toggle('flipped'); };
const changeCard = d => { if (cardList.length) { currentCardIdx = (currentCardIdx + d + cardList.length) % cardList.length; renderCard(); } };

const shuffleCards = () => { 
  if (shuffleSettings.mode === 'weighted') {
    cardList.sort((a, b) => {
      const sa = srsData[a.word.toLowerCase()]?.stability || 0;
      const sb = srsData[b.word.toLowerCase()]?.stability || 0;
      return sa - sb; 
    });
  } else if (shuffleSettings.mode === 'spaced') {
    cardList.sort((a, b) => {
      const pa = vocabMeta[a.word.toLowerCase()]?.pos || 'other';
      const pb = vocabMeta[b.word.toLowerCase()]?.pos || 'other';
      return pa.localeCompare(pb);
    });
  } else {
    for (let i = cardList.length - 1; i > 0; i--) { 
      const j = Math.floor(Math.random() * (i + 1)); 
      [cardList[i], cardList[j]] = [cardList[j], cardList[i]]; 
    } 
  }
  currentCardIdx = 0; renderCard(); 
};

const toggleAutoPlay = () => {
  const b = $('autoplay-btn'); if (!b) return;
  if (autoPlayInt) { clearInterval(autoPlayInt); autoPlayInt = null; b.textContent = customTexts['cards_btn_auto'] || 'オート: OFF'; b.style.background = ''; b.style.color = ''; }
  else { b.textContent = 'オート: ON'; b.style.background = 'var(--green)'; b.style.color = '#fff'; autoPlayInt = setInterval(() => { if (apState === 0) { flipCard(); speakCurrentCard(); apState = 1; } else { changeCard(1); apState = 0; } }, 3500); }
};

const cInner = $('flip-inner'); 
if (cInner) {
  cInner.addEventListener('touchstart', e => { swipeStartX = e.touches[0].clientX; swipeStartY = e.touches[0].clientY; cInner.style.transition = 'none'; }, { passive: true });
  cInner.addEventListener('touchmove', e => {
    const touchCurX = e.touches[0].clientX, touchCurY = e.touches[0].clientY;
    const dx = touchCurX - swipeStartX, dy = touchCurY - swipeStartY;
    if (Math.abs(dx) > Math.abs(dy) * 2) {
      e.preventDefault(); 
      const base = cInner.classList.contains('flipped') ? 180 : 0;
      cInner.style.transform = `rotateY(${base}deg) translateX(${dx}px) rotate(${dx / 20}deg)`;
      const sr = $('swipe-right'), sl = $('swipe-left');
      if (sr) sr.style.opacity = dx > 50 ? 1 : 0; if (sl) sl.style.opacity = dx < -50 ? 1 : 0;
    }
  }, { passive: false });
  cInner.addEventListener('touchend', e => {
    cInner.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
    const base = cInner.classList.contains('flipped') ? 180 : 0; cInner.style.transform = `rotateY(${base}deg)`;
    const sr = $('swipe-right'), sl = $('swipe-left'); if (sr) sr.style.opacity = 0; if (sl) sl.style.opacity = 0;
    const dx = e.changedTouches[0].clientX - swipeStartX, dy = e.changedTouches[0].clientY - swipeStartY;
    if (Math.abs(dx) > Math.abs(dy) * 2) {
      if (dx > 100) {
        if (cardList.length) {
          if (cardsMode === 'srs' || cardsMode === 'weak') srsRateCurrentCard(2);
          else { setWordProgress(cardList[currentCardIdx].word, 'mastered'); if (navigator.vibrate) navigator.vibrate(30); if (window.confetti) confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } }); showToast('覚えた'); changeCard(1); }
        }
      } else if (dx < -100) {
        if (cardList.length) {
          if (cardsMode === 'srs' || cardsMode === 'weak') srsRateCurrentCard(0);
          else { setWordProgress(cardList[currentCardIdx].word, 'learning'); if (navigator.vibrate) navigator.vibrate(30); showToast('忘れた'); changeCard(1); }
        }
      }
    }
  });

  let isDragging = false;
  cInner.addEventListener('mousedown', e => { isDragging = true; swipeStartX = e.clientX; swipeStartY = e.clientY; cInner.style.transition = 'none'; });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - swipeStartX, dy = e.clientY - swipeStartY;
    if (Math.abs(dx) > Math.abs(dy) * 2) {
      e.preventDefault(); 
      const base = cInner.classList.contains('flipped') ? 180 : 0;
      cInner.style.transform = `rotateY(${base}deg) translateX(${dx}px) rotate(${dx / 20}deg)`;
      const sr = $('swipe-right'), sl = $('swipe-left');
      if (sr) sr.style.opacity = dx > 50 ? 1 : 0; if (sl) sl.style.opacity = dx < -50 ? 1 : 0;
    }
  });
  window.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    cInner.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
    const base = cInner.classList.contains('flipped') ? 180 : 0; cInner.style.transform = `rotateY(${base}deg)`;
    const sr = $('swipe-right'), sl = $('swipe-left'); if (sr) sr.style.opacity = 0; if (sl) sl.style.opacity = 0;
    const dx = e.clientX - swipeStartX, dy = e.clientY - swipeStartY;
    if (Math.abs(dx) > Math.abs(dy) * 2) {
      if (dx > 100) {
        if (cardList.length) {
          if (cardsMode === 'srs' || cardsMode === 'weak') srsRateCurrentCard(2);
          else { setWordProgress(cardList[currentCardIdx].word, 'mastered'); if (navigator.vibrate) navigator.vibrate(30); if (window.confetti) confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } }); showToast('覚えた'); changeCard(1); }
        }
      } else if (dx < -100) {
        if (cardList.length) {
          if (cardsMode === 'srs' || cardsMode === 'weak') srsRateCurrentCard(0);
          else { setWordProgress(cardList[currentCardIdx].word, 'learning'); if (navigator.vibrate) navigator.vibrate(30); showToast('忘れた'); changeCard(1); }
        }
      }
    }
  });
}

// ============================================================
// [11] SKILL UP
// ============================================================
const switchWritingTab = t => {
  ['input', 'daily', 'quiz', 'media', 'shadowing', 'syntax', 'history'].forEach(x => {
    const tb = $('wtab-' + x), pn = $('wpane-' + x);
    if (tb) { if (x === t) tb.classList.add('active'); else tb.classList.remove('active'); }
    if (pn) { if (x === t) pn.classList.add('active'); else pn.classList.remove('active'); }
  });
  if (t === 'history') renderWritingHistory();
  if (t === 'daily') { switchDailyTab(currentDailyTab); renderDaily(); }
  if (t === 'syntax') renderSyntax();
};

const setWritingInputMode = m => { wInputMode = m; ['text', 'file', 'photo'].forEach(x => { const btn = $('wmode-' + x), area = $('w-' + x + '-area'); if (btn) { if (x === m) btn.classList.add('active'); else btn.classList.remove('active'); } if (area) { if (x === m) area.classList.remove('hidden'); else area.classList.add('hidden'); } }); };
const handleWritingFile = e => { const f = e.target.files[0]; if (!f) return; const fn = $('writing-file-name'), ft = $('writing-file-text'); if (fn) fn.textContent = f.name; const r = new FileReader(); r.onload = ev => { if (ft) ft.value = ev.target.result; }; r.readAsText(f); };
const handleWritingPhoto = e => { 
  const f = e.target.files[0]; if (!f) return; 
  openImageCropper(f, (croppedDataUrl) => {
    wPhotoData = croppedDataUrl;
    const wp = $('writing-photo-preview'); 
    if (wp) wp.innerHTML = `<img src="${wPhotoData}" style="max-width:100%;border-radius:10px">`; 
    const qb = $('writing-photo-quiz-btn');
    if (qb) qb.classList.remove('hidden');
  });
};

window.generateQuizFromPhoto = async () => {
  if (!wPhotoData) return showToast('写真を選択してください');
  const b = wPhotoData.split(',')[1], m = wPhotoData.match(/data:([^;]+)/)[1];
  const ld = $('writing-loading'), rs = $('writing-result');
  if (ld) ld.classList.remove('hidden');
  if (rs) rs.innerHTML = '';
  try {
    const rep = await callGemini([{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: m, data: b } }, { type: 'text', text: 'この画像内の英文や内容から、内容理解を問う4択クイズを3問作成し、HTMLで出力してください。解答と解説も必ず含めてください。客観的な参考書スタイルで出力してください。挨拶や語りかけは一切不要です。' }] }], 8192);
    if (rs) rs.innerHTML = `<div class="card">${clean(rep.replace(/```html?/g, '').replace(/```/g, ''))}</div>`;
  } catch (e) { if (rs) handleApiError(e, 'writing-result'); }
  finally { if (ld) ld.classList.add('hidden'); }
};

const extractSyntaxFromText = async text => { showToast('構文抽出中...'); try { const rep = await callGemini([{ role: 'user', content: text }], 8192, '大学受験レベルの重要構文抽出。JSON配列:[{"syntax":"...","meaning":"...","note":"..."}]。挨拶不要。', true); const arr = extractJSON(rep); if (!arr || !arr.length) return showToast('構文なし'); let added = 0; arr.forEach(item => { if (item.syntax) { syntaxList.unshift({ id: generateId(), syntax: item.syntax, meaning: item.meaning || '', note: item.note || '', date: new Date().toLocaleDateString('ja-JP') }); added++; } }); if (added > 0) { save.syntax(); const pn = $('wpane-syntax'); if (pn && pn.classList.contains('active')) renderSyntax(); showToast(`${added}件保存`); } } catch (e) { showToast('通信エラー'); } };
const extractSyntaxFromHistory = async id => { const h = writingHistory.find(x => String(x.id) === String(id)); if (!h) return; await extractSyntaxFromText(h.original + '\n' + h.result.replace(/<[^>]+>/g, '')); };

const submitWriting = async type => {
  let c = [], histTxt = '';
  let imageId = null;
  if (wInputMode === 'text') { const t = $('writing-text-input')?.value.trim(); if (!t) return; histTxt = t; c = [{ type: 'text', text: type === 'analyze' ? `構文解析と和訳:\n${t}` : type === 'paraphrase' ? `言い換え:\n${t}` : type === 'essay' ? `エッセイ評価:\n${t}` : `添削:\n${t}` }]; }
  else if (wInputMode === 'file') { const t = $('writing-file-text')?.value.trim(); if (!t) return; histTxt = t; c = [{ type: 'text', text: type === 'analyze' ? `構文解析と和訳:\n${t}` : type === 'paraphrase' ? `言い換え:\n${t}` : type === 'essay' ? `エッセイ評価:\n${t}` : `添削:\n${t}` }]; }
  else if (wInputMode === 'photo') { 
    if (!wPhotoData) return; 
    const b = wPhotoData.split(',')[1], m = wPhotoData.match(/data:([^;]+)/)[1]; 
    histTxt = '（写真）'; 
    imageId = await saveImageToDB(wPhotoData);
    c = [{ type: 'image', source: { type: 'base64', media_type: m, data: b } }, { type: 'text', text: type === 'analyze' ? '画像内の英文を構文解析・和訳' : type === 'paraphrase' ? '画像内の英文を言い換え' : type === 'essay' ? '画像内のエッセイを評価' : '画像内の英文添削' }]; 
  }
  const sb = $('writing-submit-btn'), ab = $('writing-analyze-btn'), pb = $('writing-paraphrase-btn'), eb = $('writing-essay-btn'), ld = $('writing-loading'), rs = $('writing-result');
  if (sb) sb.classList.add('hidden'); if (ab) ab.classList.add('hidden'); if (pb) pb.classList.add('hidden'); if (eb) eb.classList.add('hidden'); if (ld) ld.classList.remove('hidden'); if (rs) rs.innerHTML = '';
  try {
    let sys = '提出された英文を客観的かつ丁寧に添削しHTMLで出力してください。挨拶や語りかけは不要です。文法や自然な表現の解説、100点満点のスコアを含めてください。';
    if (type === 'analyze') sys = '客観的な構文解析をHTMLで出力してください。挨拶不要。SVOCを<span class="svoc-s">S</span>等で色付、<span class="slash">/</span>で区切ってください。特殊構文の解説と和訳を含めてください。';
    else if (type === 'paraphrase') sys = '入力された英文をより洗練された学術的な英語に言い換え、HTMLで出力してください。挨拶不要。言い換えた理由とニュアンスの違いを客観的に解説してください。';
    else if (type === 'essay') sys = '提出されたエッセイを「論理性」「語彙」「文法」の観点から客観的に評価し、HTMLで出力してください。挨拶不要。改善案と100点満点のスコアを含めてください。';
    
    const rep = await callGemini([{ role: 'user', content: c }], 8192, sys), ht = clean(rep.replace(/```html?/g, '').replace(/```/g, '')), newId = generateId();
    writingHistory.unshift({ id: newId, type, date: new Date().toLocaleString('ja-JP'), original: histTxt.substring(0, 100), fullOriginal: histTxt, result: ht, score: (type === 'correct' || type === 'essay') ? (ht.match(/(\d{1,3})\s*(?:点|\/\s*100)/i) ? parseInt(RegExp.$1) : null) : null, imageId });
    save.writing();
    if (rs) { if (type === 'analyze') rs.innerHTML = `<div class="card"><div class="text-xs font-bold text-muted mb-2">白文テスト</div><div class="text-base mb-3" style="line-height:1.6;">${esc(histTxt).replace(/\n/g, '<br>')}</div><button class="action-btn mb-0 bg-accent" onclick="document.getElementById('res-analyzed-${newId}').classList.remove('hidden');this.classList.add('hidden');">正解を見る</button><div id="res-analyzed-${newId}" class="hidden mt-14"><div class="correction-box mt-0">${ht}</div><button class="action-btn mt-3 mb-0 bg-accent2" onclick="extractSyntaxFromHistory('${newId}')">重要構文抽出</button></div></div>`; else rs.innerHTML = `<div class="correction-box">${ht}</div>${(type === 'correct' || type === 'essay') ? `<button class="action-btn mt-3 mb-0 bg-accent2" onclick="extractSyntaxFromHistory('${newId}')">重要構文抽出</button>` : ''}`; }
  } catch (e) { handleApiError(e, 'writing-result'); } finally { if (ld) ld.classList.add('hidden'); if (sb) sb.classList.remove('hidden'); if (ab) ab.classList.remove('hidden'); if (pb) pb.classList.remove('hidden'); if (eb) eb.classList.remove('hidden'); }
};

const renderWritingHistory = () => { 
  const c = $('writing-history-list'); 
  if (!c) return; 
  
  const filterDate = $('history-filter-date')?.value;
  const filterType = $('history-filter-type')?.value || 'all';
  const filterScore = $('history-filter-score')?.value || 'all';
  
  let filtered = writingHistory;
  if (filterDate) {
    const dStr = new Date(filterDate).toLocaleDateString('ja-JP');
    filtered = filtered.filter(h => h.date.startsWith(dStr));
  }
  if (filterType !== 'all') {
    filtered = filtered.filter(h => h.type === filterType);
  }
  if (filterScore === 'under80') {
    filtered = filtered.filter(h => h.score !== null && h.score <= 80);
  }
  
  c.innerHTML = filtered.length ? filtered.map(h => `<div class="writing-history-item" role="button" tabindex="0" onclick="showWritingHistoryDetail('${h.id}')"><div class="text-xs text-muted mb-1">${h.date}${h.score != null ? ' — ' + h.score + '点' : ''} (${h.type === 'analyze' ? '解析' : h.type === 'paraphrase' ? '言換' : h.type === 'essay' ? 'エッセイ' : '添削'})</div><div class="text-sm text-sub">${esc(h.original)}</div></div>`).join('') : '<div class="vocab-empty">履歴なし</div>'; 
};

$('history-filter-date')?.addEventListener('change', renderWritingHistory);
$('history-filter-type')?.addEventListener('change', renderWritingHistory);
$('history-filter-score')?.addEventListener('change', renderWritingHistory);

const showWritingHistoryDetail = id => {
  const h = writingHistory.find(x => String(x.id) === String(id)), mb = $('writing-history-modal-body'); if (!h || !mb) return;
  let html = '';
  if (h.imageId) {
    html += `<div class="mb-3"><button class="btn-text-muted" onclick="showSavedImage('${h.imageId}')">元の画像を表示</button><div id="saved-img-${h.imageId}" class="mt-1"></div></div>`;
  }
  if (h.type === 'analyze' || (!h.type && h.score === null)) { html += `<div class="text-xs font-bold text-muted mb-2">白文テスト</div><div class="text-base mb-3 p-14 bg-main radius-sm line-height-16">${esc(h.fullOriginal || h.original).replace(/\n/g, '<br>')}</div><button class="action-btn mb-0 bg-accent" onclick="document.getElementById('hist-analyzed-${id}').classList.remove('hidden');this.classList.add('hidden');">正解を見る</button><div id="hist-analyzed-${id}" class="hidden mt-14"><div class="correction-box mt-0">${h.result}</div></div>`; } else html += `<div class="correction-box">${h.result}</div>`;
  html += `<button class="action-btn mt-3 mb-0 btn-danger" onclick="deleteWritingHistory('${id}')">この履歴を削除</button>`;
  mb.innerHTML = html; openModal('writing-history-modal');
};
const deleteWritingHistory = id => { 
  const h = writingHistory.find(x => String(x.id) === String(id));
  if (!h) return;
  writingHistory = writingHistory.filter(x => String(x.id) !== String(id));
  save.writing(); renderWritingHistory(); closeModal('writing-history-modal'); 
  showUndoSnackbar('履歴を削除しました', () => {
    writingHistory.unshift(h);
    save.writing(); renderWritingHistory();
  }, () => {});
};

const switchDailyTab = t => {
  currentDailyTab = t;
  ['comp', 'parse', 'reading', 'listen', 'drill'].forEach(x => {
    const b = $('dtab-' + x), a = $('daily-area-' + x);
    if (b) { if (x === t) b.classList.add('active'); else b.classList.remove('active'); }
    if (a) { if (x === t) a.classList.remove('hidden'); else a.classList.add('hidden'); }
  });
  const diffWrap = $('daily-difficulty-wrap');
  if (diffWrap) { if (t === 'drill') diffWrap.classList.add('hidden'); else diffWrap.classList.remove('hidden'); }
  renderDaily();
};
const extractSyntaxFromDaily = async id => { const d = dailyChallenges.find(x => String(x.id) === String(id)); if (d) await extractSyntaxFromText(d.question.replace(/<[^>]+>/g, '') + '\n' + d.feedback.replace(/<[^>]+>/g, '')); };

window.toggleReadingTranslation = (id) => {
  const el = $(id);
  if(el) el.classList.toggle('hidden');
};

const renderDaily = () => {
  const ts = new Date().toLocaleDateString('ja-JP');
  if (currentDailyTab === 'comp' || currentDailyTab === 'parse' || currentDailyTab === 'reading') {
    const area = $('daily-area-' + currentDailyTab); if (!area) return;
    const tasks = dailyChallenges.filter(d => d.date === ts && d.taskType === currentDailyTab); let html = '';
    
    if (!tasks.length) html += `<div class="card text-center p-36"><button class="action-btn mb-0 btn-auto-width btn-lg-pad" onclick="generateDailyTask('${currentDailyTab}')">問題を作成</button></div>`;
    else { 
      html += tasks.map(task => { 
        let qHtml = task.question;
        if (currentDailyTab === 'reading') {
          qHtml = qHtml.replace(/<div class="translation hidden" id="([^"]+)">/g, '<button class="btn-text-muted mt-1 mb-2" onclick="toggleReadingTranslation(\'$1\')">和訳を表示</button><div class="translation hidden text-sm text-sub bg-main p-10 radius-sm mb-3" id="$1">');
        }
        
        if (!task.answer) return `<div class="card"><p class="text-xs font-bold text-muted mb-3">問題 (${task.date})</p><div class="text-base mb-4 line-height-16">${qHtml}</div><textarea id="daily-ans-${task.id}" class="writing-textarea" placeholder="解答..."></textarea><button class="action-btn mb-0" id="daily-submit-${task.id}" onclick="submitDailyAnswer('${task.id}')">解答・添削</button><div id="daily-load-${task.id}" class="hidden text-center mt-10"><span class="loading-dots"></span></div></div>`; 
        else return `<div class="card"><p class="text-xs font-bold text-green mb-3">完了</p><div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>問題:</b><br>${qHtml}</div><div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>解答:</b><br>${esc(task.answer)}</div><div class="correction-box mt-0">${task.feedback}</div><button class="action-btn mt-3 mb-0 bg-accent2" onclick="extractSyntaxFromDaily('${task.id}')">重要構文抽出</button></div>`; 
      }).join(''); 
      html += `<div class="text-center mt-4"><button class="action-btn btn-secondary btn-auto-width btn-md-pad" onclick="generateDailyTask('${currentDailyTab}')">＋ 追加作成</button></div>`; 
    }
    const hist = dailyChallenges.filter(d => d.date !== ts && d.taskType === currentDailyTab);
    if (hist.length) html += `<div class="mt-4 pt-3 border-top"><p class="section-note">過去の問題</p>${hist.map(h => `<div class="writing-history-item" role="button" tabindex="0" onclick="showDailyHistoryDetail('${h.id}')"><div class="text-xs text-muted mb-1">${h.date}${h.score != null ? ' — ' + h.score + '点' : ''}</div><div class="text-sm">${h.question.replace(/<[^>]+>/g, '').substring(0, 60)}...</div></div>`).join('')}</div>`;
    area.innerHTML = html;
  } else if (currentDailyTab === 'listen') {
    renderListenArea();
  }
};

const generateDailyTask = async type => {
  const a = $('daily-area-' + type); if (!a) return; a.innerHTML = '<div class="text-center p-36"><span class="loading-dots"></span></div>';
  const diff = $('daily-difficulty') ? $('daily-difficulty').value : 'standard';
  let diffText = diff === 'basic' ? '初級（共通テストレベル）の' : diff === 'advanced' ? '上級（難関大レベル）の極めて高度な' : '中級（国公立大レベル）の';
  let sys = '';
  
  if (type === 'reading') {
    const interests = userProfile.courses || '一般的な話題';
    sys = `生徒の興味（${interests}）に合わせた、高校生向けの${diffText}英語長文（${diff === 'basic' ? '150' : diff === 'advanced' ? '500' : '300'}語程度）と、内容説明の記述式問題を1題出題してください。HTMLのみ。h4で「本日の長文読解」、pで本文。段落ごとに和訳を <div class="translation hidden" id="trans_ランダムID">和訳</div> の形式で埋め込んでください。解答や解説は絶対に含めないでください。客観的な参考書スタイルで出力してください。挨拶や語りかけは一切不要です。`;
  } else if (type === 'comp') {
    sys = `高校生向けの${diffText}和文英訳問題を1題出題してください。HTMLのみ。h4で「本日の英作文」、pで日本語問題文。解答や解説は絶対に含めないでください。客観的な参考書スタイルで出力してください。挨拶や語りかけは一切不要です。`;
  } else if (type === 'parse') {
    sys = `高校生向けの${diffText}英文解釈（和訳）問題を1題出題してください。HTMLのみ。h4で「本日の英文解釈」、pで英文。解答や解説は絶対に含めないでください。客観的な参考書スタイルで出力してください。挨拶や語りかけは一切不要です。`;
  }
  
  try { const rep = await callGemini([{ role: 'user', content: '問題作成' }], 8192, sys); const ht = clean(rep.replace(/```html?/g, '').replace(/```/g, '').trim()); const ts = new Date().toLocaleDateString('ja-JP'); dailyChallenges.unshift({ id: 'daily_' + generateId(), date: ts, taskType: type, question: ht, answer: '', feedback: '', score: null }); save.daily(); renderDaily(); } catch (e) { handleApiError(e, a.id); setTimeout(renderDaily, 2000); }
};

const submitDailyAnswer = async id => {
  const i = $('daily-ans-' + id); if (!i || !i.value.trim()) return; const task = dailyChallenges.find(d => String(d.id) === String(id)); if (!task) return;
  const sb = $('daily-submit-' + id), ld = $('daily-load-' + id); if (sb) sb.classList.add('hidden'); if (ld) ld.classList.remove('hidden');
  let sys = '';
  if (task.taskType === 'comp') sys = '提出された英作文を客観的かつ丁寧に添削しHTMLで出力してください。挨拶や語りかけは不要です。なぜその表現になるのか詳しく解説し、より自然な模範解答を複数提示してください。最後に100点満点でスコアをつけてください。';
  else if (task.taskType === 'parse') sys = '和訳解答を客観的かつ丁寧に添削しHTMLで出力してください。挨拶や語りかけは不要です。SVOCを<span class="svoc-s">S</span>等で色付、<span class="slash">/</span>で区切ってください。特殊構文の構造を図解するように詳しく解説し、100点満点でスコアをつけてください。';
  else if (task.taskType === 'reading') sys = '長文読解の解答を客観的かつ丁寧に添削しHTMLで出力してください。挨拶や語りかけは不要です。本文の全訳、要旨、設問の論理的な解答プロセスを詳しく解説し、100点満点でスコアをつけてください。';
  try { const rep = await callGemini([{ role: 'user', content: `問題:\n${task.question}\n解答:\n${i.value}` }], 8192, sys); const ht = clean(rep.replace(/```html?/g, '').replace(/```/g, '')); task.answer = i.value; task.feedback = ht; task.score = ht.match(/(\d{1,3})\s*(?:点|\/\s*100)/i) ? parseInt(RegExp.$1) : null; save.daily(); renderDaily(); } catch (e) { showToast('通信エラー'); if (sb) sb.classList.remove('hidden'); if (ld) ld.classList.add('hidden'); }
};

const showDailyHistoryDetail = id => {
  const h = dailyChallenges.find(x => String(x.id) === String(id)), mb = $('writing-history-modal-body'); if (!h || !mb) return;
  const sK = "daily_" + h.id, r = srsData[sK.toLowerCase()], sT = r ? `次回復習: ${srsDaysDiff(srsNextDate(r)) <= 0 ? '今日' : srsDaysDiff(srsNextDate(r)) + '日後'}` : '未登録';
  let html = `<div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>問題 (${h.date}):</b><br>${h.question}</div><div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>解答:</b><br>${esc(h.answer)}</div><div class="correction-box mt-0">${h.feedback}</div><div class="mt-4 pt-3 border-top"><p class="text-xs font-bold mb-2">理解度 (FSRS)</p><div class="flex-gap-8"><button onclick="srsReviewItem('${sK}',0);showDailyHistoryDetail('${h.id}')" class="btn-srs bg-danger">忘</button><button onclick="srsReviewItem('${sK}',1);showDailyHistoryDetail('${h.id}')" class="btn-srs bg-streak">難</button><button onclick="srsReviewItem('${sK}',2);showDailyHistoryDetail('${h.id}')" class="btn-srs bg-green">覚</button><button onclick="srsReviewItem('${sK}',3);showDailyHistoryDetail('${h.id}')" class="btn-srs bg-blue">完</button></div><p class="text-xs text-muted text-center mt-2">${sT}</p></div>`;
  html += `<button class="action-btn mt-3 mb-0 btn-danger" onclick="deleteDailyChallenge('${id}')">この問題を削除</button>`;
  mb.innerHTML = html; openModal('writing-history-modal');
};
const deleteDailyChallenge = id => { 
  const d = dailyChallenges.find(x => String(x.id) === String(id));
  if (!d) return;
  dailyChallenges = dailyChallenges.filter(x => String(x.id) !== String(id));
  save.daily(); renderDaily(); closeModal('writing-history-modal'); 
  showUndoSnackbar('問題を削除しました', () => {
    dailyChallenges.unshift(d);
    save.daily(); renderDaily();
  }, () => {});
};

const generateWeaknessDrill = async () => {
  const btn = $('generate-weakness-drill-btn'), ld = $('drill-loading'), area = $('drill-content-area');
  if (btn) btn.classList.add('hidden'); if (ld) ld.classList.remove('hidden'); if (area) area.innerHTML = '';
  
  const mistakes = writingHistory.filter(h => h.score !== null && h.score < 80).slice(0, 3).map(h => h.result.replace(/<[^>]+>/g, '').substring(0, 200));
  const dailyMistakes = dailyChallenges.filter(d => d.score !== null && d.score < 80).slice(0, 3).map(d => d.feedback.replace(/<[^>]+>/g, '').substring(0, 200));
  const weakWords = Object.entries(srsData).filter(x => x[1].difficulty > 7).slice(0, 5).map(x => x[0]);
  
  const context = `【過去の添削ミス】\n${mistakes.join('\n')}\n【過去の問題ミス】\n${dailyMistakes.join('\n')}\n【苦手単語】\n${weakWords.join(', ')}`;
  
  try {
    const sys = `生徒の過去のミス傾向と苦手単語を分析し、それらを克服するための「弱点特化ドリル（文法・語法・単語の穴埋め問題など）」を3問作成してください。客観的な参考書スタイルで出力し、挨拶や語りかけは一切不要です。HTMLのみで出力。解答解説も必ず含めてください。`;
    const rep = await callGemini([{ role: 'user', content: context }], 8192, sys);
    const html = clean(rep.replace(/```html?/g, '').replace(/```/g, ''));
    if (area) area.innerHTML = `<div class="card">${html}</div><div class="text-center mt-3"><button class="action-btn btn-secondary btn-auto-width" onclick="generateWeaknessDrill()">もう一度生成</button></div>`;
  } catch (e) {
    if (area) handleApiError(e, 'drill-content-area');
    if (btn) btn.classList.remove('hidden');
  } finally {
    if (ld) ld.classList.add('hidden');
  }
};

window.generateTrickDrill = async () => {
  const ld = $('drill-loading'), area = $('drill-content-area');
  ld.classList.remove('hidden'); area.innerHTML = '';
  const mistakes = writingHistory.filter(h => h.score !== null && h.score < 80).slice(0, 3).map(h => h.result.replace(/<[^>]+>/g, '').substring(0, 200));
  try {
    const rep = await callGemini([{role:'user', content:`過去のミス: ${mistakes.join('\n')}`}], 8192, '過去のミスを分析し、あえて間違えやすいダミー選択肢を混ぜた「ひっかけ問題」を3問作成し、HTMLで出力。客観的な解説付き。挨拶不要。');
    area.innerHTML = `<div class="card">${clean(rep.replace(/```html?/g, '').replace(/```/g, ''))}</div>`;
  } catch(e) { area.innerHTML = '<p class="text-danger">生成失敗</p>'; }
  finally { ld.classList.add('hidden'); }
};

const setListenMode = m => {
  currentListenMode = m;
  ['mc', 'dict'].forEach(x => {
    const b = $('listen-mode-' + x), a = $('listen-' + x + '-area');
    if (b) { if (x === m) b.classList.add('active'); else b.classList.remove('active'); }
    if (a) { if (x === m) a.classList.remove('hidden'); else a.classList.add('hidden'); }
  });
  renderListenArea();
};

window.showDictationHint = (id) => {
  const task = listenHistory.find(x => String(x.id) === String(id));
  if(!task) return;
  const hint = task.transcript.replace(/[a-zA-Z]/g, '_ ');
  showToast(hint);
};

const renderListenArea = () => {
  const ts = new Date().toLocaleDateString('ja-JP');
  if (currentListenMode === 'mc') {
    const area = $('listen-mc-area'); if (!area) return;
    const tasks = listenHistory.filter(d => d.date === ts && d.type !== 'dict'); let html = '';
    if (!tasks.length) html += `<div class="card text-center p-36"><button class="action-btn mb-0 btn-auto-width btn-lg-pad bg-accent2" onclick="generateDailyListen()">選択問題を作成</button></div>`;
    else {
      html += tasks.map(task => {
        const ans = task.userAnswer >= 0, accL = ACCENT_LABELS[task.accent] || task.accent;
        let opts = task.options.map((opt, i) => { let cls = 'listen-option'; if (ans) { if (i === task.answer) cls += ' show-correct'; else if (i === task.userAnswer && task.userAnswer !== task.answer) cls += ' selected-wrong'; } return `<div class="${cls}" role="button" tabindex="0" onclick="submitDailyListenAnswer('${task.id}', ${i})">${String.fromCharCode(65 + i)}. ${esc(opt)}</div>`; }).join('');
        let card = `<div class="card mb-3"><div class="flex-between align-center mb-3"><span class="text-xs font-bold text-muted">LISTENING — ${accL}</span><span class="text-xs text-muted">${task.date}</span></div><div class="flex-center gap-2 mb-4"><button onclick="playListenAudioById('${task.id}', 1.0)" class="btn-pill bg-accent text-bg border-none btn-md-pad">標準再生</button><button onclick="playListenAudioById('${task.id}', 0.7)" class="btn-pill btn-outline btn-md-pad">スロー再生</button></div><p class="text-base font-bold mb-3">${esc(task.question)}</p><div class="listen-options">${opts}</div>`;
        if (ans) card += `<div style="background:${task.userAnswer === task.answer ? '#d4f0e0' : '#fde8e6'};border-radius:var(--radius-sm);padding:14px;margin-top:14px;"><p style="font-weight:700;margin-bottom:8px;color:${task.userAnswer === task.answer ? '#1a6038' : '#8b1c14'}">${task.userAnswer === task.answer ? '正解！' : '不正解'}</p><p class="text-sm line-height-16">${esc(task.explanation)}</p></div><div class="mt-3 p-14 bg-main radius-sm border"><p class="text-xs font-bold text-muted mb-2">放送文</p><p class="text-sm line-height-16" id="listen-transcript-${task.id}">${esc(task.transcript)}</p></div>`;
        return card + `</div>`;
      }).join('');
      html += `<div class="text-center mt-4"><button class="action-btn btn-secondary btn-auto-width btn-md-pad" onclick="generateDailyListen()">＋ 追加作成</button></div>`;
    }
    const hist = listenHistory.filter(d => d.date !== ts && d.type !== 'dict');
    if (hist.length) html += `<div class="mt-4 pt-3 border-top"><p class="section-note">過去の問題</p>${hist.map(h => `<div class="writing-history-item" role="button" tabindex="0" onclick="showListenHistoryDetail('${h.id}')"><div class="text-xs text-muted mb-1">${h.date} — ${ACCENT_LABELS[h.accent] || h.accent}</div><div class="text-xs text-sub">${esc((h.transcript || '').substring(0, 40))}...</div></div>`).join('')}</div>`;
    area.innerHTML = html;
  } else {
    const area = $('listen-dict-area'); if (!area) return;
    const tasks = listenHistory.filter(d => d.date === ts && d.type === 'dict'); let html = '';
    if (!tasks.length) html += `<div class="card text-center p-36"><button class="action-btn mb-0 btn-auto-width btn-lg-pad bg-accent2" onclick="generateDailyDictation()">ディクテーション作成</button></div>`;
    else {
      html += tasks.map(task => {
        const isDone = task.userAnswer !== undefined;
        let card = `<div class="card mb-3"><div class="flex-between align-center mb-3"><span class="text-xs font-bold text-muted">DICTATION — ${ACCENT_LABELS[task.accent] || task.accent}</span><span class="text-xs text-muted">${task.date}</span></div><div class="flex-center gap-2 mb-4"><button onclick="playListenAudioById('${task.id}', 1.0)" class="btn-pill bg-accent text-bg border-none btn-md-pad">標準再生</button><button onclick="playListenAudioById('${task.id}', 0.7)" class="btn-pill btn-outline btn-md-pad">スロー再生</button></div>`;
        if (!isDone) { card += `<textarea id="dict-ans-${task.id}" class="writing-textarea" placeholder="聞き取った英語を入力してください..."></textarea><div class="flex-gap-8"><button class="action-btn mb-0 flex-1" id="dict-submit-${task.id}" onclick="submitDailyDictation('${task.id}')">採点する</button><button class="action-btn mb-0 btn-secondary w-auto" onclick="showDictationHint('${task.id}')">ヒント</button></div><div id="dict-load-${task.id}" class="hidden text-center mt-10"><span class="loading-dots"></span></div>`; } 
        else { card += `<div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>あなたの解答:</b><br>${esc(task.userAnswer)}</div><div class="correction-box mt-0">${task.feedback}</div>`; }
        return card + `</div>`;
      }).join('');
      html += `<div class="text-center mt-4"><button class="action-btn btn-secondary btn-auto-width btn-md-pad" onclick="generateDailyDictation()">＋ 追加作成</button></div>`;
    }
    const hist = listenHistory.filter(d => d.date !== ts && d.type === 'dict');
    if (hist.length) html += `<div class="mt-4 pt-3 border-top"><p class="section-note">過去のディクテーション</p>${hist.map(h => `<div class="writing-history-item" role="button" tabindex="0" onclick="showListenHistoryDetail('${h.id}')"><div class="text-xs text-muted mb-1">${h.date} — ${ACCENT_LABELS[h.accent] || h.accent}</div><div class="text-xs text-sub">${esc((h.transcript || '').substring(0, 40))}...</div></div>`).join('')}</div>`;
    area.innerHTML = html;
  }
};

const generateDailyListen = async () => {
  const a = $('listen-mc-area'); if (!a) return; a.innerHTML = '<div class="text-center p-40"><span class="loading-dots"></span></div>';
  const ac = ACCENTS[Math.floor(Math.random() * ACCENTS.length)], diff = $('daily-difficulty') ? $('daily-difficulty').value : 'standard';
  const diffText = diff === 'basic' ? '初級（共通テストレベル）の' : diff === 'advanced' ? '上級（難関大レベル）の極めて高度な' : '中級（国公立大レベル）の';
  try {
    const sys = `高校生向けの英語リスニング問題を作成してください。難易度は「${diffText}」レベル。日常的な対話（2人の会話）や短いアナウンス（100〜150語程度）をスクリプトとし、その内容に関する4択問題を作成してください。挨拶や語りかけは一切不要です。JSONのみ:{"transcript":"英文スクリプト","question":"内容を問う設問","options":["1","2","3","4"],"answer":0,"explanation":"正解の根拠となる聞き取るべきキーワードと詳しい解説"}`;
    const rep = await callGemini([{ role: 'user', content: '作成' }], 8192, sys, true);
    const js = extractJSON(rep), ts = new Date().toLocaleDateString('ja-JP');
    listenHistory.unshift({ id: 'listen_' + generateId(), type: 'mc', date: ts, accent: ac, transcript: js.transcript, question: js.question, options: js.options, answer: js.answer, explanation: js.explanation, userAnswer: -1 });
    save.listen(); renderListenArea();
  } catch (e) { handleApiError(e, a.id); setTimeout(renderListenArea, 2000); }
};
const submitDailyListenAnswer = (id, idx) => { const t = listenHistory.find(x => String(x.id) === String(id)); if (!t || t.userAnswer >= 0) return; t.userAnswer = idx; save.listen(); renderListenArea(); };

const generateDailyDictation = async () => {
  const a = $('listen-dict-area'); if (!a) return; a.innerHTML = '<div class="text-center p-40"><span class="loading-dots"></span></div>';
  const ac = ACCENTS[Math.floor(Math.random() * ACCENTS.length)], diff = $('daily-difficulty') ? $('daily-difficulty').value : 'standard';
  const diffText = diff === 'basic' ? '初級（共通テストレベル）の' : diff === 'advanced' ? '上級（難関大レベル）の極めて高度な' : '中級（国公立大レベル）の';
  try {
    const sys = `高校生向けのディクテーション（書き取り）用の自然な英語パッセージを作成してください。難易度は「${diffText}」レベル。長さは2〜3文（30〜40語程度）。ネイティブの自然な発音（音の連結や脱落など）を意識した実践的な英文にしてください。挨拶や語りかけは一切不要です。JSONのみ:{"transcript":"英文","translation":"和訳","explanation":"日本人が聞き取りにくい音声変化のポイントや文法の解説"}`;
    const rep = await callGemini([{ role: 'user', content: '作成' }], 8192, sys, true);
    const js = extractJSON(rep), ts = new Date().toLocaleDateString('ja-JP');
    listenHistory.unshift({ id: 'dict_' + generateId(), type: 'dict', date: ts, accent: ac, transcript: js.transcript, translation: js.translation, explanation: js.explanation });
    save.listen(); renderListenArea();
  } catch (e) { handleApiError(e, a.id); setTimeout(renderListenArea, 2000); }
};
const submitDailyDictation = async id => {
  const i = $('dict-ans-' + id); if (!i || !i.value.trim()) return; const task = listenHistory.find(x => String(x.id) === String(id)); if (!task) return;
  const sb = $('dict-submit-' + id), ld = $('dict-load-' + id); if (sb) sb.classList.add('hidden'); if (ld) ld.classList.remove('hidden');
  try {
    const sys = `生徒のディクテーション（書き取り）を客観的かつ丁寧に添削し、HTMLで出力してください。挨拶や語りかけは不要です。元の正解文と生徒の解答を比較し、間違えた部分（スペルミス、聞き逃しなど）を指摘し、100点満点でスコアをつけてください。最後に和訳と解説も添えてください。\n正解文: ${task.transcript}\n和訳: ${task.translation}\n解説: ${task.explanation}`;
    const rep = await callGemini([{ role: 'user', content: `生徒の解答:\n${i.value.trim()}` }], 8192, sys);
    task.userAnswer = i.value.trim(); task.feedback = clean(rep.replace(/```html?/g, '').replace(/```/g, ''));
    save.listen(); renderListenArea();
  } catch (e) { showToast('通信エラー'); if (sb) sb.classList.remove('hidden'); if (ld) ld.classList.add('hidden'); }
};

const playListenAudioById = (id, rate = 1.0) => { 
  const t = listenHistory.find(x => String(x.id) === String(id)); 
  if (!t) return; 
  
  if (!window.speechSynthesis) return; 
  speechSynthesis.cancel(); 
  if (availableVoices.length === 0) availableVoices = speechSynthesis.getVoices();
  const langMap = { en_US: 'en-US', en_GB: 'en-GB', en_AU: 'en-AU' }; 
  const lang = langMap[t.accent] || 'en-US'; 
  
  const u = new SpeechSynthesisUtterance(t.transcript); 
  u.lang = lang; 
  if (availableVoices.length > 0) {
    const voice = availableVoices.find(v => v.lang === u.lang) || availableVoices.find(v => v.lang.startsWith(u.lang.split('-')[0]));
    if (voice) u.voice = voice;
  }
  u.rate = rate; 
  
  const transcriptEl = $(`listen-transcript-${id}`);
  if (transcriptEl) {
    const originalText = transcriptEl.textContent;
    u.onboundary = (event) => {
      if (event.name === 'word') {
        const before = originalText.substring(0, event.charIndex);
        const word = originalText.substring(event.charIndex, event.charIndex + event.charLength);
        const after = originalText.substring(event.charIndex + event.charLength);
        transcriptEl.innerHTML = `${esc(before)}<span style="background:var(--streak);color:#fff;border-radius:2px;padding:0 2px;">${esc(word)}</span>${esc(after)}`;
      }
    };
    u.onend = () => { transcriptEl.textContent = originalText; };
  }
  
  speechSynthesis.speak(u); 
};

const showListenHistoryDetail = id => {
  const h = listenHistory.find(x => String(x.id) === String(id)), mb = $('writing-history-modal-body'); if (!h || !mb) return;
  const sK = "daily_" + h.id, r = srsData[sK.toLowerCase()], sT = r ? `次回: ${srsDaysDiff(srsNextDate(r)) <= 0 ? '今日' : srsDaysDiff(srsNextDate(r)) + '日後'}` : '未登録';
  let ht = '';
  if (h.type === 'dict') {
    ht = `<div class="text-xs font-bold text-muted mb-3">DICTATION (${h.date})</div><div class="flex-center gap-2 mb-4"><button onclick="playListenAudioById('${h.id}', 1.0)" class="btn-pill bg-accent text-bg border-none btn-md-pad">標準再生</button><button onclick="playListenAudioById('${h.id}', 0.7)" class="btn-pill btn-outline btn-md-pad">スロー再生</button></div><div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>あなたの解答:</b><br>${esc(h.userAnswer || '')}</div><div class="correction-box mt-0">${h.feedback}</div>`;
  } else {
    const ans = h.userAnswer >= 0;
    let opts = h.options.map((o, i) => { let c = 'listen-option'; if (ans) { if (i === h.answer) c += ' show-correct'; else if (i === h.userAnswer && h.userAnswer !== h.answer) c += ' selected-wrong'; } return `<div class="${c}">${String.fromCharCode(65 + i)}. ${esc(o)}</div>`; }).join('');
    ht = `<div class="text-xs font-bold text-muted mb-3">LISTENING (${h.date})</div><div class="flex-center gap-2 mb-4"><button onclick="playListenAudioById('${h.id}', 1.0)" class="btn-pill bg-accent text-bg border-none btn-md-pad">標準再生</button><button onclick="playListenAudioById('${h.id}', 0.7)" class="btn-pill btn-outline btn-md-pad">スロー再生</button></div><p class="text-base font-bold mb-3">${esc(h.question)}</p><div class="listen-options">${opts}</div>`;
    if (ans) ht += `<div style="background:${h.userAnswer === h.answer ? '#d4f0e0' : '#fde8e6'};border-radius:var(--radius-sm);padding:14px;margin-top:14px;"><p style="font-weight:700;margin-bottom:8px;color:${h.userAnswer === h.answer ? '#1a6038' : '#8b1c14'}">${h.userAnswer === h.answer ? '正解！' : '不正解'}</p><p class="text-sm">${esc(h.explanation)}</p></div><div class="mt-3 p-14 bg-main radius-sm border"><p class="text-xs font-bold text-muted mb-2">放送文</p><p class="text-sm" id="listen-transcript-${h.id}">${esc(h.transcript)}</p></div>`;
  }
  ht += `<div class="mt-4 pt-3 border-top"><p class="text-xs font-bold mb-2">理解度 (FSRS)</p><div class="flex-gap-8"><button onclick="srsReviewItem('${sK}',0);showListenHistoryDetail('${h.id}')" class="btn-srs bg-danger">忘</button><button onclick="srsReviewItem('${sK}',1);showListenHistoryDetail('${h.id}')" class="btn-srs bg-streak">難</button><button onclick="srsReviewItem('${sK}',2);showListenHistoryDetail('${h.id}')" class="btn-srs bg-green">覚</button><button onclick="srsReviewItem('${sK}',3);showListenHistoryDetail('${h.id}')" class="btn-srs bg-blue">完</button></div><p class="text-xs text-muted text-center mt-2">${sT}</p></div><button class="action-btn mt-3 mb-0 btn-danger" onclick="deleteListenHistory('${h.id}')">この問題を削除</button>`;
  mb.innerHTML = ht; openModal('writing-history-modal');
};
const deleteListenHistory = id => { 
  const h = listenHistory.find(x => String(x.id) === String(id));
  if (!h) return;
  listenHistory = listenHistory.filter(x => String(x.id) !== String(id));
  save.listen(); renderDaily(); closeModal('writing-history-modal'); 
  showUndoSnackbar('問題を削除しました', () => {
    listenHistory.unshift(h);
    save.listen(); renderDaily();
  }, () => {});
};

const generateWordQuiz = async () => {
  const range = $('quiz-range').value, count = parseInt($('quiz-count').value), loading = $('word-quiz-loading'), area = $('word-quiz-area'), btn = $('generate-quiz-btn');
  const includeFill = $('quiz-include-fill') && $('quiz-include-fill').checked;
  
  let targetWords = [];
  if (range === 'saved') targetWords = ALL_WORDS.filter(w => savedWords.includes(w.word));
  else if (range === 'srs') targetWords = srsGetDueWords();
  else targetWords = ALL_WORDS.slice();
  
  if (targetWords.length < count) {
    const remaining = count - targetWords.length;
    const others = ALL_WORDS.filter(w => !targetWords.includes(w)).sort(() => 0.5 - Math.random()).slice(0, remaining);
    targetWords = targetWords.concat(others);
  }
  if (targetWords.length === 0) return showToast('単語がありません');
  
  const shuffled = targetWords.sort(() => 0.5 - Math.random()).slice(0, count), wordsToPrompt = shuffled.map(w => w.word).join(', ');
  loading.classList.remove('hidden'); area.innerHTML = ''; if (btn) btn.disabled = true;
  
  let sys = `以下の英単語を使ってランダムにクイズを作成し、JSON配列のみで出力してください。単語: ${wordsToPrompt}
出題形式は以下の${includeFill ? '3' : '2'}種類のいずれかをランダムに混ぜてください。挨拶や語りかけは一切不要です。
1. 4択問題 {"type":"mc", "word":"...", "q":"(単語) の意味は？", "options":["...", "...", "...", "..."], "ans": (正解のインデックス0-3)}
${includeFill ? '2. 穴埋め問題 {"type":"fill", "word":"...", "q":"英文の穴埋め: I eat an ___.", "ans": "(正解の単語)"}' : ''}
${includeFill ? '3' : '2'}. 並び替え問題 {"type":"sort", "word":"...", "q":"和訳: 私はりんごを食べる", "options":["eat", "I", "apple", "an"], "ans":["I", "eat", "an", "apple"]}`;

  try {
    const rep = await callGemini([{ role: 'user', content: sys }], 8192, '', true);
    activeQuizList = extractJSON(rep);
    if (!activeQuizList || !Array.isArray(activeQuizList) || activeQuizList.length === 0) throw new Error('Invalid JSON');
    activeQuizList = activeQuizList.filter(q => q.type && q.q && q.ans !== undefined);
    if (activeQuizList.length === 0) throw new Error('No valid questions');
    
    activeQuizIndex = 0; quizScore = 0; loading.classList.add('hidden'); renderWordQuiz();
  } catch (e) { loading.classList.add('hidden'); handleApiError(e, 'word-quiz-area'); } finally { if (btn) btn.disabled = false; }
};

const renderWordQuiz = () => {
  const area = $('word-quiz-area');
  if (activeQuizIndex >= activeQuizList.length) {
    area.innerHTML = `<div class="card text-center p-40"><h2 style="font-family:var(--font-block); font-size:32px; margin-bottom:10px;">RESULT</h2><p style="font-size:18px; font-weight:700; color:var(--accent); margin-bottom:20px;">${quizScore} / ${activeQuizList.length} 問正解</p><button class="action-btn" onclick="$('word-quiz-area').innerHTML='';">終了する</button></div>`;
    return;
  }
  const q = activeQuizList[activeQuizIndex];
  let html = `<div class="card"><p class="text-xs font-bold text-muted mb-2">Q${activeQuizIndex + 1} / ${activeQuizList.length}</p><p class="text-lg font-bold mb-4 line-height-15">${esc(q.q)}</p><div id="quiz-interactive-area">`;
  if (q.type === 'mc') { q.options.forEach((opt, i) => { html += `<div class="quiz-option" role="button" tabindex="0" onclick="submitWordQuiz('mc', ${i})">${esc(opt)}</div>`; }); } 
  else if (q.type === 'fill') { html += `<input type="text" id="quiz-fill-input" class="score-input mb-3" placeholder="答えを入力..." style="font-size:16px;"><button class="action-btn" onclick="submitWordQuiz('fill')">回答</button>`; } 
  else if (q.type === 'sort') { html += `<div class="quiz-sortable" id="quiz-sort-target" onclick="handleSortClick(event, 'target')"></div><p class="text-xs text-muted mb-2">下の単語をタップして上の枠に並び替えてください</p><div class="quiz-sortable" id="quiz-sort-source" onclick="handleSortClick(event, 'source')">${q.options.sort(() => 0.5 - Math.random()).map(w => `<div class="quiz-word-chip">${esc(w)}</div>`).join('')}</div><button class="action-btn" onclick="submitWordQuiz('sort')">回答</button>`; }
  html += `</div><div id="quiz-feedback-area" class="hidden mt-16 p-12 radius-sm"></div></div>`;
  area.innerHTML = html;
};

window.handleSortClick = (e, targetContainer) => { if (!e.target.classList.contains('quiz-word-chip')) return; const chip = e.target, targetId = targetContainer === 'source' ? 'quiz-sort-target' : 'quiz-sort-source'; $(targetId).appendChild(chip); };

const submitWordQuiz = (type, val) => {
  if (type === 'fill') val = $('quiz-fill-input').value;
  const q = activeQuizList[activeQuizIndex], fb = $('quiz-feedback-area'), ia = $('quiz-interactive-area'); ia.style.pointerEvents = 'none';
  let isCorrect = false, correctText = '';
  if (type === 'mc') { isCorrect = (val === q.ans); correctText = q.options[q.ans]; const opts = ia.querySelectorAll('.quiz-option'); if (opts[val]) opts[val].classList.add(isCorrect ? 'correct' : 'wrong'); if (!isCorrect && opts[q.ans]) opts[q.ans].classList.add('correct'); } 
  else if (type === 'fill') { isCorrect = (val.trim().toLowerCase() === q.ans.toLowerCase()); correctText = q.ans; } 
  else if (type === 'sort') { const userArr = Array.from($('quiz-sort-target').children).map(c => c.textContent); isCorrect = (userArr.join(' ') === q.ans.join(' ')); correctText = q.ans.join(' '); }
  
  if (isCorrect) { quizScore++; if (window.confetti) confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } }); }
  if (q.word && srsData[q.word.toLowerCase()]) srsReview(q.word, isCorrect ? 2 : 0);
  
  fb.classList.remove('hidden'); fb.style.backgroundColor = isCorrect ? '#d4f0e0' : '#fde8e6'; fb.style.border = `1px solid ${isCorrect ? 'var(--green)' : 'var(--danger)'}`;
  fb.innerHTML = `<p style="font-weight:700; color:${isCorrect ? '#1a6038' : '#8b1c14'}; margin-bottom:8px;">${isCorrect ? '正解！' : '不正解'}</p><p class="text-sm text-sub">正解: ${esc(correctText)}</p><button class="action-btn mt-3 mb-0 bg-accent" onclick="activeQuizIndex++; renderWordQuiz();">次の問題へ</button>`;
};

window.generateYouTubeLesson = async () => {
  const url = $('media-yt-url').value;
  if(!url) return showToast('URLを入力してください');
  const ld = $('media-loading'), area = $('media-result-area');
  ld.classList.remove('hidden'); area.innerHTML = '';
  try {
    const rep = await callGemini([{role:'user', content:`以下のYouTube動画URLの内容を推測・取得し、英語学習用の「要約」「重要単語」「内容理解クイズ」をHTMLで作成してください。挨拶や語りかけは一切不要です。客観的な参考書スタイルで出力してください。URL: ${url}`}], 8192);
    area.innerHTML = `<div class="card">${clean(rep.replace(/```html?/g, '').replace(/```/g, ''))}</div>`;
  } catch(e) { area.innerHTML = '<p class="text-danger">生成失敗</p>'; }
  finally { ld.classList.add('hidden'); }
};

let pdfHighlightMode = false;
window.openPdfReaderModal = () => { openModal('pdf-reader-modal'); };
window.loadPdfFile = (e) => {
  const f = e.target.files[0]; if(!f) return;
  const url = URL.createObjectURL(f);
  $('pdf-reader-container').innerHTML = `<iframe src="${url}" style="width:100%; height:100%; border:none;"></iframe>`;
};
window.togglePdfHighlightMode = () => {
  pdfHighlightMode = !pdfHighlightMode;
  showToast(pdfHighlightMode ? 'ハイライトモードON' : 'ハイライトモードOFF');
};
window.addPdfNote = () => {
  showToast('PDFへのメモ機能は現在開発中です');
};

window.openShadowingModal = () => { openModal('shadowing-modal'); };
window.playShadowingModel = () => {
  const text = $('shadowing-text-input').value;
  if(!text) return showToast('英文を入力してください');
  speakWord(text);
  drawFakeWaveform('shadowing-model-canvas', '#2980B9');
};
window.toggleShadowingRecord = async () => {
  const btn = $('shadowing-record-btn');
  if(btn.textContent === '録音開始') {
    btn.textContent = '停止'; btn.classList.remove('bg-danger'); btn.classList.add('bg-accent');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      shadowingAudioCtx = new AudioContext();
      const source = shadowingAudioCtx.createMediaStreamSource(stream);
      shadowingAnalyser = shadowingAudioCtx.createAnalyser();
      source.connect(shadowingAnalyser);
      drawRealWaveform('shadowing-user-canvas', '#E67E22');
    } catch(e) { showToast('マイクの許可が必要です'); toggleShadowingRecord(); }
  } else {
    btn.textContent = '録音開始'; btn.classList.remove('bg-accent'); btn.classList.add('bg-danger');
    if(shadowingAudioCtx) shadowingAudioCtx.close();
    cancelAnimationFrame(shadowingReqAnimFrame);
  }
};
const drawFakeWaveform = (id, color) => {
  const canvas = $(id); if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let x = 0;
  const draw = () => {
    if(x > canvas.width) return;
    ctx.fillStyle = color;
    const h = Math.random() * canvas.height;
    ctx.fillRect(x, (canvas.height - h)/2, 2, h);
    x += 3;
    requestAnimationFrame(draw);
  };
  ctx.clearRect(0,0,canvas.width,canvas.height);
  draw();
};
const drawRealWaveform = (id, color) => {
  const canvas = $(id); if(!canvas) return;
  const ctx = canvas.getContext('2d');
  shadowingAnalyser.fftSize = 256;
  const bufferLength = shadowingAnalyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const draw = () => {
    shadowingReqAnimFrame = requestAnimationFrame(draw);
    shadowingAnalyser.getByteFrequencyData(dataArray);
    ctx.fillStyle = 'var(--bg2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    for(let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 2;
      ctx.fillStyle = color;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  };
  draw();
};

const renderSyntax = () => { const c = $('syntax-list'); if (!c) return; if (!syntaxList.length) { c.innerHTML = '<div class="vocab-empty">構文なし</div>'; return; } c.innerHTML = syntaxList.map(s => { const sK = "syntax_" + s.id, r = srsData[sK.toLowerCase()], sT = r ? `次回: ${srsDaysDiff(srsNextDate(r)) <= 0 ? '今日' : srsDaysDiff(srsNextDate(r)) + '日後'}` : '未登録'; return `<div class="card mb-2 p-14"><div class="flex-between align-center mb-2"><div class="text-base font-bold line-height-15" style="font-family:var(--font-block);">${esc(s.syntax)}</div><button onclick="deleteSyntax('${s.id}')" class="btn-clear text-danger">✕</button></div><div class="text-sm text-sub mb-1">${esc(s.meaning || '')}</div>${s.note ? `<div class="text-xs text-muted mt-2 pt-2 border-top border-dashed">${esc(s.note)}</div>` : ''}<div class="flex align-center gap-1 mt-3"><button onclick="srsReviewItem('${sK}',0);renderSyntax()" class="btn-srs bg-danger btn-pill">忘</button><button onclick="srsReviewItem('${sK}',1);renderSyntax()" class="btn-srs bg-streak btn-pill">難</button><button onclick="srsReviewItem('${sK}',2);renderSyntax()" class="btn-srs bg-green btn-pill">覚</button><button onclick="srsReviewItem('${sK}',3);renderSyntax()" class="btn-srs bg-blue btn-pill">完</button><span class="text-xs text-muted ml-2 whitespace-nowrap">${sT}</span></div></div>`; }).join(''); };
const addSyntaxManual = () => { const nt = $('syntax-new-text'), nm = $('syntax-new-meaning'), nn = $('syntax-new-note'); if (!nt || !nt.value.trim()) return; syntaxList.unshift({ id: generateId(), syntax: nt.value.trim(), meaning: nm ? nm.value.trim() : '', note: nn ? nn.value.trim() : '', date: new Date().toLocaleDateString('ja-JP') }); save.syntax(); renderSyntax(); nt.value = ''; if (nm) nm.value = ''; if (nn) nn.value = ''; showToast('追加'); };
const deleteSyntax = id => { 
  const s = syntaxList.find(x => String(x.id) === String(id));
  if (!s) return;
  syntaxList = syntaxList.filter(x => String(x.id) !== String(id));
  save.syntax(); renderSyntax(); 
  showUndoSnackbar('構文を削除しました', () => {
    syntaxList.unshift(s);
    save.syntax(); renderSyntax();
  }, () => {});
};
const exportSyntaxPDF = () => {
  if (!syntaxList.length) return showToast('構文がありません');
  const html = `<!DOCTYPE html><html lang="ja"><head><title>構文リスト</title><style>body{font-family:sans-serif;padding:20px;font-size:13px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:#f5f5f5}.btn{display:block;width:180px;margin:0 auto 20px;padding:10px;text-align:center;background:#2D2B27;color:#fff;border-radius:50px;cursor:pointer}@media print{.btn{display:none}}</style></head><body><button class="btn" onclick="window.print()">印刷</button><h1>構文リスト（${syntaxList.length}件）</h1><table><tr><th>構文</th><th>意味</th><th>メモ</th></tr>${syntaxList.map(s => `<tr><td><b>${esc(s.syntax)}</b></td><td>${esc(s.meaning || '')}</td><td>${esc(s.note || '')}</td></tr>`).join('')}</table></body></html>`;
  printHtml(html);
};

// ============================================================
// [12] CUSTOM DECKS
// ============================================================
const ccInitDecks = () => { ccRenderSelects(); ccRenderDecksList(); if (ccDeckId) ccLoadDeck(); };
const ccRenderSelects = () => { const o = `<option value="">${customTexts['cc_select_default'] || '-- 選択 --'}</option>` + customDecks.map(d => `<option value="${d.id}" ${d.id === ccDeckId ? 'selected' : ''}>${esc(d.name)}</option>`).join(''); ['cc-deck-select', 'cc-edit-deck-select'].forEach(id => { const e = $(id); if (e) e.innerHTML = o; }); };
const ccRenderDecksList = () => { const c = $('cc-decks-list'); if (c) c.innerHTML = customDecks.length ? customDecks.map(d => `<div class="card flex-between align-center"><span>${esc(d.name)} (${d.cards.length}枚)</span><div class="flex-gap-8"><button onclick="ccDeleteDeck('${d.id}')" class="btn-clear text-danger">削除</button></div></div>`).join('') : ''; };
const ccCreateDeck = () => { const i = $('cc-new-deck-name'); if (!i || !i.value.trim()) return; customDecks.push({ id: 'deck_' + generateId(), name: i.value.trim(), cards: [] }); save.decks(); ccInitDecks(); showToast('作成'); i.value = ''; };
const ccDeleteDeck = id => { 
  if (!confirm('削除しますか？')) return; 
  customDecks = customDecks.filter(d => d.id !== id); 
  if (ccDeckId === id) {
    ccDeckId = null; 
    ccList = [];
    ccIdx = 0;
    ccRenderCard();
  }
  save.decks(); ccInitDecks(); 
};
const setCCMode = m => { ccMode = m; ['study', 'edit', 'decks'].forEach(x => { const el = $('cc-mode-' + x), a = $('cc-' + x + '-area'); if (el) { if (x === m) el.classList.add('active'); else el.classList.remove('active'); } if (a) { if (x === m) a.classList.remove('hidden'); else a.classList.add('hidden'); } }); if (m === 'study') ccLoadDeck(); if (m === 'edit' || m === 'decks') ccInitDecks(); };

const ccLoadDeck = () => { const s = $('cc-deck-select'); if (s && s.value) ccDeckId = s.value; const d = customDecks.find(x => x.id === ccDeckId), fc = $('cc-flip-card'), ed = $('cc-empty-deck'), nd = $('cc-no-deck'), cc = $('cc-card-counter'), cn = $('cc-card-nav'); if (fc) { if (d && d.cards.length) fc.classList.remove('hidden'); else fc.classList.add('hidden'); } if (ed) { if (d && !d.cards.length) ed.classList.remove('hidden'); else ed.classList.add('hidden'); } if (nd) { if (!d) nd.classList.remove('hidden'); else nd.classList.add('hidden'); } if (cc) { if (d && d.cards.length) cc.classList.remove('hidden'); else cc.classList.add('hidden'); } if (cn) { if (d && d.cards.length) cn.classList.remove('hidden'); else cn.classList.add('hidden'); } if (!d || !d.cards.length) return; ccList = d.cards.slice(); ccIdx = 0; ccRenderCard(); };
const ccRenderCard = () => { 
  const fi = $('cc-flip-inner'), cf = $('cc-card-front'), cb = $('cc-card-back'), ci = $('cc-card-idx'), ct = $('cc-card-total'); 
  if (fi) fi.classList.remove('flipped'); 
  if (!ccList.length) {
    if (cf) cf.textContent = '—'; if (cb) cb.textContent = '—'; if (ci) ci.textContent = '0'; if (ct) ct.textContent = '0';
    return;
  }
  if (cf) cf.textContent = ccList[ccIdx].front; if (cb) cb.textContent = ccList[ccIdx].back; if (ci) ci.textContent = ccIdx + 1; if (ct) ct.textContent = ccList.length; 
};
const ccFlipCard = () => { const fi = $('cc-flip-inner'); if (fi) fi.classList.toggle('flipped'); };
const ccChangeCard = d => { if (ccList.length) { ccIdx = (ccIdx + d + ccList.length) % ccList.length; ccRenderCard(); } };
const ccShuffleCards = () => { for (let i = ccList.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ccList[i], ccList[j]] = [ccList[j], ccList[i]]; } ccIdx = 0; ccRenderCard(); };

const ccRenderCards = () => { const s = $('cc-edit-deck-select'); if (s && s.value) ccDeckId = s.value; const d = customDecks.find(x => x.id === ccDeckId), ned = $('cc-no-edit-deck'), ce = $('cc-card-editor'), cl = $('cc-card-list'); if (ned) { if (d) ned.classList.add('hidden'); else ned.classList.remove('hidden'); } if (ce) { if (d) ce.classList.remove('hidden'); else ce.classList.add('hidden'); } if (!d || !cl) return; cl.innerHTML = d.cards.map((c, i) => `<div class="card flex-between p-10"><div><b>${esc(c.front)}</b><br><span class="text-muted">${esc(c.back)}</span></div><button onclick="ccDeleteCard(${i})" class="btn-clear text-danger">✕</button></div>`).join(''); };
const ccAddCard = () => { const fi = $('cc-new-front'), bi = $('cc-new-back'), d = customDecks.find(x => x.id === ccDeckId); if (fi && bi && d && fi.value.trim() && bi.value.trim()) { d.cards.push({ front: fi.value.trim(), back: bi.value.trim() }); save.decks(); ccRenderCards(); fi.value = ''; bi.value = ''; fi.focus(); showToast('追加'); } };
const ccDeleteCard = i => { const d = customDecks.find(x => x.id === ccDeckId); if (d) { d.cards.splice(i, 1); save.decks(); ccRenderCards(); } };

const setCCAiMode = m => { ccAiMode = m; ['text', 'file', 'photo'].forEach(x => { const btn = $('cc-ai-mode-' + x), area = $('cc-ai-' + x + '-area'); if (btn) { if (x === m) btn.classList.add('active'); else btn.classList.remove('active'); } if (area) { if (x === m) area.classList.remove('hidden'); else area.classList.add('hidden'); } }); };
const handleCCAiFile = e => { const f = e.target.files[0]; if (!f) return; const fn = $('cc-ai-file-name'); if (fn) fn.textContent = f.name; const r = new FileReader(); r.onload = ev => { ccAiFileData = ev.target.result; }; r.readAsText(f); };
const handleCCAiPhoto = e => { 
  const f = e.target.files[0]; if (!f) return; 
  openImageCropper(f, (croppedDataUrl) => {
    ccAiPhotoData = croppedDataUrl;
    const pv = $('cc-ai-photo-preview'); 
    if (pv) pv.innerHTML = `<img src="${ccAiPhotoData}" style="max-width:100%;border-radius:10px">`; 
  });
};
const ccGenerateCardsAI = async () => {
  const d = customDecks.find(x => x.id === ccDeckId); if (!d) return showToast('デッキ未選択'); let c = [];
  if (ccAiMode === 'text') { const p = $('cc-ai-prompt')?.value.trim(); if (!p) return showToast('テーマ入力必須'); c = [{ role: 'user', content: `「${p}」に関連するフラッシュカードのペア生成` }]; } 
  else if (ccAiMode === 'file') { if (!ccAiFileData) return showToast('ファイル未選択'); const p = $('cc-ai-file-prompt')?.value.trim() || 'フラッシュカード生成'; c = [{ role: 'user', content: `ファイル内容:\n${ccAiFileData.substring(0, 5000)}\n\n指示:${p}` }]; } 
  else if (ccAiMode === 'photo') { if (!ccAiPhotoData) return showToast('写真未選択'); const b = ccAiPhotoData.split(',')[1], m = ccAiPhotoData.match(/data:([^;]+)/)[1], p = $('cc-ai-photo-prompt')?.value.trim() || '画像内容からカード生成'; c = [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: m, data: b } }, { type: 'text', text: p }] }]; }
  const btn = $('cc-ai-btn'); if (btn) { btn.disabled = true; btn.textContent = '生成中...'; }
  try {
    const rep = await callGemini(c, 8192, 'JSON配列。キーは "front" と "back"。フロントとバックを簡潔に。挨拶不要。', true);
    const arr = extractJSON(rep);
    if (arr && arr.length) {
      let added = 0; arr.forEach(cd => { if (cd.front && cd.back) { d.cards.push({ front: String(cd.front), back: String(cd.back) }); added++; } });
      save.decks(); ccRenderCards(); showToast(`${added}枚生成`);
      if (ccAiMode === 'text') { const i = $('cc-ai-prompt'); if (i) i.value = ''; }
      else if (ccAiMode === 'file') { const f = $('cc-ai-file-input'); if (f) f.value = ''; $('cc-ai-file-name').textContent = ''; $('cc-ai-file-prompt').value = ''; ccAiFileData = ''; }
      else if (ccAiMode === 'photo') { $('cc-ai-photo-input').value = ''; $('cc-ai-photo-preview').innerHTML = ''; $('cc-ai-photo-prompt').value = ''; ccAiPhotoData = null; }
    } else showToast('失敗');
  } catch (e) { showToast('通信エラー'); } finally { if (btn) { btn.disabled = false; btn.textContent = customTexts['cc_ai_btn'] || 'AIで生成'; } }
};

// ============================================================
// [13] SUBJECT QA
// ============================================================
const setSubject = s => { 
  curSubj = s; 
  document.querySelectorAll('#subject-tabs .stab').forEach((b, i) => { if (Object.keys(subjConf)[i] === s) b.classList.add('active'); else b.classList.remove('active'); }); 
  const sl = $('subject-label'); if (sl) sl.textContent = (customTexts['subj_tab_' + s.substring(0,3)] || subjConf[s]) + 'モード'; 
  
  const ocrOpt = $('math-sci-ocr-option');
  if(ocrOpt) {
    if(s === 'math' || s === 'science') ocrOpt.classList.remove('hidden');
    else ocrOpt.classList.add('hidden');
  }
  
  renderSubjectChat(); renderSubjectSaved(); renderSubjectQuiz(); 
};
const switchSubjectView = v => { ['chat', 'history', 'quiz'].forEach(x => { const el = $('sview-' + x), _v = $('subject-' + x + '-view'); if (el) { if (x === v) el.classList.add('active'); else el.classList.remove('active'); } if (_v) { if (x === v) _v.classList.remove('hidden'); else _v.classList.add('hidden'); } }); if (v === 'history') renderSubjectSaved(); if (v === 'quiz') renderSubjectQuiz(); };
const setSubjectInputMode = m => { sqMode = m; ['text', 'file', 'photo'].forEach(x => { const el = $('sqmode-' + x), a = $('sq-' + x + '-area'); if (el) { if (x === m) el.classList.add('active'); else el.classList.remove('active'); } if (a) { if (x === m) a.classList.remove('hidden'); else a.classList.add('hidden'); } }); };
const handleSubjectFile = e => { const f = e.target.files[0], fn = $('subject-file-name'); if (!f) return; if (fn) fn.textContent = f.name; const r = new FileReader(); r.onload = ev => sqFileData = ev.target.result; r.readAsText(f); };
const handleSubjectPhoto = e => { 
  const f = e.target.files[0]; if (!f) return; 
  openImageCropper(f, (croppedDataUrl) => {
    sqPhotoData = croppedDataUrl;
    const pp = $('subject-photo-preview');
    if (pp) pp.innerHTML = `<img src="${sqPhotoData}" style="max-width:100%;border-radius:10px">`;
  });
};

const _sendSubj = async (c, dt) => {
  if (!subjHist[curSubj]) subjHist[curSubj] = [];
  subjHist[curSubj].push({ role: 'user', content: typeof c === 'string' ? c : dt });
  const ct = $('subject-chat'); if (!ct) return;
  ct.insertAdjacentHTML('beforeend', `<div class="chat-bubble user">${esc(dt)}</div><div class="chat-bubble ai" id="sq-load"><span class="loading-dots"></span></div>`); ct.scrollTop = ct.scrollHeight;
  try {
    const rep = await callGemini(subjHist[curSubj].slice(0, -1).concat([{ role: 'user', content: c }]), 8192, '客観的かつ簡潔な参考書スタイルで解説してください。挨拶や語りかけは一切不要です。');
    const cleanRep = clean(rep); subjHist[curSubj].push({ role: 'assistant', content: cleanRep }); const ld = $('sq-load'); if (ld) ld.remove();
    ct.insertAdjacentHTML('beforeend', `<div class="chat-bubble ai">${cleanRep.replace(/\n/g, '<br>')} <button class="copy-btn mt-2" onclick="saveLastSubjectQA(this,'${curSubj}')">保存</button></div>`);
    renderMath(ct.lastElementChild);
  } catch (e) { const ld = $('sq-load'); if (ld) ld.remove(); ct.insertAdjacentHTML('beforeend', `<div class="chat-bubble ai text-danger">通信エラー</div>`); subjHist[curSubj].pop(); }
  ct.scrollTop = ct.scrollHeight;
};
const sendSubjectMessage = () => { const i = $('subject-input'); if (!i || !i.value.trim()) return; const t = i.value.trim(); i.value = ''; autoResize(i); _sendSubj(t, t); };
const sendSubjectFileMessage = () => { if (sqFileData) { const ex = $('subject-file-extra'); _sendSubj([{ type: 'text', text: (ex ? ex.value : '') + '\n' + sqFileData }], 'ファイル添付'); if (ex) ex.value = ''; sqFileData = ''; const fn = $('subject-file-name'); if (fn) fn.textContent = ''; } };
const sendSubjectPhotoMessage = () => { 
  if (sqPhotoData) { 
    const b = sqPhotoData.split(',')[1], m = sqPhotoData.match(/data:([^;]+)/)[1], ex = $('subject-photo-extra'); 
    let textPrompt = ex ? ex.value || '質問' : '質問';
    const isMathOcr = $('subject-math-ocr-check') && $('subject-math-ocr-check').checked && (curSubj === 'math' || curSubj === 'science');
    if(isMathOcr) {
      textPrompt = `画像内の数式や問題を正確に読み取り、なぜその公式を使うのかを含めてステップバイステップで詳しく解説してください。\n追加の質問: ${textPrompt}`;
    }
    _sendSubj([{ type: 'image', source: { type: 'base64', media_type: m, data: b } }, { type: 'text', text: textPrompt }], '写真'); 
    if (ex) ex.value = ''; sqPhotoData = null; const pp = $('subject-photo-preview'); if (pp) pp.innerHTML = ''; 
  } 
};

const renderSubjectChat = () => { 
  const c = $('subject-chat'); if (!c) return; 
  c.innerHTML = ''; 
  (subjHist[curSubj] || []).forEach(m => { 
    c.insertAdjacentHTML('beforeend', `<div class="chat-bubble ${m.role === 'user' ? 'user' : 'ai'}">${m.role === 'user' ? esc(m.content) : String(m.content).replace(/\n/g, '<br>')}</div>`); 
    if (m.role === 'assistant') renderMath(c.lastElementChild);
  }); 
  c.scrollTop = c.scrollHeight; 
};
const clearSubjectChat = () => { subjHist[curSubj] = []; renderSubjectChat(); };
const saveLastSubjectQA = async (btn, subj) => {
  const hist = subjHist[subj]; if (!hist || hist.length < 2) return;
  const qObj = hist[hist.length - 2].content;
  let qStr = '画像';
  let imageId = null;
  
  if (typeof qObj === 'string') {
    qStr = qObj;
  } else if (Array.isArray(qObj)) {
    const textPart = qObj.find(x => x.type === 'text');
    if (textPart) qStr = textPart.text;
    const imgPart = qObj.find(x => x.type === 'image');
    if (imgPart) {
      const base64 = `data:${imgPart.source.media_type};base64,${imgPart.source.data}`;
      imageId = await saveImageToDB(base64);
    }
  }
  
  const folderId = $('subject-folder-select') ? $('subject-folder-select').value : 'uncategorized';
  
  subjectSaved.unshift({ id: generateId(), subject: subj, subjectLabel: subjConf[subj], date: new Date().toLocaleString(), question: qStr, answer: hist[hist.length - 1].content, imageId, folderId });
  save.subSaved(); showToast('保存済'); if (btn) { btn.textContent = '保存済'; btn.disabled = true; }
};
const generateSimilarSubject = async id => {
  const x = subjectSaved.find(s => String(s.id) === String(id)); if (!x) return; showToast('類題生成中...');
  try {
    const rep = await callGemini([{ role: 'user', content: `以下の問題と解答を参考にして、状況や数値を変えた類題を1つ出題し、その解答解説も出力して。JSONのみ: {"question":"...","answer":"..."}\nQ: ${x.question}\nA: ${x.answer}` }], 8192, '挨拶不要。客観的な参考書スタイルで出力。', true);
    const json = extractJSON(rep); subjectSaved.unshift({ id: generateId(), subject: x.subject, subjectLabel: x.subjectLabel, date: new Date().toLocaleString(), question: json.question, answer: clean(json.answer), folderId: x.folderId });
    save.subSaved(); renderSubjectSaved(); showToast('類題追加');
  } catch (e) { showToast('通信エラー'); }
};

window.createNewFolder = () => {
  const name = prompt('新しいフォルダ名を入力してください:');
  if (!name || !name.trim()) return;
  subjectFolders.push({ id: 'folder_' + generateId(), name: name.trim() });
  save.subjectFolders();
  renderSubjectSaved();
};

const renderSubjectSaved = () => { 
  const sl = $('subject-saved-list'); if (!sl) return; 
  const folderSel = $('subject-folder-select');
  if (folderSel) {
    const currentVal = folderSel.value;
    folderSel.innerHTML = `<option value="all">すべてのフォルダ</option><option value="uncategorized">未分類</option>` + subjectFolders.map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join('');
    folderSel.value = currentVal || 'all';
  }
  
  const filterFolder = folderSel ? folderSel.value : 'all';
  let ls = subjectSaved.filter(x => x.subject === curSubj);
  if (filterFolder !== 'all') {
    ls = ls.filter(x => (x.folderId || 'uncategorized') === filterFolder);
  }
  
  sl.innerHTML = ls.length ? ls.map(x => `<div class="card mb-2"><div class="text-xs text-muted mb-1">${x.date}</div><div class="text-sm font-bold mb-1">${esc(x.question)}</div>${x.imageId ? `<div class="mb-2"><button class="btn-text-muted" onclick="showSavedImage('${x.imageId}')">画像を表示</button><div id="saved-img-${x.imageId}" class="mt-1"></div></div>` : ''}<div class="text-xs text-sub">${esc(x.answer)}</div><div class="flex-gap-8 mt-2"><button class="copy-btn" onclick="generateSimilarSubject('${x.id}')">類題生成</button><button class="copy-btn text-danger" style="border-color:#f0d4d0;" onclick="deleteSubjectSaved('${x.id}')">削除</button></div></div>`).join('') : '<div class="vocab-empty">空</div>'; 
  
  // Render MathJax/KaTeX for saved items
  sl.querySelectorAll('.text-sub').forEach(el => renderMath(el));
};

$('subject-folder-select')?.addEventListener('change', renderSubjectSaved);

window.showSavedImage = async (id) => {
  const container = $(`saved-img-${id}`);
  if (!container) return;
  if (container.innerHTML) { container.innerHTML = ''; return; }
  const data = await getImageFromDB(id);
  if (data) container.innerHTML = `<img src="${data}" style="max-width:100%; border-radius:8px;">`;
};
const deleteSubjectSaved = id => { 
  const s = subjectSaved.find(x => String(x.id) === String(id));
  if (!s) return;
  subjectSaved = subjectSaved.filter(x => String(x.id) !== String(id));
  save.subSaved(); renderSubjectSaved(); 
  showUndoSnackbar('QA履歴を削除しました', () => {
    subjectSaved.unshift(s);
    save.subSaved(); renderSubjectSaved();
  }, () => {});
};

const renderSubjectQuiz = () => { const sqs = $('subject-quiz-start'), sqa = $('subject-quiz-area'); if (!sqs || !sqa) return; const pendingQuiz = subjectQuizzes.find(q => q.subject === curSubj && !q.answer); if (pendingQuiz) { sqs.classList.add('hidden'); sqa.classList.remove('hidden'); renderSubjectQuizActive(pendingQuiz); } else { sqs.classList.remove('hidden'); sqa.classList.add('hidden'); const hist = subjectQuizzes.filter(q => q.subject === curSubj && q.answer), hl = $('subject-quiz-history-list'); if (hl) hl.innerHTML = hist.length ? `<p class="section-note">過去の復習問題</p>` + hist.map(h => `<div class="writing-history-item" role="button" tabindex="0" onclick="showSubjectQuizHistory('${h.id}')"><div class="text-xs text-muted mb-1">${h.date}${h.score != null ? ' — ' + h.score + '点' : ''}</div><div class="text-sm">${h.question.replace(/<[^>]+>/g, '').substring(0, 60)}...</div></div>`).join('') : ''; } };
const generateSubjectQuiz = async () => {
  const ls = subjectSaved.filter(x => x.subject === curSubj); if (!ls.length) return showToast('QA履歴なし');
  const qas = ls.slice(0, 5).map(x => `Q: ${x.question}\nA: ${x.answer}`).join('\n\n'), sqs = $('subject-quiz-start'), sqa = $('subject-quiz-area');
  if (sqs) sqs.classList.add('hidden'); if (sqa) { sqa.classList.remove('hidden'); sqa.innerHTML = '<div class="card text-center p-36"><span class="loading-dots"></span></div>'; }
  try {
    const rep = await callGemini([{ role: 'user', content: `【QA履歴】\n${qas}\n\n復習問題を作成` }], 8192, `QA履歴から極めて難関な復習問題を1問作成。HTML(h4+p)のみ。解答解説なし。挨拶不要。客観的な参考書スタイルで出力。`);
    const html = clean(rep.replace(/```html?/g, '').replace(/```/g, '').trim()), newQuiz = { id: 'squiz_' + generateId(), subject: curSubj, date: new Date().toLocaleDateString('ja-JP'), question: html, answer: '', feedback: '', score: null };
    subjectQuizzes.unshift(newQuiz); save.subQuiz(); renderSubjectQuizActive(newQuiz);
  } catch (e) { if (sqa) handleApiError(e, sqa.id); }
};
const renderSubjectQuizActive = quiz => { const sqa = $('subject-quiz-area'); if (!sqa) return; if (!quiz.answer) sqa.innerHTML = `<div class="card"><p class="text-xs font-bold text-muted mb-3">復習問題</p><div class="text-base mb-4 line-height-16">${quiz.question}</div><textarea id="subquiz-answer-input" class="writing-textarea" placeholder="解答..."></textarea><button class="action-btn mb-0" id="subquiz-submit-btn" onclick="submitSubjectQuiz('${quiz.id}')">添削</button><div id="subquiz-loading" class="hidden text-center"><span class="loading-dots"></span></div></div>`; else sqa.innerHTML = `<div class="card"><p class="text-xs font-bold text-green mb-3">添削完了</p><div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>問題:</b><br>${quiz.question}</div><div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>解答:</b><br>${esc(quiz.answer)}</div><div class="correction-box mt-0">${quiz.feedback}</div><button class="action-btn mt-3 mb-0 bg-accent2" onclick="renderSubjectQuiz()">戻る</button></div>`; renderMath(sqa); };
const submitSubjectQuiz = async id => {
  const i = $('subquiz-answer-input'); if (!i || !i.value.trim()) return; const ans = i.value.trim(), quiz = subjectQuizzes.find(q => String(q.id) === String(id)), sb = $('subquiz-submit-btn'), ld = $('subquiz-loading');
  if (!quiz) return; if (sb) sb.classList.add('hidden'); if (ld) ld.classList.remove('hidden');
  const ls = subjectSaved.filter(x => x.subject === curSubj).slice(0, 5).map(x => `Q: ${x.question}\nA: ${x.answer}`).join('\n\n');
  try {
    const rep = await callGemini([{ role: 'user', content: `問題:\n${quiz.question}\n解答:\n${ans}` }], 8192, `非常に丁寧な添削と解説をHTML出力。100点満点スコア。挨拶不要。客観的な参考書スタイルで出力。参考:\n${ls}`);
    const html = clean(rep.replace(/```html?/g, '').replace(/```/g, '')); quiz.answer = ans; quiz.feedback = html; quiz.score = html.match(/(\d{1,3})\s*(?:点|\/\s*100)/i) ? parseInt(RegExp.$1) : null;
    save.subQuiz(); renderSubjectQuizActive(quiz);
  } catch (e) { showToast('通信エラー'); } finally { if (ld) ld.classList.add('hidden'); if (sb) sb.classList.remove('hidden'); }
};
const showSubjectQuizHistory = id => { const h = subjectQuizzes.find(x => String(x.id) === String(id)), mb = $('writing-history-modal-body'); if (!h || !mb) return; let html = `<div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>問題:</b><br>${h.question}</div><div class="text-sm mb-3 pb-3 border-bottom line-height-16"><b>解答:</b><br>${esc(h.answer)}</div><div class="correction-box mt-0">${h.feedback}</div><button class="action-btn mt-3 mb-0 btn-danger" onclick="deleteSubjectQuizHistory('${id}')">この問題を削除</button>`; mb.innerHTML = html; openModal('writing-history-modal'); renderMath(mb); };
const deleteSubjectQuizHistory = id => { if (!confirm('削除しますか？')) return; subjectQuizzes = subjectQuizzes.filter(x => String(x.id) !== String(id)); save.subQuiz(); renderSubjectQuiz(); closeModal('writing-history-modal'); };

// ============================================================
// [14] PLANNER & LOGS
// ============================================================
const setPlanMode = m => {
  planMode = m; ['calendar', 'yearly', 'gantt', 'score', 'ai'].forEach(x => { const el = $('plan-mode-' + x); if (el) { if (x === m) el.classList.add('active'); else el.classList.remove('active'); } });
  const pa = $('plan-calendar-area'), py = $('plan-yearly-area'), pg = $('plan-gantt-area'), pai = $('plan-ai-area'), ps = $('plan-score-area');
  if (pa) { if (m === 'calendar') pa.classList.remove('hidden'); else pa.classList.add('hidden'); }
  if (py) { if (m === 'yearly') py.classList.remove('hidden'); else py.classList.add('hidden'); }
  if (pg) { if (m === 'gantt') pg.classList.remove('hidden'); else pg.classList.add('hidden'); }
  if (pai) { if (m === 'ai') pai.classList.remove('hidden'); else pai.classList.add('hidden'); }
  if (ps) { if (m === 'score') ps.classList.remove('hidden'); else ps.classList.add('hidden'); }
  
  if (m === 'score') { renderScoreList(); renderScoreChart(); }
  if (m === 'calendar') { renderPlanCalendar(); renderPlanDateList(); }
  if (m === 'yearly') { renderYearlyPlan(); }
};

const planCalPrev = () => { pCalMonth--; if (pCalMonth < 0) { pCalMonth = 11; pCalYear--; } renderPlanCalendar(); };
const planCalNext = () => { pCalMonth++; if (pCalMonth > 11) { pCalMonth = 0; pCalYear++; } renderPlanCalendar(); };

const renderPlanCalendar = () => {
  const cl = $('plan-cal-month-label'); if (cl) cl.textContent = `${pCalYear}年 ${MONTHS[pCalMonth]}`;
  const firstDay = new Date(pCalYear, pCalMonth, 1), lastDay = new Date(pCalYear, pCalMonth + 1, 0); let startDow = firstDay.getDay() - 1; if (startDow < 0) startDow = 6; let html = '';
  for (let i = 0; i < startDow; i++) html += `<div class="cal-day other-month"></div>`;
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const ds = `${pCalYear}-${String(pCalMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; let cls = 'cal-day';
    if (ds === todayDateStr()) cls += ' today'; if (ds === selectedPlanDate) cls += ' selected';
    let dotHtml = ''; const dp = plans[ds];
    if (dp && dp.length > 0) dotHtml += `<div style="width:5px;height:5px;border-radius:50%;background:${dp.every(p => p.done) ? 'var(--green)' : 'var(--streak)'};"></div>`;
    const ev = events[ds]; if (ev && ev.length > 0) dotHtml += `<div style="width:5px;height:5px;border-radius:50%;background:#3498db;"></div>`;
    const dot = dotHtml ? `<div style="position:absolute;bottom:3px;left:50%;transform:translateX(-50%);display:flex;gap:2px;">${dotHtml}</div>` : '';
    html += `<div class="${cls}" onclick="selectPlanDate('${ds}')">${d}${dot}</div>`;
  }
  const cd = $('plan-cal-days'); if (cd) cd.innerHTML = html;
};

const selectPlanDate = ds => { selectedPlanDate = ds; renderPlanCalendar(); renderPlanDateList(); };
const renderPlanDateList = () => {
  const lbl = $('plan-selected-date-label'); if (lbl) lbl.textContent = selectedPlanDate;
  const evL = $('plan-event-list'), lsE = events[selectedPlanDate] || []; if (evL) evL.innerHTML = lsE.length ? lsE.map((e, i) => `<div class="plan-item-row" style="margin-bottom:6px;border-left:3px solid #3498db;"><div style="flex:1"><div class="pi-text" style="font-size:14px;">${esc(e.text)}</div></div><button class="plan-del" onclick="deletePlanEvent(${i})">✕</button></div>`).join('') : '<div class="text-center text-xs text-muted">イベントなし</div>';
  const plL = $('plan-content'), lsP = plans[selectedPlanDate] || []; if (plL) plL.innerHTML = lsP.length ? lsP.map((p, i) => `<div class="plan-item-row"><input type="checkbox" ${p.done ? 'checked' : ''} onchange="togglePlanDatePlan(${i})"><div style="flex:1"><div class="pi-text ${p.done ? 'done' : ''}" style="font-size:14px;">${esc(p.text)}</div>${p.time ? `<div class="pi-time" style="font-size:11px;color:var(--text-muted);">${esc(p.time)}</div>` : ''}</div><button class="plan-del" onclick="deletePlanDatePlan(${i})">✕</button></div>`).join('') : '<p class="text-center text-xs text-muted p-10">予定なし</p>';
};

window.toggleRoutineDays = val => {
  const sel = $('routine-days-selector');
  if(sel) {
    if(val === 'weekly') sel.classList.remove('hidden');
    else sel.classList.add('hidden');
  }
};

const addPlanEvent = () => { const i = $('plan-event-input'); if (!i || !i.value.trim()) return; if (!events[selectedPlanDate]) events[selectedPlanDate] = []; events[selectedPlanDate].push({ text: i.value.trim() }); save.events(); i.value = ''; renderPlanCalendar(); renderPlanDateList(); if ($('Dashboard').classList.contains('active')) renderDashboard(); };
const deletePlanEvent = i => { if (events[selectedPlanDate]) { events[selectedPlanDate].splice(i, 1); if (events[selectedPlanDate].length === 0) delete events[selectedPlanDate]; save.events(); renderPlanCalendar(); renderPlanDateList(); if ($('Dashboard').classList.contains('active')) renderDashboard(); } };

const addPlanDatePlan = () => { 
  const i = $('new-plan-input'), t = $('new-plan-time'), r = $('new-plan-routine'); 
  if (!i || !i.value.trim()) return; 
  
  const text = i.value.trim();
  const time = t ? t.value.trim() : '';
  const routine = r ? r.value : 'none';
  
  if (routine === 'none') {
    if (!plans[selectedPlanDate]) plans[selectedPlanDate] = []; 
    plans[selectedPlanDate].push({ text, done: false, time }); 
  } else {
    const startDate = new Date(selectedPlanDate);
    for (let j = 0; j < 90; j++) { // 90日先まで生成
      const d = new Date(startDate);
      d.setDate(d.getDate() + j);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      let shouldAdd = false;
      if (routine === 'daily') shouldAdd = true;
      else if (routine === 'weekly') {
        const checkedDays = Array.from(document.querySelectorAll('#routine-days-selector input:checked')).map(cb => parseInt(cb.value));
        if (checkedDays.includes(d.getDay())) shouldAdd = true;
      }
      else if (routine === 'monthly') {
        if (d.getDate() === startDate.getDate()) shouldAdd = true;
      }
      
      if (shouldAdd) {
        if (!plans[ds]) plans[ds] = [];
        plans[ds].push({ text, done: false, time });
      }
    }
  }
  
  save.plans(); i.value = ''; if (t) t.value = ''; 
  renderPlanCalendar(); renderPlanDateList(); 
  if ($('Dashboard').classList.contains('active')) renderDashboard(); 
};

const togglePlanDatePlan = i => { if (plans[selectedPlanDate] && plans[selectedPlanDate][i]) { plans[selectedPlanDate][i].done = !plans[selectedPlanDate][i].done; save.plans(); renderPlanCalendar(); renderPlanDateList(); if ($('Dashboard').classList.contains('active')) renderDashboard(); } };
const deletePlanDatePlan = i => { 
  if (plans[selectedPlanDate]) { 
    const p = plans[selectedPlanDate][i];
    plans[selectedPlanDate].splice(i, 1); 
    if (plans[selectedPlanDate].length === 0) delete plans[selectedPlanDate]; 
    save.plans(); renderPlanCalendar(); renderPlanDateList(); if ($('Dashboard').classList.contains('active')) renderDashboard(); 
    showUndoSnackbar('予定を削除しました', () => {
      if (!plans[selectedPlanDate]) plans[selectedPlanDate] = [];
      plans[selectedPlanDate].splice(i, 0, p);
      save.plans(); renderPlanCalendar(); renderPlanDateList();
      if ($('Dashboard').classList.contains('active')) renderDashboard();
    }, () => {});
  } 
};

window.rebuildScheduleAI = async () => {
  if(!confirm('過去の未完了の予定を今日以降に自動で再配置しますか？')) return;
  const today = todayDateStr();
  let pendingTasks = [];
  
  Object.keys(plans).forEach(date => {
    if(date < today) {
      plans[date].forEach(p => { if(!p.done) pendingTasks.push(p.text); });
      plans[date] = plans[date].filter(p => p.done);
    }
  });
  
  if(pendingTasks.length === 0) return showToast('再配置する未完了タスクはありません');
  
  const targetDate = $('gantt-target-date')?.value;
  let prompt = '';
  if (targetDate && targetDate >= today) {
    prompt = `以下の未完了タスクを、今日(${today})から目標日(${targetDate})までの間に無理なく分散させて配置し、JSON配列で出力してください。形式: [{"date":"YYYY-MM-DD", "tasks":["タスク1"]}]\n\n未完了タスク:\n${pendingTasks.join('\n')}`;
  } else {
    prompt = `以下の未完了タスクを、今日(${today})から1週間以内に無理なく分散させて配置し、JSON配列で出力してください。形式: [{"date":"YYYY-MM-DD", "tasks":["タスク1"]}]\n\n未完了タスク:\n${pendingTasks.join('\n')}`;
  }

  showToast('AIがスケジュールを再構築中...');
  try {
    const rep = await callGemini([{role:'user', content:prompt}], 8192, '客観的な参考書スタイルで出力。挨拶不要。', true);
    const arr = extractJSON(rep);
    if(arr && arr.length) {
      arr.forEach(d => {
        if(!plans[d.date]) plans[d.date] = [];
        d.tasks.forEach(t => plans[d.date].push({text: t, done: false, time: ''}));
      });
      save.plans();
      renderPlanCalendar();
      renderPlanDateList();
      showToast('スケジュールを再構築しました');
    } else {
      showToast('再構築に失敗しました');
    }
  } catch(e) {
    showToast('通信エラー');
  }
};

const renderTextbooks = () => { const c = $('textbook-chips'); if (c) c.innerHTML = textbooks.length ? textbooks.map((t, i) => `<span class="filter-chip flex align-center gap-1">${esc(t)}<button onclick="deleteTextbook(${i})" class="btn-clear text-danger">✕</button></span>`).join('') : '<span class="text-xs text-muted">空</span>'; };
const addTextbook = () => { const i = $('new-textbook-input'); if (!i) return; const v = i.value.trim(); if (v && !textbooks.includes(v)) { textbooks.push(v); save.books(); i.value = ''; renderTextbooks(); } };
const deleteTextbook = i => { textbooks.splice(i, 1); save.books(); renderTextbooks(); };

const getAcademicYearLabel = m => { const now = new Date(), curCalMonth = now.getMonth() + 1, acadStartYear = curCalMonth >= 4 ? now.getFullYear() : now.getFullYear() - 1, displayYear = (m >= 1 && m <= 3) ? (acadStartYear + 1) : acadStartYear; return `${m}月 (${displayYear})`; };
const renderYearlyPlan = () => {
  const mg = $('yearly-main-goal'); if (mg) mg.value = yearlyPlan.goal || '';
  const grid = $('yearly-months-grid'); if (!grid) return;
  let html = ''; const curMonth = new Date().getMonth() + 1;
  ACADEMIC_YEAR_MONTHS.forEach(i => {
    const val = yearlyPlan.months[i] || '', isCur = i === curMonth;
    html += `<div class="yearly-month-card" style="${isCur ? 'border-color:var(--accent); background:var(--bg2);' : ''}"><div class="yearly-month-label">${getAcademicYearLabel(i)} ${isCur ? '<span class="text-accent">(今月)</span>' : ''}</div><textarea class="yearly-month-input" rows="3" placeholder="目標・計画..." oninput="updateYearlyMonth(${i}, this.value)">${esc(val)}</textarea></div>`;
  });
  grid.innerHTML = html;
};
const updateYearlyMonth = (m, val) => { if (!yearlyPlan.months) yearlyPlan.months = {}; yearlyPlan.months[m] = val; saveYearlyPlanDebounced(); };
const saveYearlyPlan = () => { const mg = $('yearly-main-goal'); if (mg) yearlyPlan.goal = mg.value.trim(); save.yearly(); if ($('Dashboard').classList.contains('active')) renderDashboard(); };
const saveYearlyPlanDebounced = debounce(saveYearlyPlan, 500);

window.generateMilestonesAI = async () => {
  const goal = $('yearly-main-goal').value;
  if(!goal) return showToast('年間大目標を入力してください');
  showToast('AIがマイルストーンを生成中...');
  try {
    const rep = await callGemini([{role:'user', content:`目標「${goal}」を達成するための月別マイルストーンをJSONで出力。形式: {"4":"...", "5":"..."}`}], 8192, '客観的な参考書スタイルで出力。挨拶不要。', true);
    const json = extractJSON(rep);
    if(json) {
      Object.keys(json).forEach(m => {
        if(yearlyPlan.months) yearlyPlan.months[m] = json[m];
      });
      save.yearly(); renderYearlyPlan(); showToast('生成完了');
    }
  } catch(e) { showToast('生成失敗'); }
};

window.slideGanttSchedule = () => {
  showToast('開発中です');
};

const generateGanttSchedule = async () => {
  const targetName = $('gantt-target-name')?.value.trim();
  const targetDate = $('gantt-target-date')?.value;
  const materials = $('gantt-materials')?.value.trim();
  
  if (!targetName || !targetDate || !materials) return showToast('すべての項目を入力してください');
  
  const today = todayDateStr();
  if (targetDate < today) return showToast('目標日は今日以降の日付にしてください');
  
  const ld = $('gantt-loading');
  const btn = $('gantt-generate-btn');
  if (ld) ld.classList.remove('hidden');
  if (btn) btn.disabled = true;
  
  const prompt = `今日(${today})から目標日(${targetDate})までの学習スケジュール（逆算プラン）を構築し、JSON配列で出力してください。
目標: ${targetName}
使用参考書・タスク量:\n${materials}
出力形式: [{"date": "YYYY-MM-DD", "tasks": ["やること1", "やること2"]}]`;

  try {
    const rep = await callGemini([{ role: 'user', content: prompt }], 8192, '客観的な参考書スタイルで出力。挨拶不要。', true);
    const planArr = extractJSON(rep);
    if (!planArr || !Array.isArray(planArr)) throw new Error('Invalid JSON');
    
    let addedCount = 0;
    planArr.forEach(dayPlan => {
      const d = dayPlan.date;
      if (!plans[d]) plans[d] = [];
      dayPlan.tasks.forEach(t => {
        const taskText = `[${targetName}] ${t}`;
        if (!plans[d].some(p => p.text === taskText)) {
          plans[d].push({ text: taskText, done: false, time: null });
          addedCount++;
        }
      });
    });
    save.plans();
    
    $('gantt-result-card')?.classList.remove('hidden');
    const resultText = $('gantt-result-text');
    if (resultText) resultText.textContent = `${addedCount}件のタスクをカレンダーに自動配置しました。`;
    showToast('スケジュール作成完了');
    
    if (!events[targetDate]) events[targetDate] = [];
    if (!events[targetDate].some(e => e.text.includes(targetName))) {
      events[targetDate].push({ text: `[ ${targetName} 当日 ]` });
      save.events();
    }
    
  } catch(e) {
    showToast('通信エラー: スケジュール作成に失敗しました');
  } finally {
    if (ld) ld.classList.add('hidden');
    if (btn) btn.disabled = false;
  }
};

const generateAutoSchedule = () => {
  const { dueWords, dueSyntax, dueDaily } = srsGetDueItems(); const ts = todayDateStr(); if (!plans[ts]) plans[ts] = []; let added = 0;
  if (dueWords.length > 0) { const vw = dueWords.filter(w => ALL_WORDS.find(x => x.word.toLowerCase() === w)); for (let i = 0; i < vw.length; i += 15) { plans[ts].push({ text: `単語復習 (${vw.slice(i, i + 15).join(', ')})`, done: false, time: null }); added++; } }
  if (dueSyntax.length > 0) { const vs = dueSyntax.map(id => syntaxList.find(s => String(s.id) === id)).filter(Boolean); for (let i = 0; i < vs.length; i += 5) { plans[ts].push({ text: `構文復習 (${vs.slice(i, i + 5).map(s => s.syntax).join(', ')})`, done: false, time: null }); added++; } }
  if (dueDaily.length > 0) { const vd = dueDaily.map(id => dailyChallenges.find(d => String(d.id) === id) || listenHistory.find(d => String(d.id) === id)).filter(Boolean); vd.forEach(d => { plans[ts].push({ text: `過去問 (${d.date})`, done: false, time: null }); added++; }); }
  if (examScores.length > 0) { const lt = examScores[0]; if (lt.subjects && lt.subjects.length > 0) { const weak = lt.subjects.reduce((p, c) => { const pv = parseFloat(p.dev) || parseFloat(p.score) || 1000, cv = parseFloat(c.dev) || parseFloat(c.score) || 1000; return (cv < pv) ? c : p; }); plans[ts].push({ text: `弱点補強: ${weak.cat}(${weak.detail})`, done: false, time: null }); added++; } }
  if (added === 0) showToast('完璧です！'); else { save.plans(); renderDashboard(); if (planMode === 'calendar') { renderPlanCalendar(); renderPlanDateList(); } showToast(`${added}件追加`); }
};

const clearPlanAiChat = () => { planAiHistory = []; const c = $('plan-ai-chat'); if (c) c.innerHTML = ''; };
const sendPlanAiMessage = async () => {
  const i = $('plan-ai-input'); if (!i || !i.value.trim()) return; const txt = i.value.trim(); i.value = ''; autoResize(i);
  const sbtn = $('plan-ai-send'); if (sbtn) sbtn.disabled = true; const c = $('plan-ai-chat'); if (!c) return;
  c.insertAdjacentHTML('beforeend', `<div class="chat-bubble user">${esc(txt)}</div><div class="chat-bubble ai" id="pai-load"><span class="loading-dots"></span></div>`);
  planAiHistory.push({ role: 'user', content: txt }); c.scrollTop = c.scrollHeight;
  try {
    const rep = await callGemini(planAiHistory.slice(), 8192, `客観的な学習アドバイザーとして。プロフ:${userProfile.targetUniv},${userProfile.grade}${buildScoreContext()}。客観的かつ簡潔に回答。挨拶不要。`);
    const cleanRep = clean(rep); planAiHistory.push({ role: 'assistant', content: cleanRep }); const ld = $('pai-load'); if (ld) ld.remove();
    c.insertAdjacentHTML('beforeend', `<div class="chat-bubble ai">${cleanRep.replace(/\n/g, '<br>')}</div>`);
  } catch (e) { const ld = $('pai-load'); if (ld) ld.remove(); c.insertAdjacentHTML('beforeend', `<div class="chat-bubble ai text-danger">通信エラー</div>`); planAiHistory.pop(); }
  finally { if (sbtn) sbtn.disabled = false; c.scrollTop = c.scrollHeight; }
};

const generateRoadmapReport = async () => { const r = $('ai-weakness-report'); if (!r) return; r.innerHTML = '<div class="text-center"><span class="loading-dots">作成中</span></div>'; try { const rep = await callGemini([{ role: 'user', content: '合格ロードマップを作成' }], 8192, `客観的なデータ分析に基づき。プロフ(${JSON.stringify(userProfile)})と成績(${JSON.stringify(examScores.slice(0, 3))})からHTMLで。挨拶不要。客観的な参考書スタイルで出力。`); r.innerHTML = `<div class="card">${clean(rep.replace(/```html?/g, '').replace(/```/g, ''))}</div>`; } catch (e) { handleApiError(e, 'ai-weakness-report'); } };
const generatePersonalizedExam = async () => {
  const r = $('ai-weakness-report'); if (!r) return; r.innerHTML = '<div class="text-center"><span class="loading-dots">作成中</span></div>';
  const weakWords = Object.entries(srsData).sort((a, b) => a[1].stability - b[1].stability).slice(0, 15).map(x => x[0]).join(', ');
  const recentMistakes = dailyChallenges.filter(d => d.score !== null && d.score < 80).slice(0, 3).map(d => d.question).join('\n');
  const pastExams = examScores.slice(0, 2).map(s => s.subjects.map(x => `${x.detail}:${x.dev}`).join(', ')).join('\n');
  const prompt = `以下の生徒の過去の学習データから、完全カスタマイズされた模試問題（英語長文または和文英訳などを1題）を作成し、HTMLで出力してください。\n【弱点単語】${weakWords}\n【最近の誤答傾向】${recentMistakes}\n【過去の成績】${pastExams}`;
  try { const rep = await callGemini([{ role: 'user', content: prompt }], 8192, '挨拶不要。客観的な参考書スタイルで出力。'); r.innerHTML = `<div class="card">${clean(rep.replace(/```html?/g, '').replace(/```/g, ''))}</div>`; } catch (e) { handleApiError(e, 'ai-weakness-report'); }
};

const ocrScore = async e => {
  const f = e.target.files[0]; if (!f) return; showToast('画像解析中...'); 
  const resized = await resizeImage(f, 2048, 2048, true); 
  const b = resized.split(',')[1], m = resized.match(/data:([^;]+)/)[1];
  try {
    const rep = await callGemini([{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: m, data: b } }, { type: 'text', text: '成績表から模試名、実施日(YYYY/MM形式)、各科目の点数と偏差値(catはenglish,math,japanese,science,social,totalのいずれか、detailは科目名)、各志望校判定(univ,rank)を抽出せよ。出力は必ず {"name":"","date":"","subjects":[{"cat":"","detail":"","score":"","dev":""}],"judges":[{"univ":"","rank":""}]} のJSON形式のみ。' }] }], 8192, '', true);
    const json = extractJSON(rep), ni = $('score-exam-name'), di = $('score-exam-date');
    if (ni && json.name) ni.value = json.name; if (di && json.date) di.value = json.date;
    $('exam-subjects-container').innerHTML = '';
    if (json.subjects) json.subjects.forEach(s => { addExamSubjectRow(); const rs = document.querySelectorAll('.score-subject-row'), r = rs[rs.length - 1]; if (r) { r.querySelector('.exam-subj-cat').value = s.cat || 'other'; updateSubjList(r.querySelector('.exam-subj-cat')); r.querySelector('.exam-subj-detail').value = s.detail; r.querySelector('.exam-subj-score').value = s.score; r.querySelector('.exam-subj-dev').value = s.dev; } });
    $('exam-judges-container').innerHTML = '';
    if (json.judges) json.judges.forEach(j => { addExamJudgeRow(); const rs = document.querySelectorAll('.score-judge-row'), r = rs[rs.length - 1]; if (r) { r.querySelector('.exam-judge-univ').value = j.univ; r.querySelector('.exam-judge-rank').value = j.rank; } });
    showToast('入力反映完了');
  } catch (err) { showToast('OCR失敗'); }
};

const getSubjectOptions = cat => (SCORE_SUBJECTS[cat]?.details.map(d => `<option value="${d}">${d}</option>`).join('')) || '';
const updateSubjList = sel => { const ds = sel.parentElement.querySelector('.exam-subj-detail'); if (ds) ds.innerHTML = getSubjectOptions(sel.value); };
const addExamSubjectRow = () => { const c = $('exam-subjects-container'); if (!c) return; const r = document.createElement('div'); r.className = 'score-subject-row flex gap-1'; const cats = Object.entries(SCORE_SUBJECTS).map(([k, v]) => `<option value="${k}" ${k === 'english' ? 'selected' : ''}>${v.label}</option>`).join(''); r.innerHTML = `<select class="score-input exam-subj-cat w-auto flex-1 min-w-60" onchange="updateSubjList(this)">${cats}</select><select class="score-input exam-subj-detail w-auto flex-1 min-w-80">${getSubjectOptions('english')}</select><input class="score-input exam-subj-score w-50" type="number" placeholder="点数"><input class="score-input exam-subj-dev w-60" type="number" step="0.1" placeholder="偏差値"><button onclick="this.parentElement.remove()" class="btn-clear p-8">✕</button>`; c.appendChild(r); };
const addExamJudgeRow = () => { const c = $('exam-judges-container'); if (!c) return; const r = document.createElement('div'); r.className = 'score-judge-row flex gap-1'; r.innerHTML = `<input class="score-input exam-judge-univ flex-2" placeholder="志望校"><select class="score-input exam-judge-rank flex-1"><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option></select><button onclick="this.parentElement.remove()" class="btn-clear p-8">✕</button>`; c.appendChild(r); };
const addExamScore = () => {
  const ni = $('score-exam-name'); if (!ni) return; const n = ni.value.trim(); if (!n) return showToast('模試名を入力');
  const subjects = []; document.querySelectorAll('.score-subject-row').forEach(r => { const cat = r.querySelector('.exam-subj-cat').value, detail = r.querySelector('.exam-subj-detail').value, score = r.querySelector('.exam-subj-score').value.trim(), dev = r.querySelector('.exam-subj-dev').value.trim(); if (score || dev) subjects.push({ cat, detail, score, dev }); });
  const judges = []; document.querySelectorAll('.score-judge-row').forEach(r => { const univ = r.querySelector('.exam-judge-univ').value.trim(), rank = r.querySelector('.exam-judge-rank').value; if (univ) judges.push({ univ, rank }); });
  const di = $('score-exam-date'), mi = $('score-memo'); examScores.unshift({ id: Date.now(), name: n, date: di ? di.value.trim() : '', memo: mi ? mi.value.trim() : '', subjects, judges }); save.exams();
  renderScoreList(); renderScoreChart(); showToast('保存');
  ni.value = ''; if (di) di.value = ''; if (mi) mi.value = ''; $('exam-subjects-container').innerHTML = ''; $('exam-judges-container').innerHTML = ''; addExamSubjectRow(); addExamJudgeRow();
};
const deleteExamScore = id => { examScores = examScores.filter(s => s.id !== id); save.exams(); renderScoreList(); renderScoreChart(); };
const renderScoreList = () => { const c = $('score-list'); if (!c) return; if (!examScores.length) { c.innerHTML = '<div class="vocab-empty">成績なし</div>'; return; } c.innerHTML = examScores.map(s => { const subjHtml = (s.subjects || []).map(x => `<div class="flex-between border-bottom border-dashed py-4 text-xs"><span>${(SCORE_SUBJECTS[x.cat]?.label || x.cat)} (${esc(x.detail)})</span><span>${x.score ? esc(x.score) + '点' : '-'} ${x.dev ? '(偏:' + esc(x.dev) + ')' : ''}</span></div>`).join(''); const judgeHtml = (s.judges || []).map(x => `<span class="inline-block bg-main border radius-sm px-6 py-2 mr-4 mb-2 text-xs font-bold">${esc(x.univ)} <span class="text-danger">${esc(x.rank)}</span></span>`).join(''); return `<div class="card mb-2"><div class="flex-between align-center mb-2"><div><div class="text-base font-bold">${esc(s.name)}</div>${s.date ? `<div class="text-xs text-muted mt-1">${esc(s.date)}</div>` : ''}</div><button onclick="deleteExamScore(${s.id})" class="btn-clear">✕</button></div>${subjHtml ? `<div class="mb-2">${subjHtml}</div>` : ''}${judgeHtml ? `<div class="mb-2">${judgeHtml}</div>` : ''}${s.memo ? `<div class="text-xs text-muted pt-2 border-top">${esc(s.memo)}</div>` : ''}</div>`; }).join(''); };

const setScoreChartMode = m => {
  scoreChartMode = m;
  ['dev', 'judge'].forEach(x => {
    const btn = $('score-chart-mode-' + x);
    if (btn) { if (x === m) btn.classList.add('active'); else btn.classList.remove('active'); }
  });
  renderScoreChart();
};

const renderScoreChart = () => {
  const cv = $('scoreLineChart'), card = $('score-chart-card'); if (!cv || !card) return;
  if (cv.offsetParent === null) return; 
  
  const scored = examScores.filter(s => s.subjects && s.subjects.some(x => x.dev)); if (!scored.length) { card.classList.add('hidden'); return; }
  card.classList.remove('hidden');
  
  const sorted = [...scored].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  const labels = sorted.map(s => s.date || s.name);
  const colors = ['#2980B9', '#C0392B', '#2E7D52', '#E67E22', '#8E44AD', '#16A085', '#D35400', '#2C3E50'];
  
  let datasets = [];
  let allDetails = [];
  
  if (scoreChartMode === 'dev') {
    allDetails = [...new Set(sorted.flatMap(s => s.subjects.filter(x => x.dev).map(x => x.detail)))];
    datasets = allDetails.map((det, i) => ({ label: det, data: sorted.map(s => { const f = s.subjects.find(x => x.detail === det && x.dev); return f ? parseFloat(f.dev) : null; }), borderColor: colors[i % colors.length], backgroundColor: colors[i % colors.length] + '33', tension: 0.3, pointRadius: 5, pointHoverRadius: 7, spanGaps: true }));
  } else {
    const rankMap = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
    allDetails = [...new Set(sorted.flatMap(s => (s.judges || []).map(x => x.univ)))];
    datasets = allDetails.map((univ, i) => ({ label: univ, data: sorted.map(s => { const f = (s.judges || []).find(x => x.univ === univ); return f ? rankMap[f.rank] || null : null; }), borderColor: colors[i % colors.length], backgroundColor: colors[i % colors.length] + '33', tension: 0.3, pointRadius: 5, pointHoverRadius: 7, spanGaps: true }));
  }
  
  if (scoreLineChart) scoreLineChart.destroy();
  scoreLineChart = new Chart(cv, { 
    type: 'line', 
    data: { labels, datasets }, 
    options: { 
      responsive: true, 
      maintainAspectRatio: false, 
      plugins: { legend: { display: false } }, 
      scales: { 
        y: { 
          title: { display: true, text: scoreChartMode === 'dev' ? '偏差値' : '判定' }, 
          suggestedMin: scoreChartMode === 'dev' ? 30 : 1, 
          suggestedMax: scoreChartMode === 'dev' ? 70 : 5,
          ticks: scoreChartMode === 'judge' ? { callback: function(value) { return ['E','D','C','B','A'][value-1] || ''; }, stepSize: 1 } : {}
        } 
      } 
    } 
  });
  const leg = $('score-chart-legend'); if (leg) leg.innerHTML = allDetails.map((d, i) => `<span class="flex align-center gap-1"><span style="width:12px;height:12px;border-radius:50%;background:${colors[i % colors.length]};display:inline-block;"></span>${esc(d)}</span>`).join('');
};
function buildScoreContext() { if (!examScores.length) return ''; return '\n【模試】\n' + examScores.slice(0, 5).map(s => { let p = [`${s.name}`]; if (s.subjects) p.push(...s.subjects.map(x => `${x.detail}:${x.score}/${x.dev}`)); return p.join(' '); }).join('\n'); }

const openLogListModal = () => {
  openModal('log-list-modal');
  renderLogListModal();
};
const renderLogListModal = () => {
  const c = $('log-list-container'); if (!c) return;
  if (!studyLogs.length) { c.innerHTML = '<div class="vocab-empty">学習記録がありません</div>'; return; }
  
  const sortedLogs = [...studyLogs].sort((a, b) => b.ts - a.ts);
  
  c.innerHTML = sortedLogs.map(l => `
    <div class="card flex-between align-center p-14 mb-0">
      <div>
        <div class="text-xs text-muted mb-1">${l.date}</div>
        <div class="text-sm font-bold"><span class="sli-subj mr-2">${esc(SCORE_SUBJECTS[l.subj]?.label || l.subj)}</span> ${Math.floor(l.seconds / 60)}分</div>
      </div>
      <div class="flex-gap-8">
        <button onclick="openLogEditModal(${l.ts})" class="btn-clear text-accent">編集</button>
        <button onclick="deleteStudyLogFromList(${l.ts})" class="btn-clear text-danger">削除</button>
      </div>
    </div>
  `).join('');
};
const deleteStudyLogFromList = ts => {
  const l = studyLogs.find(x => x.ts === ts);
  if (!l) return;
  studyLogs = studyLogs.filter(x => x.ts !== ts);
  save.logs(); renderLogListModal();
  if ($('Dashboard').classList.contains('active')) renderDashboard();
  showUndoSnackbar('記録を削除しました', () => {
    studyLogs.push(l);
    save.logs(); renderLogListModal();
    if ($('Dashboard').classList.contains('active')) renderDashboard();
  }, () => {});
};

window.openLogEditModal = (ts) => {
  const log = studyLogs.find(l => l.ts === ts);
  if (!log) return;
  $('edit-log-ts').value = log.ts;
  $('edit-log-date').value = log.date;
  $('edit-log-subj').value = log.subj;
  $('edit-log-min').value = Math.floor(log.seconds / 60);
  openModal('log-edit-modal');
};

window.saveEditedLog = () => {
  const ts = parseInt($('edit-log-ts').value);
  const date = $('edit-log-date').value;
  const subj = $('edit-log-subj').value;
  
  const st = $('edit-log-start-time')?.value;
  const et = $('edit-log-end-time')?.value;
  let min = parseInt($('edit-log-min').value) || 0;
  
  if (st && et) {
    const [sh, sm] = st.split(':').map(Number);
    const [eh, em] = et.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    min = diff;
  }
  
  if (!date || min <= 0) return showToast('正しく入力してください');
  const log = studyLogs.find(l => l.ts === ts);
  if (log) {
    log.date = date;
    log.subj = subj;
    log.seconds = min * 60;
    save.logs();
    renderLogListModal();
    if ($('Dashboard').classList.contains('active')) renderDashboard();
    closeModal('log-edit-modal');
    showToast('保存しました');
  }
};

const openStudyLogModal = ds => { currentLogDate = ds; const t = $('log-modal-title'); if (t) t.textContent = ds; renderDailyEventList(); renderDailyPlanList(); renderLogModalList(); openModal('log-modal'); };
const renderDailyEventList = () => { const c = $('log-modal-event-list'), ls = events[currentLogDate] || []; if (c) c.innerHTML = ls.length ? ls.map((e, i) => `<div class="plan-item-row" style="margin-bottom:6px;border-left:3px solid #3498db;"><div style="flex:1"><div class="pi-text" style="font-size:14px;">${esc(e.text)}</div></div><button class="plan-del" onclick="deleteDailyEventFromModal(${i})">✕</button></div>`).join('') : '<div class="text-xs text-muted text-center">イベントなし</div>'; };
const addDailyEventFromModal = () => { const i = $('log-modal-event-input'); if (!i || !i.value.trim()) return; if (!events[currentLogDate]) events[currentLogDate] = []; events[currentLogDate].push({ text: i.value.trim() }); save.events(); i.value = ''; renderDailyEventList(); if ($('Dashboard').classList.contains('active')) renderDashboard(); };
const deleteDailyEventFromModal = i => { if (events[currentLogDate]) { events[currentLogDate].splice(i, 1); if (events[currentLogDate].length === 0) delete events[currentLogDate]; save.events(); renderDailyEventList(); if ($('Dashboard').classList.contains('active')) renderDashboard(); } };
const renderDailyPlanList = () => { const c = $('log-modal-plan-list'), ls = plans[currentLogDate] || []; if (c) c.innerHTML = ls.length ? ls.map((p, i) => `<div class="plan-item-row" style="margin-bottom:6px;"><input type="checkbox" ${p.done ? 'checked' : ''} onchange="toggleDailyPlanFromModal(${i})"><div style="flex:1"><div class="pi-text ${p.done ? 'done' : ''}" style="font-size:14px;">${esc(p.text)}</div></div><button class="plan-del" onclick="deleteDailyPlanFromModal(${i})">✕</button></div>`).join('') : '<div class="text-xs text-muted text-center">予定なし</div>'; };
const addDailyPlanFromModal = () => { const i = $('log-modal-plan-input'); if (!i || !i.value.trim()) return; if (!plans[currentLogDate]) plans[currentLogDate] = []; plans[currentLogDate].push({ text: i.value.trim(), done: false }); save.plans(); i.value = ''; renderDailyPlanList(); if ($('Dashboard').classList.contains('active')) renderDashboard(); };
const toggleDailyPlanFromModal = i => { if (plans[currentLogDate] && plans[currentLogDate][i]) { plans[currentLogDate][i].done = !plans[currentLogDate][i].done; save.plans(); renderDailyPlanList(); if ($('Dashboard').classList.contains('active')) renderDashboard(); } };
const deleteDailyPlanFromModal = i => { if (plans[currentLogDate]) { plans[currentLogDate].splice(i, 1); if (plans[currentLogDate].length === 0) delete plans[currentLogDate]; save.plans(); renderDailyPlanList(); if ($('Dashboard').classList.contains('active')) renderDashboard(); } };
const renderLogModalList = () => { const c = $('log-modal-list'), ls = studyLogs.filter(l => l.date === currentLogDate); if (c) c.innerHTML = ls.length ? ls.map(l => `<div class="card flex-between mb-2 p-14"><div><span class="sli-subj">${esc(SCORE_SUBJECTS[l.subj]?.label || l.subj)}</span> <span class="font-bold ml-2">${Math.floor(l.seconds / 60)}分</span></div><button onclick="deleteStudyLog(${l.ts})" class="btn-clear text-danger">✕</button></div>`).join('') : '<div class="vocab-empty p-20">記録なし</div>'; };
const addStudyLogManual = () => { 
  const si = $('log-modal-subj'), mi = $('log-modal-min'); 
  const st = $('log-modal-start-time')?.value;
  const et = $('log-modal-end-time')?.value;
  
  if (!si) return; 
  let m = parseInt(mi?.value) || 0; 
  
  if (st && et) {
    const [sh, sm] = st.split(':').map(Number);
    const [eh, em] = et.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    m = diff;
  }
  
  if (m <= 0) return showToast('1分以上を入力してください'); 
  studyLogs.push({ date: currentLogDate, subj: si.value, seconds: m * 60, ts: Date.now() }); 
  const cut = new Date(); cut.setDate(cut.getDate() - 365); 
  studyLogs = studyLogs.filter(l => new Date(l.date) >= cut); 
  save.logs(); 
  renderLogModalList(); 
  if ($('Dashboard').classList.contains('active')) renderDashboard(); 
  if(mi) mi.value = ''; 
  if($('log-modal-start-time')) $('log-modal-start-time').value = '';
  if($('log-modal-end-time')) $('log-modal-end-time').value = '';
};
const deleteStudyLog = ts => { studyLogs = studyLogs.filter(l => l.ts !== ts); save.logs(); renderLogModalList(); if ($('Dashboard').classList.contains('active')) renderDashboard(); };

// ============================================================
// [15] MISTAKES
// ============================================================
window.switchMistakeTab = t => {
  mistakeTab = t;
  ['saved', 'exam', 'calc', 'other'].forEach(x => {
    const tb = $('mistake-tab-' + x), pn = $('mistake-area-' + x);
    if (tb) { if (x === t) tb.classList.add('active'); else tb.classList.remove('active'); }
    if (pn) { if (x === t) pn.classList.remove('hidden'); else pn.classList.add('hidden'); }
  });
  if (t === 'saved') renderSubjectSaved(); // Reusing Subject Saved for Calculation/Saved
  if (t === 'exam') { renderExamMistakes(); renderMistakeRadarChart(); }
  if (t === 'calc') renderCalcMistakes();
  if (t === 'other') renderOtherMistakes();
};

window.addExamMistake = () => {
  const name = $('exam-mistake-name').value.trim();
  const qDesc = $('exam-mistake-q-desc').value.trim();
  const wrongAns = $('exam-mistake-wrong-ans').value.trim();
  const reason = $('exam-mistake-reason').value.trim();
  const action = $('exam-mistake-action').value.trim();
  
  const tags = Array.from(document.querySelectorAll('.mistake-cause-tag:checked')).map(cb => cb.value);
  
  if (!name || !qDesc) return showToast('模試名と問題概要は必須です');
  
  examMistakes.unshift({
    id: generateId(),
    date: todayDateStr(),
    name, qDesc, wrongAns, reason, action, tags
  });
  
  save.examMistakes();
  renderExamMistakes();
  renderMistakeRadarChart();
  
  $('exam-mistake-name').value = '';
  $('exam-mistake-q-desc').value = '';
  $('exam-mistake-wrong-ans').value = '';
  $('exam-mistake-reason').value = '';
  $('exam-mistake-action').value = '';
  document.querySelectorAll('.mistake-cause-tag').forEach(cb => cb.checked = false);
  showToast('追加しました');
};

window.renderExamMistakes = () => {
  const c = $('mistake-exam-list');
  if (!c) return;
  if (!examMistakes.length) {
    c.innerHTML = '<div class="vocab-empty">ミス履歴がありません</div>';
    return;
  }
  
  const tagLabels = { careless: 'ケアレスミス', knowledge: '知識不足', time: '時間不足', reading: '読解ミス', calculation: '計算ミス' };
  
  c.innerHTML = examMistakes.map(m => `
    <div class="card mb-2">
      <div class="flex-between mb-2">
        <span class="text-sm font-bold">${esc(m.name)}</span>
        <span class="text-xs text-muted">${m.date}</span>
      </div>
      <div class="flex gap-1 mb-2 flex-wrap">
        ${m.tags.map(t => `<span class="filter-chip" style="font-size:10px;padding:2px 6px;">${tagLabels[t] || t}</span>`).join('')}
      </div>
      <div class="text-sm mb-2 pb-2 border-bottom border-dashed"><b>問題:</b><br>${esc(m.qDesc)}</div>
      <div class="text-sm mb-2 pb-2 border-bottom border-dashed"><b>誤答:</b><br>${esc(m.wrongAns)}</div>
      <div class="text-sm mb-2 pb-2 border-bottom border-dashed"><b>原因:</b><br>${esc(m.reason)}</div>
      <div class="text-sm mb-2"><b>対策:</b><br>${esc(m.action)}</div>
      <div class="flex-gap-8 mt-3">
        <button class="action-btn mb-0 flex-1 btn-sm bg-accent2" onclick="addMistakeToPlan('${m.id}')">復習を予定に追加</button>
        <button class="action-btn mb-0 flex-1 btn-sm btn-danger" onclick="deleteExamMistake('${m.id}')">削除</button>
      </div>
    </div>
  `).join('');
};

window.deleteExamMistake = id => {
  if (!confirm('削除しますか？')) return;
  examMistakes = examMistakes.filter(m => m.id !== id);
  save.examMistakes();
  renderExamMistakes();
  renderMistakeRadarChart();
};

window.addMistakeToPlan = id => {
  const m = examMistakes.find(x => x.id === id);
  if (!m) return;
  const d = new Date();
  d.setDate(d.getDate() + 3); // 3日後に復習
  const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  if (!plans[ds]) plans[ds] = [];
  plans[ds].push({ text: `[復習] ${m.name}: ${m.qDesc.substring(0, 15)}...`, done: false, time: '' });
  save.plans();
  showToast(`${ds} の予定に追加しました`);
};

window.renderMistakeRadarChart = () => {
  renderChartSafe('mistake-radar-chart', () => {
    const cv = $('mistake-radar-chart');
    if (!cv) return;
    
    const counts = { careless: 0, knowledge: 0, time: 0, reading: 0, calculation: 0 };
    examMistakes.forEach(m => {
      m.tags.forEach(t => { if (counts[t] !== undefined) counts[t]++; });
    });
    
    const labels = ['ケアレスミス', '知識不足', '時間不足', '読解ミス', '計算ミス'];
    const data = [counts.careless, counts.knowledge, counts.time, counts.reading, counts.calculation];
    
    if (mistakeRadarChart) mistakeRadarChart.destroy();
    mistakeRadarChart = new Chart(cv, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: 'ミスの回数',
          data,
          backgroundColor: 'rgba(192, 57, 43, 0.2)',
          borderColor: '#C0392B',
          pointBackgroundColor: '#C0392B'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { r: { angleLines: { display: true }, suggestedMin: 0, ticks: { stepSize: 1 } } }
      }
    });
  });
};

window.generateMistakeRootCauseReport = async () => {
  const r = $('mistake-root-cause-report');
  if (!r) return;
  if (examMistakes.length === 0) return showToast('データがありません');
  
  r.innerHTML = '<div class="text-center"><span class="loading-dots">AIが分析中</span></div>';
  const dataStr = examMistakes.map(m => `[${m.tags.join(',')}] 原因:${m.reason} 対策:${m.action}`).join('\n');
  
  try {
    const rep = await callGemini([{ role: 'user', content: `以下の生徒のミス履歴から、根本的な原因と具体的な改善アクションをHTMLでレポートしてください。客観的な参考書スタイルで出力。挨拶不要。\n${dataStr}` }], 8192);
    r.innerHTML = `<div class="card">${clean(rep.replace(/```html?/g, '').replace(/```/g, ''))}</div>`;
  } catch (e) {
    r.innerHTML = '<p class="text-danger">分析に失敗しました</p>';
  }
};

window.addCalcMistake = () => {
  const name = $('calc-mistake-name').value.trim();
  const qDesc = $('calc-mistake-q-desc').value.trim();
  const wrongAns = $('calc-mistake-wrong-ans').value.trim();
  const reason = $('calc-mistake-reason').value.trim();
  const action = $('calc-mistake-action').value.trim();
  
  if (!name || !qDesc) return showToast('問題名と概要は必須です');
  
  calcMistakes.unshift({
    id: generateId(),
    date: todayDateStr(),
    name, qDesc, wrongAns, reason, action
  });
  
  save.calcMistakes();
  renderCalcMistakes();
  
  $('calc-mistake-name').value = '';
  $('calc-mistake-q-desc').value = '';
  $('calc-mistake-wrong-ans').value = '';
  $('calc-mistake-reason').value = '';
  $('calc-mistake-action').value = '';
  showToast('追加しました');
};

window.renderCalcMistakes = () => {
  const c = $('mistake-calc-list');
  if (!c) return;
  if (!calcMistakes.length) {
    c.innerHTML = '<div class="vocab-empty">計算ミス履歴がありません</div>';
    return;
  }
  
  c.innerHTML = calcMistakes.map(m => `
    <div class="card mb-2">
      <div class="flex-between mb-2">
        <span class="text-sm font-bold">${esc(m.name)}</span>
        <span class="text-xs text-muted">${m.date}</span>
      </div>
      <div class="text-sm mb-2 pb-2 border-bottom border-dashed"><b>問題:</b><br>${esc(m.qDesc)}</div>
      <div class="text-sm mb-2 pb-2 border-bottom border-dashed"><b>誤答:</b><br>${esc(m.wrongAns)}</div>
      <div class="text-sm mb-2 pb-2 border-bottom border-dashed"><b>原因:</b><br>${esc(m.reason)}</div>
      <div class="text-sm mb-2"><b>対策:</b><br>${esc(m.action)}</div>
      <div class="flex-gap-8 mt-3">
        <button class="action-btn mb-0 flex-1 btn-sm btn-danger" onclick="deleteCalcMistake('${m.id}')">削除</button>
      </div>
    </div>
  `).join('');
};

window.deleteCalcMistake = id => {
  if (!confirm('削除しますか？')) return;
  calcMistakes = calcMistakes.filter(m => m.id !== id);
  save.calcMistakes();
  renderCalcMistakes();
};

window.addOtherMistake = () => {
  const name = $('other-mistake-name').value.trim();
  const qDesc = $('other-mistake-q-desc').value.trim();
  const wrongAns = $('other-mistake-wrong-ans').value.trim();
  const reason = $('other-mistake-reason').value.trim();
  const action = $('other-mistake-action').value.trim();
  
  if (!name || !qDesc) return showToast('問題名と概要は必須です');
  
  otherMistakes.unshift({
    id: generateId(),
    date: todayDateStr(),
    name, qDesc, wrongAns, reason, action
  });
  
  save.otherMistakes();
  renderOtherMistakes();
  
  $('other-mistake-name').value = '';
  $('other-mistake-q-desc').value = '';
  $('other-mistake-wrong-ans').value = '';
  $('other-mistake-reason').value = '';
  $('other-mistake-action').value = '';
  showToast('追加しました');
};

window.renderOtherMistakes = () => {
  const c = $('mistake-other-list');
  if (!c) return;
  if (!otherMistakes.length) {
    c.innerHTML = '<div class="vocab-empty">その他のミス履歴がありません</div>';
    return;
  }
  
  c.innerHTML = otherMistakes.map(m => `
    <div class="card mb-2">
      <div class="flex-between mb-2">
        <span class="text-sm font-bold">${esc(m.name)}</span>
        <span class="text-xs text-muted">${m.date}</span>
      </div>
      <div class="text-sm mb-2 pb-2 border-bottom border-dashed"><b>問題:</b><br>${esc(m.qDesc)}</div>
      <div class="text-sm mb-2 pb-2 border-bottom border-dashed"><b>誤答:</b><br>${esc(m.wrongAns)}</div>
      <div class="text-sm mb-2 pb-2 border-bottom border-dashed"><b>原因:</b><br>${esc(m.reason)}</div>
      <div class="text-sm mb-2"><b>対策:</b><br>${esc(m.action)}</div>
      <div class="flex-gap-8 mt-3">
        <button class="action-btn mb-0 flex-1 btn-sm btn-danger" onclick="deleteOtherMistake('${m.id}')">削除</button>
      </div>
    </div>
  `).join('');
};

window.deleteOtherMistake = id => {
  if (!confirm('削除しますか？')) return;
  otherMistakes = otherMistakes.filter(m => m.id !== id);
  save.otherMistakes();
  renderOtherMistakes();
};

// ============================================================
// [16] IMPORT
// ============================================================
const openImportModal = () => { openModal('import-modal'); };
const switchImportTab = t => { curImpTab = t; ['file', 'text', 'url', 'photo'].forEach(x => { const tb = $('itab-' + x), c = $('itab-content-' + x); if (tb) { if (x === t) tb.classList.add('active'); else tb.classList.remove('active'); } if (c) { if (x === t) c.classList.remove('hidden'); else c.classList.add('hidden'); } }); };
const renderPreview = (w, id) => { 
  impWords = w.filter(x => x.word); 
  const c = $(id); 
  if (c) { 
    c.classList.remove('hidden'); 
    c.innerHTML = `<div class="import-preview-box">${impWords.slice(0, 20).map(x => `<div class="import-preview-row"><b>${esc(x.word)}</b><div><span>${esc(x.meaning || '')}</span><br><span class="text-xs text-muted">${esc(x.example || '')}</span></div></div>`).join('')}</div>`; 
  } 
  const ab = $('import-action-bar'), sm = $('import-summary'); 
  if (ab) ab.classList.remove('hidden'); 
  if (sm) sm.textContent = `${impWords.length}語`; 
};

const parseCSV = (text) => {
  const result = [];
  let row = [], inQuotes = false, currentVal = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') { currentVal += '"'; i++; }
        else { inQuotes = false; }
      } else { currentVal += char; }
    } else {
      if (char === '"') { inQuotes = true; }
      else if (char === ',') { row.push(currentVal); currentVal = ''; }
      else if (char === '\n' || char === '\r') {
        row.push(currentVal); currentVal = '';
        if (row.some(v => v.trim() !== '')) result.push(row);
        row = [];
        if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') i++;
      } else { currentVal += char; }
    }
  }
  if (currentVal || row.length > 0) { 
    row.push(currentVal); 
    if (row.some(v => v.trim() !== '')) result.push(row); 
  }
  return result;
};

const ifi = $('import-file-input'); if (ifi) ifi.addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return; const ld = $('import-loading');
  if (ld) ld.classList.remove('hidden');

  const isText = f.name.match(/\.(txt|csv|tsv|json)$/i) || f.type.startsWith('text/');
  const isPdf = f.name.match(/\.pdf$/i) || f.type === 'application/pdf';

  if (isText) {
    const r = new FileReader(); r.onload = ev => { 
      let w = []; 
      const txt = ev.target.result;
      if (f.name.endsWith('.json')) { 
        try { const d = JSON.parse(txt); w = d.map(x => ({ word: (x.word || x.term || '').trim(), meaning: (x.meaning || x.translation || '').trim(), example: (x.example || '').trim() })); } catch (err) {} 
      } else if (f.name.endsWith('.csv')) {
        const rows = parseCSV(txt);
        w = rows.map(parts => {
          if (parts.length < 2) return { word: parts[0].trim(), meaning: '', example: '' };
          return { word: parts[0].trim(), meaning: parts[1].trim(), example: parts[2] ? parts[2].trim() : '' };
        }).filter(p => p.word);
      } else {
        w = txt.split('\n').map(l => {
          let sep = '\t';
          const parts = l.split(sep);
          if (parts.length < 2) return { word: l.trim(), meaning: '', example: '' };
          return { word: parts[0].trim(), meaning: parts.slice(1).join(sep).trim(), example: '' };
        }).filter(p => p.word);
      }
      renderPreview(w, 'file-preview'); 
      if (ld) ld.classList.add('hidden');
    }; 
    r.readAsText(f);
  } else if (isPdf) {
    const r = new FileReader();
    r.onload = async ev => {
      const b64 = ev.target.result.split(',')[1];
      try {
        const rep = await callGemini([{ role: 'user', content: [{ inlineData: { mimeType: 'application/pdf', data: b64 } }, { type: 'text', text: 'このPDFの内容を解析し、含まれている重要な英単語を抽出し、JSON配列で出力してください。形式: [{"word":"...","meaning":"...","example":"元の文章での使用例(文脈)"}]。挨拶不要。' }] }], 8192, '', true);
        const w = extractJSON(rep);
        if (w && Array.isArray(w)) {
          renderPreview(w, 'file-preview');
        } else {
          showToast('単語を抽出できませんでした');
        }
      } catch (err) { 
        showToast('PDF解析エラー'); 
      } finally { 
        if (ld) ld.classList.add('hidden'); 
      }
    };
    r.readAsDataURL(f);
  } else {
    const r = new FileReader();
    r.onload = async ev => {
      const b64 = ev.target.result.split(',')[1];
      const mimeType = f.type || 'application/octet-stream';
      try {
        const rep = await callGemini([{ role: 'user', content: [{ inlineData: { mimeType: mimeType, data: b64 } }, { type: 'text', text: 'このファイルの内容を解析し、含まれている重要な英単語を抽出し、JSON配列で出力してください。形式: [{"word":"...","meaning":"...","example":"元の文章での使用例(文脈)"}]。挨拶不要。' }] }], 8192, '', true);
        const w = extractJSON(rep);
        if (w && Array.isArray(w)) {
          renderPreview(w, 'file-preview');
        } else {
          showToast('単語を抽出できませんでした');
        }
      } catch (err) { 
        showToast('ファイル解析エラー'); 
      } finally { 
        if (ld) ld.classList.add('hidden'); 
      }
    };
    r.readAsDataURL(f);
  }
});

const ita = $('import-textarea'); 
if (ita) {
  ita.addEventListener('input', debounce(function () { 
    const w = this.value.split('\n').map(l => {
      const sep = l.includes('\t') ? '\t' : ',';
      const idx = l.indexOf(sep);
      if (idx === -1) return { word: l.trim(), meaning: '', example: '' };
      return { word: l.substring(0, idx).trim(), meaning: l.substring(idx + 1).trim(), example: '' };
    }).filter(p => p.word);
    if (w.length) renderPreview(w, 'text-preview'); 
  }, 500));
}

const fetchAndParseUrl = async () => {
  const i = $('import-url-input'); if (!i || !i.value.trim()) return;
  const ld = $('import-loading'); if (ld) ld.classList.remove('hidden');
  const extractContext = $('import-extract-context-url') && $('import-extract-context-url').checked;
  try {
    const url = i.value.trim(); let textContent = '';
    try {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await res.json(); const parser = new DOMParser(); const doc = parser.parseFromString(data.contents, 'text/html');
      textContent = doc.body.textContent.replace(/\s+/g, ' ').substring(0, 5000);
    } catch (e) { textContent = "URLの内容を取得できませんでした。URLの文字列から推測してください。"; }
    
    let prompt = `以下のテキスト内容から、関連する重要な英単語を抽出してJSON配列で出力してください。形式: [{"word":"...","meaning":"..."${extractContext ? ',"example":"元の文章での使用例(文脈)"' : ''}}]\n\nテキスト:\n${textContent}`;
    const raw = await callGemini([{ role: 'user', content: prompt }], 8192, '客観的な参考書スタイルで出力。挨拶不要。', true);
    const w = extractJSON(raw); renderPreview(w, 'url-preview');
  } catch (e) { showToast('通信エラー'); } finally { if (ld) ld.classList.add('hidden'); }
};

window.parseManualTranscript = async () => {
  const i = $('import-youtube-transcript'); if (!i || !i.value.trim()) return;
  const ld = $('import-loading'); if (ld) ld.classList.remove('hidden');
  const extractContext = $('import-extract-context-url') && $('import-extract-context-url').checked;
  try {
    let prompt = `以下のYouTube字幕テキストから、関連する重要な英単語を抽出してJSON配列で出力してください。形式: [{"word":"...","meaning":"..."${extractContext ? ',"example":"元の文章での使用例(文脈)"' : ''}}]\n\nテキスト:\n${i.value.substring(0, 5000)}`;
    const raw = await callGemini([{ role: 'user', content: prompt }], 8192, '客観的な参考書スタイルで出力。挨拶不要。', true);
    const w = extractJSON(raw); renderPreview(w, 'url-preview');
  } catch (e) { showToast('通信エラー'); } finally { if (ld) ld.classList.add('hidden'); }
};

const handleImportPhoto = async e => { 
  const f = e.target.files[0], pp = $('import-photo-preview'), ld = $('import-loading'); if (!f) return; 
  const resized = await resizeImage(f);
  if (pp) pp.innerHTML = `<img src="${resized}" style="max-width:100%;border-radius:10px">`; 
  if (ld) ld.classList.remove('hidden'); 
  try { 
    const b = resized.split(',')[1], m = resized.match(/data:([^;]+)/)[1]; 
    const unknownOnly = $('import-unknown-only') && $('import-unknown-only').checked;
    const extractContext = $('import-extract-context-photo') && $('import-extract-context-photo').checked;
    let prompt = `画像内のテキストを読み取り、重要な英単語を抽出してJSON配列で出力してください。形式: [{"word":"...","meaning":"..."${extractContext ? ',"example":"元の文章での使用例(文脈)"' : ''}}]`;
    
    const raw = await callGemini([{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: m, data: b } }, { type: 'text', text: prompt }] }], 8192, '客観的な参考書スタイルで出力。挨拶不要。', true); 
    let wd = extractJSON(raw); 
    
    if (unknownOnly && wd && Array.isArray(wd)) {
      const knownWords = new Set(ALL_WORDS.map(x => x.word.toLowerCase()));
      wd = wd.filter(x => !knownWords.has(x.word.toLowerCase()));
      if (wd.length === 0) showToast('未知語は見つかりませんでした');
    }
    
    renderPreview(wd, 'photo-preview'); 
  } catch (err) { showToast('通信エラー'); } finally { if (ld) ld.classList.add('hidden'); } 
};

const applyImport = async m => { 
  if (!impWords.length) return; 
  
  const bulkTagsInput = $('import-bulk-tags');
  const bulkTags = bulkTagsInput && bulkTagsInput.value.trim() ? bulkTagsInput.value.split(',').map(t => t.trim()).filter(Boolean) : [];
  
  const formattedWords = impWords.map(w => ({ word: w.word, meaning: w.meaning || '', example: w.example || '', tags: [...bulkTags] }));
  
  const aiFill = $('import-ai-fill') && $('import-ai-fill').checked;
  if (aiFill) {
    showToast('AI補完中...');
    const toFill = formattedWords.filter(w => !w.meaning || !w.example);
    if (toFill.length > 0) {
      const chunkSize = 15;
      for (let i = 0; i < toFill.length; i += chunkSize) {
        const chunk = toFill.slice(i, i + chunkSize);
        try {
          const rep = await callGemini([{role:'user', content:`以下の英単語の意味と例文を補完しJSON配列で出力。形式:[{"word":"...","meaning":"...","example":"..."}]\n単語: ${chunk.map(w=>w.word).join(', ')}`}], 8192, '客観的な参考書スタイルで出力。挨拶不要。', true);
          const filled = extractJSON(rep);
          if (filled && Array.isArray(filled)) {
            filled.forEach(fw => {
              const target = formattedWords.find(w => w.word === fw.word);
              if (target) {
                target.meaning = target.meaning || fw.meaning;
                target.example = target.example || fw.example;
              }
            });
          }
        } catch(e) { console.warn('AI補完チャンク失敗', e); }
        if (i + chunkSize < toFill.length) await sleep(4000);
      }
    }
  }

  if (m === 'replace') {
    ALL_WORDS = formattedWords; 
  } else {
    const strategy = $('import-merge-strategy') ? $('import-merge-strategy').value : 'skip';
    
    if (strategy === 'skip') {
      formattedWords.forEach(w => { if (!ALL_WORDS.find(x => x.word.toLowerCase() === w.word.toLowerCase())) ALL_WORDS.push(w); }); 
    } else if (strategy === 'overwrite') {
      formattedWords.forEach(w => {
        const idx = ALL_WORDS.findIndex(x => x.word.toLowerCase() === w.word.toLowerCase());
        if (idx >= 0) ALL_WORDS[idx] = w;
        else ALL_WORDS.push(w);
      });
    } else if (strategy === 'merge') {
      formattedWords.forEach(w => {
        const existing = ALL_WORDS.find(x => x.word.toLowerCase() === w.word.toLowerCase());
        if (existing) {
          if (w.meaning && !existing.meaning.includes(w.meaning)) existing.meaning += (existing.meaning ? ' / ' : '') + w.meaning;
          if (w.example && !existing.example) existing.example = w.example;
          if (w.tags) {
            w.tags.forEach(t => { if (!existing.tags.includes(t)) existing.tags.push(t); });
          }
        } else {
          ALL_WORDS.push(w);
        }
      });
    }
  }
  
  save.words(); initCards(); updateTagFilters(); closeModal('import-modal'); showToast(`完了`); 
  const ab = $('import-action-bar'); if (ab) ab.classList.add('hidden'); 
};

// ============================================================
// [17] SETTINGS & EXPORT
// ============================================================
const loadProfileFields = () => { const map = { targetUniv: 'target-univ', grade: 'grade', courses: 'courses' }; Object.entries(map).forEach(([k, id]) => { const e = $('profile-' + id); if (e) e.value = userProfile[k] || ''; }); };
const saveProfile = () => { const u = $('profile-target-univ'), g = $('profile-grade'), c = $('profile-courses'); if (u) userProfile.targetUniv = u.value.trim(); if (g) userProfile.grade = g.value.trim(); if (c) userProfile.courses = c.value.trim(); save.profile(); };
const saveProfileDebounced = debounce(saveProfile, 500);
const toggleProfileCard = () => { const f = $('profile-fields'), b = $('profile-toggle-btn'); if (!f || !b) return; const hid = f.classList.contains('hidden'); if (hid) f.classList.remove('hidden'); else f.classList.add('hidden'); b.textContent = hid ? (customTexts['plan_ai_prof_toggle'] || '折りたたむ') : '展開'; };

window.saveGoalTimes = () => {
  ['english', 'math', 'japanese', 'science', 'social', 'other'].forEach(k => {
    const el = $(`goal-time-${k}`);
    if (el) goalTimes[k] = parseInt(el.value) || 0;
  });
  safeSet('study_goal_times', goalTimes);
  showToast('目標時間を保存しました');
  if ($('Dashboard').classList.contains('active')) renderDashboard();
};

const saveReminderSettings = async () => {
  const t = $('reminder-time'); if (!t || !t.value) return;
  userProfile.reminderTime = t.value; 
  userProfile.aiNotificationTiming = $('ai-notification-timing') && $('ai-notification-timing').checked;
  save.profile();
  try {
    if (Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { $('reminder-status-text').textContent = '通知がブロックされています。ブラウザの設定を変更してください。'; return; }
    }
    $('reminder-status-text').textContent = userProfile.aiNotificationTiming ? 'AIが最適なタイミングで通知します' : `毎日 ${t.value} に通知します`; 
    showToast('リマインダー設定保存'); startReminderCheck();
  } catch (e) { 
    $('reminder-status-text').textContent = '通知の設定に失敗しました。ブラウザが対応していない可能性があります。';
    showToast('通知の設定に失敗しました'); 
  }
};

const startReminderCheck = () => {
  if (reminderCheckInt) clearInterval(reminderCheckInt);
  reminderCheckInt = setInterval(() => {
    if (!userProfile.reminderTime || Notification.permission !== "granted") return;
    const now = new Date(), currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, todayStr = todayDateStr();
    
    let targetTime = userProfile.reminderTime;
    if (userProfile.aiNotificationTiming) {
      targetTime = '21:00'; 
    }

    if (currentHM >= targetTime && localStorage.getItem('study_last_notified') !== todayStr) {
      new Notification('Study App', { body: '今日の単語・復習タスクを終わらせましょう！' });
      localStorage.setItem('study_last_notified', todayStr);
    }
  }, 60000);
};

const updateFooter = () => { const f = $('manage-footer'); if (f) f.textContent = `Study — 単語: ${ALL_WORDS.length}` }
const showDangerBox = id => { const b = $(id); if (b) b.classList.remove('hidden'); }; const hideDangerBox = id => { const b = $(id); if (b) b.classList.add('hidden'); };
const checkConfirm = (iid, bid, ex) => { const i = $(iid), b = $(bid); if (i && b) b.disabled = i.value !== ex; };

const exportData = async () => { 
  showToast('エクスポート準備中...');
  const data = { ALL_WORDS, savedWords, plans, events, writingHistory, subjectSaved, subjectQuizzes, examScores, textbooks, srsData, userProfile, customDecks, wordProgress, vocabMeta, dailyChallenges, syntaxList, listenHistory, studyLogs, yearlyPlan, examMistakes, calcMistakes, otherMistakes, subjectFolders };
  
  const b = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'study_data.json'; a.click(); 
  showToast('エクスポート完了');
};

const exportCSV = () => {
  if (!ALL_WORDS.length) return showToast('単語がありません');
  const csvContent = "Word,Meaning,Example,Tags\n" + ALL_WORDS.map(w => `"${w.word.replace(/"/g, '""')}","${(w.meaning || '').replace(/"/g, '""')}","${(w.example || '').replace(/"/g, '""')}","${(w.tags || []).join(',').replace(/"/g, '""')}"`).join("\n");
  const b = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'study_vocab.csv'; a.click();
};

window.clearData = async () => { 
  Object.keys(localStorage).forEach(k => { if(k.startsWith('study_')) localStorage.removeItem(k); });
  const keys = await localforage.keys();
  for(const k of keys) { if(k.startsWith('study_') || k.startsWith('backup_')) await localforage.removeItem(k); }
  await imageStore.clear();
  location.reload(); 
};

const openWeeklyReport = async () => {
  openModal('weekly-report-modal'); $('weekly-report-content').innerHTML = '<div class="text-center p-40"><span class="loading-dots">AIが分析中</span></div>';
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7); const cutoffStr = cutoff.toISOString().slice(0, 10);
  const recentLogs = studyLogs.filter(l => l.date >= cutoffStr);
  if (recentLogs.length === 0) { $('weekly-report-content').innerHTML = '<p>過去7日間の学習データがありません。</p>'; return; }
  const subjMap = {}; recentLogs.forEach(l => { subjMap[l.subj] = (subjMap[l.subj] || 0) + Math.floor(l.seconds / 60); });
  const logStr = Object.entries(subjMap).map(([k, v]) => `${SCORE_SUBJECTS[k]?.label || k}:${v}分`).join(', ');
  const prompt = `以下の生徒の過去7日間の学習データに基づき、HTMLで週次レポートを作成してください。見出し（h4タグ）として「総学習時間とバランス」「ストロングポイント」「改善点」「来週のおすすめ学習プラン」を含め、pタグやul/liタグでわかりやすく記述してください。挨拶や語りかけは一切不要です。客観的な参考書スタイルで出力してください。データ: ${logStr}`;
  try { let rep = await callGemini([{ role: 'user', content: prompt }], 8192); $('weekly-report-content').innerHTML = clean(rep.replace(/```html?/g, '').replace(/```/g, '').trim()); } catch (e) { $('weekly-report-content').innerHTML = '<p class="text-danger">分析に失敗しました。通信環境を確認してください。</p><button class="action-btn mt-3" onclick="openWeeklyReport()">リトライ</button>'; }
};

window.exportWeeklyReportPDF = () => {
  const content = $('weekly-report-content').innerHTML;
  const html = `<!DOCTYPE html><html lang="ja"><head><title>Weekly Report</title><style>body{font-family:sans-serif;padding:20px;line-height:1.6;} h4{border-bottom:1px solid #ccc;padding-bottom:5px;}</style></head><body><h1>Weekly Study Report</h1>${content}</body></html>`;
  printHtml(html);
};

const openWeaknessAnalysis = async () => {
  openModal('weakness-modal'); $('weakness-content').innerHTML = '<div class="text-center p-40"><span class="loading-dots">AIが弱点を抽出中</span></div>'; $('weakness-focus-btn').classList.add('hidden');
  const overdue = Object.entries(srsData).map(([w, r]) => ({ word: w, ef: r.stability, overdueDays: srsDaysDiff(srsNextDate(r)) * -1 })).filter(x => x.overdueDays >= 0 || x.ef < 2.0).sort((a, b) => (b.overdueDays - a.overdueDays) || (a.ef - b.ef)).slice(0, 10);
  if (!overdue.length) { $('weakness-content').innerHTML = '<p>現在、深刻な弱点データはありません。素晴らしいペースです！</p>'; return; }
  weaknessWords = overdue.map(x => x.word);
  const prompt = `以下の生徒が特に苦手としている英単語TOP10のリストに基づき、HTMLでレポートを作成してください。見出し（h4タグ）として「最も復習が必要な単語TOP10」をリスト表示し、それぞれの単語の覚え方のコツや語源的アプローチを簡潔に添えてください。また「おすすめ学習法」として具体的なアドバイスを記載してください。挨拶や語りかけは一切不要です。客観的な参考書スタイルで出力してください。苦手単語: ${weaknessWords.join(', ')}`;
  try { let rep = await callGemini([{ role: 'user', content: prompt }], 8192); $('weakness-content').innerHTML = clean(rep.replace(/```html?/g, '').replace(/```/g, '').trim()); $('weakness-focus-btn').classList.remove('hidden'); } catch (e) { $('weakness-content').innerHTML = '<p class="text-danger">分析に失敗しました。通信環境を確認してください。</p><button class="action-btn mt-3" onclick="openWeaknessAnalysis()">リトライ</button>'; }
};
const startWeaknessFocusMode = () => { closeModal('weakness-modal'); setTabByIndex(4); setCardsMode('weak'); };

window.openAutoListenModal = () => { openModal('auto-listen-modal'); };
window.toggleAutoListen = () => {
  const btn = $('auto-listen-start-btn');
  if (autoListenInt) {
    clearTimeout(autoListenInt); autoListenInt = null;
    btn.textContent = '再生開始'; btn.classList.remove('bg-danger'); btn.classList.add('bg-purple');
    speechSynthesis.cancel();
  } else {
    btn.textContent = '停止'; btn.classList.remove('bg-purple'); btn.classList.add('bg-danger');
    const onlyReview = $('auto-listen-only-review').checked;
    autoListenWords = onlyReview ? srsGetDueWords() : ALL_WORDS.slice();
    if(!autoListenWords.length) { showToast('対象の単語がありません'); toggleAutoListen(); return; }
    autoListenIdx = 0; autoListenState = 0;
    playNextAutoListen();
  }
};
const playNextAutoListen = () => {
  if(!autoListenInt && $('auto-listen-start-btn').textContent === '再生開始') return;
  if(autoListenIdx >= autoListenWords.length) autoListenIdx = 0;
  const w = autoListenWords[autoListenIdx];
  $('auto-listen-word').textContent = w.word;
  $('auto-listen-meaning').textContent = w.meaning || '---';
  $('auto-listen-example').textContent = w.example || '---';
  
  let textToSpeak = '';
  let lang = 'en-US';
  if(autoListenState === 0) { textToSpeak = w.word; }
  else if(autoListenState === 1) { textToSpeak = w.meaning; lang = 'ja-JP'; }
  else if(autoListenState === 2) { textToSpeak = w.example || w.word; }
  
  const u = new SpeechSynthesisUtterance(textToSpeak);
  u.lang = lang;
  u.onend = () => {
    autoListenState++;
    if(autoListenState > 2) { autoListenState = 0; autoListenIdx++; }
    autoListenInt = setTimeout(playNextAutoListen, 800);
  };
  speechSynthesis.speak(u);
};

window.openStoryGenModal = () => { openModal('story-gen-modal'); };
window.generateStory = async () => {
  const area = $('story-result-area');
  const ld = $('story-loading');
  ld.classList.remove('hidden'); area.innerHTML = '';
  const words = srsGetDueWords().slice(0, 10).map(w => w.word);
  if(!words.length) words.push(...ALL_WORDS.slice(0,10).map(w=>w.word));
  try {
    const rep = await callGemini([{role:'user', content:`以下の単語を全て使って、面白い英語のショートストーリーを作成し、和訳と解説をHTMLで出力してください。挨拶や語りかけは一切不要です。客観的な参考書スタイルで出力してください。単語: ${words.join(', ')}`}], 8192);
    area.innerHTML = clean(rep.replace(/```html?/g, '').replace(/```/g, ''));
  } catch(e) { area.innerHTML = '<p class="text-danger">生成失敗</p>'; }
  finally { ld.classList.add('hidden'); }
};

window.openTagManagerModal = () => {
  openModal('tag-manager-modal');
  const tags = new Set();
  ALL_WORDS.forEach(w => { if(w.tags) w.tags.forEach(t => tags.add(t)); });
  $('tag-manager-list').innerHTML = Array.from(tags).map(t => `
    <div class="flex-between card p-10 mb-2">
      <span class="font-bold">${esc(t)}</span>
      <button class="btn-clear text-danger" onclick="deleteTagGlobally('${escJS(t)}')">削除</button>
    </div>
  `).join('');
};
window.deleteTagGlobally = (tag) => {
  if(!confirm(`タグ「${tag}」を全ての単語から削除しますか？`)) return;
  ALL_WORDS.forEach(w => { if(w.tags) w.tags = w.tags.filter(t => t !== tag); });
  save.words(); updateTagFilters(); openTagManagerModal(); showToast('削除しました');
};

window.openShuffleSettingsModal = () => {
  document.querySelectorAll('input[name="shuffle-mode"]').forEach(r => {
    if(r.value === shuffleSettings.mode) r.checked = true;
  });
  openModal('shuffle-settings-modal');
};
window.saveShuffleSettings = () => {
  const mode = document.querySelector('input[name="shuffle-mode"]:checked').value;
  shuffleSettings.mode = mode;
  safeSet('study_shuffle_settings', shuffleSettings);
  closeModal('shuffle-settings-modal');
  showToast('設定を保存しました');
};

// ============================================================
// [18] ROUTER & INIT
// ============================================================
const setTabByIndex = (idx) => {
  if (idx < 0 || idx >= TABS.length) return;
  currentTabIndex = idx; const targetId = TABS[idx];
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const t = $(targetId); if (t) t.classList.add('active');
  const navItem = document.querySelector(`.nav-item[data-tab="${targetId}"]`); if (navItem) navItem.classList.add('active');
  closeModal('detail-modal'); window.scrollTo(0, 0); triggerTabEffects(targetId);
};

const triggerTabEffects = (id) => {
  if (id === 'Dashboard') renderDashboard();
  if (id === 'Timer') { updateTimerDisplay(); renderTimerPresets(); }
  if (id === 'Vocab') { renderVocab(true); renderVocabStats(); updateTagFilters(); }
  if (id === 'Plan') { setPlanMode('calendar'); renderTextbooks(); loadProfileFields(); renderYearlyPlan(); }
  if (id === 'Cards') { updateTagFilters(); initCards(); }
  if (id === 'CustomCards') ccInitDecks();
  if (id === 'Manage') {
    updateFooter(); updateAutoSyncBtn(); initModelSelect(); renderBackupList();
    
    // API Keyの読み込み
    const apiKeyInput = $('gemini-api-key-input');
    if (apiKeyInput) apiKeyInput.value = localStorage.getItem('study_gemini_api_key') || '';
    
    if (userProfile.reminderTime) $('reminder-time').value = userProfile.reminderTime;
    if ($('ai-notification-timing')) $('ai-notification-timing').checked = userProfile.aiNotificationTiming;
    if (fsrsRetention) { $('fsrs-retention-slider').value = fsrsRetention; $('fsrs-retention-label').textContent = fsrsRetention + '%'; }
    const uiFontSize = localStorage.getItem('study_ui_font_size') || 'medium';
    const uiFontSelect = $('ui-font-size-select');
    if (uiFontSelect) uiFontSelect.value = uiFontSize;
    const scheduleEnabled = safeGet('study_dark_schedule_enabled', false);
    const toggle = $('dark-mode-schedule-toggle');
    if (toggle) toggle.checked = scheduleEnabled;
    if (scheduleEnabled) $('dark-mode-schedule-times').classList.remove('hidden');
    $('dark-mode-start').value = safeGet('study_dark_schedule_start', '20:00');
    $('dark-mode-end').value = safeGet('study_dark_schedule_end', '06:00');
    if (userProfile.customThemeColor) $('custom-theme-bg').value = userProfile.customThemeColor;
    ['english', 'math', 'japanese', 'science', 'social', 'other'].forEach(k => {
      const el = $(`goal-time-${k}`);
      if (el) el.value = goalTimes[k] || '';
    });
  }
  if (id === 'SkillUp') switchWritingTab('input');
  if (id === 'Subject') { renderSubjectChat(); renderSubjectSaved(); renderSubjectQuiz(); }
  if (id === 'Plan' && planMode === 'score') { renderScoreList(); renderScoreChart(); }
  if (id === 'Mistakes') { switchMistakeTab(mistakeTab); }
};

document.querySelectorAll('.nav-item').forEach((item, idx) => {
  item.addEventListener('click', () => { setTabByIndex(idx); });
  item.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') setTabByIndex(idx); });
});

document.addEventListener('touchstart', e => { swipeStartX = e.touches[0].clientX; swipeStartY = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', e => {
  if (!e.changedTouches.length) return;
  const dx = e.changedTouches[0].clientX - swipeStartX, dy = e.changedTouches[0].clientY - swipeStartY;
  if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2 && !window.getSelection().toString()) {
    if (e.target.closest('.flip-inner, .nav-bar, .heatmap-grid, [style*="overflow-x"], textarea, .cal-wrap, .chat-container, .quiz-sortable, .writing-tabs, .chat-subject-tabs, .import-tab-bar, .month-tabs, .week-day-tabs')) return;
    if (dx < 0 && currentTabIndex < TABS.length - 1) setTabByIndex(currentTabIndex + 1);
    else if (dx > 0 && currentTabIndex > 0) setTabByIndex(currentTabIndex - 1);
  }
}, { passive: true });

async function initAppData() {
  localforage.config({ name: 'StudyApp' });
  
  const [
    words, saved, p, ev, writing, subSaved, subQuiz, exams, books, srs, prof, decks, prog, meta, daily, syntax, listen, logs, yearly, freeze, examMistakesData, calcMistakesData, otherMistakesData, subjectFoldersData
  ] = await Promise.all([
    localforage.getItem('study_words'),
    localforage.getItem('study_saved'),
    localforage.getItem('study_plans'),
    localforage.getItem('study_events'),
    localforage.getItem('study_writing'),
    localforage.getItem('study_subject_saved'),
    localforage.getItem('study_subject_quizzes'),
    localforage.getItem('study_exam_scores'),
    localforage.getItem('study_textbooks'),
    localforage.getItem('study_srs'),
    localforage.getItem('study_profile'),
    localforage.getItem('study_custom_decks'),
    localforage.getItem('study_word_progress'),
    localforage.getItem('study_vocab_meta'),
    localforage.getItem('study_daily'),
    localforage.getItem('study_syntax'),
    localforage.getItem('study_listen'),
    localforage.getItem('study_logs'),
    localforage.getItem('study_yearly_plan'),
    localforage.getItem('study_freeze_logs'),
    localforage.getItem('study_exam_mistakes'),
    localforage.getItem('study_calc_mistakes'),
    localforage.getItem('study_other_mistakes'),
    localforage.getItem('study_subject_folders')
  ]);

  ALL_WORDS = words || [];
  savedWords = saved || [];
  plans = p || {};
  events = ev || {};
  writingHistory = writing || [];
  subjectSaved = subSaved || [];
  subjectQuizzes = subQuiz || [];
  examScores = exams || [];
  textbooks = books || [];
  srsData = srs || {};
  userProfile = prof || { targetUniv: '', grade: '', courses: '', xp: 0, autoSync: false, reminderTime: '', aiNotificationTiming: false, freezeItems: 0, themeColor: 'default', customThemeColor: '' };
  customDecks = decks || [];
  wordProgress = prog || {};
  vocabMeta = meta || {};
  dailyChallenges = daily || [];
  syntaxList = syntax || [];
  listenHistory = listen || [];
  studyLogs = logs || [];
  yearlyPlan = yearly || { year: new Date().getFullYear(), goal: '', months: {} };
  freezeLogs = freeze || [];
  examMistakes = examMistakesData || [];
  calcMistakes = calcMistakesData || [];
  otherMistakes = otherMistakesData || [];
  subjectFolders = subjectFoldersData || [];
  
  ALL_WORDS = ALL_WORDS.map(w => {
    if (typeof w === 'string') return { word: w, meaning: '', example: '', tags: [] };
    if (!w.tags) w.tags = [];
    if (!w.example) w.example = '';
    return w;
  });
  
  const cur = getISOWeek(new Date()), last = parseInt(localStorage.getItem('study_last_week') || '-1');
  if (last !== -1 && cur !== last) { 
    const today = todayDateStr();
    let carriedOver = 0;
    Object.keys(plans).forEach(date => {
      if (date < today) {
        const incomplete = plans[date].filter(p => !p.done);
        if (incomplete.length > 0) {
          if (!plans[today]) plans[today] = [];
          incomplete.forEach(p => {
            plans[today].push({ text: p.text + ' (繰越)', done: false, time: p.time || '' });
            carriedOver++;
          });
          plans[date] = plans[date].filter(p => p.done);
        }
      }
    });
    if (carriedOver > 0) { save.plans(); showToast(`${carriedOver}件の未完了タスクを今週に繰り越しました`); }
  }
  localStorage.setItem('study_last_week', cur); currentWeekDay = getTodayWeekIdx();
  
  if (userProfile.reminderTime) { $('reminder-time').value = userProfile.reminderTime; startReminderCheck(); }
  
  const uiFontSize = localStorage.getItem('study_ui_font_size') || 'medium';
  document.documentElement.setAttribute('data-font-size', uiFontSize);
  
  applyThemeColor();
  loadWidgetOrder();
  loadCustomTexts(); 
  
  const wi = $('word-input'); if (wi) wi.addEventListener('input', debounce(() => searchWord(true), 200));
  const vs = $('vocab-search'); if (vs) vs.addEventListener('input', debounce(() => renderVocab(true), 200));
  
  const pm = $('timer-pomodoro-mode');
  if (pm) {
    pm.addEventListener('change', (e) => {
      isPomodoroMode = e.target.checked;
      if (isPomodoroMode && !timerRunning) { timerInitial = 25 * 60; timerTime = timerInitial; updateTimerDisplay(); }
    });
  }
  
  updateTagFilters(); initCards(); setPlanMode('calendar'); updateFooter(); renderVocabStats(); renderTextbooks(); loadProfileFields(); updateTimerDisplay(); renderTimerPresets(); addExamSubjectRow(); addExamJudgeRow(); updateAutoSyncBtn(); initModelSelect();
  
  renderCountdown();
  renderDashboard();
  
  createAutoBackup();
}

const getISOWeek = date => { const d = new Date(date.getTime()); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); const w1 = new Date(d.getFullYear(), 0, 4); return 1 + Math.round(((d.getTime() - w1.getTime()) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7); };

window.addEventListener('DOMContentLoaded', initAppData);
