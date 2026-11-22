// La sincronizzazione di Le Mie Finanze tra telefono e computer, tramite il tuo Google Drive.
// Il funzionamento (uguale in tutte le mie app) è in sincro/; qui c'è solo quello che riguarda questa app.
// app.js non è un modulo: parla con questo file attraverso window.LeMieFinanze (vedi "ponte" in app.js).
import { creaSincro, conta } from './sincro/sincro.js';

// L'"ID client OAuth" del progetto Google Cloud "Le mie app" (pubblico: identifica l'app, non dà accesso a niente).
export const GOOGLE_CLIENT_ID = '494586901323-p0t3hln8h1rjg8jqhh4a9frl0ncap7h3.apps.googleusercontent.com';

// Cosa si sincronizza. Restano solo su questo dispositivo: le chiavi API, il giorno dell'ultimo backup
// e la versione dei dati. Ogni conto, movimento, debito, pagamento, posizione e categoria si unisce
// per conto suo: vince la modifica più recente.
export const SCHEMA = {
  raccolte: [
    { percorso: 'accounts', chiave: x => x.id },
    { percorso: 'transactions', chiave: x => x.id },
    { percorso: 'debts', chiave: x => x.id },
    { percorso: 'upcoming', chiave: x => x.id },
    { percorso: 'portfolios', chiave: x => x.id },
    { percorso: 'portfolio', chiave: x => x.id },
    { percorso: 'expenseCategories', chiave: x => x.id },
    { percorso: 'incomeCategories', chiave: x => x.id },
    { percorso: 'history', chiave: x => x.m }
  ],
  singoli: ['goal', 'transferLog']
};

const plurale = (n, uno, tanti) => `${n} ${n === 1 ? uno : tanti}`;
function descrivi(p) {
  const n = conta(p);
  return [plurale(n.accounts || 0, 'conto', 'conti'), plurale(n.transactions || 0, 'movimento', 'movimenti')].join(' e ');
}

export function avvia(ponte = window.LeMieFinanze) {
  if (!ponte) return null;
  const sincro = creaSincro({
    prefisso: 'finanze',
    nomeFile: 'finanze.json',
    schema: SCHEMA,
    clientId: GOOGLE_CLIENT_ID,
    leggiDati: () => ponte.leggi(),
    scriviDati: nuovi => ponte.scrivi(nuovi),
    descrivi,
    chiediPrimaUnione: async ({ qui, account }) => {
      if (confirm(`Sul tuo account ci sono già dei dati: ${account}. Su questo dispositivo: ${qui}.\n\nVuoi UNIRLI (tenere tutti e due)?`)) return 'unisci';
      if (confirm('Allora vuoi usare SOLO quelli dell’account? Quelli di questo dispositivo verranno sostituiti.\n\n(Annulla = non collegare per ora)')) return 'account';
      return 'annulla';
    }
  });
  ponte.quandoSalva(() => sincro.dopoSalvataggio());
  sincro.ascolta(() => ponte.ridisegna());
  ponte.collegaSincro(sincro);
  sincro.avvia();
  return sincro;
}

if (typeof window !== 'undefined' && window.LeMieFinanze) avvia();
