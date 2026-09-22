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

  var PERSIST_KEYS = ['accounts', 'debts', 'upcoming', 'portfolio', 'portfolios', 'transactions', 'goal', 'expenseCategories', 'incomeCategories'];

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
      showAddPortfolio: false, newPortfolioName: '',

      showAddTx: false, newTxCategory: '', newTxAmount: '', newTxType: 'uscita', newTxDate: '', newTxNote: '',
      showCreateCat: false, managingCategories: false,
      newCatName: '', newCatColor: CATEGORY_PALETTE[0], newCatIcon: '',
      editingCatId: null, editingCatType: null
    };
  }

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
  function uid() { return Date.now() + Math.floor(Math.random() * 1000); }

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

  // ---------- state update ----------
  function update(partial) {
    Object.assign(state, partial);
    save();
    renderPreserveFocus();
  }
  function toggle(field) {
    var p = {}; p[field] = !state[field]; update(p);
  }

  // ---------- mutations ----------
  var App = {
    setField: function (field, value) {
      state[field] = value;
      if (field === 'newTxType') state.newTxCategory = '';
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
      update({ goal: { label: state.goal.label, target: parseFloat(state.goalTargetInput) || 0, current: parseFloat(state.goalCurrentInput) || 0 }, editGoal: false });
    },

    addAccount: function () {
      if (!state.newAccountName || state.newAccountBalance === '') return;
      update({
        accounts: state.accounts.concat([{ id: uid(), name: state.newAccountName, bank: state.newAccountBank, balance: parseFloat(state.newAccountBalance) || 0, excludeFromTotal: false }]),
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
      var val = parseFloat(state.editAccountBalanceInput);
      if (isNaN(val)) { update({ editingAccountId: null }); return; }
      update({ accounts: state.accounts.map(function (a) { return a.id === id ? Object.assign({}, a, { balance: val }) : a; }), editingAccountId: null, editAccountBalanceInput: '' });
    },

    toggleTransfer: function () { update({ showTransfer: !state.showTransfer, transferFrom: '', transferTo: '', transferAmount: '' }); },
    doTransfer: function () {
      var amt = parseFloat(state.transferAmount);
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
        debts: state.debts.concat([{ id: uid(), person: state.newDebtPerson, amount: parseFloat(state.newDebtAmount) || 0, kind: state.newDebtKind, due: state.newDebtDue }]),
        newDebtPerson: '', newDebtAmount: '', newDebtKind: 'devo', newDebtDue: '', showAddDebt: false
      });
    },
    removeDebt: function (id) { update({ debts: state.debts.filter(function (d) { return d.id !== id; }) }); },

    addPayment: function () {
      if (!state.newPaymentLabel || state.newPaymentAmount === '' || !state.newPaymentDate) return;
      update({
        upcoming: state.upcoming.concat([{ id: uid(), label: state.newPaymentLabel, amount: parseFloat(state.newPaymentAmount) || 0, date: state.newPaymentDate, category: state.newPaymentCategory, recurrence: state.newPaymentRecurrence }]),
        newPaymentLabel: '', newPaymentAmount: '', newPaymentDate: '', newPaymentCategory: '', newPaymentRecurrence: 'none', showAddPayment: false
      });
    },
    removeUpcoming: function (id) { update({ upcoming: state.upcoming.filter(function (u) { return u.id !== id; }) }); },
    pickPaymentCategory: function (name) { update({ newPaymentCategory: name }); },

    addHolding: function () {
      if (!state.newHoldingName || state.newHoldingValue === '') return;
      var pid = parseFloat(state.newHoldingPortfolioId) || (state.portfolios[0] && state.portfolios[0].id) || 1;
      update({
        portfolio: state.portfolio.concat([{ id: uid(), name: state.newHoldingName, value: parseFloat(state.newHoldingValue) || 0, changePct: parseFloat(state.newHoldingChange) || 0, portfolioId: pid }]),
        newHoldingName: '', newHoldingValue: '', newHoldingChange: '', showAddHolding: false
      });
    },
    removeHolding: function (id) { update({ portfolio: state.portfolio.filter(function (h) { return h.id !== id; }) }); },
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

    pickTxCategory: function (name) { update({ newTxCategory: name }); },
    addTx: function () {
      if (!state.newTxCategory || state.newTxAmount === '' || !state.newTxDate) return;
      update({
        transactions: state.transactions.concat([{ id: uid(), category: state.newTxCategory, amount: parseFloat(state.newTxAmount) || 0, type: state.newTxType, date: state.newTxDate, note: state.newTxNote }]),
        newTxCategory: '', newTxAmount: '', newTxType: 'uscita', newTxDate: '', newTxNote: '', showAddTx: false
      });
    },
    removeTx: function (id) { update({ transactions: state.transactions.filter(function (t) { return t.id !== id; }) }); },

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
    printPage: function () { try { window.print(); } catch (e) {} }
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
    html += '</div></div>';

    document.getElementById('app').innerHTML = html;
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
        '<input class="text-input" type="number" step="0.01" data-field="goalCurrentInput" value="' + esc(s.goalCurrentInput) + '" placeholder="Attuale" style="width:110px;background:rgba(250,250,248,0.95);">' +
        '<span style="color:rgba(250,250,248,0.7);">di</span>' +
        '<input class="text-input" type="number" step="0.01" data-field="goalTargetInput" value="' + esc(s.goalTargetInput) + '" placeholder="Obiettivo" style="width:110px;background:rgba(250,250,248,0.95);">' +
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

    var txList = periodTx.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 12).map(function (t) {
      var meta = catMeta(s.expenseCategories.concat(s.incomeCategories), t.category);
      var amountFmt = (t.type === 'entrata' ? '+' : '-') + fmt(t.amount);
      var color = t.type === 'entrata' ? ACCENT : NEGATIVE;
      return '<div class="list-row"><div style="display:flex;align-items:center;gap:10px;">' + avatarHtml(meta, 30) +
        '<div><div style="font-size:14px;font-weight:500;">' + esc(t.category) + '</div><div class="muted" style="font-size:12px;">' + fmtDate(t.date) + ' &middot; ' + esc(t.note || '—') + '</div></div></div>' +
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

    var addTxForm = s.showAddTx ? (
      '<div class="form-box" style="flex-direction:column;align-items:stretch;">' +
      '<select class="text-input" data-field="newTxType" style="width:fit-content;"><option value="uscita"' + (s.newTxType === 'uscita' ? ' selected' : '') + '>Uscita</option><option value="entrata"' + (s.newTxType === 'entrata' ? ' selected' : '') + '>Entrata</option></select>' +
      '<div><div class="muted" style="font-size:13px;margin:10px 0;">Categoria</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(68px,1fr));gap:14px 8px;">' + catGrid + '</div>' +
      '<div class="row" style="margin-top:10px;"><div class="muted" style="font-size:12px;">' + (s.newTxCategory ? 'Categoria: ' + esc(s.newTxCategory) : 'Scegli una categoria qui sopra') + '</div><button class="btn-link" data-action="toggle-manage-cats">Gestisci categorie</button></div></div>' +
      createCatBox + manageBox +
      '<div class="form-box" style="padding:0;margin-top:14px;">' +
      '<input class="text-input" type="number" step="0.01" data-field="newTxAmount" value="' + esc(s.newTxAmount) + '" placeholder="Importo" style="width:110px;">' +
      '<input class="text-input" type="date" data-field="newTxDate" value="' + esc(s.newTxDate) + '">' +
      '<input class="text-input" type="text" data-field="newTxNote" value="' + esc(s.newTxNote) + '" placeholder="Nota (opzionale)" style="flex:1 1 160px;">' +
      '</div><div style="margin-top:14px;"><button class="btn btn-primary" data-action="add-tx">Salva movimento</button></div>' +
      '</div>'
    ) : '';

    return '<div class="card">' +
      '<div class="row" style="flex-wrap:wrap;"><div class="section-title">Entrate e uscite</div>' +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;"><div style="display:flex;gap:4px;background:#F6F5F2;padding:4px;border-radius:10px;">' + periodBtns + '</div>' +
      '<button class="btn btn-ghost" data-action="export-csv">Esporta CSV</button><button class="btn btn-ghost" data-action="print-page">Stampa / PDF</button></div></div>' +
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
        return '<div class="list-row"><div style="display:flex;align-items:center;gap:10px;">' + avatarHtml(meta, 30) + '<span style="font-size:13px;">' + esc(c.name) + '</span></div>' +
          '<div style="display:flex;gap:10px;"><button class="btn-link" data-action="edit-category" data-id="' + c.id + '" data-cattype="' + type + '">Modifica</button>' +
          '<button class="btn-link" data-action="remove-category" data-id="' + c.id + '" data-cattype="' + type + '" style="color:' + NEGATIVE + ';">Elimina</button></div></div>';
      }).join('');
      return '<div><div style="font-size:12px;font-weight:600;color:#6B6862;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.03em;">' + title + '</div><div style="display:flex;flex-direction:column;gap:2px;">' + rows + '</div></div>';
    };
    return '<div style="display:flex;flex-direction:column;gap:14px;padding:14px;background:#FFFFFF;border-radius:10px;border:1px solid #E4E2DC;margin-top:10px;">' +
      block('Categorie di uscita', s.expenseCategories, 'expense') + block('Categorie di entrata', s.incomeCategories, 'income') + '</div>';
  }

  function renderAccounts(s) {
    var cards = s.accounts.map(function (a) {
      var editing = s.editingAccountId === a.id;
      var balanceBlock = editing
        ? '<div style="display:flex;gap:8px;align-items:center;"><input class="text-input" type="number" step="0.01" data-field="editAccountBalanceInput" value="' + esc(s.editAccountBalanceInput) + '" style="width:110px;"><button class="btn btn-primary" data-action="save-edit-balance" data-id="' + a.id + '" style="padding:7px 12px;">Salva</button></div>'
        : '<button data-action="start-edit-balance" data-id="' + a.id + '" style="background:none;border:none;cursor:pointer;padding:0;text-align:left;font-size:19px;font-weight:600;font-family:\'Fraunces\',serif;color:#1E1D1B;">' + fmt(a.balance) + '</button>';
      return '<div style="border:1px solid #E4E2DC;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;">' +
        '<div class="row" style="align-items:flex-start;"><div><div style="font-size:14px;font-weight:600;">' + esc(a.name) + '</div><div class="muted" style="font-size:12px;margin-top:2px;">' + esc(a.bank) + '</div></div>' +
        '<button class="icon-btn" data-action="remove-account" data-id="' + a.id + '" aria-label="Rimuovi conto">' + xIcon() + '</button></div>' +
        balanceBlock +
        '<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:' + (a.excludeFromTotal ? WARN : '#6B6862') + ';cursor:pointer;"><input type="checkbox" data-field="account-exclude-' + a.id + '" data-action="toggle-exclude" data-id="' + a.id + '" ' + (a.excludeFromTotal ? 'checked' : '') + ' style="margin:0;">' + (a.excludeFromTotal ? 'Escluso dal totale' : 'Incluso nel totale') + '</label>' +
        '</div>';
    }).join('');

    var addForm = s.showAddAccount ? (
      '<div class="form-box">' +
      '<input class="text-input" type="text" data-field="newAccountName" value="' + esc(s.newAccountName) + '" placeholder="Nome conto" style="flex:1 1 160px;">' +
      '<input class="text-input" type="text" data-field="newAccountBank" value="' + esc(s.newAccountBank) + '" placeholder="Banca" style="flex:1 1 140px;">' +
      '<input class="text-input" type="number" step="0.01" data-field="newAccountBalance" value="' + esc(s.newAccountBalance) + '" placeholder="Saldo" style="width:120px;">' +
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
      '<input class="text-input" type="number" step="0.01" data-field="transferAmount" value="' + esc(s.transferAmount) + '" placeholder="Importo" style="width:110px;">' +
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
      '<input class="text-input" type="number" step="0.01" data-field="newDebtAmount" value="' + esc(s.newDebtAmount) + '" placeholder="Importo" style="width:110px;">' +
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
      '<input class="text-input" type="number" step="0.01" data-field="newPaymentAmount" value="' + esc(s.newPaymentAmount) + '" placeholder="Importo" style="width:110px;">' +
      '<input class="text-input" type="date" data-field="newPaymentDate" value="' + esc(s.newPaymentDate) + '">' +
      '<select class="text-input" data-field="newPaymentRecurrence"><option value="none"' + (s.newPaymentRecurrence === 'none' ? ' selected' : '') + '>Non ricorrente</option><option value="monthly"' + (s.newPaymentRecurrence === 'monthly' ? ' selected' : '') + '>Ogni mese</option><option value="quarterly"' + (s.newPaymentRecurrence === 'quarterly' ? ' selected' : '') + '>Ogni 3 mesi</option><option value="semiannual"' + (s.newPaymentRecurrence === 'semiannual' ? ' selected' : '') + '>Ogni 6 mesi</option></select>' +
      '</div><div><div class="muted" style="font-size:12px;margin-bottom:8px;">' + (s.newPaymentCategory ? 'Categoria: ' + esc(s.newPaymentCategory) : 'Categoria (opzionale)') + '</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:12px 6px;">' + catGrid + '</div></div>' +
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
        return '<div style="border:1px solid #E4E2DC;border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:flex-start;">' +
          '<div><div style="font-size:14px;font-weight:600;">' + esc(h.name) + '</div><div style="font-size:17px;font-weight:600;margin-top:6px;font-family:\'Fraunces\',serif;">' + fmt(h.value) + '</div><div style="font-size:13px;font-weight:600;margin-top:2px;color:' + (changePct >= 0 ? ACCENT : NEGATIVE) + ';">' + changeFmt + '</div></div>' +
          '<button class="icon-btn" data-action="remove-holding" data-id="' + h.id + '" aria-label="Rimuovi posizione">' + xIcon() + '</button></div>';
      }).join('');
      return '<div style="display:flex;flex-direction:column;gap:12px;padding-bottom:16px;border-bottom:1px solid #F0EFEA;">' +
        '<div class="row"><div style="font-size:14px;font-weight:600;">' + esc(p.name) + ' <span style="font-weight:400;color:#6B6862;">&middot; ' + fmt(subtotal) + '</span></div>' +
        (canRemove ? '<button class="icon-btn" data-action="remove-portfolio" data-id="' + p.id + '" aria-label="Rimuovi portafoglio">' + xIcon() + '</button>' : '') + '</div>' +
        '<div class="grid-fit">' + (holdings || '<div class="muted" style="font-size:13px;">Nessuna posizione.</div>') + '</div></div>';
    }).join('');

    var portfolioOptions = s.portfolios.map(function (p) { return '<option value="' + p.id + '"' + (String(s.newHoldingPortfolioId) === String(p.id) ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('');

    var addHoldingForm = s.showAddHolding ? (
      '<div class="form-box">' +
      '<select class="text-input" data-field="newHoldingPortfolioId">' + portfolioOptions + '</select>' +
      '<input class="text-input" type="text" data-field="newHoldingName" value="' + esc(s.newHoldingName) + '" placeholder="Nome titolo" style="flex:1 1 160px;">' +
      '<input class="text-input" type="number" step="0.01" data-field="newHoldingValue" value="' + esc(s.newHoldingValue) + '" placeholder="Valore attuale" style="width:120px;">' +
      '<input class="text-input" type="number" step="0.1" data-field="newHoldingChange" value="' + esc(s.newHoldingChange) + '" placeholder="Variazione %" style="width:110px;">' +
      '<button class="btn btn-dark" data-action="add-holding">Salva</button></div>'
    ) : '';
    var addPortfolioForm = s.showAddPortfolio ? (
      '<div class="form-box">' +
      '<input class="text-input" type="text" data-field="newPortfolioName" value="' + esc(s.newPortfolioName) + '" placeholder="Nome portafoglio (es. Binance, Directa...)" style="flex:1 1 200px;">' +
      '<button class="btn btn-dark" data-action="add-portfolio">Crea</button></div>'
    ) : '';

    return '<div class="card"><div class="row"><div class="section-title">Portafogli</div><div style="font-size:13px;color:#6B6862;">Totale: <span style="font-weight:600;color:#1E1D1B;">' + fmt(totalPortfolio) + '</span></div></div>' +
      sections +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;"><button class="btn btn-primary" data-action="toggle" data-field="showAddHolding">+ Aggiungi posizione</button><button class="btn btn-ghost" data-action="toggle" data-field="showAddPortfolio">+ Nuovo portafoglio</button></div>' +
      addHoldingForm + addPortfolioForm + '</div>';
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

    document.getElementById('app').addEventListener('click', function (e) {
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
        case 'add-portfolio': App.addPortfolio(); break;
        case 'remove-portfolio': App.removePortfolio(numId); break;
        case 'pick-tx-category': App.pickTxCategory(el.dataset.cat); break;
        case 'add-tx': App.addTx(); break;
        case 'remove-tx': App.removeTx(numId); break;
        case 'toggle-create-cat': App.toggleCreateCat(); break;
        case 'toggle-manage-cats': App.toggleManageCategories(); break;
        case 'pick-cat-color': App.pickCatColor(el.dataset.color); break;
        case 'pick-cat-icon': App.pickCatIcon(el.dataset.icon); break;
        case 'save-category': App.saveCategory(); break;
        case 'edit-category': App.startEditCategory(el.dataset.id, el.dataset.cattype); break;
        case 'remove-category': App.deleteCategory(el.dataset.id, el.dataset.cattype); break;
        case 'export-csv': App.exportCSV(); break;
        case 'print-page': App.printPage(); break;
      }
    });

    document.getElementById('app').addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset && t.dataset.field && t.type !== 'checkbox') App.setField(t.dataset.field, t.value);
    });
    document.getElementById('app').addEventListener('change', function (e) {
      var t = e.target;
      if (t.type === 'checkbox' && t.dataset && t.dataset.action === 'toggle-exclude') {
        App.toggleExcludeAccount(isNaN(Number(t.dataset.id)) ? t.dataset.id : Number(t.dataset.id));
      } else if (t.tagName === 'SELECT' && t.dataset && t.dataset.field) {
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
