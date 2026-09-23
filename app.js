(function () {
  'use strict';

  var STORAGE_KEY = 'finanze-personali-data';
  var ACCENT = '#1F6F5C';
  var NEGATIVE = '#B3413A';
  var WARN = '#B08900';

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

  var DEFAULT_EXPENSE_CATEGORIES = makeDefaultCategories([
    ['Salute', 'heart'], ['Svago', ''], ['Casa', 'home'], ['Bar', 'coffee'], ['Formazione', 'book'],
    ['Regali', 'gift'], ['Spesa', 'cart'], ['Famiglia', ''], ['Sport', ''], ['Trasporti', 'car'],
    ['Ristoranti', ''], ['Investimenti', 'moneybag'], ['Prestiti', ''], ['Abbonamenti', ''],
    ['Abbigliamento', ''], ['Tech', ''], ['Altro', '']
  ], 'e');

  var DEFAULT_INCOME_CATEGORIES = makeDefaultCategories([
    ['Stipendio', 'moneybag'], ['Freelance', ''], ['Regalo', 'gift'], ['Interessi', ''],
    ['Vendite online', 'cart'], ['Investimenti', 'moneybag'], ['Altro', '']
  ], 'i');

  var RECUR_LABELS = { monthly: 'Ogni mese', quarterly: 'Ogni 3 mesi', semiannual: 'Ogni 6 mesi' };

  var PERSIST_KEYS = ['accounts', 'debts', 'upcoming', 'portfolio', 'portfolios', 'transactions', 'goal', 'expenseCategories', 'incomeCategories', 'twelveDataApiKey'];

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

      period: 'mese', customFrom: '', customTo: '',
      editGoal: false, goalTargetInput: '', goalCurrentInput: '',

      showAddAccount: false, newAccountName: '', newAccountBank: '', newAccountBalance: '',
      editingAccountId: null, editAccountBalanceInput: '',
      showTransfer: false, transferFrom: '', transferTo: '', transferAmount: '',

      showAddDebt: false, newDebtPerson: '', newDebtAmount: '', newDebtKind: 'devo', newDebtDue: '',

      showAddPayment: false, newPaymentLabel: '', newPaymentAmount: '', newPaymentDate: '',
      newPaymentCategory: '', newPaymentRecurrence: 'none',

      showAddHolding: false, newHoldingName: '', newHoldingValue: '', newHoldingChange: '', newHoldingPortfolioId: '1',
      newHoldingTicker: '', newHoldingQty: '', newHoldingAssetType: 'stock',
      showAddPortfolio: false, newPortfolioName: '',
      editingHoldingId: null, editHoldingName: '', editHoldingValue: '', editHoldingChange: '',
      editHoldingTicker: '', editHoldingQty: '', editHoldingAssetType: 'stock',

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
      }
    } catch (e) {}
  })();

  function save() {
    try {
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
  function uid() { uidSeq = (uidSeq + 1) % 1000; return Date.now() * 1000 + uidSeq; }

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
        category = 'Investimenti';
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

    toggleEditGoal: function () {
      update({ editGoal: !state.editGoal, goalTargetInput: String(state.goal.target), goalCurrentInput: String(state.goal.current) });
    },
    saveGoal: function () {
      update({ goal: { label: state.goal.label, target: numVal(state.goalTargetInput) || 0, current: numVal(state.goalCurrentInput) || 0 }, editGoal: false });
    },

    addAccount: function () {
      if (!state.newAccountName || state.newAccountBalance === '') return;
      update({
        accounts: state.accounts.concat([{ id: uid(), name: state.newAccountName, bank: state.newAccountBank, balance: numVal(state.newAccountBalance) || 0, excludeFromTotal: false }]),
        newAccountName: '', newAccountBank: '', newAccountBalance: '', showAddAccount: false
      });
    },
    removeAccount: function (id) { update({ accounts: state.accounts.filter(function (a) { return a.id !== id; }) }); },
    clearAccountTransactions: function (id) {
      var linked = state.transactions.filter(function (t) { return t.accountId === id; });
      if (!linked.length) return;
      if (!window.confirm('Cancellare i ' + linked.length + ' movimenti già registrati su questo conto e riportare il saldo a 0? (Eventuali giroconti già applicati verranno azzerati insieme al resto.) Non si può annullare.')) return;
      var transactions = state.transactions.filter(function (t) { return t.accountId !== id; });
      var accounts = state.accounts.map(function (a) { return a.id === id ? Object.assign({}, a, { balance: 0 }) : a; });
      update({ transactions: transactions, accounts: accounts });
    },
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
        debts: state.debts.concat([{ id: uid(), person: state.newDebtPerson, amount: numVal(state.newDebtAmount) || 0, kind: state.newDebtKind, due: state.newDebtDue }]),
        newDebtPerson: '', newDebtAmount: '', newDebtKind: 'devo', newDebtDue: '', showAddDebt: false
      });
    },
    removeDebt: function (id) { update({ debts: state.debts.filter(function (d) { return d.id !== id; }) }); },

    addPayment: function () {
      if (!state.newPaymentLabel || state.newPaymentAmount === '' || !state.newPaymentDate) return;
      update({
        upcoming: state.upcoming.concat([{ id: uid(), label: state.newPaymentLabel, amount: numVal(state.newPaymentAmount) || 0, date: state.newPaymentDate, category: state.newPaymentCategory, recurrence: state.newPaymentRecurrence }]),
        newPaymentLabel: '', newPaymentAmount: '', newPaymentDate: '', newPaymentCategory: '', newPaymentRecurrence: 'none', showAddPayment: false
      });
    },
    removeUpcoming: function (id) { update({ upcoming: state.upcoming.filter(function (u) { return u.id !== id; }) }); },
    pickPaymentCategory: function (name) { update({ newPaymentCategory: name }); },

    addHolding: function () {
      if (!state.newHoldingName || state.newHoldingValue === '') return;
      var pid = parseFloat(state.newHoldingPortfolioId) || (state.portfolios[0] && state.portfolios[0].id) || 1;
      update({
        portfolio: state.portfolio.concat([{
          id: uid(), name: state.newHoldingName, value: numVal(state.newHoldingValue) || 0, changePct: numVal(state.newHoldingChange) || 0, portfolioId: pid,
          ticker: state.newHoldingTicker.trim().toUpperCase(), quantity: state.newHoldingQty === '' ? null : (numVal(state.newHoldingQty) || 0), assetType: state.newHoldingAssetType
        }]),
        newHoldingName: '', newHoldingValue: '', newHoldingChange: '', newHoldingTicker: '', newHoldingQty: '', newHoldingAssetType: 'stock', showAddHolding: false
      });
    },
    removeHolding: function (id) { update({ portfolio: state.portfolio.filter(function (h) { return h.id !== id; }) }); },
    startEditHolding: function (id) {
      var h = state.portfolio.find(function (x) { return x.id === id; });
      if (!h) return;
      update({
        editingHoldingId: id, editHoldingName: h.name, editHoldingValue: String(h.value), editHoldingChange: String(h.changePct),
        editHoldingTicker: h.ticker || '', editHoldingQty: h.quantity != null ? String(h.quantity) : '', editHoldingAssetType: h.assetType || 'stock'
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
            ticker: state.editHoldingTicker.trim().toUpperCase(), quantity: state.editHoldingQty === '' ? null : (numVal(state.editHoldingQty) || 0), assetType: state.editHoldingAssetType
          }) : h;
        }),
        editingHoldingId: null, editHoldingName: '', editHoldingValue: '', editHoldingChange: '', editHoldingTicker: '', editHoldingQty: '', editHoldingAssetType: 'stock'
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


    togglePriceSettings: function () { update({ showPriceSettings: !state.showPriceSettings, priceKeyInput: state.twelveDataApiKey }); },
    savePriceKey: function () { update({ twelveDataApiKey: state.priceKeyInput.trim(), showPriceSettings: false }); },

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
          value: header.indexOf('valore'), change: header.indexOf('variazione')
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
          quantity: r.qty === '' ? null : (numVal(r.qty) || 0)
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

      var cryptoHoldings = trackable.filter(function (h) { return h.assetType === 'crypto'; });
      var stockHoldings = trackable.filter(function (h) { return h.assetType === 'stock'; });

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
            var byTicker = {};
            cryptoHoldings.forEach(function (h) {
              var id = CRYPTO_ID_MAP[h.ticker.toLowerCase()] || h.ticker.toLowerCase();
              if (data[id]) byTicker[h.id] = { price: data[id].eur, changePct: data[id].eur_24h_change };
            });
            return byTicker;
          }).catch(function () { return {}; });
      }

      var stockPromise = Promise.resolve({});
      if (stockHoldings.length) {
        if (!state.twelveDataApiKey) {
          stockPromise = Promise.resolve({ __missingKey: true });
        } else {
          var symbols = [];
          var symSeen = {};
          stockHoldings.forEach(function (h) { if (!symSeen[h.ticker]) { symSeen[h.ticker] = true; symbols.push(h.ticker); } });
          stockPromise = fetch('https://api.twelvedata.com/quote?symbol=' + encodeURIComponent(symbols.join(',')) + '&apikey=' + encodeURIComponent(state.twelveDataApiKey))
            .then(function (r) { return r.json(); })
            .then(function (data) {
              var byTicker = {};
              stockHoldings.forEach(function (h) {
                var q = symbols.length > 1 ? data[h.ticker] : data;
                if (q && q.close && !q.code) byTicker[h.id] = { price: parseFloat(q.close), changePct: parseFloat(q.percent_change) };
              });
              return byTicker;
            }).catch(function () { return {}; });
        }
      }

      Promise.all([cryptoPromise, stockPromise]).then(function (results) {
        var cryptoResults = results[0] || {};
        var stockResults = results[1] || {};
        var missingKey = !!stockResults.__missingKey;
        var updatedCount = 0;
        var portfolio = state.portfolio.map(function (h) {
          var r = cryptoResults[h.id] || stockResults[h.id];
          if (!r || r.price == null || isNaN(r.price)) return h;
          updatedCount++;
          return Object.assign({}, h, { value: r.price * h.quantity, changePct: isNaN(r.changePct) ? h.changePct : r.changePct });
        });
        var status = updatedCount + ' posizion' + (updatedCount === 1 ? 'e aggiornata' : 'i aggiornate') + ' su ' + trackable.length + '.';
        if (missingKey) status += ' Per le azioni/ETF serve una chiave Twelve Data (vedi "Impostazioni prezzi").';
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
    toggleManageCategories: function () { update({ managingCategories: !state.managingCategories, showCreateCat: false, editingCatId: null }); },
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
        var rows = [['Data', 'Categoria', 'Tipo', 'Importo', 'Nota']];
        state.transactions.slice().sort(function (a, b) { return new Date(a.date) - new Date(b.date); }).forEach(function (t) {
          rows.push([t.date, t.category, t.type, String(t.amount).replace('.', ','), t.note || '']);
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
        PERSIST_KEYS.forEach(function (k) { data[k] = state[k]; });
        var payload = { app: 'le-mie-finanze', version: 1, exportedAt: new Date().toISOString(), data: data };
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        var d = new Date();
        a.href = url; a.download = 'le-mie-finanze-backup-' + d.toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
      var fresh = defaultState();
      Object.keys(state).forEach(function (k) { delete state[k]; });
      Object.assign(state, fresh);
      PERSIST_KEYS.forEach(function (k) { if (data[k] !== undefined) state[k] = data[k]; });
      state.backupPreview = null;
      save();
      render();
    },

    toggleResetConfirm: function () { update({ showResetConfirm: !state.showResetConfirm, resetCodeInput: '', resetError: '' }); },
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
        list.push(cat);
        return cat.name;
      }

      var newTx = [];
      var balanceDelta = {};
      var skippedTransfers = 0;
      var appliedTransfers = 0;

      included.forEach(function (r) {
        if (r.kind === 'transfer') {
          var fromId = resolveAccount(r.fromAccountChoice);
          var toId = resolveAccount(r.toAccountChoice);
          var tamt = numVal(r.amount) || 0;
          if (!fromId || !toId || fromId === toId || tamt <= 0) { skippedTransfers++; return; }
          balanceDelta[fromId] = (balanceDelta[fromId] || 0) - tamt;
          balanceDelta[toId] = (balanceDelta[toId] || 0) + tamt;
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

      update({
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
  function render() {
    var s = state;

    var totalAccounts = s.accounts.filter(function (a) { return !a.excludeFromTotal; }).reduce(function (sum, a) { return sum + Number(a.balance || 0); }, 0);
    var totalPortfolio = s.portfolio.reduce(function (sum, h) { return sum + Number(h.value || 0); }, 0);
    var totalDebt = s.debts.filter(function (d) { return d.kind === 'devo'; }).reduce(function (sum, d) { return sum + Number(d.amount || 0); }, 0);
    var totalCredit = s.debts.filter(function (d) { return d.kind === 'mi deve'; }).reduce(function (sum, d) { return sum + Number(d.amount || 0); }, 0);
    var netWorth = totalAccounts + totalPortfolio + totalCredit - totalDebt;
    var goalPct = s.goal.target > 0 ? Math.min(100, (s.goal.current / s.goal.target) * 100) : 0;

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

    var monthTx = s.transactions.filter(function (t) { return new Date(t.date) >= ranges.mese; });
    var monthlyIncome = monthTx.filter(function (t) { return t.type === 'entrata'; }).reduce(function (sum, t) { return sum + Number(t.amount || 0); }, 0);
    var monthlyExpense = monthTx.filter(function (t) { return t.type === 'uscita'; }).reduce(function (sum, t) { return sum + Number(t.amount || 0); }, 0);

    var periodTx = s.transactions.filter(function (t) { var d = new Date(t.date); return d >= rangeStart && d <= rangeEnd; });
    var periodIncome = periodTx.filter(function (t) { return t.type === 'entrata'; }).reduce(function (sum, t) { return sum + Number(t.amount || 0); }, 0);
    var periodExpense = periodTx.filter(function (t) { return t.type === 'uscita'; }).reduce(function (sum, t) { return sum + Number(t.amount || 0); }, 0);
    var periodNet = periodIncome - periodExpense;
    var maxBar = Math.max(periodIncome, periodExpense, 1);

    var urgentDays = s.upcoming.map(function (u) {
      var eff = nextOccurrence(u.date, u.recurrence, startOfDay);
      return { u: u, eff: eff, days: Math.ceil((eff - startOfDay) / 86400000) };
    });
    var urgent = urgentDays.filter(function (x) { return x.days <= 7; });
    var urgentTotal = urgent.reduce(function (sum, x) { return sum + Number(x.u.amount || 0); }, 0);

    var html = '';
    html += '<div class="page"><div class="wrap">';
    html += renderHeader(s, netWorth, totalAccounts, totalPortfolio, totalDebt, totalCredit, urgent.length, urgentTotal, goalPct);
    html += renderInsights(s, totalAccounts, totalDebt, totalPortfolio, monthlyIncome, monthlyExpense);
    html += renderTxSection(s, periodTx, periodIncome, periodExpense, periodNet, maxBar);
    html += renderAccounts(s);
    html += renderDebts(s);
    html += renderUpcoming(s, urgentDays, startOfDay);
    html += renderPortfolios(s, totalPortfolio);
    html += '<div style="text-align:center;font-size:12px;color:#A6A39B;padding-top:8px;">I dati vengono salvati sul tuo dispositivo (localStorage), non lasciano il telefono.</div>';
    html += renderBackupPanel(s);
    html += renderResetPanel(s);
    html += '</div></div>';

    document.getElementById('app').innerHTML = html;
  }

  function renderBackupPanel(s) {
    var html = '<div class="card">' +
      '<div class="section-title">Backup</div>' +
      '<div class="muted" style="font-size:12px;">Esporta un file con tutti i tuoi dati (conti, movimenti, debiti, pagamenti, portafogli, categorie) per non perderli se cambi telefono o cancelli i dati del browser.</div>' +
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

  function nextOccurrence(dateStr, recurrence, startOfDay) {
    var d = new Date(dateStr);
    var stepMonths = recurrence === 'monthly' ? 1 : recurrence === 'quarterly' ? 3 : recurrence === 'semiannual' ? 6 : 0;
    if (!stepMonths) return d;
    var guard = 0;
    while (d < startOfDay && guard < 240) { d = new Date(d.getFullYear(), d.getMonth() + stepMonths, d.getDate()); guard++; }
    return d;
  }

  function renderHeader(s, netWorth, totalAccounts, totalPortfolio, totalDebt, totalCredit, urgentCount, urgentTotal, goalPct) {
    var stat = function (label, value) {
      return '<div><div style="font-size:12px;color:rgba(250,250,248,0.65);">' + label + '</div><div style="font-size:18px;font-weight:600;margin-top:2px;">' + value + '</div></div>';
    };
    var goalEdit = s.editGoal
      ? '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">' +
        '<input class="text-input" type="text" inputmode="decimal" data-field="goalCurrentInput" value="' + esc(s.goalCurrentInput) + '" placeholder="Attuale" style="width:110px;background:rgba(250,250,248,0.95);">' +
        '<span style="color:rgba(250,250,248,0.7);">di</span>' +
        '<input class="text-input" type="text" inputmode="decimal" data-field="goalTargetInput" value="' + esc(s.goalTargetInput) + '" placeholder="Obiettivo" style="width:110px;background:rgba(250,250,248,0.95);">' +
        '<button class="btn" data-action="save-goal" style="background:#FAFAF8;color:#1F6F5C;">Salva</button>' +
        '</div>'
      : '';
    return (
      '<div style="background:' + ACCENT + ';border-radius:16px;padding:26px 20px;color:#FAFAF8;display:flex;flex-direction:column;gap:22px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">' +
          '<div><h1 style="font-size:26px;font-weight:600;color:#FAFAF8;">Le Mie Finanze</h1><div style="font-size:14px;color:rgba(250,250,248,0.75);margin-top:4px;">Panoramica personale</div></div>' +
          '<div style="text-align:right;"><div style="font-size:12px;color:rgba(250,250,248,0.75);text-transform:uppercase;letter-spacing:0.04em;">Patrimonio netto</div><div style="font-size:32px;font-family:\'Fraunces\',serif;font-weight:600;">' + fmt(netWorth) + '</div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:14px;padding-top:8px;border-top:1px solid rgba(250,250,248,0.2);">' +
          stat('Conti correnti', fmt(totalAccounts)) + stat('Portafoglio', fmt(totalPortfolio)) + stat('Devo', fmt(totalDebt)) + stat('Mi devono', fmt(totalCredit)) + stat('Scadenze 7gg', urgentCount + ' &middot; ' + fmt(urgentTotal)) +
        '</div>' +
        '<div style="background:rgba(250,250,248,0.08);border-radius:12px;padding:16px 18px;display:flex;flex-direction:column;gap:10px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;"><div style="font-size:14px;font-weight:600;">Obiettivo: ' + esc(s.goal.label) + '</div><button class="btn-link" data-action="toggle-edit-goal" style="color:rgba(250,250,248,0.8);">Modifica</button></div>' +
          goalEdit +
          '<div style="display:flex;justify-content:space-between;font-size:13px;color:rgba(250,250,248,0.8);"><span>' + fmt(s.goal.current) + ' di ' + fmt(s.goal.target) + '</span><span>' + Math.round(goalPct) + '%</span></div>' +
          '<div style="width:100%;height:8px;background:rgba(250,250,248,0.2);border-radius:4px;overflow:hidden;"><div style="height:100%;background:#FAFAF8;border-radius:4px;width:' + goalPct + '%;"></div></div>' +
        '</div>' +
      '</div>'
    );
  }

  function insightCard(title, value, status, color, bg, tip) {
    return '<div style="border:1px solid #E4E2DC;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:8px;">' +
      '<div class="row"><div style="font-size:13px;color:#6B6862;">' + title + '</div><span class="badge" style="background:' + bg + ';color:' + color + ';">' + status + '</span></div>' +
      '<div style="font-size:19px;font-weight:600;font-family:\'Fraunces\',serif;">' + value + '</div>' +
      '<div style="font-size:12px;color:#6B6862;line-height:1.5;">' + tip + '</div>' +
      '</div>';
  }

  function renderInsights(s, totalAccounts, totalDebt, totalPortfolio, monthlyIncome, monthlyExpense) {
    var cards = [];
    if (monthlyExpense > 0) {
      var months = totalAccounts / monthlyExpense;
      if (months >= 6) cards.push(insightCard('Fondo di emergenza', months.toFixed(1) + ' mesi coperti', 'Ottimo', ACCENT, 'rgba(31,111,92,0.1)', 'Hai una riserva solida per gli imprevisti: puoi destinare il resto a risparmio o investimenti.'));
      else if (months >= 3) cards.push(insightCard('Fondo di emergenza', months.toFixed(1) + ' mesi coperti', 'Adeguato', WARN, 'rgba(176,137,0,0.1)', 'Un obiettivo comune è arrivare a coprire 6 mesi di spese prima di investire tutto il resto.'));
      else cards.push(insightCard('Fondo di emergenza', months.toFixed(1) + ' mesi coperti', 'Basso', NEGATIVE, 'rgba(179,65,58,0.1)', 'Prima regola di base: costruisci un fondo di emergenza di 3-6 mesi di spese, tenuto liquido.'));
    } else {
      cards.push(insightCard('Fondo di emergenza', '&mdash;', 'N/D', '#6B6862', '#F0EFEA', 'Registra qualche uscita mensile per calcolare quanti mesi di spese copri con la liquidità.'));
    }
    if (monthlyIncome > 0) {
      var rate = (monthlyIncome - monthlyExpense) / monthlyIncome * 100;
      if (rate < 0) cards.push(insightCard('Tasso di risparmio (mese)', rate.toFixed(0) + '%', 'Attenzione', NEGATIVE, 'rgba(179,65,58,0.1)', 'Questo mese le uscite superano le entrate: rivedi le voci di spesa più alte.'));
      else if (rate >= 20) cards.push(insightCard('Tasso di risparmio (mese)', rate.toFixed(0) + '%', 'Ottimo', ACCENT, 'rgba(31,111,92,0.1)', 'Un tasso di risparmio del 20% o più è un ottimo punto di partenza per investire con regolarità.'));
      else if (rate >= 10) cards.push(insightCard('Tasso di risparmio (mese)', rate.toFixed(0) + '%', 'Buono', WARN, 'rgba(176,137,0,0.1)', 'Sei sulla buona strada: prova ad avvicinarti al 20% di risparmio sul reddito.'));
      else cards.push(insightCard('Tasso di risparmio (mese)', rate.toFixed(0) + '%', 'Basso', NEGATIVE, 'rgba(179,65,58,0.1)', '"Prima paga te stesso": prova a mettere da parte una quota fissa appena arriva lo stipendio.'));
    } else {
      cards.push(insightCard('Tasso di risparmio (mese)', '&mdash;', 'N/D', '#6B6862', '#F0EFEA', 'Registra un’entrata questo mese per calcolare quanto riesci a risparmiare.'));
    }
    if (totalDebt <= 0) cards.push(insightCard('Debiti', fmt(0), 'A posto', ACCENT, 'rgba(31,111,92,0.1)', 'Nessun debito aperto: la liquidità in eccesso può andare a risparmio o investimenti.'));
    else if (totalDebt > totalAccounts) cards.push(insightCard('Debiti', fmt(totalDebt), 'Priorità', NEGATIVE, 'rgba(179,65,58,0.1)', 'I debiti superano la liquidità disponibile: prima di investire, valuta di saldarli, specie se a tasso alto.'));
    else cards.push(insightCard('Debiti', fmt(totalDebt), 'Da monitorare', WARN, 'rgba(176,137,0,0.1)', 'Hai debiti aperti: un debito "cattivo" (tasso alto, beni che si svalutano) va saldato prima di investire.'));

    if (s.portfolio.length === 0) cards.push(insightCard('Diversificazione portafoglio', '&mdash;', 'N/D', '#6B6862', '#F0EFEA', 'Nessuna posizione registrata ancora.'));
    else if (s.portfolio.length === 1) cards.push(insightCard('Diversificazione portafoglio', '1 posizione', 'Rischioso', NEGATIVE, 'rgba(179,65,58,0.1)', 'Puntare su un solo titolo espone a un rischio specifico alto: un ETF ampiamente diversificato riduce questo rischio a parità di rendimento atteso.'));
    else {
      var maxHolding = Math.max.apply(null, s.portfolio.map(function (h) { return Number(h.value || 0); }));
      var concPct = totalPortfolio > 0 ? (maxHolding / totalPortfolio * 100) : 0;
      if (concPct > 50) cards.push(insightCard('Diversificazione portafoglio', Math.round(concPct) + '% in 1 posizione', 'Concentrato', WARN, 'rgba(176,137,0,0.1)', 'Oltre metà del portafoglio è in una sola posizione: valuta di ribilanciare verso strumenti più diversificati.'));
      else cards.push(insightCard('Diversificazione portafoglio', s.portfolio.length + ' posizioni', 'Distribuito', ACCENT, 'rgba(31,111,92,0.1)', 'Il portafoglio è distribuito su più posizioni, nessuna delle quali domina il totale.'));
    }

    return '<div class="card"><div><div class="section-title">Salute finanziaria</div><div class="muted" style="font-size:13px;margin-top:4px;">Indicatori di base, calcolati sui tuoi dati del mese in corso.</div></div><div class="grid-fit">' + cards.join('') + '</div></div>';
  }

  function renderTxSection(s, periodTx, periodIncome, periodExpense, periodNet, maxBar) {
    var periodDefs = [{ key: 'giorno', label: 'Giorno' }, { key: 'settimana', label: 'Settimana' }, { key: 'mese', label: 'Mese' }, { key: 'anno', label: 'Anno' }, { key: 'custom', label: 'Intervallo' }];
    var periodBtns = periodDefs.map(function (p) {
      var active = s.period === p.key;
      return '<button class="btn" data-action="pick-period" data-key="' + p.key + '" style="border-radius:7px;padding:7px 14px;background:' + (active ? ACCENT : 'transparent') + ';color:' + (active ? '#fff' : '#1E1D1B') + ';">' + p.label + '</button>';
    }).join('');

    var customRange = s.period === 'custom'
      ? '<div class="form-box" style="align-items:center;"><span class="muted" style="font-size:12px;">Dal</span><input class="text-input" type="date" data-field="customFrom" value="' + esc(s.customFrom) + '"><span class="muted" style="font-size:12px;">al</span><input class="text-input" type="date" data-field="customTo" value="' + esc(s.customTo) + '"></div>'
      : '';

    var expenseByCat = {};
    periodTx.filter(function (t) { return t.type === 'uscita'; }).forEach(function (t) { expenseByCat[t.category] = (expenseByCat[t.category] || 0) + Number(t.amount || 0); });
    var maxCatVal = 1;
    Object.keys(expenseByCat).forEach(function (k) { if (expenseByCat[k] > maxCatVal) maxCatVal = expenseByCat[k]; });
    var topCats = Object.keys(expenseByCat).map(function (name) { return [name, expenseByCat[name]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);
    var topCatsHtml = topCats.length ? (
      '<div style="display:flex;flex-direction:column;gap:10px;"><div style="font-size:13px;font-weight:600;color:#6B6862;">Dove spendo di più</div>' +
      topCats.map(function (pair) {
        var meta = catMeta(s.expenseCategories.concat(s.incomeCategories), pair[0]);
        return '<div style="display:flex;align-items:center;gap:10px;">' + avatarHtml(meta, 26) +
          '<span style="width:100px;font-size:12px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(pair[0]) + '</span>' +
          '<div class="bar-track"><div class="bar-fill" style="background:' + meta.color + ';width:' + (pair[1] / maxCatVal * 100) + '%;"></div></div>' +
          '<span style="font-size:12px;font-weight:600;width:80px;text-align:right;flex-shrink:0;">' + fmt(pair[1]) + '</span></div>';
      }).join('') + '</div>'
    ) : '';

    var txAccountOptions = function (selectedId) {
      return '<option value="">Nessun conto</option>' + s.accounts.map(function (a) { return '<option value="' + a.id + '"' + (String(selectedId) === String(a.id) ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('');
    };
    var txList = periodTx.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 12).map(function (t) {
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
      var amountFmt = (t.type === 'entrata' ? '+' : '-') + fmt(t.amount);
      var color = t.type === 'entrata' ? ACCENT : NEGATIVE;
      var acc = t.accountId ? s.accounts.find(function (a) { return a.id === t.accountId; }) : null;
      var subtitle = fmtDate(t.date) + (acc ? ' &middot; ' + esc(acc.name) : '') + ' &middot; ' + esc(t.note || '—');
      return '<div class="list-row"><button data-action="start-edit-tx" data-id="' + t.id + '" style="background:none;border:none;cursor:pointer;padding:0;text-align:left;display:flex;align-items:center;gap:10px;">' + avatarHtml(meta, 30) +
        '<div><div style="font-size:14px;font-weight:500;color:#1E1D1B;">' + esc(t.category) + '</div><div class="muted" style="font-size:12px;">' + subtitle + '</div></div></button>' +
        '<div style="display:flex;align-items:center;gap:12px;"><div style="font-size:14px;font-weight:600;color:' + color + ';">' + amountFmt + '</div>' +
        '<button class="icon-btn" data-action="remove-tx" data-id="' + t.id + '" aria-label="Rimuovi movimento">' + xIcon() + '</button></div></div>';
    }).join('');

    var activeCatList = s.newTxType === 'entrata' ? s.incomeCategories : s.expenseCategories;
    var catGrid = activeCatList.map(function (c) {
      var selected = s.newTxCategory === c.name;
      var meta = { color: c.color, initials: c.name.trim().slice(0, 2).toUpperCase(), iconD: c.icon && ICONS[c.icon] ? ICONS[c.icon] : null };
      return '<button data-action="pick-tx-category" data-cat="' + esc(c.name) + '" style="background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;padding:2px;">' +
        '<div style="width:46px;height:46px;border-radius:50%;background:' + meta.color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:600;box-shadow:' + (selected ? '0 0 0 3px rgba(30,29,27,0.35)' : 'none') + ';">' +
        (meta.iconD ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="' + meta.iconD + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' : esc(meta.initials)) +
        '</div><span style="font-size:11px;color:' + (selected ? '#1E1D1B' : '#6B6862') + ';text-align:center;max-width:68px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(c.name) + '</span></button>';
    }).join('') + '<button data-action="toggle-create-cat" style="background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;padding:2px;"><div style="width:46px;height:46px;border-radius:50%;background:#E4E2DC;display:flex;align-items:center;justify-content:center;color:#6B6862;font-size:20px;">+</div><span style="font-size:11px;color:#6B6862;">Nuova</span></button>';

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
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;"><div style="display:flex;gap:4px;background:#F6F5F2;padding:4px;border-radius:10px;">' + periodBtns + '</div>' +
      '<button class="btn btn-ghost" data-action="toggle" data-field="showImport">Importa</button><button class="btn btn-ghost" data-action="export-csv">Esporta CSV</button><button class="btn btn-ghost" data-action="print-page">Stampa / PDF</button></div></div>' +
      renderImportPanel(s) +
      customRange +
      '<div class="grid-fit" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));">' +
      '<div style="background:#F6F5F2;border-radius:12px;padding:14px 16px;"><div class="muted" style="font-size:12px;">Entrate</div><div style="font-size:19px;font-weight:600;color:' + ACCENT + ';margin-top:4px;">' + fmt(periodIncome) + '</div></div>' +
      '<div style="background:#F6F5F2;border-radius:12px;padding:14px 16px;"><div class="muted" style="font-size:12px;">Uscite</div><div style="font-size:19px;font-weight:600;color:' + NEGATIVE + ';margin-top:4px;">' + fmt(periodExpense) + '</div></div>' +
      '<div style="background:#F6F5F2;border-radius:12px;padding:14px 16px;"><div class="muted" style="font-size:12px;">Netto</div><div style="font-size:19px;font-weight:600;margin-top:4px;color:' + (periodNet >= 0 ? ACCENT : NEGATIVE) + ';">' + (periodNet >= 0 ? '+' : '') + fmt(periodNet) + '</div></div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
      '<div style="display:flex;align-items:center;gap:10px;"><span style="width:56px;font-size:12px;color:#6B6862;">Entrate</span><div class="bar-track"><div class="bar-fill" style="background:' + ACCENT + ';width:' + (periodIncome / maxBar * 100) + '%;"></div></div></div>' +
      '<div style="display:flex;align-items:center;gap:10px;"><span style="width:56px;font-size:12px;color:#6B6862;">Uscite</span><div class="bar-track"><div class="bar-fill" style="background:' + NEGATIVE + ';width:' + (periodExpense / maxBar * 100) + '%;"></div></div></div>' +
      '</div>' +
      topCatsHtml +
      '<div style="display:flex;flex-direction:column;gap:2px;border-top:1px solid #E4E2DC;padding-top:10px;">' + (txList || '<div class="muted" style="font-size:13px;padding:10px 4px;">Nessun movimento in questo periodo.</div>') + '</div>' +
      '<div><button class="btn btn-primary" data-action="toggle" data-field="showAddTx">+ Aggiungi movimento</button>' + addTxForm + '</div>' +
      '</div>';
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

    var rows = s.importRows.map(function (r, idx) {
      if (r.kind === 'transfer') {
        return '<div class="list-row" style="flex-wrap:wrap;">' +
          '<input type="checkbox" data-action="toggle-import-row" data-idx="' + idx + '" ' + (r.include ? 'checked' : '') + ' style="margin:0;">' +
          '<span class="badge" style="background:#E4E2DC;color:#1E1D1B;">Giroconto</span>' +
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
      return '<div class="list-row" style="flex-wrap:wrap;">' +
        '<input type="checkbox" data-action="toggle-import-row" data-idx="' + idx + '" ' + (r.include ? 'checked' : '') + ' style="margin:0;">' +
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
      '<div style="display:flex;flex-direction:column;gap:2px;max-height:360px;overflow:auto;">' + rows + '</div>' +
      '<div><button class="btn btn-primary" data-action="confirm-import">' + label + '</button></div>' +
      '</div>';
  }

  function renderCreateCat(s) {
    var swatches = CATEGORY_PALETTE.map(function (color) {
      return '<button data-action="pick-cat-color" data-color="' + color + '" style="width:22px;height:22px;border-radius:50%;background:' + color + ';border:' + (s.newCatColor === color ? '2px solid #1E1D1B' : '2px solid transparent') + ';cursor:pointer;padding:0;"></button>';
    }).join('');
    var iconSwatches = '<button data-action="pick-cat-icon" data-icon="" style="width:30px;height:30px;border-radius:50%;background:#F6F5F2;border:' + (s.newCatIcon === '' ? '2px solid #1E1D1B' : '1px solid #E4E2DC') + ';cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;color:#6B6862;padding:0;">Aa</button>' +
      ICON_LIST.map(function (key) {
        return '<button data-action="pick-cat-icon" data-icon="' + key + '" style="width:30px;height:30px;border-radius:50%;background:#F6F5F2;border:' + (s.newCatIcon === key ? '2px solid #1E1D1B' : '1px solid #E4E2DC') + ';cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;color:#1E1D1B;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="' + ICONS[key] + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
      }).join('');
    return '<div style="display:flex;flex-direction:column;gap:12px;padding:14px;background:#FFFFFF;border-radius:10px;border:1px solid #E4E2DC;margin-top:10px;">' +
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
        return '<div class="list-row"><div style="display:flex;align-items:center;gap:10px;">' + avatarHtml(meta, 30) + '<span style="font-size:13px;">' + esc(c.name) + '</span></div>' +
          '<div style="display:flex;gap:10px;"><button class="btn-link" data-action="start-merge-category" data-id="' + c.id + '" data-cattype="' + type + '">Unisci</button>' +
          '<button class="btn-link" data-action="edit-category" data-id="' + c.id + '" data-cattype="' + type + '">Modifica</button>' +
          '<button class="btn-link" data-action="remove-category" data-id="' + c.id + '" data-cattype="' + type + '" style="color:' + NEGATIVE + ';">Elimina</button></div></div>';
      }).join('');
      return '<div><div style="font-size:12px;font-weight:600;color:#6B6862;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.03em;">' + title + '</div><div style="display:flex;flex-direction:column;gap:2px;">' + rows + '</div></div>';
    };
    return '<div style="display:flex;flex-direction:column;gap:14px;padding:14px;background:#FFFFFF;border-radius:10px;border:1px solid #E4E2DC;margin-top:10px;">' +
      '<div class="muted" style="font-size:11px;">"Unisci" sposta tutti i movimenti di una categoria in un\'altra e la elimina: utile per accorpare doppioni (es. "Groceries" e "Spesa").</div>' +
      block('Categorie di uscita', s.expenseCategories, 'expense') + block('Categorie di entrata', s.incomeCategories, 'income') + '</div>';
  }

  function renderAccounts(s) {
    var cards = s.accounts.map(function (a) {
      var editing = s.editingAccountId === a.id;
      var balanceBlock = editing
        ? '<div style="display:flex;gap:8px;align-items:center;"><input class="text-input" type="text" inputmode="decimal" data-field="editAccountBalanceInput" value="' + esc(s.editAccountBalanceInput) + '" style="width:110px;"><button class="btn btn-primary" data-action="save-edit-balance" data-id="' + a.id + '" style="padding:7px 12px;">Salva</button></div>'
        : '<button data-action="start-edit-balance" data-id="' + a.id + '" style="background:none;border:none;cursor:pointer;padding:0;text-align:left;font-size:19px;font-weight:600;font-family:\'Fraunces\',serif;color:#1E1D1B;">' + fmt(a.balance) + '</button>';
      return '<div style="border:1px solid #E4E2DC;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;">' +
        '<div class="row" style="align-items:flex-start;"><div><div style="font-size:14px;font-weight:600;">' + esc(a.name) + '</div><div class="muted" style="font-size:12px;margin-top:2px;">' + esc(a.bank) + '</div></div>' +
        '<button class="icon-btn" data-action="remove-account" data-id="' + a.id + '" aria-label="Rimuovi conto">' + xIcon() + '</button></div>' +
        balanceBlock +
        '<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:' + (a.excludeFromTotal ? WARN : '#6B6862') + ';cursor:pointer;"><input type="checkbox" data-field="account-exclude-' + a.id + '" data-action="toggle-exclude" data-id="' + a.id + '" ' + (a.excludeFromTotal ? 'checked' : '') + ' style="margin:0;">' + (a.excludeFromTotal ? 'Escluso dal totale' : 'Incluso nel totale') + '</label>' +
        (s.transactions.some(function (t) { return t.accountId === a.id; })
          ? '<button class="btn-link" data-action="clear-account-tx" data-id="' + a.id + '" style="color:' + NEGATIVE + ';">Svuota movimenti di questo conto</button>'
          : '') +
        '</div>';
    }).join('');

    var addForm = s.showAddAccount ? (
      '<div class="form-box">' +
      '<input class="text-input" type="text" data-field="newAccountName" value="' + esc(s.newAccountName) + '" placeholder="Nome conto" style="flex:1 1 160px;">' +
      '<input class="text-input" type="text" data-field="newAccountBank" value="' + esc(s.newAccountBank) + '" placeholder="Banca" style="flex:1 1 140px;">' +
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
      return '<div class="list-row"><div><div style="font-size:14px;font-weight:500;">' + (d.kind === 'devo' ? 'Devo a ' : 'Mi deve ') + esc(d.person) + '</div><div class="muted" style="font-size:12px;">Scadenza: ' + (d.due ? fmtDate(d.due) : '—') + '</div></div>' +
        '<div style="display:flex;align-items:center;gap:12px;"><div style="font-size:14px;font-weight:600;color:' + color + ';">' + fmt(d.amount) + '</div><button class="icon-btn" data-action="remove-debt" data-id="' + d.id + '" aria-label="Rimuovi voce">' + xIcon() + '</button></div></div>';
    }).join('');
    var addForm = s.showAddDebt ? (
      '<div class="form-box">' +
      '<input class="text-input" type="text" data-field="newDebtPerson" value="' + esc(s.newDebtPerson) + '" placeholder="Persona" style="flex:1 1 140px;">' +
      '<input class="text-input" type="text" inputmode="decimal" data-field="newDebtAmount" value="' + esc(s.newDebtAmount) + '" placeholder="Importo" style="width:110px;">' +
      '<select class="text-input" data-field="newDebtKind"><option value="devo"' + (s.newDebtKind === 'devo' ? ' selected' : '') + '>Devo</option><option value="mi deve"' + (s.newDebtKind === 'mi deve' ? ' selected' : '') + '>Mi deve</option></select>' +
      '<input class="text-input" type="date" data-field="newDebtDue" value="' + esc(s.newDebtDue) + '">' +
      '<button class="btn btn-dark" data-action="add-debt">Salva</button></div>'
    ) : '';
    return '<div class="card"><div class="section-title">Debiti e crediti</div><div style="display:flex;flex-direction:column;gap:2px;">' + (rows || '<div class="muted" style="font-size:13px;">Nessun debito o credito registrato.</div>') + '</div>' +
      '<div><button class="btn btn-primary" data-action="toggle" data-field="showAddDebt">+ Aggiungi debito o credito</button>' + addForm + '</div></div>';
  }

  function renderUpcoming(s, urgentDays, startOfDay) {
    var sorted = urgentDays.slice().sort(function (a, b) { return a.eff - b.eff; });
    var rows = sorted.map(function (x) {
      var u = x.u, days = x.days;
      var isUrgent = days <= 7;
      var meta = u.category ? catMeta(s.expenseCategories, u.category) : null;
      return '<div class="list-row"><div style="display:flex;align-items:center;gap:10px;">' +
        '<span class="badge" style="background:' + (isUrgent ? 'rgba(179,65,58,0.1)' : 'rgba(31,111,92,0.1)') + ';color:' + (isUrgent ? NEGATIVE : ACCENT) + ';">' + (days < 0 ? 'Scaduto' : (days === 0 ? 'Oggi' : days + ' g')) + '</span>' +
        (meta ? avatarHtml(meta, 26) : '') +
        '<div><div style="font-size:14px;font-weight:500;">' + esc(u.label) + '</div><div class="muted" style="font-size:12px;">' + fmtDate(x.eff) + (RECUR_LABELS[u.recurrence] ? ' &middot; ↻ ' + RECUR_LABELS[u.recurrence] : '') + '</div></div></div>' +
        '<div style="display:flex;align-items:center;gap:12px;"><div style="font-size:14px;font-weight:600;">' + fmt(u.amount) + '</div><button class="icon-btn" data-action="remove-upcoming" data-id="' + u.id + '" aria-label="Rimuovi pagamento">' + xIcon() + '</button></div></div>';
    }).join('');

    var catGrid = s.expenseCategories.map(function (c) {
      var selected = s.newPaymentCategory === c.name;
      var meta = { color: c.color, initials: c.name.trim().slice(0, 2).toUpperCase(), iconD: c.icon && ICONS[c.icon] ? ICONS[c.icon] : null };
      return '<button data-action="pick-payment-category" data-cat="' + esc(c.name) + '" style="background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;padding:2px;">' +
        '<div style="width:38px;height:38px;border-radius:50%;background:' + meta.color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:600;box-shadow:' + (selected ? '0 0 0 3px rgba(30,29,27,0.35)' : 'none') + ';">' +
        (meta.iconD ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="' + meta.iconD + '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' : esc(meta.initials)) +
        '</div><span style="font-size:10px;color:' + (selected ? '#1E1D1B' : '#6B6862') + ';text-align:center;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(c.name) + '</span></button>';
    }).join('');

    var addForm = s.showAddPayment ? (
      '<div class="form-box" style="flex-direction:column;align-items:stretch;">' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;">' +
      '<input class="text-input" type="text" data-field="newPaymentLabel" value="' + esc(s.newPaymentLabel) + '" placeholder="Descrizione" style="flex:1 1 160px;">' +
      '<input class="text-input" type="text" inputmode="decimal" data-field="newPaymentAmount" value="' + esc(s.newPaymentAmount) + '" placeholder="Importo" style="width:110px;">' +
      '<input class="text-input" type="date" data-field="newPaymentDate" value="' + esc(s.newPaymentDate) + '">' +
      '<select class="text-input" data-field="newPaymentRecurrence"><option value="none"' + (s.newPaymentRecurrence === 'none' ? ' selected' : '') + '>Non ricorrente</option><option value="monthly"' + (s.newPaymentRecurrence === 'monthly' ? ' selected' : '') + '>Ogni mese</option><option value="quarterly"' + (s.newPaymentRecurrence === 'quarterly' ? ' selected' : '') + '>Ogni 3 mesi</option><option value="semiannual"' + (s.newPaymentRecurrence === 'semiannual' ? ' selected' : '') + '>Ogni 6 mesi</option></select>' +
      '</div><div><div class="muted" style="font-size:12px;margin-bottom:8px;">' + (s.newPaymentCategory ? 'Categoria: ' + esc(s.newPaymentCategory) : 'Categoria (opzionale)') + '</div><div style="display:flex;flex-wrap:wrap;gap:10px;">' + catGrid + '</div></div>' +
      '<div><button class="btn btn-dark" data-action="add-payment">Salva</button></div></div>'
    ) : '';

    return '<div class="card"><div class="section-title">Pagamenti futuri</div><div style="display:flex;flex-direction:column;gap:2px;">' + (rows || '<div class="muted" style="font-size:13px;">Nessun pagamento in programma.</div>') + '</div>' +
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
          return '<div style="border:1px solid #E4E2DC;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:8px;">' +
            '<input class="text-input" type="text" data-field="editHoldingName" value="' + esc(s.editHoldingName) + '" placeholder="Nome titolo">' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<input class="text-input" type="text" inputmode="decimal" data-field="editHoldingValue" value="' + esc(s.editHoldingValue) + '" placeholder="Valore" style="width:100px;">' +
            '<input class="text-input" type="text" inputmode="decimal" data-field="editHoldingChange" value="' + esc(s.editHoldingChange) + '" placeholder="Variazione %" style="width:100px;">' +
            '</div>' +
            '<div class="muted" style="font-size:11px;margin-top:2px;">Per l\'aggiornamento prezzi automatico (opzionale):</div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<select class="text-input" data-field="editHoldingAssetType" style="width:110px;"><option value="stock"' + (s.editHoldingAssetType === 'stock' ? ' selected' : '') + '>Azione/ETF</option><option value="crypto"' + (s.editHoldingAssetType === 'crypto' ? ' selected' : '') + '>Crypto</option></select>' +
            '<input class="text-input" type="text" data-field="editHoldingTicker" value="' + esc(s.editHoldingTicker) + '" placeholder="Ticker (es. AAPL, BTC)" style="width:130px;">' +
            '<input class="text-input" type="text" inputmode="decimal" data-field="editHoldingQty" value="' + esc(s.editHoldingQty) + '" placeholder="Quantità" style="width:100px;">' +
            '</div>' +
            '<div style="display:flex;gap:8px;"><button class="btn btn-primary" data-action="save-edit-holding" data-id="' + h.id + '">Salva</button><button class="btn btn-ghost" data-action="cancel-edit-holding">Annulla</button></div>' +
            '</div>';
        }
        return '<div style="border:1px solid #E4E2DC;border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">' +
          '<button data-action="start-edit-holding" data-id="' + h.id + '" style="background:none;border:none;cursor:pointer;padding:0;text-align:left;">' +
          '<div style="font-size:14px;font-weight:600;color:#1E1D1B;">' + esc(h.name) + (h.ticker ? ' <span class="muted" style="font-weight:400;">' + esc(h.ticker) + '</span>' : '') + '</div><div style="font-size:17px;font-weight:600;margin-top:6px;font-family:\'Fraunces\',serif;color:#1E1D1B;">' + fmt(h.value) + '</div><div style="font-size:13px;font-weight:600;margin-top:2px;color:' + (changePct >= 0 ? ACCENT : NEGATIVE) + ';">' + changeFmt + '</div>' +
          '</button>' +
          '<button class="icon-btn" data-action="remove-holding" data-id="' + h.id + '" aria-label="Rimuovi posizione">' + xIcon() + '</button></div>';
      }).join('');
      return '<div style="display:flex;flex-direction:column;gap:12px;padding-bottom:16px;border-bottom:1px solid #F0EFEA;">' +
        '<div class="row"><div style="font-size:14px;font-weight:600;">' + esc(p.name) + ' <span style="font-weight:400;color:#6B6862;">&middot; ' + fmt(subtotal) + '</span></div>' +
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
      '</div>' +
      '<div class="muted" style="font-size:11px;margin-top:8px;">Per l\'aggiornamento prezzi automatico (opzionale):</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:4px;">' +
      '<select class="text-input" data-field="newHoldingAssetType" style="width:110px;"><option value="stock"' + (s.newHoldingAssetType === 'stock' ? ' selected' : '') + '>Azione/ETF</option><option value="crypto"' + (s.newHoldingAssetType === 'crypto' ? ' selected' : '') + '>Crypto</option></select>' +
      '<input class="text-input" type="text" data-field="newHoldingTicker" value="' + esc(s.newHoldingTicker) + '" placeholder="Ticker (es. AAPL, BTC)" style="width:140px;">' +
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
      '<div class="muted" style="font-size:12px;">Le crypto si aggiornano gratis (CoinGecko, nessuna chiave). Per azioni/ETF serve una chiave gratuita da <a href="https://twelvedata.com/pricing" target="_blank" rel="noopener">twelvedata.com</a> (piano free, 1 minuto).</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;"><input class="text-input" type="password" data-field="priceKeyInput" value="' + esc(s.priceKeyInput) + '" placeholder="Chiave Twelve Data" style="flex:1 1 200px;"><button class="btn btn-dark" data-action="save-price-key">Salva</button></div>' +
      '</div>'
    ) : '';

    var refreshRow = '<div class="row" style="flex-wrap:wrap;">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">' +
      '<button class="btn btn-ghost" data-action="refresh-prices"' + (s.priceRefreshBusy ? ' disabled' : '') + '>' + (s.priceRefreshBusy ? 'Aggiorno...' : 'Aggiorna prezzi') + '</button>' +
      '<button class="btn-link" data-action="toggle-price-settings">Impostazioni prezzi</button>' +
      '</div></div>' +
      (s.priceRefreshStatus ? '<div class="muted" style="font-size:12px;">' + esc(s.priceRefreshStatus) + '</div>' : '') +
      priceSettingsBox;

    return '<div class="card"><div class="row"><div class="section-title">Portafogli</div><div style="font-size:13px;color:#6B6862;">Totale: <span style="font-weight:600;color:#1E1D1B;">' + fmt(totalPortfolio) + '</span></div></div>' +
      refreshRow +
      sections +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;"><button class="btn btn-primary" data-action="toggle" data-field="showAddHolding">+ Aggiungi posizione</button><button class="btn btn-ghost" data-action="toggle" data-field="showAddPortfolio">+ Nuovo portafoglio</button><button class="btn btn-ghost" data-action="toggle" data-field="showImportHoldings">Importa posizioni</button></div>' +
      addHoldingForm + addPortfolioForm + renderImportHoldingsPanel(s) + '</div>';
  }

  function renderImportHoldingsPanel(s) {
    if (!s.showImportHoldings) return '';
    var html = '<div class="form-box" style="flex-direction:column;align-items:stretch;margin-top:10px;">' +
      '<div class="row" style="align-items:center;"><div style="font-size:14px;font-weight:600;">Importa posizioni da CSV</div><button class="btn-link" data-action="toggle" data-field="showImportHoldings">Chiudi</button></div>' +
      '<div class="muted" style="font-size:12px;">Colonne: Portafoglio, Nome, Ticker, Tipo (stock/crypto), Quantita, Valore, Variazione. Le posizioni si aggiungono a quelle esistenti, non le sostituiscono.</div>' +
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

    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-action]');
      if (!el) return;
      var action = el.dataset.action;
      var id = el.dataset.id;
      var numId = id !== undefined ? (isNaN(Number(id)) ? id : Number(id)) : null;
      switch (action) {
        case 'toggle': App.toggle(el.dataset.field); break;
        case 'pick-period': App.pickPeriod(el.dataset.key); break;
        case 'toggle-edit-goal': App.toggleEditGoal(); break;
        case 'save-goal': App.saveGoal(); break;
        case 'add-account': App.addAccount(); break;
        case 'remove-account': App.removeAccount(numId); break;
        case 'clear-account-tx': App.clearAccountTransactions(numId); break;
        case 'toggle-exclude': App.toggleExcludeAccount(numId); break;
        case 'start-edit-balance': App.startEditBalance(numId); break;
        case 'save-edit-balance': App.saveEditBalance(numId); break;
        case 'do-transfer': App.doTransfer(); break;
        case 'add-debt': App.addDebt(); break;
        case 'remove-debt': App.removeDebt(numId); break;
        case 'add-payment': App.addPayment(); break;
        case 'remove-upcoming': App.removeUpcoming(numId); break;
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
        case 'export-csv': App.exportCSV(); break;
        case 'print-page': App.printPage(); break;
        case 'export-backup': App.exportBackup(); break;
        case 'confirm-restore-backup': App.confirmRestoreBackup(); break;
        case 'cancel-restore-backup': App.cancelRestoreBackup(); break;
        case 'toggle-reset-confirm': App.toggleResetConfirm(); break;
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
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
