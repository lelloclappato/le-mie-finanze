(function () {
  'use strict';

  var STORAGE_KEY = 'finanze-personali-data';
  var ACCENT = 'var(--accent)';
  var NEGATIVE = 'var(--negative)';
  var WARN = 'var(--warn)';
  // Sfondo dell'header: separato da ACCENT perché nel tema scuro il verde acceso usato per
  // bottoni/link non ha abbastanza contrasto con il testo chiaro se diventa uno sfondo pieno.
  var HEADER_BG = 'var(--header-bg)';

  // ---------- tema ----------
  // Chiave separata (non nel blob principale) così lo script anti-flash in index.html
  // può leggerla in modo sincrono, prima ancora che app.js venga caricato.
  var THEME_KEY = 'finanze-tema';
  var THEMES = [
    { id: 'verde', label: 'Verde', swatch: ['#F6F5F2', '#1F6F5C'] },
    { id: 'blu', label: 'Blu notte', swatch: ['#F2F5F8', '#1A5DA6'] },
    { id: 'scuro', label: 'Scuro', swatch: ['#16191A', '#33A382'] },
    { id: 'minimal', label: 'Minimal', swatch: ['#FAFAF9', '#3B5B52'] }
  ];
  function systemPrefersDark() {
    try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }
  function getThemePref() {
    try { return window.localStorage.getItem(THEME_KEY) || 'auto'; } catch (e) { return 'auto'; }
  }
  function resolveTheme(pref) {
    if (THEMES.some(function (t) { return t.id === pref; })) return pref;
    return systemPrefersDark() ? 'scuro' : 'verde';
  }
  function applyTheme(pref) {
    try { document.documentElement.setAttribute('data-theme', resolveTheme(pref)); } catch (e) {}
  }
  function setThemePref(pref) {
    try { window.localStorage.setItem(THEME_KEY, pref); } catch (e) {}
    applyTheme(pref);
  }

  var CATEGORY_PALETTE = ['#B3413A', '#1F6F5C', '#C97C3D', '#6B5CA5', '#3B6EA5', '#B5548B', '#5B8C3A', '#B08900', '#6B6862', '#2F4F4F'];

  var ICONS = {
    home: 'M4 11 L12 4 L20 11 M6 10 V20 H18 V10 M10 20 V14 H14 V20',
    cart: 'M4 5 H6 L8 15 H18 L20 8 H7 M8 15 L6.5 19 H18',
    car: 'M4 16 H20 M5 16 L6.5 10 H17.5 L19 16 M9 10 L10 7 H14 L15 10 M5.4 18 A1.6 1.6 0 1 0 8.6 18 A1.6 1.6 0 1 0 5.4 18 M15.4 18 A1.6 1.6 0 1 0 18.6 18 A1.6 1.6 0 1 0 15.4 18',
    heart: 'M12 20 C12 20 4 14.5 4 9 C4 6 6.2 4 9 4 C10.5 4 11.6 4.8 12 6 C12.4 4.8 13.5 4 15 4 C17.8 4 20 6 20 9 C20 14.5 12 20 12 20 Z',
    coffee: 'M4 8 H16 V15 A4 4 0 0 1 12 19 H8 A4 4 0 0 1 4 15 Z M16 9 H18 A2.5 2.5 0 0 1 18 14 H16 M6 4 V6 M9 4 V6 M12 4 V6',
    gift: 'M4 9 H20 V12 H4 Z M5 12 H19 V20 H5 Z M12 9 V20 M12 9 C10 9 8.5 7.5 9.5 6 C10.5 4.5 12 6 12 9 M12 9 C14 9 15.5 7.5 14.5 6 C13.5 4.5 12 6 12 9',
    book: 'M4 6 C4 5 5 4 7 4 H12 V19 H7 C5 19 4 20 4 19 Z M20 6 C20 5 19 4 17 4 H12 V19 H17 C19 19 20 20 20 19 Z',
    moneybag: 'M12 4 L9 8 H15 Z M6 8 H18 L19 20 A2 2 0 0 1 17 22 H7 A2 2 0 0 1 5 20 Z'
  };
  var ICON_LIST = ['home', 'cart', 'car', 'heart', 'coffee', 'gift', 'book', 'moneybag'];

  function makeDefaultCategories(list, prefix) {
    return list.map(function (pair, i) {
      return { id: prefix + i, name: pair[0], color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length], icon: pair[1] };
    });
  }

  // Categorie "neutre": spostamenti di soldi tuoi (giroconti, acquisto/vendita titoli).
  // Aggiornano il saldo del conto ma NON contano come entrate/uscite nei totali.
  var NEUTRAL_EXPENSE_NAMES = ['giroconti', 'investimenti'];
  var NEUTRAL_INCOME_NAMES = ['giroconti', 'vendita titoli'];
  function isNeutralDefaultName(name, type) {
    var list = type === 'entrata' ? NEUTRAL_INCOME_NAMES : NEUTRAL_EXPENSE_NAMES;
    return list.indexOf(String(name || '').toLowerCase().trim()) > -1;
  }

  var DEFAULT_EXPENSE_CATEGORIES = makeDefaultCategories([
    ['Salute', 'heart'], ['Svago', ''], ['Casa', 'home'], ['Bar', 'coffee'], ['Formazione', 'book'],
    ['Regali', 'gift'], ['Spesa', 'cart'], ['Famiglia', ''], ['Sport', ''], ['Trasporti', 'car'],
    ['Ristoranti', ''], ['Investimenti', 'moneybag'], ['Prestiti', ''], ['Abbonamenti', ''],
    ['Abbigliamento', ''], ['Tech', ''], ['Giroconti', ''], ['Altro', '']
  ], 'e').map(function (c) { if (isNeutralDefaultName(c.name, 'uscita')) c.neutral = true; return c; });

  var DEFAULT_INCOME_CATEGORIES = makeDefaultCategories([
    ['Stipendio', 'moneybag'], ['Freelance', ''], ['Regalo', 'gift'], ['Interessi', ''],
    ['Vendite online', 'cart'], ['Investimenti', 'moneybag'], ['Vendita titoli', ''], ['Giroconti', ''], ['Altro', '']
  ], 'i').map(function (c) { if (isNeutralDefaultName(c.name, 'entrata')) c.neutral = true; return c; });

  var APP_VERSION = '2.5';
  var DATA_VERSION = 2;
  var BACKUP_REMINDER_DAYS = 30;

  var RECUR_LABELS = {
    daily: 'Ogni giorno', weekly: 'Ogni settimana', monthly: 'Ogni mese', quarterly: 'Ogni 3 mesi',
    semiannual: 'Ogni 6 mesi', yearly: 'Ogni anno', custom: 'Personalizzato'
  };
  var CUSTOM_UNIT_LABELS = { days: 'giorni', weeks: 'settimane', months: 'mesi' };

  var PERSIST_KEYS = ['accounts', 'debts', 'upcoming', 'portfolio', 'portfolios', 'transactions', 'goal', 'expenseCategories', 'incomeCategories',
    'twelveDataApiKey', 'alphaVantageApiKey', 'history', 'transferLog', 'lastBackupAt', 'dataVersion'];
  // Chiavi API: restano sul telefono, non finiscono mai nel file di backup.
  var SECRET_KEYS = ['twelveDataApiKey', 'alphaVantageApiKey'];

  var CRYPTO_ID_MAP = {
    btc: 'bitcoin', bitcoin: 'bitcoin',
    eth: 'ethereum', ethereum: 'ethereum',
    xrp: 'ripple', ripple: 'ripple',
    dot: 'polkadot', polkadot: 'polkadot',
    near: 'near',
    ada: 'cardano', cardano: 'cardano',
    sol: 'solana', solana: 'solana',
    doge: 'dogecoin', dogecoin: 'dogecoin',
    usdt: 'tether', tether: 'tether',
    usdc: 'usd-coin',
    bnb: 'binancecoin',
    ltc: 'litecoin', litecoin: 'litecoin',
    link: 'chainlink', chainlink: 'chainlink',
    hbar: 'hedera-hashgraph', hedera: 'hedera-hashgraph'
  };

  function defaultState() {
    return {
      accounts: [],
      debts: [],
      upcoming: [],
      portfolio: [],
      portfolios: [{ id: 1, name: 'Portafoglio 1' }],
      transactions: [],
      goal: { label: 'Fondo emergenza', target: 0, current: 0 },
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
      incomeCategories: DEFAULT_INCOME_CATEGORIES,
      history: [], transferLog: [], lastBackupAt: null, dataVersion: DATA_VERSION,
      themePref: getThemePref(),
      alphaVantageApiKey: '', avKeyInput: '',
      monthViewKey: '', showBudgets: false, showAddHistory: false, newHistoryMonth: '', newHistoryValue: '',
      updateReady: false,

      period: 'mese', customFrom: '', customTo: '', txCategoryFilter: '',
      editGoal: false, goalTargetInput: '', goalCurrentInput: '',

      showAddAccount: false, newAccountName: '', newAccountBank: '', newAccountBalance: '',
      editingAccountId: null, editAccountBalanceInput: '',
      showTransfer: false, transferFrom: '', transferTo: '', transferAmount: '',

      showAddDebt: false, newDebtPerson: '', newDebtAmount: '', newDebtKind: 'devo', newDebtDue: '', newDebtExclude: false,

      showAddPayment: false, newPaymentLabel: '', newPaymentAmount: '', newPaymentDate: '',
      newPaymentCategory: '', newPaymentRecurrence: 'none',
      newPaymentAccountId: '', newPaymentTime: '', newPaymentEndDate: '', newPaymentCustomValue: '1', newPaymentCustomUnit: 'months',

      editingUpcomingId: null, editPaymentLabel: '', editPaymentAmount: '', editPaymentDate: '',
      editPaymentCategory: '', editPaymentRecurrence: 'none',
      editPaymentAccountId: '', editPaymentTime: '', editPaymentEndDate: '', editPaymentCustomValue: '1', editPaymentCustomUnit: 'months',

      showSettings: false,

      showAddHolding: false, newHoldingName: '', newHoldingValue: '', newHoldingChange: '', newHoldingPortfolioId: '1',
      newHoldingTicker: '', newHoldingQty: '', newHoldingAssetType: 'stock', newHoldingInvested: '',
      showAddPortfolio: false, newPortfolioName: '',
      editingHoldingId: null, editHoldingName: '', editHoldingValue: '', editHoldingChange: '',
      editHoldingTicker: '', editHoldingQty: '', editHoldingAssetType: 'stock', editHoldingInvested: '',

      showImportHoldings: false, importHoldingsBusy: false, importHoldingsError: '', importHoldingsSuccess: '', importHoldingsRows: [],

      twelveDataApiKey: '', showPriceSettings: false, priceKeyInput: '',
      priceRefreshBusy: false, priceRefreshStatus: '',

      showAddTx: false, newTxCategory: '', newTxAmount: '', newTxType: 'uscita', newTxDate: '', newTxNote: '', newTxAccountId: '',
      editingTxId: null, editTxCategory: '', editTxAmount: '', editTxType: 'uscita', editTxDate: '', editTxNote: '', editTxAccountId: '',
      showImport: false, importBusy: false, importError: '', importSuccess: '', importRows: [],
      showCreateCat: false, managingCategories: false,
      newCatName: '', newCatColor: CATEGORY_PALETTE[0], newCatIcon: '',
      editingCatId: null, editingCatType: null,
      mergingCatId: null, mergingCatType: null, mergeTargetId: '',

      showResetConfirm: false, resetCodeInput: '', resetError: '',
      backupError: '', backupPreview: null
    };
  }

  var RESET_CODE = '20831';

  var state = defaultState();

  (function load() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        PERSIST_KEYS.forEach(function (k) {
          if (saved[k] !== undefined) state[k] = saved[k];
        });
        if (saved.dataVersion === undefined) state.dataVersion = 1; // dati di una versione precedente
      }
    } catch (e) {}
    migrate();
    postDuePayments();
    save();
  })();
  applyTheme(state.themePref); // lo script in index.html lo fa già prima del disegno; questo copre i casi in cui manca

  // Quando un pagamento futuro arriva a scadenza (oggi o prima), lo trasforma da solo in un
  // movimento vero e proprio tra le uscite, aggiornando il saldo del conto collegato se c'è.
  // Se è ricorrente, resta comunque tra i "pagamenti futuri" ma con la data spostata alla
  // prossima scadenza; se non lo è (o la ricorrenza è finita), sparisce da lì perché ormai
  // è diventato un movimento. Viene controllato una volta ad ogni apertura dell'app.
  function postDuePayments() {
    var now = new Date();
    var startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var newTx = [];
    var accounts = state.accounts;
    var upcoming = [];
    var posted = false;

    state.upcoming.forEach(function (u) {
      var recurrence = u.recurrence || 'none';
      var endDate = u.endDate ? new Date(u.endDate + 'T23:59:59') : null;
      var d = new Date(u.date);
      var guard = 0;
      var alive = true;
      while (alive && d <= startOfDay && guard < 3000) {
        var accId = u.accountId || null;
        newTx.push({
          id: uid(), category: u.category, amount: Number(u.amount) || 0, type: 'uscita',
          date: isoFromDate(d), note: 'Aggiunto automaticamente da un pagamento futuro', accountId: accId
        });
        if (accId) {
          accounts = accounts.map(function (a) { return a.id === accId ? Object.assign({}, a, { balance: a.balance - (Number(u.amount) || 0) }) : a; });
        }
        posted = true;
        if (recurrence === 'none' || recurrence === '') { alive = false; break; }
        var next = advanceDate(d, recurrence, u.customValue, u.customUnit);
        if (!next) { alive = false; break; }
        d = next;
        guard++;
        if (endDate && d > endDate) { alive = false; }
      }
      if (alive) upcoming.push(Object.assign({}, u, { date: isoFromDate(d) }));
    });

    if (posted) {
      state.transactions = state.transactions.concat(newTx);
      state.accounts = accounts;
      state.upcoming = upcoming;
    }
  }

  // Aggiorna i dati salvati con versioni precedenti dell'app.
  function migrate() {
    if (!Array.isArray(state.history)) state.history = [];
    if (!Array.isArray(state.transferLog)) state.transferLog = [];
    if (typeof state.alphaVantageApiKey !== 'string') state.alphaVantageApiKey = '';
    if ((state.dataVersion || 1) < 2) {
      // v2: giroconti e compravendita titoli non contano più come spese/entrate
      var fix = function (list, type, extraNames) {
        list = (list || []).map(function (c) {
          if (c.neutral === undefined && isNeutralDefaultName(c.name, type)) return Object.assign({}, c, { neutral: true });
          return c;
        });
        extraNames.forEach(function (name) {
          var exists = list.some(function (c) { return c.name.toLowerCase() === name.toLowerCase(); });
          if (!exists) list.push({ id: uid(), name: name, color: '#6B6862', icon: '', neutral: true });
        });
        return list;
      };
      state.expenseCategories = fix(state.expenseCategories, 'uscita', ['Giroconti']);
      state.incomeCategories = fix(state.incomeCategories, 'entrata', ['Giroconti', 'Vendita titoli']);
      state.dataVersion = 2;
    }
  }

  // ---------- storico patrimonio ----------
  function monthKey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1); }
  function computeTotals(s) {
    var acc = s.accounts.filter(function (a) { return !a.excludeFromTotal; }).reduce(function (sum, a) { return sum + Number(a.balance || 0); }, 0);
    var port = s.portfolio.reduce(function (sum, h) { return sum + Number(h.value || 0); }, 0);
    var debt = s.debts.filter(function (d) { return d.kind === 'devo' && !d.excludeFromTotal; }).reduce(function (sum, d) { return sum + Number(d.amount || 0); }, 0);
    var cred = s.debts.filter(function (d) { return d.kind === 'mi deve' && !d.excludeFromTotal; }).reduce(function (sum, d) { return sum + Number(d.amount || 0); }, 0);
    return { acc: acc, port: port, debt: debt, cred: cred, nw: acc + port + cred - debt };
  }
  function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  // Una "foto" per mese: il valore del mese corrente si aggiorna finché il mese non finisce.
  function updateHistorySnapshot() {
    var s = state;
    if (!s.accounts.length && !s.portfolio.length && !s.debts.length) return;
    var t = computeTotals(s);
    var key = monthKey();
    var snap = { m: key, d: isoFromDate(new Date()), acc: round2(t.acc), port: round2(t.port), cred: round2(t.cred), debt: round2(t.debt), nw: round2(t.nw) };
    var hist = s.history || [];
    var idx = -1;
    for (var i = 0; i < hist.length; i++) { if (hist[i].m === key) { idx = i; break; } }
    if (idx > -1) {
      var old = hist[idx];
      if (!old.manual && old.nw === snap.nw && old.acc === snap.acc && old.port === snap.port && old.d === snap.d) return;
      hist = hist.slice(); hist[idx] = snap;
    } else {
      hist = hist.concat([snap]).sort(function (a, b) { return a.m < b.m ? -1 : 1; });
    }
    s.history = hist;
  }

  function save() {
    try {
      updateHistorySnapshot();
      var data = {};
      PERSIST_KEYS.forEach(function (k) { data[k] = state[k]; });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  // ---------- helpers ----------
  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(n) {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n || 0);
  }
  function fmtDate(d) {
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  var uidSeq = 0;
  function uid() { uidSeq = ((uidSeq || 0) + 1) % 1000; return Date.now() * 1000 + uidSeq; }

  function numVal(v) {
    if (v === '' || v == null) return NaN;
    return parseAmountStr(String(v));
  }

  function catMeta(categories, name) {
    var found = null;
    for (var i = 0; i < categories.length; i++) { if (categories[i].name === name) { found = categories[i]; break; } }
    var label = (name || '?').trim();
    if (!found) return { color: '#A6A39B', initials: label.slice(0, 2).toUpperCase(), iconD: null };
    var iconD = found.icon && ICONS[found.icon] ? ICONS[found.icon] : null;
    return { color: found.color, initials: found.name.trim().slice(0, 2).toUpperCase(), iconD: iconD };
  }
  function avatarHtml(meta, size) {
    var inner = meta.iconD
      ? '<svg width="' + Math.round(size * 0.5) + '" height="' + Math.round(size * 0.5) + '" viewBox="0 0 24 24" fill="none"><path d="' + meta.iconD + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : esc(meta.initials);
    return '<div class="avatar" style="width:' + size + 'px;height:' + size + 'px;background:' + meta.color + ';font-size:' + Math.round(size * 0.36) + 'px;">' + inner + '</div>';
  }
  function xIcon() {
    return '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  }

  // ---------- import helpers (CSV / Excel / PDF) ----------
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[data-src="' + src + '"]')) { resolve(); return; }
      var s = document.createElement('script');
      s.crossOrigin = 'anonymous'; // risposta CORS: il service worker la può salvare per l'uso offline
      s.src = src; s.dataset.src = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Impossibile caricare la libreria necessaria (' + src + ').')); };
      document.head.appendChild(s);
    });
  }

  function pad2(n) { n = String(n); return n.length < 2 ? '0' + n : n; }
  function isoFromDate(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }

  function parseFlexibleDate(str) {
    str = String(str).trim();
    var m = str.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
    if (m) return m[1] + '-' + pad2(m[2]) + '-' + pad2(m[3]);
    m = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m) {
      var d = m[1], mo = m[2], y = m[3];
      if (y.length === 2) y = (parseInt(y, 10) > 70 ? '19' : '20') + y;
      return y + '-' + pad2(mo) + '-' + pad2(d);
    }
    return null;
  }

  function looksLikeAmount(str) {
    var s = String(str).trim().replace(/[€$\s]/g, '');
    if (!s) return false;
    return /^-?\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(s) || /^-?\d{1,3}(,\d{3})*(\.\d{1,2})?$/.test(s) || /^-?\d+([.,]\d{1,2})?$/.test(s);
  }
  function parseAmountStr(str) {
    var s = String(str).trim().replace(/[€$\s]/g, '');
    if (s.indexOf(',') > -1 && s.indexOf('.') > -1) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else if (s.indexOf(',') > -1) {
      s = s.replace(',', '.');
    }
    return parseFloat(s);
  }
  function numOrZero(v) {
    var n = parseAmountStr(v || '');
    return isNaN(n) ? 0 : n;
  }
  function indexByNames(header) {
    var map = {};
    (header || []).forEach(function (h, i) {
      var key = String(h == null ? '' : h).toLowerCase().trim();
      if (key && map[key] === undefined) map[key] = i;
    });
    return map;
  }

  var CATEGORY_KEYWORDS = {
    'Spesa': ['supermerc', 'esselunga', 'conad', 'coop ', 'carrefour', 'lidl', 'eurospin', 'md ', 'pam ', 'despar', 'iper'],
    'Ristoranti': ['ristorante', 'pizzeria', 'trattoria', 'sushi', 'mcdonald', 'burger', 'osteria'],
    'Bar': ['bar ', 'caffe', 'caffè', 'cafe', 'starbucks'],
    'Trasporti': ['benzina', 'carburant', ' eni ', ' esso ', ' q8 ', 'autostrad', 'atm ', 'trenitalia', 'italo', 'uber', 'taxi', 'telepass'],
    'Casa': ['affitto', 'condominio', 'enel', 'eni gas', 'a2a', 'iren', 'tim ', 'vodafone', 'wind tre', 'fastweb', 'mutuo', 'iliad'],
    'Salute': ['farmacia', 'ospedale', 'medico', 'dentista', 'parafarmacia'],
    'Svago': ['cinema', 'netflix', 'spotify', 'sky ', 'disney', 'teatro'],
    'Abbonamenti': ['abbonamento', 'canone', 'subscription'],
    'Stipendio': ['stipendio', 'salario', 'retribuzione'],
    'Regali': ['regalo', 'regali'],
    'Abbigliamento': ['zara', 'h&m', 'oviesse', 'abbigliamento'],
    'Tech': ['apple store', 'amazon', 'mediaworld', 'unieuro']
  };
  function guessCategory(desc, categories) {
    var d = (' ' + (desc || '') + ' ').toLowerCase();
    for (var catName in CATEGORY_KEYWORDS) {
      var kws = CATEGORY_KEYWORDS[catName];
      for (var i = 0; i < kws.length; i++) {
        if (d.indexOf(kws[i]) > -1) {
          var match = null;
          for (var j = 0; j < categories.length; j++) { if (categories[j].name === catName) { match = categories[j]; break; } }
          if (match) return match.name;
        }
      }
    }
    for (var k = 0; k < categories.length; k++) {
      if (categories[k].name && d.indexOf(categories[k].name.toLowerCase()) > -1) return categories[k].name;
    }
    var altro = null;
    for (var m = 0; m < categories.length; m++) { if (categories[m].name === 'Altro') { altro = categories[m]; break; } }
    return altro ? altro.name : (categories[0] ? categories[0].name : 'Altro');
  }

  function parseCSV(text) {
    var lines = text.replace(/^﻿/, '').split(/\r\n|\n/).filter(function (l) { return l.trim().length; });
    if (!lines.length) return [];
    var firstLine = lines[0];
    var delim = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';
    return lines.map(function (line) {
      var cells = [], cur = '', inQuotes = false;
      for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (inQuotes) {
          if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; } }
          else cur += ch;
        } else {
          if (ch === '"') inQuotes = true;
          else if (ch === delim) { cells.push(cur); cur = ''; }
          else cur += ch;
        }
      }
      cells.push(cur);
      return cells.map(function (c) { return c.trim(); });
    });
  }

  function parsePDFLines(lines) {
    var dateRe = /(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/;
    var amountRe = /(-?\d{1,3}(?:[.,]\d{3})*[.,]\d{2})(?!\d)/g;
    var rows = [];
    lines.forEach(function (line) {
      var dm = line.match(dateRe);
      if (!dm) return;
      var amounts = line.match(amountRe);
      if (!amounts || !amounts.length) return;
      var amountStr = amounts[amounts.length - 1];
      var desc = line.replace(dm[0], '').replace(amountStr, '').trim();
      rows.push([dm[0], desc, amountStr]);
    });
    return rows;
  }

  function readCSVFile(file) {
    return file.text().then(function (text) { return [{ name: null, rows: parseCSV(text) }]; });
  }
  function readXLSXFile(file) {
    return loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js').then(function () {
      return file.arrayBuffer();
    }).then(function (buf) {
      var wb = window.XLSX.read(buf, { type: 'array', cellDates: true });
      return wb.SheetNames.map(function (sn) {
        return { name: sn, rows: window.XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: true, defval: '' }) };
      });
    });
  }
  function readPDFFile(file) {
    var PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
    var PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    return loadScript(PDFJS_URL).then(function () {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      return file.arrayBuffer();
    }).then(function (buf) {
      return window.pdfjsLib.getDocument({ data: buf }).promise;
    }).then(function (pdf) {
      var pagePromises = [];
      var _loop = function (i) {
        pagePromises.push(pdf.getPage(i).then(function (page) {
          return page.getTextContent().then(function (tc) {
            var lines = {};
            tc.items.forEach(function (it) {
              var y = Math.round(it.transform[5]);
              if (!lines[y]) lines[y] = [];
              lines[y].push(it.str);
            });
            return Object.keys(lines).map(Number).sort(function (a, b) { return b - a; }).map(function (y) { return lines[y].join(' '); });
          });
        }));
      };
      for (var i = 1; i <= pdf.numPages; i++) _loop(i);
      return Promise.all(pagePromises);
    }).then(function (pagesLines) {
      var allLines = [];
      pagesLines.forEach(function (pl) { allLines = allLines.concat(pl); });
      return [{ name: null, rows: parsePDFLines(allLines) }];
    });
  }

  function rowsToImportItems(rows, categories) {
    var items = [];
    rows.forEach(function (row) {
      if (!row || row.length < 2) return;
      var dateVal = null, dateCellIdx = -1;
      row.forEach(function (cell, i) {
        if (dateVal !== null) return;
        if (cell instanceof Date) { dateVal = isoFromDate(cell); dateCellIdx = i; return; }
        var str = String(cell == null ? '' : cell).trim();
        if (!str) return;
        var d = parseFlexibleDate(str);
        if (d) { dateVal = d; dateCellIdx = i; }
      });
      if (dateVal === null) return;

      var allCats = categories.expenseCategories.concat(categories.incomeCategories);
      var amountVal = null, amountCellIdx = -1, typeWordVal = null, explicitCatIdx = -1, explicitCatName = null;
      row.forEach(function (cell, i) {
        if (i === dateCellIdx || cell instanceof Date) return;
        var str = String(cell == null ? '' : cell).trim();
        if (!str) return;
        var lower = str.toLowerCase();
        if (/^uscita$|^spesa$|^debit$|^dare$/.test(lower)) typeWordVal = 'uscita';
        else if (/^entrata$|^income$|^credit$|^avere$/.test(lower)) typeWordVal = 'entrata';
        if (explicitCatName === null) {
          for (var ci = 0; ci < allCats.length; ci++) {
            if (allCats[ci].name.toLowerCase() === lower) { explicitCatName = allCats[ci].name; explicitCatIdx = i; break; }
          }
        }
        if (looksLikeAmount(str)) {
          var n = parseAmountStr(str);
          if (!isNaN(n)) { amountVal = n; amountCellIdx = i; }
        }
      });
      if (amountVal === null) return;

      var descParts = [];
      row.forEach(function (cell, i) {
        if (i === dateCellIdx || i === amountCellIdx || i === explicitCatIdx) return;
        var str = String(cell == null ? '' : cell).trim();
        if (!str) return;
        var lower = str.toLowerCase();
        if (/^uscita$|^spesa$|^debit$|^dare$|^entrata$|^income$|^credit$|^avere$/.test(lower)) return;
        descParts.push(str);
      });
      var desc = descParts.join(' ').slice(0, 140);
      var type = typeWordVal || (amountVal < 0 ? 'uscita' : 'entrata');
      var absAmount = Math.abs(amountVal);
      var catList = type === 'entrata' ? categories.incomeCategories : categories.expenseCategories;
      var explicitValidForType = explicitCatName && catList.some(function (c) { return c.name === explicitCatName; });
      var cat = explicitValidForType ? explicitCatName : guessCategory(desc, catList);
      items.push({ kind: 'tx', date: dateVal, note: desc, amount: String(absAmount.toFixed(2)).replace('.', ','), type: type, category: cat, accountName: '', accountChoice: '', include: true });
    });
    return items;
  }

  // ---------- header-aware import (Excel/CSV exports with explicit columns) ----------
  function excelSerialToISO(n) {
    var utcDays = Math.floor(n - 25569);
    return isoFromDate(new Date(utcDays * 86400000));
  }
  function cellToISODate(cell) {
    if (cell instanceof Date) return isoFromDate(cell);
    if (typeof cell === 'number') return excelSerialToISO(cell);
    var str = String(cell == null ? '' : cell).trim();
    if (/^\d+(\.\d+)?$/.test(str)) return excelSerialToISO(parseFloat(str));
    return parseFlexibleDate(str);
  }

  function detectHeaderMap(headerRow) {
    var map = {};
    (headerRow || []).forEach(function (cell, i) {
      var h = String(cell == null ? '' : cell).toLowerCase().trim();
      if (map.date === undefined && /^date|^data/.test(h)) { map.date = i; return; }
      if (map.category === undefined && /^categor/.test(h)) { map.category = i; return; }
      if (map.account === undefined && /^account|^conto/.test(h)) { map.account = i; return; }
      if (map.outgoing === undefined && /^outgoing/.test(h)) { map.outgoing = i; return; }
      if (map.incoming === undefined && /^incoming/.test(h)) { map.incoming = i; return; }
      if (map.type === undefined && /^type$|^tipo$/.test(h)) { map.type = i; return; }
      if (map.note === undefined && /comment|nota|note|descrizione/.test(h)) { map.note = i; return; }
      if (/amount in default currency/.test(h)) { map.amount = i; return; }
      if (map.amount === undefined && /amount|importo/.test(h)) { map.amount = i; return; }
    });
    return map;
  }

  function classifySheet(sheetName, rows) {
    if (!rows || !rows.length) return null;
    var headerIdx = -1, map = null, kind = null;
    for (var i = 0; i < Math.min(rows.length, 20); i++) {
      var headerLower = (rows[i] || []).map(function (h) { return String(h == null ? '' : h).toLowerCase().trim(); });
      if (headerLower.indexOf('datetime') > -1 && headerLower.indexOf('account_type') > -1 && headerLower.indexOf('counterparty_iban') > -1) {
        headerIdx = i; kind = 'tx-traderepublic'; break;
      }
      if (headerLower.indexOf('operazione') > -1 && headerLower.indexOf('dettagli') > -1) {
        headerIdx = i; kind = 'tx-isybank'; break;
      }
      var candidate = detectHeaderMap(rows[i]);
      var candTransfer = candidate.outgoing !== undefined && candidate.incoming !== undefined && candidate.date !== undefined;
      var candTx = !candTransfer && candidate.date !== undefined && candidate.amount !== undefined;
      if (candTransfer || candTx) { headerIdx = i; map = candidate; kind = candTransfer ? 'transfer' : 'tx'; break; }
    }
    if (headerIdx === -1) return { kind: 'generic', rows: rows };
    if (kind === 'tx-traderepublic' || kind === 'tx-isybank') {
      return { kind: kind, headerRow: rows[headerIdx], rows: rows.slice(headerIdx + 1) };
    }
    var lowerName = (sheetName || '').toLowerCase();
    var forcedType = null;
    if (/expense|spes|uscit/.test(lowerName)) forcedType = 'uscita';
    else if (/income|entrat/.test(lowerName)) forcedType = 'entrata';
    return { kind: kind, map: map, rows: rows.slice(headerIdx + 1), forcedType: forcedType };
  }

  function buildTxItemsFromTradeRepublicRows(rows, headerRow, categories) {
    var idx = indexByNames(headerRow);
    var items = [];
    rows.forEach(function (row) {
      var rowCat = cellStr(row, idx.category).toUpperCase();
      if (rowCat === 'DELIVERY') return;
      var amt = numOrZero(cellStr(row, idx.amount)) + numOrZero(cellStr(row, idx.fee)) + numOrZero(cellStr(row, idx.tax));
      if (!amt) return;
      var dateVal = cellStr(row, idx.date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return;
      var type = amt >= 0 ? 'entrata' : 'uscita';
      var absAmount = Math.abs(amt);
      var rowType = cellStr(row, idx.type).toUpperCase();
      var name = cellStr(row, idx.name);
      var desc = cellStr(row, idx.description);
      var counterparty = cellStr(row, idx.counterparty_name);
      var note, category;
      if (rowCat === 'TRADING') {
        note = (name + ' ' + desc).trim();
        category = type === 'entrata' ? 'Vendita titoli' : 'Investimenti';
      } else {
        note = (desc || counterparty || name).replace(/null$/i, '').trim();
        var catList = type === 'entrata' ? categories.incomeCategories : categories.expenseCategories;
        if (rowType === 'CARD_TRANSACTION' || rowType === 'CARD_TRANSACTION_INTERNATIONAL') category = guessCategory(note, catList);
        else if (rowType === 'INTEREST_PAYMENT') category = 'Interessi';
        else if (rowType === 'DIVIDEND' || rowType === 'BENEFITS_SAVEBACK' || rowType === 'STOCKPERK') category = 'Investimenti';
        else if (/TRANSFER|CUSTOMER_INBOUND|CUSTOMER_OUTBOUND|MANUAL_CASH_TRANSFER/.test(rowType)) category = 'Giroconti';
        else category = 'Altro';
      }
      items.push({ kind: 'tx', date: dateVal, note: note.slice(0, 140), amount: String(absAmount.toFixed(2)).replace('.', ','), type: type, category: category, accountName: 'Trade Republic', accountChoice: '', include: true });
    });
    return items;
  }

  function buildTxItemsFromIsybankRows(rows, headerRow, categories) {
    var idx = indexByNames(headerRow);
    var items = [];
    rows.forEach(function (row) {
      var dateVal = cellToISODate(row[idx.data]);
      if (!dateVal) return;
      var amt = numOrZero(cellStr(row, idx.importo));
      if (!amt) return;
      var type = amt >= 0 ? 'entrata' : 'uscita';
      var absAmount = Math.abs(amt);
      var operazione = cellStr(row, idx.operazione);
      var dettagli = cellStr(row, idx.dettagli);
      var combined = (operazione + ' ' + dettagli).toLowerCase();
      var category;
      if (combined.indexOf('trade republic') > -1) category = 'Giroconti';
      else {
        var catList = type === 'entrata' ? categories.incomeCategories : categories.expenseCategories;
        category = guessCategory(operazione + ' ' + dettagli, catList);
      }
      items.push({ kind: 'tx', date: dateVal, note: operazione.slice(0, 140), amount: String(absAmount.toFixed(2)).replace('.', ','), type: type, category: category, accountName: 'Isybank', accountChoice: '', include: true });
    });
    return items;
  }

  function cellStr(row, idx) {
    if (idx === undefined) return '';
    var v = row[idx];
    return String(v == null ? '' : v).trim();
  }

  var CATEGORY_ALIASES = {
    'other': 'Altro',
    'home': 'Casa',
    'health': 'Salute',
    'groceries': 'Spesa',
    'education': 'Formazione',
    'transportation': 'Trasporti',
    'leisure': 'Svago',
    'gifts': 'Regali',
    'gift': 'Regalo',
    'paycheck': 'Stipendio',
    'interest': 'Interessi',
    'vinted': 'Vendite online',
    'workout': 'Sport',
    'pasto fuori': 'Ristoranti',
    'prestito': 'Prestiti'
  };
  function resolveImportCategory(rawCategory, catList) {
    if (!rawCategory) return null;
    var lower = rawCategory.toLowerCase();
    var i;
    for (i = 0; i < catList.length; i++) {
      if (catList[i].name.toLowerCase() === lower) return catList[i].name;
    }
    var alias = CATEGORY_ALIASES[lower];
    if (alias) {
      for (i = 0; i < catList.length; i++) {
        if (catList[i].name.toLowerCase() === alias.toLowerCase()) return catList[i].name;
      }
      return alias;
    }
    return rawCategory;
  }

  function buildTxItemsFromMappedSheet(sheet, categories) {
    var items = [];
    sheet.rows.forEach(function (row) {
      var dateVal = cellToISODate(row[sheet.map.date]);
      if (!dateVal) return;
      var amountVal = parseAmountStr(cellStr(row, sheet.map.amount));
      if (isNaN(amountVal) || amountVal === 0) return;
      var typeVal = sheet.forcedType;
      if (!typeVal && sheet.map.type !== undefined) {
        var tCell = cellStr(row, sheet.map.type).toLowerCase();
        if (/uscita|spesa|debit|dare|expense/.test(tCell)) typeVal = 'uscita';
        else if (/entrata|income|credit|avere/.test(tCell)) typeVal = 'entrata';
      }
      if (!typeVal) typeVal = amountVal < 0 ? 'uscita' : 'entrata';
      var absAmount = Math.abs(amountVal);
      var rawCategory = cellStr(row, sheet.map.category);
      var rawNote = cellStr(row, sheet.map.note);
      var rawAccount = cellStr(row, sheet.map.account);
      var catList = typeVal === 'entrata' ? categories.incomeCategories : categories.expenseCategories;
      var cat = resolveImportCategory(rawCategory, catList) || guessCategory(rawNote, catList);
      items.push({ kind: 'tx', date: dateVal, note: rawNote, amount: String(absAmount.toFixed(2)).replace('.', ','), type: typeVal, category: cat, accountName: rawAccount, accountChoice: '', include: true });
    });
    return items;
  }

  function buildTransferItemsFromMappedSheet(sheet) {
    var items = [];
    sheet.rows.forEach(function (row) {
      var dateVal = cellToISODate(row[sheet.map.date]);
      if (!dateVal) return;
      var amountVal = parseAmountStr(cellStr(row, sheet.map.amount));
      if (isNaN(amountVal) || amountVal === 0) return;
      var fromName = cellStr(row, sheet.map.outgoing);
      var toName = cellStr(row, sheet.map.incoming);
      if (!fromName || !toName) return;
      var note = cellStr(row, sheet.map.note);
      items.push({ kind: 'transfer', date: dateVal, note: note, amount: String(Math.abs(amountVal).toFixed(2)).replace('.', ','), fromAccountName: fromName, toAccountName: toName, fromAccountChoice: '', toAccountChoice: '', include: true });
    });
    return items;
  }

  function canonicalAccountName(raw) {
    var s = String(raw || '').trim();
    if (!s) return '';
    if (s === s.toUpperCase() && s.length <= 5) return s;
    return s.replace(/\S+/g, function (w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); });
  }
  function findAccountByName(name, accounts) {
    var lower = name.toLowerCase();
    for (var i = 0; i < accounts.length; i++) { if (accounts[i].name.toLowerCase() === lower) return accounts[i]; }
    return null;
  }
  function resolveAccountChoiceDefault(name, accounts) {
    if (!name) return '';
    var canon = canonicalAccountName(name);
    var existing = findAccountByName(canon, accounts);
    return existing ? String(existing.id) : ('new:' + canon);
  }

  function buildImportItemsFromSheets(sheetsResult, categories, accountsSnapshot) {
    var items = [];
    sheetsResult.forEach(function (sheet) {
      if (!sheet.rows || !sheet.rows.length) return;
      var classified = classifySheet(sheet.name, sheet.rows);
      if (!classified) return;
      if (classified.kind === 'tx') items = items.concat(buildTxItemsFromMappedSheet(classified, categories));
      else if (classified.kind === 'transfer') items = items.concat(buildTransferItemsFromMappedSheet(classified));
      else if (classified.kind === 'tx-traderepublic') items = items.concat(buildTxItemsFromTradeRepublicRows(classified.rows, classified.headerRow, categories));
      else if (classified.kind === 'tx-isybank') items = items.concat(buildTxItemsFromIsybankRows(classified.rows, classified.headerRow, categories));
      else items = items.concat(rowsToImportItems(classified.rows, categories));
    });
    items.forEach(function (item) {
      if (item.kind === 'tx' && item.accountName) item.accountChoice = resolveAccountChoiceDefault(item.accountName, accountsSnapshot);
      else if (item.kind === 'transfer') {
        item.fromAccountChoice = resolveAccountChoiceDefault(item.fromAccountName, accountsSnapshot);
        item.toAccountChoice = resolveAccountChoiceDefault(item.toAccountName, accountsSnapshot);
      }
    });
    return items;
  }

  // ---------- controllo doppioni all'import ----------
  function normNote(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function amountKey(v) { var n = typeof v === 'number' ? v : numVal(v); return isNaN(n) ? '0.00' : Math.abs(n).toFixed(2); }
  function txWeakKey(date, amount, type) { return date + '|' + amountKey(amount) + '|' + type; }
  function txStrongKey(date, amount, type, note) { return txWeakKey(date, amount, type) + '|' + normNote(note); }
  function transferKey(r) { return r.date + '|' + amountKey(r.amount) + '|' + normNote(r.fromAccountName) + '>' + normNote(r.toAccountName); }

  // Segna le righe già presenti nei movimenti salvati. Usa un conteggio, così due caffè
  // identici nello stesso giorno restano entrambi importabili se in app ce n'è uno solo.
  function markImportDuplicates(items, transactions, transferLog) {
    var strong = {}, weak = {}, transfers = {};
    transactions.forEach(function (t) {
      var sk = txStrongKey(t.date, t.amount, t.type, t.note), wk = txWeakKey(t.date, t.amount, t.type);
      strong[sk] = (strong[sk] || 0) + 1;
      weak[wk] = (weak[wk] || 0) + 1;
    });
    (transferLog || []).forEach(function (k) { transfers[k] = (transfers[k] || 0) + 1; });
    // prima i match esatti, poi quelli "simili" (stessa data, importo e tipo)
    items.forEach(function (it) {
      if (it.kind === 'transfer') {
        var tk = transferKey(it);
        if (transfers[tk]) { transfers[tk]--; it.dup = 'exact'; it.include = false; }
        return;
      }
      var sk = txStrongKey(it.date, it.amount, it.type, it.note), wk = txWeakKey(it.date, it.amount, it.type);
      if (strong[sk]) { strong[sk]--; weak[wk]--; it.dup = 'exact'; it.include = false; }
    });
    items.forEach(function (it) {
      if (it.kind === 'transfer' || it.dup) return;
      var wk = txWeakKey(it.date, it.amount, it.type);
      if (weak[wk] > 0) { weak[wk]--; it.dup = 'similar'; it.include = false; }
    });
    return items;
  }

  function collectNewAccountOptions(importRows) {
    var seen = {}, list = [];
    importRows.forEach(function (r) {
      [r.accountChoice, r.fromAccountChoice, r.toAccountChoice].forEach(function (c) {
        if (c && c.indexOf('new:') === 0 && !seen[c]) { seen[c] = true; list.push(c); }
      });
    });
    return list;
  }
  function accountSelectOptions(existingAccounts, newAccountChoices, selected) {
    var opts = '<option value=""' + (selected === '' ? ' selected' : '') + '>Nessun conto</option>';
    existingAccounts.forEach(function (a) {
      var v = String(a.id);
      opts += '<option value="' + v + '"' + (selected === v ? ' selected' : '') + '>' + esc(a.name) + '</option>';
    });
    newAccountChoices.forEach(function (c) {
      opts += '<option value="' + esc(c) + '"' + (selected === c ? ' selected' : '') + '>+ Nuovo conto: ' + esc(c.slice(4)) + '</option>';
    });
    return opts;
  }

  // ---------- state update ----------
  function update(partial) {
    Object.assign(state, partial);
    save();
    renderPreserveFocus();
  }
  function toggle(field) {
    var p = {}; p[field] = !state[field];
    if (field === 'showAddTx' && p[field] && !state.newTxAccountId && state.accounts.length) {
      p.newTxAccountId = String(state.accounts[0].id);
    }
    update(p);
  }

  // ---------- mutations ----------
  var App = {
    setField: function (field, value) {
      state[field] = value;
      if (field === 'newTxType') state.newTxCategory = '';
      if (field === 'editTxType') {
        var list = value === 'entrata' ? state.incomeCategories : state.expenseCategories;
        if (!list.some(function (c) { return c.name === state.editTxCategory; })) state.editTxCategory = list.length ? list[0].name : '';
      }
      save();
      renderPreserveFocus();
    },
    setChecked: function (field, checked) { var p = {}; p[field] = checked; update(p); },
    toggle: toggle,
    pickPeriod: function (key) { update({ period: key }); },
    pickMonth: function (key) { update({ monthViewKey: key }); },
    addHistory: function () {
      var m = state.newHistoryMonth, v = numVal(state.newHistoryValue);
      if (!/^\d{4}-\d{2}$/.test(m) || isNaN(v) || m >= monthKey()) return;
      var hist = (state.history || []).filter(function (h) { return h.m !== m; });
      hist.push({ m: m, d: m + '-28', acc: null, port: null, cred: null, debt: null, nw: round2(v), manual: true });
      hist.sort(function (a, b) { return a.m < b.m ? -1 : 1; });
      update({ history: hist, newHistoryMonth: '', newHistoryValue: '', showAddHistory: false });
    },
    removeHistory: function (m) {
      update({ history: (state.history || []).filter(function (h) { return !(h.m === m && h.manual); }) });
    },
    toggleBudgets: function () { update({ showBudgets: !state.showBudgets, managingCategories: false, showCreateCat: false, editingCatId: null }); },
    filterTxCategory: function (name) { update({ txCategoryFilter: state.txCategoryFilter === name ? '' : name }); },
    clearTxCategoryFilter: function () { update({ txCategoryFilter: '' }); },

    toggleEditGoal: function () {
      update({ editGoal: !state.editGoal, goalTargetInput: String(state.goal.target), goalCurrentInput: String(state.goal.current) });
    },
    saveGoal: function () {
      update({ goal: { label: state.goal.label, target: numVal(state.goalTargetInput) || 0, current: numVal(state.goalCurrentInput) || 0 }, editGoal: false });
    },

    addAccount: function () {
      var name = state.newAccountName.trim();
      var bank = state.newAccountBank.trim();
      // Il nome è facoltativo: se manca, si usa la banca (che quindi deve esserci).
      if ((!name && !bank) || state.newAccountBalance === '') return;
      update({
        accounts: state.accounts.concat([{ id: uid(), name: name || bank, bank: bank, balance: numVal(state.newAccountBalance) || 0, excludeFromTotal: false }]),
        newAccountName: '', newAccountBank: '', newAccountBalance: '', showAddAccount: false
      });
    },
    removeAccount: function (id) { update({ accounts: state.accounts.filter(function (a) { return a.id !== id; }) }); },
    toggleExcludeAccount: function (id) {
      update({ accounts: state.accounts.map(function (a) { return a.id === id ? Object.assign({}, a, { excludeFromTotal: !a.excludeFromTotal }) : a; }) });
    },
    startEditBalance: function (id) {
      var acc = state.accounts.find(function (a) { return a.id === id; });
      update({ editingAccountId: id, editAccountBalanceInput: String(acc ? acc.balance : 0) });
    },
    saveEditBalance: function (id) {
      var val = numVal(state.editAccountBalanceInput);
      if (isNaN(val)) { update({ editingAccountId: null }); return; }
      update({ accounts: state.accounts.map(function (a) { return a.id === id ? Object.assign({}, a, { balance: val }) : a; }), editingAccountId: null, editAccountBalanceInput: '' });
    },

    toggleTransfer: function () { update({ showTransfer: !state.showTransfer, transferFrom: '', transferTo: '', transferAmount: '' }); },
    doTransfer: function () {
      var amt = numVal(state.transferAmount);
      if (!state.transferFrom || !state.transferTo || state.transferFrom === state.transferTo || !amt || amt <= 0) return;
      update({
        accounts: state.accounts.map(function (a) {
          if (String(a.id) === String(state.transferFrom)) return Object.assign({}, a, { balance: a.balance - amt });
          if (String(a.id) === String(state.transferTo)) return Object.assign({}, a, { balance: a.balance + amt });
          return a;
        }),
        showTransfer: false, transferFrom: '', transferTo: '', transferAmount: ''
      });
    },

    addDebt: function () {
      if (!state.newDebtPerson || state.newDebtAmount === '') return;
      update({
        debts: state.debts.concat([{ id: uid(), person: state.newDebtPerson, amount: numVal(state.newDebtAmount) || 0, kind: state.newDebtKind, due: state.newDebtDue, excludeFromTotal: !!state.newDebtExclude }]),
        newDebtPerson: '', newDebtAmount: '', newDebtKind: 'devo', newDebtDue: '', newDebtExclude: false, showAddDebt: false
      });
    },
    removeDebt: function (id) { update({ debts: state.debts.filter(function (d) { return d.id !== id; }) }); },
    toggleExcludeDebt: function (id) {
      update({ debts: state.debts.map(function (d) { return d.id === id ? Object.assign({}, d, { excludeFromTotal: !d.excludeFromTotal }) : d; }) });
    },

    addPayment: function () {
      if (!state.newPaymentLabel || state.newPaymentAmount === '' || !state.newPaymentDate) return;
      update({
        upcoming: state.upcoming.concat([{
          id: uid(), label: state.newPaymentLabel, amount: numVal(state.newPaymentAmount) || 0, date: state.newPaymentDate,
          category: state.newPaymentCategory, recurrence: state.newPaymentRecurrence,
          accountId: state.newPaymentAccountId ? Number(state.newPaymentAccountId) : null,
          time: state.newPaymentTime, endDate: state.newPaymentEndDate,
          customValue: state.newPaymentCustomValue, customUnit: state.newPaymentCustomUnit
        }]),
        newPaymentLabel: '', newPaymentAmount: '', newPaymentDate: '', newPaymentCategory: '', newPaymentRecurrence: 'none',
        newPaymentAccountId: '', newPaymentTime: '', newPaymentEndDate: '', newPaymentCustomValue: '1', newPaymentCustomUnit: 'months',
        showAddPayment: false
      });
    },
    removeUpcoming: function (id) { update({ upcoming: state.upcoming.filter(function (u) { return u.id !== id; }) }); },
    startEditUpcoming: function (id) {
      var u = state.upcoming.find(function (x) { return x.id === id; });
      if (!u) return;
      update({
        editingUpcomingId: id, editPaymentLabel: u.label, editPaymentAmount: String(u.amount), editPaymentDate: u.date,
        editPaymentCategory: u.category || '', editPaymentRecurrence: u.recurrence || 'none',
        editPaymentAccountId: u.accountId ? String(u.accountId) : '', editPaymentTime: u.time || '', editPaymentEndDate: u.endDate || '',
        editPaymentCustomValue: u.customValue || '1', editPaymentCustomUnit: u.customUnit || 'months'
      });
    },
    cancelEditUpcoming: function () { update({ editingUpcomingId: null }); },
    saveEditUpcoming: function (id) {
      if (!state.editPaymentLabel || state.editPaymentAmount === '' || !state.editPaymentDate) return;
      var upcoming = state.upcoming.map(function (u) {
        if (u.id !== id) return u;
        return Object.assign({}, u, {
          label: state.editPaymentLabel, amount: numVal(state.editPaymentAmount) || 0, date: state.editPaymentDate,
          category: state.editPaymentCategory, recurrence: state.editPaymentRecurrence,
          accountId: state.editPaymentAccountId ? Number(state.editPaymentAccountId) : null,
          time: state.editPaymentTime, endDate: state.editPaymentEndDate,
          customValue: state.editPaymentCustomValue, customUnit: state.editPaymentCustomUnit
        });
      });
      update({ upcoming: upcoming, editingUpcomingId: null });
    },
    pickPaymentCategory: function (name) { update({ newPaymentCategory: name }); },

    addHolding: function () {
      if (!state.newHoldingName || state.newHoldingValue === '') return;
      var pid = parseFloat(state.newHoldingPortfolioId) || (state.portfolios[0] && state.portfolios[0].id) || 1;
      update({
        portfolio: state.portfolio.concat([{
          id: uid(), name: state.newHoldingName, value: numVal(state.newHoldingValue) || 0, changePct: numVal(state.newHoldingChange) || 0, portfolioId: pid,
          ticker: state.newHoldingTicker.trim().toUpperCase(), quantity: state.newHoldingQty === '' ? null : (numVal(state.newHoldingQty) || 0), assetType: state.newHoldingAssetType,
          invested: state.newHoldingInvested === '' ? null : (numVal(state.newHoldingInvested) || 0)
        }]),
        newHoldingName: '', newHoldingValue: '', newHoldingChange: '', newHoldingTicker: '', newHoldingQty: '', newHoldingAssetType: 'stock', newHoldingInvested: '', showAddHolding: false
      });
    },
    removeHolding: function (id) { update({ portfolio: state.portfolio.filter(function (h) { return h.id !== id; }) }); },
    startEditHolding: function (id) {
      var h = state.portfolio.find(function (x) { return x.id === id; });
      if (!h) return;
      update({
        editingHoldingId: id, editHoldingName: h.name, editHoldingValue: String(h.value), editHoldingChange: String(h.changePct),
        editHoldingTicker: h.ticker || '', editHoldingQty: h.quantity != null ? String(h.quantity) : '', editHoldingAssetType: h.assetType || 'stock',
        editHoldingInvested: h.invested != null ? String(h.invested).replace('.', ',') : ''
      });
    },
    cancelEditHolding: function () { update({ editingHoldingId: null }); },
    saveEditHolding: function (id) {
      var name = state.editHoldingName.trim();
      if (!name) return;
      update({
        portfolio: state.portfolio.map(function (h) {
          return h.id === id ? Object.assign({}, h, {
            name: name, value: numVal(state.editHoldingValue) || 0, changePct: numVal(state.editHoldingChange) || 0,
            ticker: state.editHoldingTicker.trim().toUpperCase(), quantity: state.editHoldingQty === '' ? null : (numVal(state.editHoldingQty) || 0), assetType: state.editHoldingAssetType,
            invested: state.editHoldingInvested === '' ? null : (numVal(state.editHoldingInvested) || 0)
          }) : h;
        }),
        editingHoldingId: null, editHoldingName: '', editHoldingValue: '', editHoldingChange: '', editHoldingTicker: '', editHoldingQty: '', editHoldingAssetType: 'stock', editHoldingInvested: ''
      });
    },
    toggleAddPortfolio: function () { update({ showAddPortfolio: !state.showAddPortfolio }); },
    addPortfolio: function () {
      var name = state.newPortfolioName.trim();
      if (!name) return;
      var id = uid();
      update({ portfolios: state.portfolios.concat([{ id: id, name: name }]), newPortfolioName: '', showAddPortfolio: false, newHoldingPortfolioId: String(id) });
    },
    removePortfolio: function (id) {
      if (state.portfolios.length <= 1) return;
      update({
        portfolios: state.portfolios.filter(function (p) { return p.id !== id; }),
        portfolio: state.portfolio.filter(function (h) { return h.portfolioId !== id; })
      });
    },


    togglePriceSettings: function () { update({ showPriceSettings: !state.showPriceSettings, priceKeyInput: state.twelveDataApiKey, avKeyInput: state.alphaVantageApiKey }); },
    savePriceKey: function () { update({ twelveDataApiKey: state.priceKeyInput.trim(), alphaVantageApiKey: state.avKeyInput.trim(), showPriceSettings: false }); },

    handleHoldingsImportFile: function (file) {
      if (!file) return;
      update({ importHoldingsBusy: true, importHoldingsError: '', importHoldingsSuccess: '', importHoldingsRows: [] });
      file.text().then(function (text) {
        var rows = parseCSV(text);
        if (!rows.length) throw new Error('File vuoto.');
        var header = rows[0].map(function (h) { return h.toLowerCase().trim(); });
        var idx = {
          portfolio: header.indexOf('portafoglio'), name: header.indexOf('nome'), ticker: header.indexOf('ticker'),
          type: header.indexOf('tipo'), qty: header.indexOf('quantita') > -1 ? header.indexOf('quantita') : header.indexOf('quantità'),
          value: header.indexOf('valore'), change: header.indexOf('variazione'),
          invested: header.indexOf('investito') > -1 ? header.indexOf('investito') : header.indexOf('carico')
        };
        if (idx.name === -1 || idx.value === -1) throw new Error('Il file deve avere almeno le colonne "Nome" e "Valore".');
        var items = rows.slice(1).filter(function (r) { return r.length > 1 && r[idx.name]; }).map(function (r) {
          var typeRaw = idx.type > -1 ? r[idx.type].toLowerCase().trim() : 'stock';
          return {
            portfolioName: idx.portfolio > -1 && r[idx.portfolio] ? r[idx.portfolio].trim() : 'Portafoglio importato',
            name: r[idx.name].trim(),
            ticker: idx.ticker > -1 ? r[idx.ticker].trim().toUpperCase() : '',
            assetType: /crypto/.test(typeRaw) ? 'crypto' : 'stock',
            qty: idx.qty > -1 ? r[idx.qty].trim() : '',
            value: idx.value > -1 ? r[idx.value].trim() : '0',
            change: idx.change > -1 ? r[idx.change].trim() : '0',
            invested: idx.invested > -1 && r[idx.invested] ? r[idx.invested].trim() : '',
            include: true
          };
        });
        if (!items.length) throw new Error('Nessuna riga valida trovata.');
        update({ importHoldingsBusy: false, importHoldingsRows: items });
      }).catch(function (err) {
        update({ importHoldingsBusy: false, importHoldingsError: err.message || 'Errore nella lettura del file.' });
      });
    },
    setImportHoldingField: function (idx, field, value) {
      var rows = state.importHoldingsRows.slice();
      if (!rows[idx]) return;
      rows[idx] = Object.assign({}, rows[idx], (function () { var o = {}; o[field] = value; return o; })());
      state.importHoldingsRows = rows;
      save();
      renderPreserveFocus();
    },
    toggleImportHoldingRow: function (idx) {
      var rows = state.importHoldingsRows.slice();
      if (!rows[idx]) return;
      rows[idx] = Object.assign({}, rows[idx], { include: !rows[idx].include });
      update({ importHoldingsRows: rows });
    },
    removeImportHoldingRow: function (idx) {
      update({ importHoldingsRows: state.importHoldingsRows.filter(function (_, i) { return i !== idx; }) });
    },
    confirmImportHoldings: function () {
      var included = state.importHoldingsRows.filter(function (r) { return r.include; });
      if (!included.length) { update({ importHoldingsRows: [] }); return; }

      var portfolios = state.portfolios.slice();
      var portfolioIdByName = {};
      portfolios.forEach(function (p) { portfolioIdByName[p.name.toLowerCase()] = p.id; });
      function resolvePortfolio(name) {
        var key = name.toLowerCase();
        if (portfolioIdByName[key]) return portfolioIdByName[key];
        var p = { id: uid(), name: name };
        portfolios.push(p);
        portfolioIdByName[key] = p.id;
        return p.id;
      }

      var newHoldings = included.map(function (r) {
        return {
          id: uid(), name: r.name, value: numVal(r.value) || 0, changePct: numVal(r.change) || 0,
          portfolioId: resolvePortfolio(r.portfolioName), ticker: r.ticker, assetType: r.assetType,
          quantity: r.qty === '' ? null : (numVal(r.qty) || 0),
          invested: !r.invested ? null : (numVal(r.invested) || 0)
        };
      });

      update({
        portfolios: portfolios, portfolio: state.portfolio.concat(newHoldings),
        showImportHoldings: true, importHoldingsRows: [], importHoldingsError: '',
        importHoldingsSuccess: newHoldings.length + ' posizioni aggiunte.'
      });
    },

    refreshPrices: function () {
      var trackable = state.portfolio.filter(function (h) { return h.ticker && h.quantity != null && h.assetType; });
      if (!trackable.length) {
        update({ priceRefreshStatus: 'Nessuna posizione con ticker e quantità impostati. Modifica una posizione per aggiungerli.' });
        return;
      }
      update({ priceRefreshBusy: true, priceRefreshStatus: '' });

      var isEuSuffix = function (t) { return /\.[A-Z]{2,4}$/.test(t); };
      var cryptoHoldings = trackable.filter(function (h) { return h.assetType === 'crypto'; });
      var avHoldings = trackable.filter(function (h) { return h.assetType === 'stock' && isEuSuffix(h.ticker); });
      var tdHoldings = trackable.filter(function (h) { return h.assetType === 'stock' && !isEuSuffix(h.ticker); });
      var notes = [];
      var failed = [];

      var cryptoPromise = Promise.resolve({});
      if (cryptoHoldings.length) {
        var ids = [];
        var idSeen = {};
        cryptoHoldings.forEach(function (h) {
          var id = CRYPTO_ID_MAP[h.ticker.toLowerCase()] || h.ticker.toLowerCase();
          if (!idSeen[id]) { idSeen[id] = true; ids.push(id); }
        });
        cryptoPromise = fetch('https://api.coingecko.com/api/v3/simple/price?ids=' + encodeURIComponent(ids.join(',')) + '&vs_currencies=eur&include_24hr_change=true')
          .then(function (r) { if (!r.ok) throw new Error('CoinGecko: ' + r.status); return r.json(); })
          .then(function (data) {
            var byId = {};
            cryptoHoldings.forEach(function (h) {
              var id = CRYPTO_ID_MAP[h.ticker.toLowerCase()] || h.ticker.toLowerCase();
              if (data[id]) byId[h.id] = { price: data[id].eur, changePct: data[id].eur_24h_change };
              else failed.push(h.ticker);
            });
            return byId;
          }).catch(function () { notes.push('CoinGecko non raggiungibile.'); return {}; });
      }

      // Twelve Data: azioni/ETF USA (piano gratuito), con conversione in euro
      var tdPromise = Promise.resolve({});
      if (tdHoldings.length) {
        if (!state.twelveDataApiKey) {
          notes.push('Per ' + tdHoldings.map(function (h) { return h.ticker; }).join(', ') + ' serve la chiave Twelve Data (o usa un ticker europeo, es. VWCE.DEX).');
        } else {
          var key = state.twelveDataApiKey;
          var symbols = [];
          var symSeen = {};
          tdHoldings.forEach(function (h) { if (!symSeen[h.ticker]) { symSeen[h.ticker] = true; symbols.push(h.ticker); } });
          tdPromise = fetch('https://api.twelvedata.com/quote?symbol=' + encodeURIComponent(symbols.join(',')) + '&apikey=' + encodeURIComponent(key))
            .then(function (r) { return r.json(); })
            .then(function (data) {
              var quotes = {};
              symbols.forEach(function (sym) {
                var q = symbols.length > 1 ? data[sym] : data;
                if (q && q.close && !q.code) quotes[sym] = { price: parseFloat(q.close), changePct: parseFloat(q.percent_change), currency: (q.currency || 'USD').toUpperCase() };
              });
              var currencies = {};
              Object.keys(quotes).forEach(function (sym) { if (quotes[sym].currency !== 'EUR') currencies[quotes[sym].currency] = true; });
              var fxList = Object.keys(currencies);
              return Promise.all(fxList.map(function (cur) {
                return fetch('https://api.twelvedata.com/exchange_rate?symbol=' + encodeURIComponent(cur + '/EUR') + '&apikey=' + encodeURIComponent(key))
                  .then(function (r) { return r.json(); })
                  .then(function (fx) { return [cur, fx && fx.rate ? parseFloat(fx.rate) : NaN]; })
                  .catch(function () { return [cur, NaN]; });
              })).then(function (pairs) {
                var rates = { EUR: 1 };
                pairs.forEach(function (p) { rates[p[0]] = p[1]; });
                var byId = {};
                tdHoldings.forEach(function (h) {
                  var q = quotes[h.ticker];
                  if (!q) { failed.push(h.ticker); return; }
                  var rate = rates[q.currency];
                  if (isNaN(rate)) { failed.push(h.ticker + ' (cambio ' + q.currency + ')'); return; }
                  byId[h.id] = { price: q.price * rate, changePct: q.changePct };
                });
                return byId;
              });
            }).catch(function () { notes.push('Twelve Data non raggiungibile.'); return {}; });
        }
      }

      // Alpha Vantage: ETF/azioni europee (es. VWCE.DEX). Una richiesta per ticker, in sequenza.
      var avPromise = Promise.resolve({});
      if (avHoldings.length) {
        if (!state.alphaVantageApiKey) {
          notes.push('Per ' + avHoldings.map(function (h) { return h.ticker; }).join(', ') + ' serve la chiave Alpha Vantage (Impostazioni prezzi).');
        } else {
          var avSymbols = [];
          var avSeen = {};
          avHoldings.forEach(function (h) { if (!avSeen[h.ticker]) { avSeen[h.ticker] = true; avSymbols.push(h.ticker); } });
          var avQuotes = {};
          var limited = false;
          var wait = function (ms) { return new Promise(function (res) { setTimeout(res, ms); }); };
          avPromise = avSymbols.reduce(function (chain, sym, i) {
            return chain.then(function () {
              if (limited) return null;
              return (i > 0 ? wait(1200) : Promise.resolve()).then(function () {
                return fetch('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=' + encodeURIComponent(sym) + '&apikey=' + encodeURIComponent(state.alphaVantageApiKey));
              }).then(function (r) { return r.json(); }).then(function (data) {
                if (data && (data.Note || data.Information)) { limited = true; return; }
                var q = data && data['Global Quote'];
                var price = q ? parseFloat(q['05. price']) : NaN;
                if (!isNaN(price)) avQuotes[sym] = { price: price, changePct: parseFloat(String(q['10. change percent'] || '').replace('%', '')) };
              }).catch(function () {});
            });
          }, Promise.resolve()).then(function () {
            if (limited) notes.push('Alpha Vantage: limite di richieste raggiunto (25 al giorno sul piano gratuito). Riprova domani.');
            var byId = {};
            avHoldings.forEach(function (h) { if (avQuotes[h.ticker]) byId[h.id] = avQuotes[h.ticker]; else if (!limited) failed.push(h.ticker); });
            return byId;
          });
        }
      }

      Promise.all([cryptoPromise, tdPromise, avPromise]).then(function (results) {
        var all = Object.assign({}, results[0] || {}, results[1] || {}, results[2] || {});
        var updatedCount = 0;
        var today = isoFromDate(new Date());
        var portfolio = state.portfolio.map(function (h) {
          var r = all[h.id];
          if (!r || r.price == null || isNaN(r.price)) return h;
          updatedCount++;
          return Object.assign({}, h, { value: round2(r.price * h.quantity), changePct: isNaN(r.changePct) ? h.changePct : r.changePct, priceUpdatedAt: today });
        });
        var status = updatedCount + ' posizion' + (updatedCount === 1 ? 'e aggiornata' : 'i aggiornate') + ' su ' + trackable.length + '.';
        if (failed.length) status += ' Prezzo non trovato per: ' + failed.join(', ') + ' (controlla il ticker).';
        if (notes.length) status += ' ' + notes.join(' ');
        update({ portfolio: portfolio, priceRefreshBusy: false, priceRefreshStatus: status });
      });
    },

    pickTxCategory: function (name) { update({ newTxCategory: name }); },
    addTx: function () {
      if (!state.newTxCategory || state.newTxAmount === '' || !state.newTxDate) return;
      var amt = numVal(state.newTxAmount) || 0;
      var accountId = state.newTxAccountId ? Number(state.newTxAccountId) : null;
      var accounts = accountId ? state.accounts.map(function (a) {
        return a.id === accountId ? Object.assign({}, a, { balance: a.balance + (state.newTxType === 'entrata' ? amt : -amt) }) : a;
      }) : state.accounts;
      update({
        transactions: state.transactions.concat([{ id: uid(), category: state.newTxCategory, amount: amt, type: state.newTxType, date: state.newTxDate, note: state.newTxNote, accountId: accountId }]),
        accounts: accounts,
        newTxCategory: '', newTxAmount: '', newTxType: 'uscita', newTxDate: '', newTxNote: '', newTxAccountId: '', showAddTx: false
      });
    },
    removeTx: function (id) {
      var tx = state.transactions.find(function (t) { return t.id === id; });
      var accounts = state.accounts;
      if (tx && tx.accountId) {
        accounts = state.accounts.map(function (a) {
          return a.id === tx.accountId ? Object.assign({}, a, { balance: a.balance - (tx.type === 'entrata' ? tx.amount : -tx.amount) }) : a;
        });
      }
      update({ transactions: state.transactions.filter(function (t) { return t.id !== id; }), accounts: accounts });
    },
    startEditTx: function (id) {
      var t = state.transactions.find(function (x) { return x.id === id; });
      if (!t) return;
      update({
        editingTxId: id, editTxCategory: t.category, editTxAmount: String(t.amount), editTxType: t.type,
        editTxDate: t.date, editTxNote: t.note || '', editTxAccountId: t.accountId ? String(t.accountId) : ''
      });
    },
    cancelEditTx: function () { update({ editingTxId: null }); },
    saveEditTx: function (id) {
      var old = state.transactions.find(function (t) { return t.id === id; });
      if (!old || !state.editTxCategory || state.editTxAmount === '' || !state.editTxDate) return;
      var newAmt = numVal(state.editTxAmount) || 0;
      var newAccountId = state.editTxAccountId ? Number(state.editTxAccountId) : null;
      var newType = state.editTxType;

      var accounts = state.accounts.map(function (a) {
        var bal = a.balance;
        var touched = false;
        if (a.id === old.accountId) { bal -= (old.type === 'entrata' ? old.amount : -old.amount); touched = true; }
        if (a.id === newAccountId) { bal += (newType === 'entrata' ? newAmt : -newAmt); touched = true; }
        return touched ? Object.assign({}, a, { balance: bal }) : a;
      });

      var transactions = state.transactions.map(function (t) {
        return t.id === id ? Object.assign({}, t, { category: state.editTxCategory, amount: newAmt, type: newType, date: state.editTxDate, note: state.editTxNote, accountId: newAccountId }) : t;
      });

      update({ transactions: transactions, accounts: accounts, editingTxId: null });
    },

    toggleCreateCat: function () {
      update({ showCreateCat: !state.showCreateCat, editingCatId: null, editingCatType: null, newCatName: '', newCatColor: CATEGORY_PALETTE[0], newCatIcon: '' });
    },
    pickCatColor: function (color) { update({ newCatColor: color }); },
    pickCatIcon: function (icon) { update({ newCatIcon: icon }); },
    toggleManageCategories: function () { update({ managingCategories: !state.managingCategories, showBudgets: false, showCreateCat: false, editingCatId: null }); },
    startEditCategory: function (id, type) {
      var key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
      var cat = state[key].find(function (c) { return c.id == id; });
      if (!cat) return;
      update({ editingCatId: cat.id, editingCatType: type, newCatName: cat.name, newCatColor: cat.color, newCatIcon: cat.icon || '', showCreateCat: true });
    },
    deleteCategory: function (id, type) {
      var key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
      var p = {}; p[key] = state[key].filter(function (c) { return c.id != id; });
      update(p);
    },
    toggleCategoryNeutral: function (id, type) {
      var key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
      var p = {}; p[key] = state[key].map(function (c) { return c.id == id ? Object.assign({}, c, { neutral: !c.neutral }) : c; });
      update(p);
    },
    setCategoryBudget: function (id, raw) {
      var v = String(raw || '').trim() === '' ? 0 : numVal(raw);
      if (isNaN(v) || v < 0) v = 0;
      update({ expenseCategories: state.expenseCategories.map(function (c) { return c.id == id ? Object.assign({}, c, { budget: round2(v) }) : c; }) });
    },
    startMergeCategory: function (id, type) { update({ mergingCatId: id, mergingCatType: type, mergeTargetId: '' }); },
    cancelMergeCategory: function () { update({ mergingCatId: null, mergingCatType: null, mergeTargetId: '' }); },
    confirmMergeCategory: function () {
      if (!state.mergeTargetId || String(state.mergeTargetId) === String(state.mergingCatId)) return;
      var key = state.mergingCatType === 'income' ? 'incomeCategories' : 'expenseCategories';
      var list = state[key];
      var source = list.find(function (c) { return c.id == state.mergingCatId; });
      var target = list.find(function (c) { return c.id == state.mergeTargetId; });
      if (!source || !target) return;
      var transactions = state.transactions.map(function (t) { return t.category === source.name ? Object.assign({}, t, { category: target.name }) : t; });
      var upcoming = state.upcoming.map(function (u) { return u.category === source.name ? Object.assign({}, u, { category: target.name }) : u; });
      var partial = {}; partial[key] = list.filter(function (c) { return c.id !== source.id; });
      update(Object.assign(partial, { transactions: transactions, upcoming: upcoming, mergingCatId: null, mergingCatType: null, mergeTargetId: '' }));
    },
    saveCategory: function () {
      var name = state.newCatName.trim();
      if (!name) return;
      if (state.editingCatId != null) {
        var key = state.editingCatType === 'income' ? 'incomeCategories' : 'expenseCategories';
        var updated = state[key].map(function (c) { return c.id == state.editingCatId ? Object.assign({}, c, { name: name, color: state.newCatColor, icon: state.newCatIcon }) : c; });
        var p = {}; p[key] = updated;
        update(Object.assign(p, { newCatName: '', newCatColor: CATEGORY_PALETTE[0], newCatIcon: '', showCreateCat: false, editingCatId: null, editingCatType: null }));
        return;
      }
      var cat = { id: uid(), name: name, color: state.newCatColor, icon: state.newCatIcon };
      var isExpense = state.newTxType !== 'entrata';
      var partial = isExpense ? { expenseCategories: state.expenseCategories.concat([cat]) } : { incomeCategories: state.incomeCategories.concat([cat]) };
      update(Object.assign(partial, { newTxCategory: name, newCatName: '', newCatColor: CATEGORY_PALETTE[0], newCatIcon: '', showCreateCat: false }));
    },

    exportCSV: function () {
      try {
        var rows = [['Data', 'Categoria', 'Tipo', 'Importo', 'Nota', 'Conto', 'Fuori dai totali']];
        var isNeutral = neutralChecker(state);
        state.transactions.slice().sort(function (a, b) { return new Date(a.date) - new Date(b.date); }).forEach(function (t) {
          var acc = t.accountId ? state.accounts.find(function (a) { return a.id === t.accountId; }) : null;
          rows.push([t.date, t.category, t.type, String(t.amount).replace('.', ','), t.note || '', acc ? acc.name : '', isNeutral(t) ? 'si' : '']);
        });
        var csv = rows.map(function (r) { return r.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n');
        var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'movimenti.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {}
    },
    printPage: function () { try { window.print(); } catch (e) {} },

    exportBackup: function () {
      try {
        var data = {};
        PERSIST_KEYS.forEach(function (k) { if (SECRET_KEYS.indexOf(k) === -1) data[k] = state[k]; });
        var nowIso = new Date().toISOString();
        data.lastBackupAt = nowIso;
        var payload = { app: 'le-mie-finanze', version: 2, exportedAt: nowIso, data: data };
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        var d = new Date();
        a.href = url; a.download = 'le-mie-finanze-backup-' + d.toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        update({ lastBackupAt: nowIso });
      } catch (e) {}
    },
    handleBackupFile: function (file) {
      if (!file) return;
      update({ backupError: '', backupPreview: null });
      file.text().then(function (text) {
        var parsed;
        try { parsed = JSON.parse(text); } catch (e) { throw new Error('Il file non è un JSON valido.'); }
        if (!parsed || !parsed.data || !Array.isArray(parsed.data.accounts) || !Array.isArray(parsed.data.transactions)) {
          throw new Error('Questo file non sembra un backup di Le Mie Finanze.');
        }
        update({
          backupPreview: {
            data: parsed.data,
            exportedAt: parsed.exportedAt || null,
            summary: parsed.data.accounts.length + ' conti, ' + parsed.data.transactions.length + ' movimenti, ' + (parsed.data.portfolio || []).length + ' posizioni'
          }
        });
      }).catch(function (err) {
        update({ backupError: err.message || 'Errore nella lettura del file.' });
      });
    },
    cancelRestoreBackup: function () { update({ backupPreview: null, backupError: '' }); },
    confirmRestoreBackup: function () {
      if (!state.backupPreview) return;
      var data = state.backupPreview.data;
      var keepSecrets = {};
      SECRET_KEYS.forEach(function (k) { keepSecrets[k] = state[k]; });
      var fresh = defaultState();
      Object.keys(state).forEach(function (k) { delete state[k]; });
      Object.assign(state, fresh);
      PERSIST_KEYS.forEach(function (k) { if (data[k] !== undefined) state[k] = data[k]; });
      if (data.dataVersion === undefined) state.dataVersion = 1;
      // le chiavi API del telefono restano quelle attuali, a meno che il backup (vecchio formato) ne contenga una
      SECRET_KEYS.forEach(function (k) { if (!state[k]) state[k] = keepSecrets[k] || ''; });
      migrate();
      state.backupPreview = null;
      save();
      render();
    },

    toggleResetConfirm: function () { update({ showResetConfirm: !state.showResetConfirm, resetCodeInput: '', resetError: '' }); },
    closeSettings: function () { update({ showSettings: false }); },
    pickTheme: function (pref) {
      pref = (pref === 'auto' || THEMES.some(function (t) { return t.id === pref; })) ? pref : 'auto';
      setThemePref(pref);
      update({ themePref: pref });
    },
    confirmReset: function () {
      if (state.resetCodeInput !== RESET_CODE) {
        state.resetError = 'Codice errato.';
        renderPreserveFocus();
        return;
      }
      var fresh = defaultState();
      Object.keys(state).forEach(function (k) { delete state[k]; });
      Object.assign(state, fresh);
      save();
      render();
    },

    handleImportFile: function (fileList) {
      var files = Array.prototype.slice.call(fileList || []);
      if (!files.length) return;
      update({ importBusy: true, importError: '', importSuccess: '', importRows: [] });
      var categories = { expenseCategories: state.expenseCategories, incomeCategories: state.incomeCategories };
      var accountsSnapshot = state.accounts;
      var unsupported = [];
      var readers = files.map(function (file) {
        var name = file.name.toLowerCase();
        if (/\.csv$/.test(name)) return readCSVFile(file);
        if (/\.xlsx$|\.xls$/.test(name)) return readXLSXFile(file);
        if (/\.pdf$/.test(name)) return readPDFFile(file);
        unsupported.push(file.name);
        return Promise.resolve([]);
      });

      Promise.all(readers).then(function (results) {
        var sheetsResult = [];
        results.forEach(function (sheets) { sheetsResult = sheetsResult.concat(sheets); });
        var items = buildImportItemsFromSheets(sheetsResult, categories, accountsSnapshot);
        if (!items.length) {
          var msg = 'Non ho trovato movimenti riconoscibili in questi file. Controlla il formato oppure inseriscili a mano.';
          if (unsupported.length) msg = 'Formato non supportato: ' + unsupported.join(', ') + '. Usa CSV, Excel (.xlsx) o PDF.';
          update({ importBusy: false, importError: msg });
          return;
        }
        markImportDuplicates(items, state.transactions, state.transferLog);
        update({ importBusy: false, importRows: items });
      }).catch(function (err) {
        update({ importBusy: false, importError: 'Errore durante la lettura del file: ' + (err && err.message ? err.message : err) });
      });
    },
    setImportField: function (idx, field, value) {
      var rows = state.importRows.slice();
      if (!rows[idx]) return;
      var updated = Object.assign({}, rows[idx]);
      updated[field] = value;
      if (field === 'type') {
        var list = value === 'entrata' ? state.incomeCategories : state.expenseCategories;
        var stillValid = list.some(function (c) { return c.name === updated.category; });
        if (!stillValid) updated.category = guessCategory(updated.note, list);
      }
      rows[idx] = updated;
      state.importRows = rows;
      save();
      renderPreserveFocus();
    },
    toggleImportRow: function (idx) {
      var rows = state.importRows.slice();
      if (!rows[idx]) return;
      rows[idx] = Object.assign({}, rows[idx], { include: !rows[idx].include });
      update({ importRows: rows });
    },
    removeImportRow: function (idx) {
      update({ importRows: state.importRows.filter(function (_, i) { return i !== idx; }) });
    },
    confirmImport: function () {
      var included = state.importRows.filter(function (r) { return r.include; });
      if (!included.length) { update({ importRows: [] }); return; }

      var accounts = state.accounts.slice();
      var newAccountIdByChoice = {};
      function resolveAccount(choice) {
        if (!choice) return null;
        if (choice.indexOf('new:') === 0) {
          if (newAccountIdByChoice[choice]) return newAccountIdByChoice[choice];
          var acc = { id: uid(), name: choice.slice(4), bank: '', balance: 0, excludeFromTotal: false };
          accounts.push(acc);
          newAccountIdByChoice[choice] = acc.id;
          return acc.id;
        }
        var found = accounts.find(function (a) { return String(a.id) === choice; });
        return found ? found.id : null;
      }

      var expenseCategories = state.expenseCategories.slice();
      var incomeCategories = state.incomeCategories.slice();
      function resolveCategory(name, type) {
        var list = type === 'entrata' ? incomeCategories : expenseCategories;
        var found = list.find(function (c) { return c.name.toLowerCase() === name.toLowerCase(); });
        if (found) return found.name;
        var cat = { id: uid(), name: name, color: CATEGORY_PALETTE[list.length % CATEGORY_PALETTE.length], icon: '' };
        if (isNeutralDefaultName(name, type)) cat.neutral = true;
        list.push(cat);
        return cat.name;
      }

      var newTx = [];
      var balanceDelta = {};
      var skippedTransfers = 0;
      var appliedTransfers = 0;
      var transferLog = (state.transferLog || []).slice();

      included.forEach(function (r) {
        if (r.kind === 'transfer') {
          var fromId = resolveAccount(r.fromAccountChoice);
          var toId = resolveAccount(r.toAccountChoice);
          var tamt = numVal(r.amount) || 0;
          if (!fromId || !toId || fromId === toId || tamt <= 0) { skippedTransfers++; return; }
          balanceDelta[fromId] = (balanceDelta[fromId] || 0) - tamt;
          balanceDelta[toId] = (balanceDelta[toId] || 0) + tamt;
          transferLog.push(transferKey(r));
          appliedTransfers++;
          return;
        }
        var accountId = resolveAccount(r.accountChoice);
        var amt = numVal(r.amount) || 0;
        var categoryName = resolveCategory(r.category || 'Altro', r.type);
        newTx.push({ id: uid(), category: categoryName, amount: amt, type: r.type, date: r.date, note: r.note, accountId: accountId });
        if (accountId) balanceDelta[accountId] = (balanceDelta[accountId] || 0) + (r.type === 'entrata' ? amt : -amt);
      });

      accounts = accounts.map(function (a) {
        return balanceDelta[a.id] ? Object.assign({}, a, { balance: a.balance + balanceDelta[a.id] }) : a;
      });

      var summary = newTx.length + ' movimenti importati';
      if (appliedTransfers > 0) summary += ', ' + appliedTransfers + ' giroconti applicati';
      if (skippedTransfers > 0) summary += ' (' + skippedTransfers + ' giroconti saltati per conto mancante)';
      var skippedDup = state.importRows.filter(function (r) { return r.dup && !r.include; }).length;
      if (skippedDup > 0) summary += '. ' + skippedDup + ' doppioni non importati';

      update({
        transferLog: transferLog.slice(-2000),
        accounts: accounts,
        expenseCategories: expenseCategories,
        incomeCategories: incomeCategories,
        transactions: state.transactions.concat(newTx),
        showImport: true, importRows: [], importError: '', importSuccess: summary
      });
    }
  };
  window.App = App;

  // ---------- render ----------
  // Restituisce una funzione che dice se un movimento è "neutro" (giroconto, compravendita titoli).
  function neutralChecker(s) {
    var set = {};
    s.expenseCategories.forEach(function (c) { if (c.neutral) set['uscita|' + c.name] = true; });
    s.incomeCategories.forEach(function (c) { if (c.neutral) set['entrata|' + c.name] = true; });
    return function (t) { return !!set[t.type + '|' + t.category]; };
  }
  function sumAmount(list) { return list.reduce(function (sum, t) { return sum + Number(t.amount || 0); }, 0); }

  function render() {
    var s = state;

    var totals = computeTotals(s);
    var totalAccounts = totals.acc, totalPortfolio = totals.port, totalDebt = totals.debt, totalCredit = totals.cred;
    var netWorth = totals.nw;
    var goalPct = s.goal.target > 0 ? Math.min(100, (s.goal.current / s.goal.target) * 100) : 0;
    var isNeutral = neutralChecker(s);

    var now = new Date();
    var startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var ranges = {
      giorno: startOfDay,
      settimana: new Date(startOfDay.getTime() - 6 * 86400000),
      mese: new Date(now.getFullYear(), now.getMonth(), 1),
      anno: new Date(now.getFullYear(), 0, 1)
    };
    var rangeStart = s.period === 'custom' ? (s.customFrom ? new Date(s.customFrom) : new Date(2000, 0, 1)) : (ranges[s.period] || ranges.mese);
    var rangeEnd = s.period === 'custom' && s.customTo ? new Date(s.customTo + 'T23:59:59') : new Date(now.getTime() + 86400000);

    var curMonth = monthKey(now);
    var monthTx = s.transactions.filter(function (t) { return String(t.date).slice(0, 7) === curMonth && !isNeutral(t); });
    var monthlyIncome = sumAmount(monthTx.filter(function (t) { return t.type === 'entrata'; }));
    var monthlyExpense = sumAmount(monthTx.filter(function (t) { return t.type === 'uscita'; }));

    var periodTx = s.transactions.filter(function (t) { var d = new Date(t.date); return d >= rangeStart && d <= rangeEnd; });
    var periodReal = periodTx.filter(function (t) { return !isNeutral(t); });
    var periodNeutral = periodTx.filter(isNeutral);
    var periodIncome = sumAmount(periodReal.filter(function (t) { return t.type === 'entrata'; }));
    var periodExpense = sumAmount(periodReal.filter(function (t) { return t.type === 'uscita'; }));
    var periodNet = periodIncome - periodExpense;
    var periodMoved = sumAmount(periodNeutral.filter(function (t) { return t.type === 'uscita'; })) - sumAmount(periodNeutral.filter(function (t) { return t.type === 'entrata'; }));
    var maxBar = Math.max(periodIncome, periodExpense, 1);

    var urgentDays = s.upcoming.map(function (u) {
      var eff = nextOccurrence(u, startOfDay);
      return eff ? { u: u, eff: eff, days: Math.ceil((eff - startOfDay) / 86400000) } : null;
    }).filter(Boolean);
    var urgent = urgentDays.filter(function (x) { return x.days <= 7; });
    var urgentTotal = urgent.reduce(function (sum, x) { return sum + Number(x.u.amount || 0); }, 0);

    var html = '';
    html += '<div class="page"><div class="wrap">';
    html += renderUpdateBanner(s);
    html += renderHeader(s, netWorth, totalAccounts, totalPortfolio, totalDebt, totalCredit, urgent.length, urgentTotal, goalPct);
    html += renderBackupReminder(s);
    html += renderInsights(s, totalAccounts, totalDebt, monthlyIncome, monthlyExpense, isNeutral);
    html += renderTxSection(s, periodTx, periodIncome, periodExpense, periodNet, maxBar, isNeutral, periodMoved);
    html += renderMonthly(s, isNeutral);
    html += renderNetWorthHistory(s);
    html += renderAccounts(s);
    html += renderDebts(s);
    html += renderUpcoming(s, urgentDays, startOfDay);
    html += renderPortfolios(s, totalPortfolio);
    html += '<button type="button" class="settings-link" data-action="toggle" data-field="showSettings">' + gearIcon() + 'Aspetto, backup e altro</button>';
    html += '<div style="text-align:center;font-size:12px;color:var(--faint);padding-top:0;">I dati vengono salvati sul tuo dispositivo (localStorage), non lasciano il telefono. &middot; v' + APP_VERSION + '</div>';
    html += '</div></div>';
    html += renderSettingsModal(s);

    document.getElementById('app').innerHTML = html;
  }

  function gearIcon() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;"><path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 1 0 12 8.5 Z M12 2 L12 4.5 M12 19.5 L12 22 M4.2 4.2 L6 6 M18 18 L19.8 19.8 M2 12 L4.5 12 M19.5 12 L22 12 M4.2 19.8 L6 18 M18 6 L19.8 4.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function renderSettingsModal(s) {
    if (!s.showSettings) return '';
    return '<div class="modal-backdrop">' +
      '<div class="modal-panel">' +
      '<div class="modal-header"><div class="section-title">Impostazioni</div><button class="icon-btn" data-action="close-settings" aria-label="Chiudi">' + xIcon() + '</button></div>' +
      renderThemePanel(s) +
      renderBackupPanel(s) +
      renderResetPanel(s) +
      '</div></div>';
  }

  function daysSince(iso) { return iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null; }
  function renderBackupReminder(s) {
    var hasData = s.transactions.length || s.accounts.length || s.portfolio.length;
    if (!hasData) return '';
    var days = daysSince(s.lastBackupAt);
    if (days !== null && days < BACKUP_REMINDER_DAYS) return '';
    var msg = days === null ? 'Non hai ancora fatto un backup: i dati esistono solo su questo telefono.' : 'L\'ultimo backup è di ' + days + ' giorni fa.';
    return '<div class="card" style="flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:14px 16px;border-color:rgba(var(--warn-rgb),0.4);background:rgba(var(--warn-rgb),0.08);">' +
      '<div style="font-size:13px;"><strong>Backup</strong> &middot; ' + msg + '</div>' +
      '<button class="btn btn-dark" data-action="export-backup">Esporta ora</button></div>';
  }
  function renderUpdateBanner(s) {
    if (!s.updateReady) return '';
    return '<div class="card" style="flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:12px 16px;">' +
      '<div style="font-size:13px;">È disponibile una nuova versione dell\'app.</div>' +
      '<button class="btn btn-primary" data-action="reload-app">Aggiorna</button></div>';
  }

  function themeSwatchSvg(bg, accent) {
    return '<svg viewBox="0 0 34 34" width="34" height="34">' +
      '<path d="M17,1 A16,16 0 0,0 17,33 Z" fill="' + bg + '"/>' +
      '<path d="M17,1 A16,16 0 0,1 17,33 Z" fill="' + accent + '"/>' +
      '<circle cx="17" cy="17" r="15.25" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="1.5"/></svg>';
  }
  function renderThemePanel(s) {
    var current = s.themePref || 'auto';
    var chosen = THEMES.filter(function (t) { return t.id === current; })[0];
    var label = chosen ? chosen.label : 'Auto — segue il tema del telefono';
    var btn = function (id, title, bg, accent) {
      var active = current === id;
      return '<button type="button" class="theme-swatch" data-action="pick-theme" data-theme="' + id + '" title="' + esc(title) + '" ' +
        'style="border:' + (active ? '2px solid var(--accent)' : '2px solid transparent') + ';">' + themeSwatchSvg(bg, accent) + '</button>';
    };
    var buttons = btn('auto', 'Auto (segue il telefono)', '#F6F5F2', '#16191A') +
      THEMES.map(function (t) { return btn(t.id, t.label, t.swatch[0], t.swatch[1]); }).join('');
    return '<div class="card">' +
      '<div class="section-title">Aspetto</div>' +
      '<div class="muted" style="font-size:12px;">' + esc(label) + '</div>' +
      '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;">' + buttons + '</div>' +
      '</div>';
  }

  function renderBackupPanel(s) {
    var html = '<div class="card">' +
      '<div class="section-title">Backup</div>' +
      '<div class="muted" style="font-size:12px;">Esporta un file con tutti i tuoi dati (conti, movimenti, debiti, pagamenti, portafogli, categorie, storico) per non perderli se cambi telefono o cancelli i dati del browser. Le chiavi API non vengono incluse. Il file contiene i tuoi dati finanziari: tienilo in un posto privato.</div>' +
      '<div style="font-size:12px;">Ultimo backup: <strong>' + (s.lastBackupAt ? fmtDate(s.lastBackupAt) : 'mai') + '</strong></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">' +
      '<button class="btn btn-primary" data-action="export-backup">Esporta backup (.json)</button>' +
      '<label class="btn btn-ghost" style="cursor:pointer;">Importa backup<input type="file" accept=".json" data-action="import-backup-file" style="display:none;"></label>' +
      '</div>';
    if (s.backupError) html += '<div style="color:' + NEGATIVE + ';font-size:12px;">' + esc(s.backupError) + '</div>';
    if (s.backupPreview) {
      html += '<div style="border:1px solid ' + WARN + ';border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:8px;">' +
        '<div style="font-size:13px;font-weight:600;">Sostituire i dati attuali con questo backup?</div>' +
        '<div class="muted" style="font-size:12px;">Contiene: ' + esc(s.backupPreview.summary) + (s.backupPreview.exportedAt ? ' &middot; esportato il ' + fmtDate(s.backupPreview.exportedAt) : '') + '. I dati attuali verranno sovrascritti.</div>' +
        '<div style="display:flex;gap:10px;"><button class="btn btn-dark" data-action="confirm-restore-backup">Sostituisci</button><button class="btn btn-ghost" data-action="cancel-restore-backup">Annulla</button></div>' +
        '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderResetPanel(s) {
    if (!s.showResetConfirm) {
      return '<div style="text-align:center;padding-top:4px;"><button class="btn-link" data-action="toggle-reset-confirm" style="color:' + NEGATIVE + ';">Reimposta tutti i dati</button></div>';
    }
    return '<div style="border:1px solid ' + NEGATIVE + ';border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:10px;">' +
      '<div style="font-size:13px;font-weight:600;color:' + NEGATIVE + ';">Questo cancella conti, movimenti, debiti, pagamenti futuri e portafogli. Non si può annullare.</div>' +
      '<div class="muted" style="font-size:12px;">Per confermare inserisci il codice di sicurezza.</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">' +
      '<input class="text-input" type="password" inputmode="numeric" data-field="resetCodeInput" value="' + esc(s.resetCodeInput) + '" placeholder="Codice" style="width:120px;">' +
      '<button class="btn btn-dark" style="background:' + NEGATIVE + ';" data-action="confirm-reset">Cancella tutto</button>' +
      '<button class="btn btn-ghost" data-action="toggle-reset-confirm">Annulla</button>' +
      '</div>' +
      (s.resetError ? '<div style="color:' + NEGATIVE + ';font-size:12px;">' + esc(s.resetError) + '</div>' : '') +
      '</div>';
  }

  function advanceDate(d, recurrence, customValue, customUnit) {
    if (recurrence === 'daily') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    if (recurrence === 'weekly') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
    if (recurrence === 'monthly') return new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
    if (recurrence === 'quarterly') return new Date(d.getFullYear(), d.getMonth() + 3, d.getDate());
    if (recurrence === 'semiannual') return new Date(d.getFullYear(), d.getMonth() + 6, d.getDate());
    if (recurrence === 'yearly') return new Date(d.getFullYear() + 1, d.getMonth(), d.getDate());
    if (recurrence === 'custom') {
      var n = Math.max(1, parseInt(customValue, 10) || 1);
      if (customUnit === 'days') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
      if (customUnit === 'weeks') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n * 7);
      return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
    }
    return null;
  }

  function nextOccurrence(u, startOfDay) {
    var d = new Date(u.date);
    var recurrence = u.recurrence || 'none';
    if (recurrence === 'none' || recurrence === '') return d;
    var endDate = u.endDate ? new Date(u.endDate + 'T23:59:59') : null;
    var guard = 0;
    while (d < startOfDay && guard < 3000) {
      var next = advanceDate(d, recurrence, u.customValue, u.customUnit);
      if (!next) break;
      d = next;
      guard++;
      if (endDate && d > endDate) return null;
    }
    if (endDate && d > endDate) return null;
    return d;
  }

  function renderHeader(s, netWorth, totalAccounts, totalPortfolio, totalDebt, totalCredit, urgentCount, urgentTotal, goalPct) {
    var stat = function (label, value) {
      return '<div><div style="font-size:12px;color:rgba(var(--header-fg-rgb),0.65);">' + label + '</div><div style="font-size:18px;font-weight:600;margin-top:2px;">' + value + '</div></div>';
    };
    var goalEdit = s.editGoal
      ? '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">' +
        '<input class="text-input" type="text" inputmode="decimal" data-field="goalCurrentInput" value="' + esc(s.goalCurrentInput) + '" placeholder="Attuale" style="width:110px;background:var(--surface);">' +
        '<span style="color:rgba(var(--header-fg-rgb),0.7);">di</span>' +
        '<input class="text-input" type="text" inputmode="decimal" data-field="goalTargetInput" value="' + esc(s.goalTargetInput) + '" placeholder="Obiettivo" style="width:110px;background:var(--surface);">' +
        '<button class="btn" data-action="save-goal" style="background:var(--surface);color:var(--accent);">Salva</button>' +
        '</div>'
      : '';
    return (
      '<div style="background:' + HEADER_BG + ';border-radius:16px;padding:26px 20px;color:var(--header-fg);display:flex;flex-direction:column;gap:22px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">' +
          '<div><h1 style="font-size:26px;font-weight:600;color:var(--header-fg);">Le Mie Finanze</h1><div style="font-size:14px;color:rgba(var(--header-fg-rgb),0.75);margin-top:4px;">Panoramica personale</div></div>' +
          '<div style="text-align:right;"><div style="font-size:12px;color:rgba(var(--header-fg-rgb),0.75);text-transform:uppercase;letter-spacing:0.04em;">Patrimonio netto</div><div style="font-size:32px;font-family:\'Fraunces\',serif;font-weight:600;">' + fmt(netWorth) + '</div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:14px;padding-top:8px;border-top:1px solid rgba(var(--header-fg-rgb),0.2);">' +
          stat('Conti correnti', fmt(totalAccounts)) + stat('Portafoglio', fmt(totalPortfolio)) + stat('Devo', fmt(totalDebt)) + stat('Mi devono', fmt(totalCredit)) + stat('Scadenze 7gg', urgentCount + ' &middot; ' + fmt(urgentTotal)) +
        '</div>' +
        '<div style="background:rgba(var(--header-fg-rgb),0.08);border-radius:12px;padding:16px 18px;display:flex;flex-direction:column;gap:10px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;"><div style="font-size:14px;font-weight:600;">Obiettivo: ' + esc(s.goal.label) + '</div><button class="btn-link" data-action="toggle-edit-goal" style="color:rgba(var(--header-fg-rgb),0.8);">Modifica</button></div>' +
          goalEdit +
          '<div style="display:flex;justify-content:space-between;font-size:13px;color:rgba(var(--header-fg-rgb),0.8);"><span>' + fmt(s.goal.current) + ' di ' + fmt(s.goal.target) + '</span><span>' + Math.round(goalPct) + '%</span></div>' +
          '<div style="width:100%;height:8px;background:rgba(var(--header-fg-rgb),0.2);border-radius:4px;overflow:hidden;"><div style="height:100%;background:var(--header-fg);border-radius:4px;width:' + goalPct + '%;"></div></div>' +
        '</div>' +
      '</div>'
    );
  }

  function insightCard(title, value, status, color, bg, tip) {
    return '<div style="border:1px solid var(--border);border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:8px;">' +
      '<div class="row"><div style="font-size:13px;color:var(--muted);">' + title + '</div><span class="badge" style="background:' + bg + ';color:' + color + ';">' + status + '</span></div>' +
      '<div style="font-size:19px;font-weight:600;font-family:\'Fraunces\',serif;">' + value + '</div>' +
      '<div style="font-size:12px;color:var(--muted);line-height:1.5;">' + tip + '</div>' +
      '</div>';
  }

  function monthExpenseByCategory(s, key, isNeutral) {
    var by = {};
    s.transactions.forEach(function (t) {
      if (t.type !== 'uscita' || String(t.date).slice(0, 7) !== key || isNeutral(t)) return;
      by[t.category] = (by[t.category] || 0) + Number(t.amount || 0);
    });
    return by;
  }

  function renderInsights(s, totalAccounts, totalDebt, monthlyIncome, monthlyExpense, isNeutral) {
    var cards = [];
    if (monthlyExpense > 0) {
      var months = totalAccounts / monthlyExpense;
      if (months >= 6) cards.push(insightCard('Fondo di emergenza', months.toFixed(1) + ' mesi coperti', 'Ottimo', ACCENT, 'rgba(var(--accent-rgb),0.1)', 'Hai una riserva solida per gli imprevisti: puoi destinare il resto a risparmio o investimenti.'));
      else if (months >= 3) cards.push(insightCard('Fondo di emergenza', months.toFixed(1) + ' mesi coperti', 'Adeguato', WARN, 'rgba(var(--warn-rgb),0.1)', 'Un obiettivo comune è arrivare a coprire 6 mesi di spese prima di investire tutto il resto.'));
      else cards.push(insightCard('Fondo di emergenza', months.toFixed(1) + ' mesi coperti', 'Basso', NEGATIVE, 'rgba(var(--negative-rgb),0.1)', 'Prima regola di base: costruisci un fondo di emergenza di 3-6 mesi di spese, tenuto liquido.'));
    } else {
      cards.push(insightCard('Fondo di emergenza', '&mdash;', 'N/D', 'var(--muted)', 'var(--divider)', 'Registra qualche uscita mensile per calcolare quanti mesi di spese copri con la liquidità.'));
    }
    if (monthlyIncome > 0) {
      var rate = (monthlyIncome - monthlyExpense) / monthlyIncome * 100;
      if (rate < 0) cards.push(insightCard('Tasso di risparmio (mese)', rate.toFixed(0) + '%', 'Attenzione', NEGATIVE, 'rgba(var(--negative-rgb),0.1)', 'Questo mese le uscite superano le entrate: rivedi le voci di spesa più alte.'));
      else if (rate >= 20) cards.push(insightCard('Tasso di risparmio (mese)', rate.toFixed(0) + '%', 'Ottimo', ACCENT, 'rgba(var(--accent-rgb),0.1)', 'Un tasso di risparmio del 20% o più è un ottimo punto di partenza per investire con regolarità. Gli acquisti di titoli contano come risparmio, non come spesa.'));
      else if (rate >= 10) cards.push(insightCard('Tasso di risparmio (mese)', rate.toFixed(0) + '%', 'Buono', WARN, 'rgba(var(--warn-rgb),0.1)', 'Sei sulla buona strada: prova ad avvicinarti al 20% di risparmio sul reddito.'));
      else cards.push(insightCard('Tasso di risparmio (mese)', rate.toFixed(0) + '%', 'Basso', NEGATIVE, 'rgba(var(--negative-rgb),0.1)', '"Prima paga te stesso": prova a mettere da parte una quota fissa appena arriva lo stipendio.'));
    } else {
      cards.push(insightCard('Tasso di risparmio (mese)', '&mdash;', 'N/D', 'var(--muted)', 'var(--divider)', 'Registra un’entrata questo mese per calcolare quanto riesci a risparmiare.'));
    }
    if (totalDebt <= 0) cards.push(insightCard('Debiti', fmt(0), 'A posto', ACCENT, 'rgba(var(--accent-rgb),0.1)', 'Nessun debito aperto: la liquidità in eccesso può andare a risparmio o investimenti.'));
    else if (totalDebt > totalAccounts) cards.push(insightCard('Debiti', fmt(totalDebt), 'Priorità', NEGATIVE, 'rgba(var(--negative-rgb),0.1)', 'I debiti superano la liquidità disponibile: prima di investire, valuta di saldarli, specie se a tasso alto.'));
    else cards.push(insightCard('Debiti', fmt(totalDebt), 'Da monitorare', WARN, 'rgba(var(--warn-rgb),0.1)', 'Hai debiti aperti: un debito "cattivo" (tasso alto, beni che si svalutano) va saldato prima di investire.'));

    var budgeted = s.expenseCategories.filter(function (c) { return Number(c.budget) > 0; });
    if (budgeted.length) {
      var spentNow = monthExpenseByCategory(s, monthKey(), isNeutral);
      var over = budgeted.filter(function (c) { return (spentNow[c.name] || 0) > Number(c.budget); });
      var near = budgeted.filter(function (c) { var v = spentNow[c.name] || 0; return v <= Number(c.budget) && v >= Number(c.budget) * 0.8; });
      if (over.length) cards.push(insightCard('Budget del mese', over.length + ' su ' + budgeted.length + ' sforati', 'Attenzione', NEGATIVE, 'rgba(var(--negative-rgb),0.1)', 'Sforati: ' + over.map(function (c) { return esc(c.name); }).join(', ') + '. Dettaglio in "Mese per mese".'));
      else if (near.length) cards.push(insightCard('Budget del mese', near.length + ' vicini al limite', 'Da monitorare', WARN, 'rgba(var(--warn-rgb),0.1)', 'Oltre l\'80%: ' + near.map(function (c) { return esc(c.name); }).join(', ') + '.'));
      else cards.push(insightCard('Budget del mese', 'Tutto nei limiti', 'Ottimo', ACCENT, 'rgba(var(--accent-rgb),0.1)', budgeted.length + (budgeted.length === 1 ? ' categoria' : ' categorie') + ' con budget, nessuna sforata.'));
    }

    return '<div class="card"><div><div class="section-title">Salute finanziaria</div><div class="muted" style="font-size:13px;margin-top:4px;">Indicatori di base, calcolati sui tuoi dati del mese in corso.</div></div><div class="grid-fit">' + cards.join('') + '</div></div>';
  }

  function renderTxSection(s, periodTx, periodIncome, periodExpense, periodNet, maxBar, isNeutral, periodMoved) {
    var periodDefs = [{ key: 'giorno', label: 'Giorno' }, { key: 'settimana', label: 'Settimana' }, { key: 'mese', label: 'Mese' }, { key: 'anno', label: 'Anno' }, { key: 'custom', label: 'Intervallo' }];
    var periodBtns = periodDefs.map(function (p) {
      var active = s.period === p.key;
      return '<button class="btn" data-action="pick-period" data-key="' + p.key + '" style="border-radius:7px;padding:7px 14px;background:' + (active ? ACCENT : 'transparent') + ';color:' + (active ? 'var(--accent-ink)' : 'var(--ink)') + ';">' + p.label + '</button>';
    }).join('');

    var customRange = s.period === 'custom'
      ? '<div class="form-box" style="align-items:center;"><span class="muted" style="font-size:12px;">Dal</span><input class="text-input" type="date" data-field="customFrom" value="' + esc(s.customFrom) + '"><span class="muted" style="font-size:12px;">al</span><input class="text-input" type="date" data-field="customTo" value="' + esc(s.customTo) + '"></div>'
      : '';

    var expenseByCat = {};
    periodTx.filter(function (t) { return t.type === 'uscita' && !isNeutral(t); }).forEach(function (t) { expenseByCat[t.category] = (expenseByCat[t.category] || 0) + Number(t.amount || 0); });
    var maxCatVal = 1;
    Object.keys(expenseByCat).forEach(function (k) { if (expenseByCat[k] > maxCatVal) maxCatVal = expenseByCat[k]; });
    var topCats = Object.keys(expenseByCat).map(function (name) { return [name, expenseByCat[name]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);
    var topCatsHtml = topCats.length ? (
      '<div style="display:flex;flex-direction:column;gap:10px;"><div style="font-size:13px;font-weight:600;color:var(--muted);">Dove spendo di più</div>' +
      topCats.map(function (pair) {
        var meta = catMeta(s.expenseCategories.concat(s.incomeCategories), pair[0]);
        var active = s.txCategoryFilter === pair[0];
        return '<button data-action="filter-tx-category" data-cat="' + esc(pair[0]) + '" style="display:flex;align-items:center;gap:10px;background:none;border:none;padding:4px 2px;cursor:pointer;width:100%;text-align:left;border-radius:8px;' + (active ? 'background:var(--divider);' : '') + '">' + avatarHtml(meta, 26) +
          '<span style="width:100px;font-size:12px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink);">' + esc(pair[0]) + '</span>' +
          '<div class="bar-track"><div class="bar-fill" style="background:' + meta.color + ';width:' + (pair[1] / maxCatVal * 100) + '%;"></div></div>' +
          '<span style="font-size:12px;font-weight:600;width:80px;text-align:right;flex-shrink:0;color:var(--ink);">' + fmt(pair[1]) + '</span></button>';
      }).join('') + '</div>'
    ) : '';

    var filterNotice = s.txCategoryFilter ? (
      '<div class="row" style="background:var(--surface-2);border-radius:8px;padding:8px 12px;"><span style="font-size:12px;">Filtro: <strong>' + esc(s.txCategoryFilter) + '</strong></span><button class="btn-link" data-action="clear-tx-category-filter">Rimuovi filtro ✕</button></div>'
    ) : '';
    var txSource = s.txCategoryFilter ? periodTx.filter(function (t) { return t.category === s.txCategoryFilter; }) : periodTx;

    var txAccountOptions = function (selectedId) {
      return '<option value="">Nessun conto</option>' + s.accounts.map(function (a) { return '<option value="' + a.id + '"' + (String(selectedId) === String(a.id) ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('');
    };
    var txList = txSource.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, s.txCategoryFilter ? 200 : 12).map(function (t) {
      if (s.editingTxId === t.id) {
        var editCatList = s.editTxType === 'entrata' ? s.incomeCategories : s.expenseCategories;
        var editCatOptions = editCatList.map(function (c) { return '<option value="' + esc(c.name) + '"' + (s.editTxCategory === c.name ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');
        return '<div class="list-row" style="flex-wrap:wrap;flex-direction:column;align-items:stretch;gap:8px;">' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<select class="text-input" data-field="editTxType" style="width:90px;"><option value="uscita"' + (s.editTxType === 'uscita' ? ' selected' : '') + '>Uscita</option><option value="entrata"' + (s.editTxType === 'entrata' ? ' selected' : '') + '>Entrata</option></select>' +
          '<select class="text-input" data-field="editTxCategory" style="width:130px;">' + editCatOptions + '</select>' +
          '<select class="text-input" data-field="editTxAccountId" style="width:140px;">' + txAccountOptions(s.editTxAccountId) + '</select>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<input class="text-input" type="date" data-field="editTxDate" value="' + esc(s.editTxDate) + '" style="width:132px;">' +
          '<input class="text-input" type="text" inputmode="decimal" data-field="editTxAmount" value="' + esc(s.editTxAmount) + '" style="width:100px;">' +
          '<input class="text-input" type="text" data-field="editTxNote" value="' + esc(s.editTxNote) + '" placeholder="Nota" style="flex:1 1 140px;">' +
          '</div>' +
          '<div style="display:flex;gap:8px;"><button class="btn btn-primary" data-action="save-edit-tx" data-id="' + t.id + '">Salva</button><button class="btn btn-ghost" data-action="cancel-edit-tx">Annulla</button></div>' +
          '</div>';
      }
      var meta = catMeta(s.expenseCategories.concat(s.incomeCategories), t.category);
      var neutral = isNeutral(t);
      var amountFmt = (t.type === 'entrata' ? '+' : '-') + fmt(t.amount);
      var color = neutral ? 'var(--muted)' : (t.type === 'entrata' ? ACCENT : NEGATIVE);
      var acc = t.accountId ? s.accounts.find(function (a) { return a.id === t.accountId; }) : null;
      var subtitle = fmtDate(t.date) + (acc ? ' &middot; ' + esc(acc.name) : '') + ' &middot; ' + esc(t.note || '—') + (neutral ? ' &middot; <span title="Giroconto o compravendita titoli: aggiorna il saldo ma non conta come spesa o entrata">fuori dai totali</span>' : '');
      return '<div class="list-row"><button data-action="start-edit-tx" data-id="' + t.id + '" style="background:none;border:none;cursor:pointer;padding:0;text-align:left;display:flex;align-items:center;gap:10px;">' + avatarHtml(meta, 30) +
        '<div><div style="font-size:14px;font-weight:500;color:var(--ink);">' + esc(t.category) + '</div><div class="muted" style="font-size:12px;">' + subtitle + '</div></div></button>' +
        '<div style="display:flex;align-items:center;gap:12px;"><div style="font-size:14px;font-weight:600;color:' + color + ';">' + amountFmt + '</div>' +
        '<button class="icon-btn" data-action="remove-tx" data-id="' + t.id + '" aria-label="Rimuovi movimento">' + xIcon() + '</button></div></div>';
    }).join('');

    var activeCatList = s.newTxType === 'entrata' ? s.incomeCategories : s.expenseCategories;
    var catGrid = activeCatList.map(function (c) {
      var selected = s.newTxCategory === c.name;
      var meta = { color: c.color, initials: c.name.trim().slice(0, 2).toUpperCase(), iconD: c.icon && ICONS[c.icon] ? ICONS[c.icon] : null };
      return '<button data-action="pick-tx-category" data-cat="' + esc(c.name) + '" style="background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;padding:2px;">' +
        '<div style="width:46px;height:46px;border-radius:50%;background:' + meta.color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:600;box-shadow:' + (selected ? '0 0 0 3px rgba(var(--ink-rgb),0.35)' : 'none') + ';">' +
        (meta.iconD ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="' + meta.iconD + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' : esc(meta.initials)) +
        '</div><span style="font-size:11px;color:' + (selected ? 'var(--ink)' : 'var(--muted)') + ';text-align:center;max-width:68px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(c.name) + '</span></button>';
    }).join('') + '<button data-action="toggle-create-cat" style="background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;padding:2px;"><div style="width:46px;height:46px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:20px;">+</div><span style="font-size:11px;color:var(--muted);">Nuova</span></button>';

    var createCatBox = s.showCreateCat ? renderCreateCat(s) : '';
    var manageBox = s.managingCategories ? renderManageCategories(s) : '';

    var accountPickerHtml = s.accounts.length
      ? '<select class="text-input" data-field="newTxAccountId" style="width:fit-content;"><option value="">Nessun conto</option>' + s.accounts.map(function (a) { return '<option value="' + a.id + '"' + (String(s.newTxAccountId) === String(a.id) ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('') + '</select>'
      : '<div class="muted" style="font-size:12px;">Nessun conto disponibile: aggiungine uno in "Conti correnti" per collegare i movimenti al saldo.</div>';

    var addTxForm = s.showAddTx ? (
      '<div class="form-box" style="flex-direction:column;align-items:stretch;">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">' +
      '<select class="text-input" data-field="newTxType" style="width:fit-content;"><option value="uscita"' + (s.newTxType === 'uscita' ? ' selected' : '') + '>Uscita</option><option value="entrata"' + (s.newTxType === 'entrata' ? ' selected' : '') + '>Entrata</option></select>' +
      accountPickerHtml +
      '</div>' +
      '<div><div class="muted" style="font-size:13px;margin:10px 0;">Categoria</div><div style="display:flex;flex-wrap:wrap;gap:12px;">' + catGrid + '</div>' +
      '<div class="row" style="margin-top:10px;"><div class="muted" style="font-size:12px;">' + (s.newTxCategory ? 'Categoria: ' + esc(s.newTxCategory) : 'Scegli una categoria qui sopra') + '</div><button class="btn-link" data-action="toggle-manage-cats">Gestisci categorie</button></div></div>' +
      createCatBox + manageBox +
      '<div class="form-box" style="padding:0;margin-top:14px;">' +
      '<input class="text-input" type="text" inputmode="decimal" data-field="newTxAmount" value="' + esc(s.newTxAmount) + '" placeholder="Importo" style="width:110px;">' +
      '<input class="text-input" type="date" data-field="newTxDate" value="' + esc(s.newTxDate) + '">' +
      '<input class="text-input" type="text" data-field="newTxNote" value="' + esc(s.newTxNote) + '" placeholder="Nota (opzionale)" style="flex:1 1 160px;">' +
      '</div><div style="margin-top:14px;"><button class="btn btn-primary" data-action="add-tx">Salva movimento</button></div>' +
      '</div>'
    ) : '';

    return '<div class="card">' +
      '<div class="row" style="flex-wrap:wrap;"><div class="section-title">Entrate e uscite</div>' +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;max-width:100%;"><div style="display:flex;gap:4px;background:var(--surface-2);padding:4px;border-radius:10px;max-width:100%;overflow-x:auto;">' + periodBtns + '</div>' +
      '<button class="btn btn-ghost" data-action="toggle" data-field="showImport">Importa</button><button class="btn btn-ghost" data-action="export-csv">Esporta CSV</button><button class="btn btn-ghost" data-action="print-page">Stampa / PDF</button></div></div>' +
      renderImportPanel(s) +
      customRange +
      '<div class="grid-fit" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));">' +
      '<div style="background:var(--surface-2);border-radius:12px;padding:14px 16px;"><div class="muted" style="font-size:12px;">Entrate</div><div style="font-size:19px;font-weight:600;color:' + ACCENT + ';margin-top:4px;">' + fmt(periodIncome) + '</div></div>' +
      '<div style="background:var(--surface-2);border-radius:12px;padding:14px 16px;"><div class="muted" style="font-size:12px;">Uscite</div><div style="font-size:19px;font-weight:600;color:' + NEGATIVE + ';margin-top:4px;">' + fmt(periodExpense) + '</div></div>' +
      '<div style="background:var(--surface-2);border-radius:12px;padding:14px 16px;"><div class="muted" style="font-size:12px;">Netto</div><div style="font-size:19px;font-weight:600;margin-top:4px;color:' + (periodNet >= 0 ? ACCENT : NEGATIVE) + ';">' + (periodNet >= 0 ? '+' : '') + fmt(periodNet) + '</div></div>' +
      (Math.abs(periodMoved) >= 0.005 ? '<div style="background:var(--surface-2);border-radius:12px;padding:14px 16px;" title="Giroconti e acquisti/vendite di titoli: non sono spese, quindi restano fuori da entrate e uscite"><div class="muted" style="font-size:12px;">' + (periodMoved >= 0 ? 'Investito / spostato' : 'Rientrato da investimenti') + '</div><div style="font-size:19px;font-weight:600;margin-top:4px;color:var(--ink);">' + fmt(Math.abs(periodMoved)) + '</div></div>' : '') +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
      '<div style="display:flex;align-items:center;gap:10px;"><span style="width:56px;font-size:12px;color:var(--muted);">Entrate</span><div class="bar-track"><div class="bar-fill" style="background:' + ACCENT + ';width:' + (periodIncome / maxBar * 100) + '%;"></div></div></div>' +
      '<div style="display:flex;align-items:center;gap:10px;"><span style="width:56px;font-size:12px;color:var(--muted);">Uscite</span><div class="bar-track"><div class="bar-fill" style="background:' + NEGATIVE + ';width:' + (periodExpense / maxBar * 100) + '%;"></div></div></div>' +
      '</div>' +
      topCatsHtml +
      filterNotice +
      '<div style="display:flex;flex-direction:column;gap:2px;border-top:1px solid var(--border);padding-top:10px;">' + (txList || '<div class="muted" style="font-size:13px;padding:10px 4px;">Nessun movimento in questo periodo.</div>') + '</div>' +
      '<div><button class="btn btn-primary" data-action="toggle" data-field="showAddTx">+ Aggiungi movimento</button>' + addTxForm + '</div>' +
      '</div>';
  }

  // ---------- mese per mese ----------
  function lastMonthKeys(n) {
    var now = new Date(), keys = [];
    for (var i = n - 1; i >= 0; i--) keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
    return keys;
  }
  function prevMonthKey(key) {
    var y = parseInt(key.slice(0, 4), 10), m = parseInt(key.slice(5, 7), 10);
    return monthKey(new Date(y, m - 2, 1));
  }
  function monthLabel(key, long) {
    var d = new Date(parseInt(key.slice(0, 4), 10), parseInt(key.slice(5, 7), 10) - 1, 1);
    return long ? d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }) : d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', '');
  }
  function fmtCompact(n) {
    var a = Math.abs(n);
    if (a >= 1000) return (n / 1000).toLocaleString('it-IT', { maximumFractionDigits: a >= 10000 ? 0 : 1 }) + 'k';
    return Math.round(n).toLocaleString('it-IT');
  }
  // Barra con angoli arrotondati solo in cima (appoggiata alla linea di base).
  function barPath(x, y, w, h, r) {
    if (h <= 0) return '';
    r = Math.min(r, w / 2, h);
    return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z';
  }
  function niceMax(v) {
    if (v <= 0) return 100;
    var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
    var steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    for (var i = 0; i < steps.length; i++) if (steps[i] * p >= v) return steps[i] * p;
    return 10 * p;
  }

  function renderMonthly(s, isNeutral) {
    var keys = lastMonthKeys(12);
    var byMonth = {};
    keys.forEach(function (k) { byMonth[k] = { inc: 0, exp: 0 }; });
    var hasAny = false;
    s.transactions.forEach(function (t) {
      var k = String(t.date).slice(0, 7);
      if (!byMonth[k] || isNeutral(t)) return;
      hasAny = true;
      if (t.type === 'entrata') byMonth[k].inc += Number(t.amount || 0); else byMonth[k].exp += Number(t.amount || 0);
    });
    var sel = keys.indexOf(s.monthViewKey) > -1 ? s.monthViewKey : keys[keys.length - 1];
    var prev = prevMonthKey(sel);

    var head = '<div class="row" style="flex-wrap:wrap;"><div class="section-title">Mese per mese</div>' +
      '<div style="display:flex;gap:14px;font-size:12px;color:var(--muted);align-items:center;">' +
      '<span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:3px;background:' + ACCENT + ';"></span>Entrate</span>' +
      '<span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:3px;background:' + NEGATIVE + ';"></span>Uscite</span></div></div>';

    if (!hasAny) {
      return '<div class="card">' + head + '<div class="muted" style="font-size:13px;">Quando avrai movimenti in più mesi, qui vedrai l\'andamento degli ultimi 12 mesi e il confronto tra categorie.</div></div>';
    }

    // grafico a barre: entrate e uscite affiancate per ogni mese
    var W = 360, H = 180, padL = 34, padR = 4, padT = 8, padB = 22;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var max = 0;
    keys.forEach(function (k) { max = Math.max(max, byMonth[k].inc, byMonth[k].exp); });
    max = niceMax(max);
    var y = function (v) { return padT + plotH - (v / max) * plotH; };
    var groupW = plotW / keys.length;
    var barW = Math.max(5, Math.min(14, groupW / 2 - 3));
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Entrate e uscite degli ultimi 12 mesi" style="display:block;font-family:\'Public Sans\',sans-serif;">';
    [0, 0.5, 1].forEach(function (f) {
      var gy = y(max * f);
      svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + gy + '" y2="' + gy + '" stroke="var(--border)" stroke-width="1"' + (f === 0 ? '' : ' stroke-dasharray="3 4"') + '/>';
      svg += '<text x="' + (padL - 6) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + fmtCompact(max * f) + '</text>';
    });
    keys.forEach(function (k, i) {
      var gx = padL + i * groupW;
      var cx = gx + groupW / 2;
      var d = byMonth[k];
      var isSel = k === sel;
      if (isSel) svg += '<rect x="' + (gx + 1) + '" y="' + padT + '" width="' + (groupW - 2) + '" height="' + plotH + '" rx="6" fill="var(--divider)"/>';
      svg += '<path d="' + barPath(cx - barW - 1, y(d.inc), barW, padT + plotH - y(d.inc), 4) + '" fill="' + ACCENT + '"/>';
      svg += '<path d="' + barPath(cx + 1, y(d.exp), barW, padT + plotH - y(d.exp), 4) + '" fill="' + NEGATIVE + '"/>';
      svg += '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="' + (isSel ? 'var(--ink)' : 'var(--muted)') + '" font-weight="' + (isSel ? '700' : '400') + '">' + monthLabel(k) + '</text>';
      // area cliccabile più grande della barra, con tooltip nativo
      svg += '<rect data-action="pick-month" data-key="' + k + '" x="' + gx + '" y="0" width="' + groupW + '" height="' + H + '" fill="transparent" style="cursor:pointer;"><title>' + monthLabel(k, true) + ' — Entrate ' + fmt(d.inc) + ' · Uscite ' + fmt(d.exp) + ' · Netto ' + fmt(d.inc - d.exp) + '</title></rect>';
    });
    svg += '</svg>';

    // dettaglio del mese selezionato
    var cur = byMonth[sel] || { inc: 0, exp: 0 };
    var prevData = byMonth[prev];
    if (!prevData) {
      prevData = { inc: 0, exp: 0 };
      s.transactions.forEach(function (t) { if (String(t.date).slice(0, 7) === prev && !isNeutral(t)) { if (t.type === 'entrata') prevData.inc += Number(t.amount || 0); else prevData.exp += Number(t.amount || 0); } });
    }
    var net = cur.inc - cur.exp;
    var rate = cur.inc > 0 ? Math.round(net / cur.inc * 100) : null;
    var expDelta = cur.exp - prevData.exp;
    var tile = function (label, value, color, sub) {
      return '<div style="background:var(--surface-2);border-radius:12px;padding:12px 14px;"><div class="muted" style="font-size:12px;">' + label + '</div><div style="font-size:17px;font-weight:600;margin-top:4px;color:' + (color || 'var(--ink)') + ';">' + value + '</div>' + (sub ? '<div class="muted" style="font-size:11px;margin-top:2px;">' + sub + '</div>' : '') + '</div>';
    };
    var tiles = '<div class="grid-fit" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;">' +
      tile('Entrate', fmt(cur.inc), ACCENT) +
      tile('Uscite', fmt(cur.exp), NEGATIVE, prevData.exp > 0 ? (expDelta >= 0 ? '+' : '−') + fmt(Math.abs(expDelta)) + ' vs ' + monthLabel(prev) : '') +
      tile('Netto', (net >= 0 ? '+' : '') + fmt(net), net >= 0 ? ACCENT : NEGATIVE) +
      tile('Risparmio', rate === null ? '—' : rate + '%', null, 'sulle entrate del mese') +
      '</div>';

    var curCats = monthExpenseByCategory(s, sel, isNeutral);
    var prevCats = monthExpenseByCategory(s, prev, isNeutral);
    var names = {};
    Object.keys(curCats).forEach(function (n) { names[n] = true; });
    Object.keys(prevCats).forEach(function (n) { names[n] = true; });
    s.expenseCategories.forEach(function (c) { if (Number(c.budget) > 0) names[c.name] = true; });
    var allCats = s.expenseCategories.concat(s.incomeCategories);
    var rows = Object.keys(names).map(function (n) { return { name: n, cur: curCats[n] || 0, prev: prevCats[n] || 0 }; })
      .sort(function (a, b) { return b.cur - a.cur || b.prev - a.prev; })
      .map(function (r) {
        var meta = catMeta(allCats, r.name);
        var catObj = s.expenseCategories.find(function (c) { return c.name === r.name; });
        var budget = catObj ? Number(catObj.budget) || 0 : 0;
        var diff = r.cur - r.prev;
        var diffHtml = '';
        if (r.prev > 0 || r.cur > 0) {
          if (Math.abs(diff) < 0.005) diffHtml = '<span class="muted">= ' + monthLabel(prev) + '</span>';
          else diffHtml = '<span style="color:' + (diff > 0 ? NEGATIVE : ACCENT) + ';">' + (diff > 0 ? '▲ +' : '▼ −') + fmt(Math.abs(diff)) + '</span> <span class="muted">vs ' + monthLabel(prev) + '</span>';
        }
        var budgetHtml = '';
        if (budget > 0) {
          var pct = r.cur / budget;
          var bc = pct > 1 ? NEGATIVE : (pct >= 0.8 ? WARN : ACCENT);
          budgetHtml = '<div style="display:flex;align-items:center;gap:8px;margin-top:6px;"><div class="bar-track" style="height:6px;"><div class="bar-fill" style="background:' + bc + ';width:' + Math.min(100, pct * 100) + '%;"></div></div>' +
            '<span style="font-size:11px;white-space:nowrap;color:' + (pct > 1 ? NEGATIVE : 'var(--muted)') + ';">' + (pct > 1 ? 'Sforato: ' : '') + fmt(r.cur) + ' di ' + fmt(budget) + '</span></div>';
        }
        return '<div style="padding:9px 2px;border-bottom:1px solid var(--divider);"><div style="display:flex;align-items:center;gap:10px;">' + avatarHtml(meta, 26) +
          '<div style="flex:1;min-width:0;"><div style="display:flex;justify-content:space-between;gap:8px;"><span style="font-size:13px;font-weight:500;">' + esc(r.name) + '</span><span style="font-size:13px;font-weight:600;">' + fmt(r.cur) + '</span></div>' +
          '<div style="font-size:11px;margin-top:2px;">' + diffHtml + '</div>' + budgetHtml + '</div></div></div>';
      }).join('');

    return '<div class="card">' + head +
      '<div class="muted" style="font-size:12px;margin-top:-8px;">Tocca un mese per vederne il dettaglio. Giroconti e acquisti di titoli sono esclusi.</div>' +
      svg +
      '<div style="font-size:14px;font-weight:600;text-transform:capitalize;">' + monthLabel(sel, true) + '</div>' +
      tiles +
      '<div><div style="font-size:13px;font-weight:600;color:var(--muted);margin-bottom:4px;">Uscite per categoria</div>' + (rows || '<div class="muted" style="font-size:13px;">Nessuna uscita in questo mese.</div>') +
      '<div style="margin-top:10px;"><button class="btn btn-ghost" data-action="toggle-budgets">' + (s.showBudgets ? 'Chiudi categorie e budget' : 'Imposta budget e categorie') + '</button></div>' +
      (s.showBudgets ? ((s.showCreateCat && s.editingCatId != null) ? renderCreateCat(s) : '') + renderManageCategories(s) : '') + '</div>' +
      '</div>';
  }

  // ---------- andamento patrimonio ----------
  function renderNetWorthHistory(s) {
    var hist = (s.history || []).slice().sort(function (a, b) { return a.m < b.m ? -1 : 1; });
    var addForm = s.showAddHistory ? (
      '<div class="form-box" style="align-items:center;">' +
      '<span class="muted" style="font-size:12px;flex-basis:100%;">Aggiungi il patrimonio di un mese passato (es. da un vecchio estratto conto) per avere subito uno storico.</span>' +
      '<input class="text-input" type="month" data-field="newHistoryMonth" value="' + esc(s.newHistoryMonth) + '" max="' + monthKey() + '">' +
      '<input class="text-input" type="text" inputmode="decimal" data-field="newHistoryValue" value="' + esc(s.newHistoryValue) + '" placeholder="Patrimonio €" style="width:130px;">' +
      '<button class="btn btn-dark" data-action="add-history">Salva</button></div>'
    ) : '';
    var addBtn = '<div><button class="btn btn-ghost" data-action="toggle" data-field="showAddHistory">+ Mese passato</button></div>';
    var title = '<div class="section-title">Andamento patrimonio</div>';

    if (hist.length < 2) {
      return '<div class="card">' + title +
        '<div class="muted" style="font-size:13px;">Lo storico si costruisce da solo: l\'app salva il tuo patrimonio netto una volta al mese. ' +
        (hist.length === 1 ? 'Primo punto salvato: ' + monthLabel(hist[0].m, true) + ' (' + fmt(hist[0].nw) + '). ' : '') +
        'Dal mese prossimo vedrai il grafico, oppure aggiungi a mano qualche mese passato.</div>' + addBtn + addForm + '</div>';
    }

    var ord = function (m) { return parseInt(m.slice(0, 4), 10) * 12 + parseInt(m.slice(5, 7), 10) - 1; };
    var o0 = ord(hist[0].m), o1 = ord(hist[hist.length - 1].m);
    var vals = hist.map(function (h) { return h.nw; });
    var vMax = niceMax(Math.max.apply(null, vals.concat([0])));
    var vMinRaw = Math.min.apply(null, vals.concat([0]));
    var vMin = vMinRaw < 0 ? -niceMax(-vMinRaw) : 0;
    var W = 360, H = 170, padL = 38, padR = 12, padT = 10, padB = 22;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var x = function (m) { return padL + (o1 === o0 ? plotW / 2 : (ord(m) - o0) / (o1 - o0) * plotW); };
    var y = function (v) { return padT + plotH - (v - vMin) / (vMax - vMin) * plotH; };

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Patrimonio netto nel tempo" style="display:block;font-family:\'Public Sans\',sans-serif;">';
    [vMin, (vMin + vMax) / 2, vMax].forEach(function (v, i) {
      svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="var(--border)" stroke-width="1"' + (i === 0 ? '' : ' stroke-dasharray="3 4"') + '/>';
      svg += '<text x="' + (padL - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + fmtCompact(v) + '</text>';
    });
    if (vMin < 0) svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="var(--faint)" stroke-width="1"/>';
    var line = hist.map(function (h, i) { return (i ? 'L' : 'M') + x(h.m).toFixed(1) + ',' + y(h.nw).toFixed(1); }).join('');
    var base = y(Math.max(0, vMin));
    svg += '<path d="' + line + 'L' + x(hist[hist.length - 1].m).toFixed(1) + ',' + base + 'L' + x(hist[0].m).toFixed(1) + ',' + base + 'Z" fill="' + ACCENT + '" fill-opacity="0.08"/>';
    svg += '<path d="' + line + '" fill="none" stroke="' + ACCENT + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    // etichette mesi: al massimo ~7 per non sovrapporle
    var step = Math.max(1, Math.ceil(hist.length / 7));
    hist.forEach(function (h, i) {
      var cx = x(h.m), cy = y(h.nw);
      svg += '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="' + (h.manual ? 'var(--surface)' : ACCENT) + '" stroke="' + (h.manual ? ACCENT : 'var(--surface)') + '" stroke-width="2"/>';
      svg += '<circle cx="' + cx + '" cy="' + cy + '" r="14" fill="transparent"><title>' + monthLabel(h.m, true) + ': ' + fmt(h.nw) + (h.manual ? ' (inserito a mano)' : '') + '</title></circle>';
      if (i % step === 0 || i === hist.length - 1) {
        svg += '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="var(--muted)">' + monthLabel(h.m) + (h.m.slice(5) === '01' || i === 0 ? ' ' + h.m.slice(2, 4) : '') + '</text>';
      }
    });
    svg += '</svg>';

    var last = hist[hist.length - 1], prev = hist[hist.length - 2], first = hist[0];
    var delta = function (a, b) {
      var d = a - b;
      var pct = b !== 0 ? ' (' + (d >= 0 ? '+' : '') + (d / Math.abs(b) * 100).toFixed(1).replace('.', ',') + '%)' : '';
      return '<span style="color:' + (d >= 0 ? ACCENT : NEGATIVE) + ';font-weight:600;">' + (d >= 0 ? '+' : '−') + fmt(Math.abs(d)) + pct + '</span>';
    };
    var summary = '<div style="display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13px;">' +
      '<span>vs ' + monthLabel(prev.m, true) + ': ' + delta(last.nw, prev.nw) + '</span>' +
      (first !== prev ? '<span>da ' + monthLabel(first.m, true) + ': ' + delta(last.nw, first.nw) + '</span>' : '') + '</div>';

    var rows = hist.slice().reverse().slice(0, 12).map(function (h, i, arr) {
      var older = arr[i + 1];
      return '<div class="list-row" style="padding:7px 2px;"><span style="font-size:13px;text-transform:capitalize;">' + monthLabel(h.m, true) + (h.manual ? ' <span class="muted" style="font-size:11px;text-transform:none;">(a mano)</span>' : '') + '</span>' +
        '<span style="display:flex;align-items:center;gap:10px;font-size:13px;">' + (older ? '<span style="font-size:11px;color:' + (h.nw - older.nw >= 0 ? ACCENT : NEGATIVE) + ';">' + (h.nw - older.nw >= 0 ? '+' : '−') + fmt(Math.abs(h.nw - older.nw)) + '</span>' : '') +
        '<strong>' + fmt(h.nw) + '</strong>' + (h.manual ? '<button class="icon-btn" data-action="remove-history" data-key="' + h.m + '" aria-label="Rimuovi mese">' + xIcon() + '</button>' : '') + '</span></div>';
    }).join('');

    return '<div class="card">' + title + summary + svg +
      '<details><summary style="cursor:pointer;font-size:13px;color:var(--muted);">Valori mese per mese</summary><div style="margin-top:6px;">' + rows + '</div></details>' +
      addBtn + addForm + '</div>';
  }

  function renderImportPanel(s) {
    if (!s.showImport) return '';
    var html = '<div class="form-box" style="flex-direction:column;align-items:stretch;">' +
      '<div class="row" style="align-items:center;"><div style="font-size:14px;font-weight:600;">Importa movimenti da CSV, Excel o PDF</div><button class="btn-link" data-action="toggle" data-field="showImport">Chiudi</button></div>' +
      '<div class="muted" style="font-size:12px;">Funziona con estratti conto (anche export ufficiali di Trade Republic e Isybank), file Excel (anche con fogli Expenses/Income/Transfers) o PDF. Puoi selezionare più file insieme. Le righe vengono proposte per la revisione prima di essere aggiunte. La prima volta serve una connessione a internet per caricare le librerie di lettura.</div>' +
      '<input type="file" accept=".csv,.xlsx,.xls,.pdf" data-action="import-file" multiple style="margin-top:4px;">';
    if (s.importBusy) html += '<div class="muted" style="font-size:13px;">Analisi del file in corso...</div>';
    if (s.importError) html += '<div style="color:' + NEGATIVE + ';font-size:13px;">' + esc(s.importError) + '</div>';
    if (s.importSuccess) html += '<div style="color:' + ACCENT + ';font-size:13px;font-weight:600;">' + esc(s.importSuccess) + '</div>';
    html += '</div>';

    if (!s.importRows.length) return html;

    var newAccOpts = collectNewAccountOptions(s.importRows);
    var dupBadge = function (r) {
      if (!r.dup) return '';
      return r.dup === 'exact'
        ? '<span class="badge" style="background:rgba(var(--negative-rgb),0.1);color:' + NEGATIVE + ';">Già presente</span>'
        : '<span class="badge" style="background:rgba(var(--warn-rgb),0.12);color:var(--warn-ink);" title="Stessa data, importo e tipo di un movimento già salvato">Possibile doppione</span>';
    };
    var dupCount = s.importRows.filter(function (r) { return r.dup; }).length;

    var rows = s.importRows.map(function (r, idx) {
      if (r.kind === 'transfer') {
        return '<div class="list-row" style="flex-wrap:wrap;">' +
          '<input type="checkbox" data-action="toggle-import-row" data-idx="' + idx + '" ' + (r.include ? 'checked' : '') + ' style="margin:0;">' +
          '<span class="badge" style="background:var(--border);color:var(--ink);">Giroconto</span>' + dupBadge(r) +
          '<input class="text-input" type="date" data-import-field="date" data-idx="' + idx + '" value="' + esc(r.date) + '" style="width:132px;">' +
          '<select class="text-input" data-import-field="fromAccountChoice" data-idx="' + idx + '" style="width:140px;">' + accountSelectOptions(s.accounts, newAccOpts, r.fromAccountChoice) + '</select>' +
          '<span class="muted">&rarr;</span>' +
          '<select class="text-input" data-import-field="toAccountChoice" data-idx="' + idx + '" style="width:140px;">' + accountSelectOptions(s.accounts, newAccOpts, r.toAccountChoice) + '</select>' +
          '<input class="text-input" type="text" inputmode="decimal" data-import-field="amount" data-idx="' + idx + '" value="' + esc(r.amount) + '" style="width:90px;">' +
          '<button class="icon-btn" data-action="remove-import-row" data-idx="' + idx + '" aria-label="Rimuovi riga">' + xIcon() + '</button>' +
          '</div>';
      }
      var catList = r.type === 'entrata' ? s.incomeCategories : s.expenseCategories;
      var catNames = catList.map(function (c) { return c.name; });
      var extraCat = r.category && catNames.indexOf(r.category) === -1 ? [r.category] : [];
      var catOptions = catNames.concat(extraCat).map(function (name) {
        return '<option value="' + esc(name) + '"' + (r.category === name ? ' selected' : '') + '>' + esc(name) + (extraCat.indexOf(name) > -1 ? ' (nuova)' : '') + '</option>';
      }).join('');
      return '<div class="list-row" style="flex-wrap:wrap;' + (r.dup && !r.include ? 'opacity:0.6;' : '') + '">' +
        '<input type="checkbox" data-action="toggle-import-row" data-idx="' + idx + '" ' + (r.include ? 'checked' : '') + ' style="margin:0;">' + dupBadge(r) +
        '<input class="text-input" type="date" data-import-field="date" data-idx="' + idx + '" value="' + esc(r.date) + '" style="width:132px;">' +
        '<select class="text-input" data-import-field="type" data-idx="' + idx + '" style="width:88px;"><option value="uscita"' + (r.type === 'uscita' ? ' selected' : '') + '>Uscita</option><option value="entrata"' + (r.type === 'entrata' ? ' selected' : '') + '>Entrata</option></select>' +
        '<select class="text-input" data-import-field="category" data-idx="' + idx + '" style="width:130px;">' + catOptions + '</select>' +
        '<select class="text-input" data-import-field="accountChoice" data-idx="' + idx + '" style="width:140px;">' + accountSelectOptions(s.accounts, newAccOpts, r.accountChoice) + '</select>' +
        '<input class="text-input" type="text" data-import-field="note" data-idx="' + idx + '" value="' + esc(r.note) + '" placeholder="Descrizione" style="flex:1 1 140px;">' +
        '<input class="text-input" type="text" inputmode="decimal" data-import-field="amount" data-idx="' + idx + '" value="' + esc(r.amount) + '" style="width:90px;">' +
        '<button class="icon-btn" data-action="remove-import-row" data-idx="' + idx + '" aria-label="Rimuovi riga">' + xIcon() + '</button>' +
        '</div>';
    }).join('');

    var includedTx = s.importRows.filter(function (r) { return r.include && r.kind !== 'transfer'; }).length;
    var includedTransfer = s.importRows.filter(function (r) { return r.include && r.kind === 'transfer'; }).length;
    var label = 'Importa';
    if (includedTx) label += ' ' + includedTx + ' movimenti';
    if (includedTransfer) label += (includedTx ? ' e ' : ' ') + includedTransfer + ' giroconti';
    if (!includedTx && !includedTransfer) label += ' 0 righe';

    return html + '<div class="form-box" style="flex-direction:column;align-items:stretch;margin-top:10px;">' +
      '<div class="muted" style="font-size:12px;">Controlla e correggi le righe prima di importare: categoria e conto sono proposti automaticamente dove possibile. "+ Nuovo conto" crea il conto al momento dell\'import (senza duplicati se compare più volte).</div>' +
      (dupCount ? '<div style="font-size:12px;color:var(--warn-ink);background:rgba(var(--warn-rgb),0.1);border-radius:8px;padding:8px 10px;">' + dupCount + (dupCount === 1 ? ' riga sembra già presente' : ' righe sembrano già presenti') + ' tra i tuoi movimenti: le ho deselezionate. Spuntale se vuoi importarle comunque.</div>' : '') +
      '<div style="display:flex;flex-direction:column;gap:2px;max-height:360px;overflow:auto;">' + rows + '</div>' +
      '<div><button class="btn btn-primary" data-action="confirm-import">' + label + '</button></div>' +
      '</div>';
  }

  function renderCreateCat(s) {
    var swatches = CATEGORY_PALETTE.map(function (color) {
      return '<button data-action="pick-cat-color" data-color="' + color + '" style="width:22px;height:22px;border-radius:50%;background:' + color + ';border:' + (s.newCatColor === color ? '2px solid var(--ink)' : '2px solid transparent') + ';cursor:pointer;padding:0;"></button>';
    }).join('');
    var iconSwatches = '<button data-action="pick-cat-icon" data-icon="" style="width:30px;height:30px;border-radius:50%;background:var(--surface-2);border:' + (s.newCatIcon === '' ? '2px solid var(--ink)' : '1px solid var(--border)') + ';cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--muted);padding:0;">Aa</button>' +
      ICON_LIST.map(function (key) {
        return '<button data-action="pick-cat-icon" data-icon="' + key + '" style="width:30px;height:30px;border-radius:50%;background:var(--surface-2);border:' + (s.newCatIcon === key ? '2px solid var(--ink)' : '1px solid var(--border)') + ';cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;color:var(--ink);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="' + ICONS[key] + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
      }).join('');
    return '<div style="display:flex;flex-direction:column;gap:12px;padding:14px;background:var(--surface);border-radius:10px;border:1px solid var(--border);margin-top:10px;">' +
      '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;"><input class="text-input" type="text" data-field="newCatName" value="' + esc(s.newCatName) + '" placeholder="Nome categoria" style="flex:1 1 160px;"><div style="display:flex;gap:7px;">' + swatches + '</div></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;"><span class="muted" style="font-size:12px;">Icona:</span>' + iconSwatches + '</div>' +
      '<div><button class="btn btn-dark" data-action="save-category">' + (s.editingCatId != null ? 'Salva modifiche' : 'Crea categoria') + '</button></div>' +
      '</div>';
  }

  function renderManageCategories(s) {
    var block = function (title, list, type) {
      var rows = list.map(function (c) {
        var meta = { color: c.color, initials: c.name.trim().slice(0, 2).toUpperCase(), iconD: c.icon && ICONS[c.icon] ? ICONS[c.icon] : null };
        if (String(s.mergingCatId) === String(c.id) && s.mergingCatType === type) {
          var otherOptions = list.filter(function (o) { return o.id !== c.id; }).map(function (o) {
            return '<option value="' + o.id + '"' + (String(s.mergeTargetId) === String(o.id) ? ' selected' : '') + '>' + esc(o.name) + '</option>';
          }).join('');
          return '<div class="list-row" style="flex-wrap:wrap;gap:8px;"><span style="font-size:13px;">Unisci "' + esc(c.name) + '" con:</span>' +
            '<select class="text-input" data-field="mergeTargetId" style="width:140px;"><option value="">Scegli...</option>' + otherOptions + '</select>' +
            '<button class="btn-link" data-action="confirm-merge-category">Conferma</button>' +
            '<button class="btn-link" data-action="cancel-merge-category">Annulla</button></div>';
        }
        var extra = '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;width:100%;padding-left:40px;">' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);cursor:pointer;" title="Per giroconti e compravendita di titoli: il movimento aggiorna il saldo ma non conta come ' + (type === 'income' ? 'entrata' : 'spesa') + '">' +
          '<input type="checkbox" data-action="toggle-cat-neutral" data-id="' + c.id + '" data-cattype="' + type + '" ' + (c.neutral ? 'checked' : '') + ' style="margin:0;">Fuori dai totali</label>' +
          (type === 'expense' ? '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);">Budget al mese <input class="text-input" type="text" inputmode="decimal" data-cat-budget="' + c.id + '" value="' + (Number(c.budget) > 0 ? esc(String(c.budget).replace('.', ',')) : '') + '" placeholder="€" style="width:90px;padding:6px 8px;font-size:14px;"></label>' : '') +
          '</div>';
        return '<div class="list-row" style="flex-wrap:wrap;gap:8px;"><div style="display:flex;align-items:center;gap:10px;">' + avatarHtml(meta, 30) + '<span style="font-size:13px;">' + esc(c.name) + '</span></div>' +
          '<div style="display:flex;gap:10px;"><button class="btn-link" data-action="start-merge-category" data-id="' + c.id + '" data-cattype="' + type + '">Unisci</button>' +
          '<button class="btn-link" data-action="edit-category" data-id="' + c.id + '" data-cattype="' + type + '">Modifica</button>' +
          '<button class="btn-link" data-action="remove-category" data-id="' + c.id + '" data-cattype="' + type + '" style="color:' + NEGATIVE + ';">Elimina</button></div>' + extra + '</div>';
      }).join('');
      return '<div><div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.03em;">' + title + '</div><div style="display:flex;flex-direction:column;gap:2px;">' + rows + '</div></div>';
    };
    return '<div style="display:flex;flex-direction:column;gap:14px;padding:14px;background:var(--surface);border-radius:10px;border:1px solid var(--border);margin-top:10px;">' +
      '<div class="muted" style="font-size:11px;">"Unisci" sposta tutti i movimenti di una categoria in un\'altra e la elimina: utile per accorpare doppioni (es. "Groceries" e "Spesa"). "Fuori dai totali" serve per giroconti e acquisto di titoli: aggiornano il saldo ma non sono spese. Il budget è un tetto mensile, lo vedi in "Mese per mese".</div>' +
      block('Categorie di uscita', s.expenseCategories, 'expense') + block('Categorie di entrata', s.incomeCategories, 'income') + '</div>';
  }

  function renderAccounts(s) {
    var cards = s.accounts.map(function (a) {
      var editing = s.editingAccountId === a.id;
      var balanceBlock = editing
        ? '<div style="display:flex;gap:8px;align-items:center;"><input class="text-input" type="text" inputmode="decimal" data-field="editAccountBalanceInput" value="' + esc(s.editAccountBalanceInput) + '" style="width:110px;"><button class="btn btn-primary" data-action="save-edit-balance" data-id="' + a.id + '" style="padding:7px 12px;">Salva</button></div>'
        : '<button data-action="start-edit-balance" data-id="' + a.id + '" style="background:none;border:none;cursor:pointer;padding:0;text-align:left;font-size:19px;font-weight:600;font-family:\'Fraunces\',serif;color:var(--ink);">' + fmt(a.balance) + '</button>';
      return '<div style="border:1px solid var(--border);border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;">' +
        '<div class="row" style="align-items:flex-start;"><div><div style="font-size:14px;font-weight:600;">' + esc(a.name) + '</div>' + (a.bank && a.bank !== a.name ? '<div class="muted" style="font-size:12px;margin-top:2px;">' + esc(a.bank) + '</div>' : '') + '</div>' +
        '<button class="icon-btn" data-action="remove-account" data-id="' + a.id + '" aria-label="Rimuovi conto">' + xIcon() + '</button></div>' +
        balanceBlock +
        '<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:' + (a.excludeFromTotal ? WARN : 'var(--muted)') + ';cursor:pointer;"><input type="checkbox" data-field="account-exclude-' + a.id + '" data-action="toggle-exclude" data-id="' + a.id + '" ' + (a.excludeFromTotal ? 'checked' : '') + ' style="margin:0;">' + (a.excludeFromTotal ? 'Escluso dal totale' : 'Incluso nel totale') + '</label>' +
        '</div>';
    }).join('');

    var addForm = s.showAddAccount ? (
      '<div class="form-box">' +
      '<input class="text-input" type="text" data-field="newAccountBank" value="' + esc(s.newAccountBank) + '" placeholder="Banca" style="flex:1 1 140px;">' +
      '<input class="text-input" type="text" data-field="newAccountName" value="' + esc(s.newAccountName) + '" placeholder="Nome conto (opzionale)" style="flex:1 1 160px;">' +
      '<input class="text-input" type="text" inputmode="decimal" data-field="newAccountBalance" value="' + esc(s.newAccountBalance) + '" placeholder="Saldo" style="width:120px;">' +
      '<button class="btn btn-dark" data-action="add-account">Salva</button></div>'
    ) : '';

    var transferOptionsFor = function (selectedId) {
      return s.accounts.map(function (a) { return '<option value="' + a.id + '"' + (String(selectedId) === String(a.id) ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('');
    };
    var transferForm = s.showTransfer ? (
      '<div class="form-box" style="align-items:center;">' +
      '<select class="text-input" data-field="transferFrom"><option value="">Da conto...</option>' + transferOptionsFor(s.transferFrom) + '</select>' +
      '<span class="muted">&rarr;</span>' +
      '<select class="text-input" data-field="transferTo"><option value="">A conto...</option>' + transferOptionsFor(s.transferTo) + '</select>' +
      '<input class="text-input" type="text" inputmode="decimal" data-field="transferAmount" value="' + esc(s.transferAmount) + '" placeholder="Importo" style="width:110px;">' +
      '<button class="btn btn-dark" data-action="do-transfer">Trasferisci</button></div>'
    ) : '';

    return '<div class="card"><div class="section-title">Conti correnti</div>' +
      '<div class="grid-fit">' + (cards || '<div class="muted" style="font-size:13px;">Nessun conto ancora. Aggiungine uno.</div>') + '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;"><button class="btn btn-primary" data-action="toggle" data-field="showAddAccount">+ Aggiungi conto</button><button class="btn btn-ghost" data-action="toggle" data-field="showTransfer">Giroconto</button></div>' +
      addForm + transferForm + '</div>';
  }

  function renderDebts(s) {
    var rows = s.debts.map(function (d) {
      var color = d.kind === 'devo' ? NEGATIVE : ACCENT;
      return '<div class="list-row" style="flex-wrap:wrap;gap:6px;"><div><div style="font-size:14px;font-weight:500;">' + (d.kind === 'devo' ? 'Devo a ' : 'Mi deve ') + esc(d.person) + '</div><div class="muted" style="font-size:12px;">Scadenza: ' + (d.due ? fmtDate(d.due) : '—') + '</div>' +
        '<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:' + (d.excludeFromTotal ? WARN : 'var(--muted)') + ';cursor:pointer;margin-top:4px;"><input type="checkbox" data-action="toggle-exclude-debt" data-id="' + d.id + '" ' + (d.excludeFromTotal ? 'checked' : '') + ' style="margin:0;">' + (d.excludeFromTotal ? 'Escluso dal totale' : 'Incluso nel totale') + '</label></div>' +
        '<div style="display:flex;align-items:center;gap:12px;"><div style="font-size:14px;font-weight:600;color:' + color + ';">' + fmt(d.amount) + '</div><button class="icon-btn" data-action="remove-debt" data-id="' + d.id + '" aria-label="Rimuovi voce">' + xIcon() + '</button></div></div>';
    }).join('');
    var addForm = s.showAddDebt ? (
      '<div class="form-box">' +
      '<input class="text-input" type="text" data-field="newDebtPerson" value="' + esc(s.newDebtPerson) + '" placeholder="Persona" style="flex:1 1 140px;">' +
      '<input class="text-input" type="text" inputmode="decimal" data-field="newDebtAmount" value="' + esc(s.newDebtAmount) + '" placeholder="Importo" style="width:110px;">' +
      '<select class="text-input" data-field="newDebtKind"><option value="devo"' + (s.newDebtKind === 'devo' ? ' selected' : '') + '>Devo</option><option value="mi deve"' + (s.newDebtKind === 'mi deve' ? ' selected' : '') + '>Mi deve</option></select>' +
      '<input class="text-input" type="date" data-field="newDebtDue" value="' + esc(s.newDebtDue) + '">' +
      '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);cursor:pointer;"><input type="checkbox" data-field="newDebtExclude" data-action="toggle" ' + (s.newDebtExclude ? 'checked' : '') + ' style="margin:0;">Escludi dal totale</label>' +
      '<button class="btn btn-dark" data-action="add-debt">Salva</button></div>'
    ) : '';
    return '<div class="card"><div class="section-title">Debiti e crediti</div><div style="display:flex;flex-direction:column;gap:2px;">' + (rows || '<div class="muted" style="font-size:13px;">Nessun debito o credito registrato.</div>') + '</div>' +
      '<div><button class="btn btn-primary" data-action="toggle" data-field="showAddDebt">+ Aggiungi debito o credito</button>' + addForm + '</div></div>';
  }

  function renderUpcoming(s, urgentDays, startOfDay) {
    var accountOptionsFor = function (selectedId) {
      return '<option value="">Nessun conto</option>' + s.accounts.map(function (a) { return '<option value="' + a.id + '"' + (String(selectedId) === String(a.id) ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('');
    };
    var recurrenceOptionsFor = function (selectedVal) {
      return [
        ['none', 'Non ricorrente'], ['daily', 'Ogni giorno'], ['weekly', 'Ogni settimana'], ['monthly', 'Ogni mese'],
        ['quarterly', 'Ogni 3 mesi'], ['semiannual', 'Ogni 6 mesi'], ['yearly', 'Ogni anno'], ['custom', 'Personalizzato...']
      ].map(function (pair) { return '<option value="' + pair[0] + '"' + (selectedVal === pair[0] ? ' selected' : '') + '>' + pair[1] + '</option>'; }).join('');
    };
    var categoryOptionsFor = function (selectedName) {
      return '<option value="">Nessuna categoria</option>' + s.expenseCategories.map(function (c) { return '<option value="' + esc(c.name) + '"' + (selectedName === c.name ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');
    };

    var sorted = urgentDays.slice().sort(function (a, b) { return a.eff - b.eff; });
    var rows = sorted.map(function (x) {
      var u = x.u, days = x.days;
      if (s.editingUpcomingId === u.id) {
        var editCustomRow = s.editPaymentRecurrence === 'custom' ? (
          '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;"><span class="muted" style="font-size:13px;">Ogni</span>' +
          '<input class="text-input" type="text" inputmode="decimal" data-field="editPaymentCustomValue" value="' + esc(s.editPaymentCustomValue) + '" style="width:70px;">' +
          '<select class="text-input" data-field="editPaymentCustomUnit"><option value="days"' + (s.editPaymentCustomUnit === 'days' ? ' selected' : '') + '>Giorni</option><option value="weeks"' + (s.editPaymentCustomUnit === 'weeks' ? ' selected' : '') + '>Settimane</option><option value="months"' + (s.editPaymentCustomUnit === 'months' ? ' selected' : '') + '>Mesi</option></select></div>'
        ) : '';
        var editEndDateRow = s.editPaymentRecurrence !== 'none' ? (
          '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;"><span class="muted" style="font-size:13px;">Fino al (opzionale)</span><input class="text-input" type="date" data-field="editPaymentEndDate" value="' + esc(s.editPaymentEndDate) + '"></div>'
        ) : '';
        return '<div class="list-row" style="flex-wrap:wrap;flex-direction:column;align-items:stretch;gap:8px;">' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<input class="text-input" type="text" data-field="editPaymentLabel" value="' + esc(s.editPaymentLabel) + '" placeholder="Descrizione" style="flex:1 1 160px;">' +
          '<input class="text-input" type="text" inputmode="decimal" data-field="editPaymentAmount" value="' + esc(s.editPaymentAmount) + '" placeholder="Importo" style="width:100px;">' +
          '<input class="text-input" type="date" data-field="editPaymentDate" value="' + esc(s.editPaymentDate) + '" style="width:140px;">' +
          '<input class="text-input" type="time" data-field="editPaymentTime" value="' + esc(s.editPaymentTime) + '" style="width:100px;">' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<select class="text-input" data-field="editPaymentAccountId" style="width:fit-content;">' + accountOptionsFor(s.editPaymentAccountId) + '</select>' +
          '<select class="text-input" data-field="editPaymentCategory" style="width:fit-content;">' + categoryOptionsFor(s.editPaymentCategory) + '</select>' +
          '<select class="text-input" data-field="editPaymentRecurrence" style="width:fit-content;">' + recurrenceOptionsFor(s.editPaymentRecurrence) + '</select>' +
          '</div>' +
          editCustomRow + editEndDateRow +
          '<div style="display:flex;gap:8px;"><button class="btn btn-primary" data-action="save-edit-upcoming" data-id="' + u.id + '">Salva</button><button class="btn btn-ghost" data-action="cancel-edit-upcoming">Annulla</button></div>' +
          '</div>';
      }
      var isUrgent = days <= 7;
      var meta = u.category ? catMeta(s.expenseCategories, u.category) : null;
      var acc = u.accountId ? s.accounts.find(function (a) { return a.id === u.accountId; }) : null;
      var recurLabel = RECUR_LABELS[u.recurrence] ? (u.recurrence === 'custom' ? 'Ogni ' + (u.customValue || 1) + ' ' + (CUSTOM_UNIT_LABELS[u.customUnit] || 'mesi') : RECUR_LABELS[u.recurrence]) : '';
      var subtitleParts = [fmtDate(x.eff)];
      if (u.time) subtitleParts.push(u.time);
      if (acc) subtitleParts.push(esc(acc.name));
      if (recurLabel) subtitleParts.push('↻ ' + recurLabel);
      if (u.endDate) subtitleParts.push('fino al ' + fmtDate(u.endDate));
      return '<div class="list-row"><button data-action="start-edit-upcoming" data-id="' + u.id + '" style="background:none;border:none;cursor:pointer;padding:0;text-align:left;display:flex;align-items:center;gap:10px;">' +
        '<span class="badge" style="background:' + (isUrgent ? 'rgba(var(--negative-rgb),0.1)' : 'rgba(var(--accent-rgb),0.1)') + ';color:' + (isUrgent ? NEGATIVE : ACCENT) + ';">' + (days < 0 ? 'Scaduto' : (days === 0 ? 'Oggi' : days + ' g')) + '</span>' +
        (meta ? avatarHtml(meta, 26) : '') +
        '<div><div style="font-size:14px;font-weight:500;color:var(--ink);">' + esc(u.label) + '</div><div class="muted" style="font-size:12px;">' + subtitleParts.join(' &middot; ') + '</div></div></button>' +
        '<div style="display:flex;align-items:center;gap:12px;"><div style="font-size:14px;font-weight:600;">' + fmt(u.amount) + '</div><button class="icon-btn" data-action="remove-upcoming" data-id="' + u.id + '" aria-label="Rimuovi pagamento">' + xIcon() + '</button></div></div>';
    }).join('');

    var catGrid = s.expenseCategories.map(function (c) {
      var selected = s.newPaymentCategory === c.name;
      var meta = { color: c.color, initials: c.name.trim().slice(0, 2).toUpperCase(), iconD: c.icon && ICONS[c.icon] ? ICONS[c.icon] : null };
      return '<button data-action="pick-payment-category" data-cat="' + esc(c.name) + '" style="background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;padding:2px;">' +
        '<div style="width:38px;height:38px;border-radius:50%;background:' + meta.color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:600;box-shadow:' + (selected ? '0 0 0 3px rgba(var(--ink-rgb),0.35)' : 'none') + ';">' +
        (meta.iconD ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="' + meta.iconD + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' : esc(meta.initials)) +
        '</div><span style="font-size:10px;color:' + (selected ? 'var(--ink)' : 'var(--muted)') + ';text-align:center;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(c.name) + '</span></button>';
    }).join('');

    var customRow = s.newPaymentRecurrence === 'custom' ? (
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;"><span class="muted" style="font-size:13px;">Ogni</span>' +
      '<input class="text-input" type="text" inputmode="decimal" data-field="newPaymentCustomValue" value="' + esc(s.newPaymentCustomValue) + '" style="width:70px;">' +
      '<select class="text-input" data-field="newPaymentCustomUnit"><option value="days"' + (s.newPaymentCustomUnit === 'days' ? ' selected' : '') + '>Giorni</option><option value="weeks"' + (s.newPaymentCustomUnit === 'weeks' ? ' selected' : '') + '>Settimane</option><option value="months"' + (s.newPaymentCustomUnit === 'months' ? ' selected' : '') + '>Mesi</option></select></div>'
    ) : '';

    var endDateRow = s.newPaymentRecurrence !== 'none' ? (
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;"><span class="muted" style="font-size:13px;">Fino al (opzionale)</span><input class="text-input" type="date" data-field="newPaymentEndDate" value="' + esc(s.newPaymentEndDate) + '"></div>'
    ) : '';

    var addForm = s.showAddPayment ? (
      '<div class="form-box" style="flex-direction:column;align-items:stretch;">' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;">' +
      '<input class="text-input" type="text" data-field="newPaymentLabel" value="' + esc(s.newPaymentLabel) + '" placeholder="Descrizione" style="flex:1 1 160px;">' +
      '<input class="text-input" type="text" inputmode="decimal" data-field="newPaymentAmount" value="' + esc(s.newPaymentAmount) + '" placeholder="Importo" style="width:110px;">' +
      '<input class="text-input" type="date" data-field="newPaymentDate" value="' + esc(s.newPaymentDate) + '">' +
      '<input class="text-input" type="time" data-field="newPaymentTime" value="' + esc(s.newPaymentTime) + '" style="width:110px;">' +
      '<select class="text-input" data-field="newPaymentAccountId" style="width:fit-content;">' + accountOptionsFor(s.newPaymentAccountId) + '</select>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;">' +
      '<select class="text-input" data-field="newPaymentRecurrence">' + recurrenceOptionsFor(s.newPaymentRecurrence) + '</select>' +
      '</div>' +
      customRow + endDateRow +
      '<div style="margin-top:10px;"><div class="muted" style="font-size:12px;margin-bottom:8px;">' + (s.newPaymentCategory ? 'Categoria: ' + esc(s.newPaymentCategory) : 'Categoria (opzionale)') + '</div><div style="display:flex;flex-wrap:wrap;gap:10px;">' + catGrid + '</div></div>' +
      '<div style="margin-top:10px;"><button class="btn btn-dark" data-action="add-payment">Salva</button></div></div>'
    ) : '';

    return '<div class="card"><div class="section-title">Pagamenti futuri</div><div class="muted" style="font-size:12px;">Tocca un pagamento per modificarlo.</div><div style="display:flex;flex-direction:column;gap:2px;">' + (rows || '<div class="muted" style="font-size:13px;">Nessun pagamento in programma.</div>') + '</div>' +
      '<div><button class="btn btn-primary" data-action="toggle" data-field="showAddPayment">+ Aggiungi pagamento</button>' + addForm + '</div></div>';
  }

  function renderPortfolios(s, totalPortfolio) {
    var canRemove = s.portfolios.length > 1;
    var sections = s.portfolios.map(function (p) {
      var items = s.portfolio.filter(function (h) { return h.portfolioId === p.id; });
      var subtotal = items.reduce(function (sum, h) { return sum + Number(h.value || 0); }, 0);
      var holdings = items.map(function (h) {
        var changePct = Number(h.changePct || 0);
        var changeFmt = (changePct >= 0 ? '+' : '') + changePct.toFixed(1) + '%';
        if (s.editingHoldingId === h.id) {
          return '<div style="border:1px solid var(--border);border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:8px;">' +
            '<input class="text-input" type="text" data-field="editHoldingName" value="' + esc(s.editHoldingName) + '" placeholder="Nome titolo">' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<input class="text-input" type="text" inputmode="decimal" data-field="editHoldingValue" value="' + esc(s.editHoldingValue) + '" placeholder="Valore" style="width:100px;">' +
            '<input class="text-input" type="text" inputmode="decimal" data-field="editHoldingChange" value="' + esc(s.editHoldingChange) + '" placeholder="Variazione %" style="width:100px;">' +
            '<input class="text-input" type="text" inputmode="decimal" data-field="editHoldingInvested" value="' + esc(s.editHoldingInvested) + '" placeholder="Investito €" title="Quanto hai pagato in totale (prezzo di carico × quantità)" style="width:110px;">' +
            '</div>' +
            '<div class="muted" style="font-size:11px;margin-top:2px;">Per l\'aggiornamento prezzi automatico (opzionale):</div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<select class="text-input" data-field="editHoldingAssetType" style="width:110px;"><option value="stock"' + (s.editHoldingAssetType === 'stock' ? ' selected' : '') + '>Azione/ETF</option><option value="crypto"' + (s.editHoldingAssetType === 'crypto' ? ' selected' : '') + '>Crypto</option></select>' +
            '<input class="text-input" type="text" data-field="editHoldingTicker" value="' + esc(s.editHoldingTicker) + '" placeholder="Ticker (es. VWCE.DEX, BTC)" style="width:150px;">' +
            '<input class="text-input" type="text" inputmode="decimal" data-field="editHoldingQty" value="' + esc(s.editHoldingQty) + '" placeholder="Quantità" style="width:100px;">' +
            '</div>' +
            '<div style="display:flex;gap:8px;"><button class="btn btn-primary" data-action="save-edit-holding" data-id="' + h.id + '">Salva</button><button class="btn btn-ghost" data-action="cancel-edit-holding">Annulla</button></div>' +
            '</div>';
        }
        var plHtml = '';
        if (h.invested != null && Number(h.invested) > 0) {
          var pl = Number(h.value || 0) - Number(h.invested);
          var plPct = pl / Number(h.invested) * 100;
          plHtml = '<div style="font-size:12px;margin-top:6px;color:var(--muted);">Investito ' + fmt(h.invested) + ' &middot; <span style="font-weight:600;color:' + (pl >= 0 ? ACCENT : NEGATIVE) + ';">' + (pl >= 0 ? '+' : '−') + fmt(Math.abs(pl)) + ' (' + (pl >= 0 ? '+' : '') + plPct.toFixed(1).replace('.', ',') + '%)</span></div>';
        }
        return '<div style="border:1px solid var(--border);border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">' +
          '<button data-action="start-edit-holding" data-id="' + h.id + '" style="background:none;border:none;cursor:pointer;padding:0;text-align:left;">' +
          '<div style="font-size:14px;font-weight:600;color:var(--ink);">' + esc(h.name) + (h.ticker ? ' <span class="muted" style="font-weight:400;">' + esc(h.ticker) + '</span>' : '') + '</div><div style="font-size:17px;font-weight:600;margin-top:6px;font-family:\'Fraunces\',serif;color:var(--ink);">' + fmt(h.value) + '</div><div style="font-size:13px;font-weight:600;margin-top:2px;color:' + (changePct >= 0 ? ACCENT : NEGATIVE) + ';">' + changeFmt + ' <span class="muted" style="font-weight:400;font-size:11px;">' + (h.priceUpdatedAt ? 'oggi &middot; prezzo del ' + fmtDate(h.priceUpdatedAt) : 'variazione') + '</span></div>' +
          plHtml +
          '</button>' +
          '<button class="icon-btn" data-action="remove-holding" data-id="' + h.id + '" aria-label="Rimuovi posizione">' + xIcon() + '</button></div>';
      }).join('');
      return '<div style="display:flex;flex-direction:column;gap:12px;padding-bottom:16px;border-bottom:1px solid var(--divider);">' +
        '<div class="row"><div style="font-size:14px;font-weight:600;">' + esc(p.name) + ' <span style="font-weight:400;color:var(--muted);">&middot; ' + fmt(subtotal) + '</span></div>' +
        (canRemove ? '<button class="icon-btn" data-action="remove-portfolio" data-id="' + p.id + '" aria-label="Rimuovi portafoglio">' + xIcon() + '</button>' : '') + '</div>' +
        '<div class="grid-fit">' + (holdings || '<div class="muted" style="font-size:13px;">Nessuna posizione.</div>') + '</div></div>';
    }).join('');

    var portfolioOptions = s.portfolios.map(function (p) { return '<option value="' + p.id + '"' + (String(s.newHoldingPortfolioId) === String(p.id) ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('');

    var addHoldingForm = s.showAddHolding ? (
      '<div class="form-box" style="flex-direction:column;align-items:stretch;">' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;">' +
      '<select class="text-input" data-field="newHoldingPortfolioId">' + portfolioOptions + '</select>' +
      '<input class="text-input" type="text" data-field="newHoldingName" value="' + esc(s.newHoldingName) + '" placeholder="Nome titolo" style="flex:1 1 160px;">' +
      '<input class="text-input" type="text" inputmode="decimal" data-field="newHoldingValue" value="' + esc(s.newHoldingValue) + '" placeholder="Valore attuale" style="width:120px;">' +
      '<input class="text-input" type="text" inputmode="decimal" data-field="newHoldingChange" value="' + esc(s.newHoldingChange) + '" placeholder="Variazione %" style="width:110px;">' +
      '<input class="text-input" type="text" inputmode="decimal" data-field="newHoldingInvested" value="' + esc(s.newHoldingInvested) + '" placeholder="Investito € (facoltativo)" title="Quanto hai pagato in totale: serve per calcolare guadagno o perdita" style="width:180px;">' +
      '</div>' +
      '<div class="muted" style="font-size:11px;margin-top:8px;">Per l\'aggiornamento prezzi automatico (opzionale):</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:4px;">' +
      '<select class="text-input" data-field="newHoldingAssetType" style="width:110px;"><option value="stock"' + (s.newHoldingAssetType === 'stock' ? ' selected' : '') + '>Azione/ETF</option><option value="crypto"' + (s.newHoldingAssetType === 'crypto' ? ' selected' : '') + '>Crypto</option></select>' +
      '<input class="text-input" type="text" data-field="newHoldingTicker" value="' + esc(s.newHoldingTicker) + '" placeholder="Ticker (es. VWCE.DEX, BTC)" style="width:160px;">' +
      '<input class="text-input" type="text" inputmode="decimal" data-field="newHoldingQty" value="' + esc(s.newHoldingQty) + '" placeholder="Quantità" style="width:100px;">' +
      '</div>' +
      '<div style="margin-top:10px;"><button class="btn btn-dark" data-action="add-holding">Salva</button></div></div>'
    ) : '';
    var addPortfolioForm = s.showAddPortfolio ? (
      '<div class="form-box">' +
      '<input class="text-input" type="text" data-field="newPortfolioName" value="' + esc(s.newPortfolioName) + '" placeholder="Nome portafoglio (es. Binance, Directa...)" style="flex:1 1 200px;">' +
      '<button class="btn btn-dark" data-action="add-portfolio">Crea</button></div>'
    ) : '';

    var priceSettingsBox = s.showPriceSettings ? (
      '<div class="form-box" style="flex-direction:column;align-items:stretch;">' +
      '<div class="muted" style="font-size:12px;line-height:1.5;"><strong>Crypto</strong> (es. BTC, ETH): gratis con CoinGecko, nessuna chiave.<br>' +
      '<strong>ETF e azioni europee</strong> (es. <code>VWCE.DEX</code>, <code>MBG.DEX</code> per Xetra, in euro): chiave gratuita di <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener">Alpha Vantage</a> (max 25 richieste al giorno). Metti il suffisso di borsa nel ticker.<br>' +
      '<strong>Azioni/ETF USA</strong> (es. AAPL): chiave gratuita di <a href="https://twelvedata.com/pricing" target="_blank" rel="noopener">Twelve Data</a>; i prezzi in dollari vengono convertiti in euro. Il piano gratuito di Twelve Data non copre le borse europee.<br>' +
      'Il valore diventa prezzo × quantità: imposta ticker e quantità su ogni posizione. Le chiavi restano sul telefono e non finiscono nel backup.</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;"><input class="text-input" type="password" data-field="avKeyInput" value="' + esc(s.avKeyInput) + '" placeholder="Chiave Alpha Vantage (ETF europei)" style="flex:1 1 200px;"></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;"><input class="text-input" type="password" data-field="priceKeyInput" value="' + esc(s.priceKeyInput) + '" placeholder="Chiave Twelve Data (USA)" style="flex:1 1 200px;"><button class="btn btn-dark" data-action="save-price-key">Salva chiavi</button></div>' +
      '</div>'
    ) : '';

    var refreshRow = '<div class="row" style="flex-wrap:wrap;">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">' +
      '<button class="btn btn-ghost" data-action="refresh-prices"' + (s.priceRefreshBusy ? ' disabled' : '') + '>' + (s.priceRefreshBusy ? 'Aggiorno...' : 'Aggiorna prezzi') + '</button>' +
      '<button class="btn-link" data-action="toggle-price-settings">Impostazioni prezzi</button>' +
      '</div></div>' +
      (s.priceRefreshStatus ? '<div class="muted" style="font-size:12px;">' + esc(s.priceRefreshStatus) + '</div>' : '') +
      priceSettingsBox;

    var withCost = s.portfolio.filter(function (h) { return h.invested != null && Number(h.invested) > 0; });
    var plSummary = '';
    if (withCost.length) {
      var inv = withCost.reduce(function (sum, h) { return sum + Number(h.invested); }, 0);
      var val = withCost.reduce(function (sum, h) { return sum + Number(h.value || 0); }, 0);
      var plTot = val - inv;
      plSummary = '<div style="font-size:13px;color:var(--muted);margin-top:-8px;">Investito ' + fmt(inv) + ' &middot; ' +
        '<span style="font-weight:600;color:' + (plTot >= 0 ? ACCENT : NEGATIVE) + ';">' + (plTot >= 0 ? 'Guadagno ' : 'Perdita ') + fmt(Math.abs(plTot)) + ' (' + (plTot >= 0 ? '+' : '−') + Math.abs(plTot / inv * 100).toFixed(1).replace('.', ',') + '%)</span>' +
        (withCost.length < s.portfolio.length ? ' <span style="font-size:11px;">su ' + withCost.length + ' posizioni su ' + s.portfolio.length + '</span>' : '') + '</div>';
    }
    return '<div class="card"><div class="row"><div class="section-title">Portafogli</div><div style="font-size:13px;color:var(--muted);">Totale: <span style="font-weight:600;color:var(--ink);">' + fmt(totalPortfolio) + '</span></div></div>' +
      plSummary +
      refreshRow +
      sections +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;"><button class="btn btn-primary" data-action="toggle" data-field="showAddHolding">+ Aggiungi posizione</button><button class="btn btn-ghost" data-action="toggle" data-field="showAddPortfolio">+ Nuovo portafoglio</button><button class="btn btn-ghost" data-action="toggle" data-field="showImportHoldings">Importa posizioni</button></div>' +
      addHoldingForm + addPortfolioForm + renderImportHoldingsPanel(s) + '</div>';
  }

  function renderImportHoldingsPanel(s) {
    if (!s.showImportHoldings) return '';
    var html = '<div class="form-box" style="flex-direction:column;align-items:stretch;margin-top:10px;">' +
      '<div class="row" style="align-items:center;"><div style="font-size:14px;font-weight:600;">Importa posizioni da CSV</div><button class="btn-link" data-action="toggle" data-field="showImportHoldings">Chiudi</button></div>' +
      '<div class="muted" style="font-size:12px;">Colonne: Portafoglio, Nome, Ticker, Tipo (stock/crypto), Quantita, Valore, Variazione, Investito (facoltativa: quanto hai pagato in totale). Le posizioni si aggiungono a quelle esistenti, non le sostituiscono.</div>' +
      '<input type="file" accept=".csv" data-action="import-holdings-file" style="margin-top:4px;">';
    if (s.importHoldingsBusy) html += '<div class="muted" style="font-size:13px;">Analisi del file in corso...</div>';
    if (s.importHoldingsError) html += '<div style="color:' + NEGATIVE + ';font-size:13px;">' + esc(s.importHoldingsError) + '</div>';
    if (s.importHoldingsSuccess) html += '<div style="color:' + ACCENT + ';font-size:13px;font-weight:600;">' + esc(s.importHoldingsSuccess) + '</div>';
    html += '</div>';

    if (!s.importHoldingsRows.length) return html;

    var rows = s.importHoldingsRows.map(function (r, idx) {
      return '<div class="list-row" style="flex-wrap:wrap;">' +
        '<input type="checkbox" data-action="toggle-import-holding-row" data-idx="' + idx + '" ' + (r.include ? 'checked' : '') + ' style="margin:0;">' +
        '<input class="text-input" type="text" data-import-holding-field="portfolioName" data-idx="' + idx + '" value="' + esc(r.portfolioName) + '" placeholder="Portafoglio" style="width:150px;">' +
        '<input class="text-input" type="text" data-import-holding-field="name" data-idx="' + idx + '" value="' + esc(r.name) + '" placeholder="Nome" style="flex:1 1 140px;">' +
        '<input class="text-input" type="text" data-import-holding-field="ticker" data-idx="' + idx + '" value="' + esc(r.ticker) + '" placeholder="Ticker" style="width:80px;">' +
        '<select class="text-input" data-import-holding-field="assetType" data-idx="' + idx + '" style="width:100px;"><option value="stock"' + (r.assetType === 'stock' ? ' selected' : '') + '>Azione/ETF</option><option value="crypto"' + (r.assetType === 'crypto' ? ' selected' : '') + '>Crypto</option></select>' +
        '<input class="text-input" type="text" inputmode="decimal" data-import-holding-field="qty" data-idx="' + idx + '" value="' + esc(r.qty) + '" placeholder="Quantità" style="width:90px;">' +
        '<input class="text-input" type="text" inputmode="decimal" data-import-holding-field="value" data-idx="' + idx + '" value="' + esc(r.value) + '" placeholder="Valore" style="width:90px;">' +
        '<input class="text-input" type="text" inputmode="decimal" data-import-holding-field="change" data-idx="' + idx + '" value="' + esc(r.change) + '" placeholder="Var. %" style="width:80px;">' +
        '<input class="text-input" type="text" inputmode="decimal" data-import-holding-field="invested" data-idx="' + idx + '" value="' + esc(r.invested || '') + '" placeholder="Investito" style="width:90px;">' +
        '<button class="icon-btn" data-action="remove-import-holding-row" data-idx="' + idx + '" aria-label="Rimuovi riga">' + xIcon() + '</button>' +
        '</div>';
    }).join('');
    var includedCount = s.importHoldingsRows.filter(function (r) { return r.include; }).length;

    return html + '<div class="form-box" style="flex-direction:column;align-items:stretch;margin-top:10px;">' +
      '<div style="display:flex;flex-direction:column;gap:2px;max-height:360px;overflow:auto;">' + rows + '</div>' +
      '<div><button class="btn btn-primary" data-action="confirm-import-holdings">Importa ' + includedCount + ' posizioni</button></div>' +
      '</div>';
  }


  // ---------- focus-preserving render + event delegation ----------
  function renderPreserveFocus() {
    var active = document.activeElement;
    var field = active && active.dataset ? active.dataset.field : null;
    var selStart = active && typeof active.selectionStart === 'number' ? active.selectionStart : null;
    var selEnd = active && typeof active.selectionEnd === 'number' ? active.selectionEnd : null;
    render();
    if (field) {
      var el = document.querySelector('[data-field="' + field + '"]');
      if (el) {
        el.focus();
        if (selStart != null && el.setSelectionRange) {
          try { el.setSelectionRange(selStart, selEnd); } catch (e) {}
        }
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    render();

    // In modalità "Auto" segue live il tema del telefono, anche senza ricaricare la pagina.
    try {
      var darkQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
      if (darkQuery && darkQuery.addEventListener) {
        darkQuery.addEventListener('change', function () {
          if (state.themePref === 'auto') applyTheme('auto');
        });
      }
    } catch (e) {}

    document.addEventListener('click', function (e) {
      if (e.target.classList && e.target.classList.contains('modal-backdrop')) { App.closeSettings(); return; }
      var el = e.target.closest('[data-action]');
      if (!el) return;
      var action = el.dataset.action;
      var id = el.dataset.id;
      var numId = id !== undefined ? (isNaN(Number(id)) ? id : Number(id)) : null;
      switch (action) {
        case 'toggle': App.toggle(el.dataset.field); break;
        case 'pick-period': App.pickPeriod(el.dataset.key); break;
        case 'pick-month': App.pickMonth(el.dataset.key); break;
        case 'toggle-budgets': App.toggleBudgets(); break;
        case 'add-history': App.addHistory(); break;
        case 'remove-history': App.removeHistory(el.dataset.key); break;
        case 'filter-tx-category': App.filterTxCategory(el.dataset.cat); break;
        case 'clear-tx-category-filter': App.clearTxCategoryFilter(); break;
        case 'toggle-edit-goal': App.toggleEditGoal(); break;
        case 'save-goal': App.saveGoal(); break;
        case 'add-account': App.addAccount(); break;
        case 'remove-account': App.removeAccount(numId); break;
        case 'toggle-exclude': App.toggleExcludeAccount(numId); break;
        case 'toggle-exclude-debt': App.toggleExcludeDebt(numId); break;
        case 'start-edit-balance': App.startEditBalance(numId); break;
        case 'save-edit-balance': App.saveEditBalance(numId); break;
        case 'do-transfer': App.doTransfer(); break;
        case 'add-debt': App.addDebt(); break;
        case 'remove-debt': App.removeDebt(numId); break;
        case 'add-payment': App.addPayment(); break;
        case 'remove-upcoming': App.removeUpcoming(numId); break;
        case 'start-edit-upcoming': App.startEditUpcoming(numId); break;
        case 'cancel-edit-upcoming': App.cancelEditUpcoming(); break;
        case 'save-edit-upcoming': App.saveEditUpcoming(numId); break;
        case 'pick-payment-category': App.pickPaymentCategory(el.dataset.cat); break;
        case 'add-holding': App.addHolding(); break;
        case 'remove-holding': App.removeHolding(numId); break;
        case 'start-edit-holding': App.startEditHolding(numId); break;
        case 'save-edit-holding': App.saveEditHolding(numId); break;
        case 'cancel-edit-holding': App.cancelEditHolding(); break;
        case 'add-portfolio': App.addPortfolio(); break;
        case 'remove-portfolio': App.removePortfolio(numId); break;
        case 'pick-tx-category': App.pickTxCategory(el.dataset.cat); break;
        case 'add-tx': App.addTx(); break;
        case 'remove-tx': App.removeTx(numId); break;
        case 'start-edit-tx': App.startEditTx(numId); break;
        case 'cancel-edit-tx': App.cancelEditTx(); break;
        case 'save-edit-tx': App.saveEditTx(numId); break;
        case 'toggle-create-cat': App.toggleCreateCat(); break;
        case 'toggle-manage-cats': App.toggleManageCategories(); break;
        case 'pick-cat-color': App.pickCatColor(el.dataset.color); break;
        case 'pick-cat-icon': App.pickCatIcon(el.dataset.icon); break;
        case 'save-category': App.saveCategory(); break;
        case 'edit-category': App.startEditCategory(el.dataset.id, el.dataset.cattype); break;
        case 'start-merge-category': App.startMergeCategory(el.dataset.id, el.dataset.cattype); break;
        case 'cancel-merge-category': App.cancelMergeCategory(); break;
        case 'confirm-merge-category': App.confirmMergeCategory(); break;
        case 'remove-category': App.deleteCategory(el.dataset.id, el.dataset.cattype); break;
        case 'toggle-cat-neutral': App.toggleCategoryNeutral(el.dataset.id, el.dataset.cattype); break;
        case 'export-csv': App.exportCSV(); break;
        case 'print-page': App.printPage(); break;
        case 'export-backup': App.exportBackup(); break;
        case 'reload-app': window.location.reload(); break;
        case 'confirm-restore-backup': App.confirmRestoreBackup(); break;
        case 'cancel-restore-backup': App.cancelRestoreBackup(); break;
        case 'toggle-reset-confirm': App.toggleResetConfirm(); break;
        case 'close-settings': App.closeSettings(); break;
        case 'pick-theme': App.pickTheme(el.dataset.theme); break;
        case 'refresh-prices': App.refreshPrices(); break;
        case 'toggle-price-settings': App.togglePriceSettings(); break;
        case 'save-price-key': App.savePriceKey(); break;
        case 'toggle-import-holding-row': App.toggleImportHoldingRow(Number(el.dataset.idx)); break;
        case 'remove-import-holding-row': App.removeImportHoldingRow(Number(el.dataset.idx)); break;
        case 'confirm-import-holdings': App.confirmImportHoldings(); break;
        case 'confirm-reset': App.confirmReset(); break;
        case 'toggle-import-row': App.toggleImportRow(Number(el.dataset.idx)); break;
        case 'remove-import-row': App.removeImportRow(Number(el.dataset.idx)); break;
        case 'confirm-import': App.confirmImport(); break;
      }
    });

    document.addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset && t.dataset.importField && t.tagName !== 'SELECT') {
        App.setImportField(Number(t.dataset.idx), t.dataset.importField, t.value);
        return;
      }
      if (t.dataset && t.dataset.field && t.type !== 'checkbox') App.setField(t.dataset.field, t.value);
    });
    document.addEventListener('change', function (e) {
      var t = e.target;
      if (t.type === 'checkbox' && t.dataset) {
        if (t.dataset.action === 'toggle-exclude') {
          App.toggleExcludeAccount(isNaN(Number(t.dataset.id)) ? t.dataset.id : Number(t.dataset.id));
        } else if (t.dataset.action === 'toggle-import-row') {
          App.toggleImportRow(Number(t.dataset.idx));
        }
        return;
      }
      if (t.type === 'file' && t.dataset && t.dataset.action === 'import-file') {
        if (t.files && t.files.length) App.handleImportFile(t.files);
        return;
      }
      if (t.type === 'file' && t.dataset && t.dataset.action === 'import-backup-file') {
        if (t.files && t.files[0]) App.handleBackupFile(t.files[0]);
        return;
      }
      if (t.type === 'file' && t.dataset && t.dataset.action === 'import-holdings-file') {
        if (t.files && t.files[0]) App.handleHoldingsImportFile(t.files[0]);
        return;
      }
      if (t.dataset && t.dataset.catBudget) {
        App.setCategoryBudget(t.dataset.catBudget, t.value);
        return;
      }
      if (t.dataset && t.dataset.importHoldingField) {
        App.setImportHoldingField(Number(t.dataset.idx), t.dataset.importHoldingField, t.value);
        return;
      }
      if (t.dataset && t.dataset.importField) {
        App.setImportField(Number(t.dataset.idx), t.dataset.importField, t.value);
        return;
      }
      if (t.tagName === 'SELECT' && t.dataset && t.dataset.field) {
        App.setField(t.dataset.field, t.value);
      }
    });
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      var hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        reg.update().catch(function () {});
      }).catch(function () {});
      // Una nuova versione ha preso il controllo: proponi di ricaricare (solo se c'era già una versione attiva).
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (hadController && !state.updateReady) { state.updateReady = true; renderPreserveFocus(); }
      });
    });
  }
})();
