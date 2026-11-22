# Le Mie Finanze

App personale di finanza (conti correnti, entrate/uscite, debiti e crediti, pagamenti futuri, portafoglio investimenti) — pensata per uso **privato**, non pubblico.

Nata come [Claude Artifact](https://claude.ai) e portata in HTML/CSS/JS puro come **Progressive Web App (PWA)**, installabile sul telefono come un'app vera.

## Importante: dove vivono i tuoi dati

Tutti i dati che inserisci (conti, spese, debiti...) restano **solo nel browser del tuo telefono** (`localStorage`). Non vengono mai inviati a un server: questo repository contiene solo il codice dell'app vuota, mai le tue informazioni finanziarie.

Per lo stesso motivo: se disinstalli l'app o cancelli i dati del browser, i dati inseriti si perdono. Usa "Esporta backup (.json)" in fondo alla pagina: l'app te lo ricorda se l'ultimo backup ha più di 30 giorni. Il backup non contiene le chiavi API.

## Cosa fa

- **Entrate e uscite** per categoria, con periodi a scelta, import da CSV/Excel/PDF (anche export Trade Republic e Isybank) e controllo dei doppioni.
- **Giroconti e compravendita di titoli** restano fuori da entrate/uscite: aggiornano il saldo ma non contano come spese (categorie "Fuori dai totali", modificabili in "Gestisci categorie").
- **Mese per mese**: grafico degli ultimi 12 mesi, confronto delle categorie con il mese prima e **budget mensili** per categoria.
- **Patrimonio netto** (conti + portafogli + crediti − debiti) con **storico mensile** automatico e grafico.
- **Portafogli** con prezzo di carico (guadagno/perdita) e aggiornamento prezzi: crypto con CoinGecko, ETF europei con Alpha Vantage (ticker tipo `VWCE.DEX`), azioni USA con Twelve Data (convertite in euro).
- **Aspetto**: 4 temi (Verde, Blu notte, Scuro, Minimal) scelti in fondo alla pagina, sotto "Aspetto". Con "Auto" (l'opzione di default) l'app segue in automatico la modalità scura del telefono, anche dal vivo se la cambi mentre l'app è aperta.

## Pubblicare un aggiornamento

Basta caricare i file modificati su GitHub: dopo 1–2 minuti (il tempo che GitHub Pages pubblica) l'app sul telefono usa la nuova versione alla prima apertura con internet. Offline usa l'ultima versione salvata. Se modifichi `sw.js`, cambia anche il suo `CACHE_NAME` (es. `v4` → `v5`). Il numero di versione visibile in fondo alla pagina è `APP_VERSION` in `app.js`.

## Come installarla sul telefono

1. Apri l'URL di GitHub Pages di questo progetto nel browser del telefono (Safari su iPhone, Chrome su Android).
2. **iPhone (Safari):** tocca l'icona di condivisione (il quadrato con la freccia) → "Aggiungi a Home".
3. **Android (Chrome):** tocca il menu (⋮) → "Aggiungi a schermata Home" (o comparirà un banner automatico "Installa app").
4. L'app apparirà come icona sulla home, si aprirà a schermo intero senza barra del browser e funzionerà anche offline dopo il primo caricamento.

## Sviluppo locale

Non serve alcun build. Basta servire la cartella con un qualsiasi server statico (per il service worker serve un'origine `http://localhost` o HTTPS, non `file://`), ad esempio con l'estensione "Live Server" di VS Code, oppure con `npx serve` se hai Node installato.

## Telefono e computer: la sincronizzazione

In *Aspetto, backup e altro* c'è **Accedi con Google**: con lo stesso account sul telefono
e sul computer i dati restano uguali. Funziona così:

- i dati vanno in un file nella **cartella nascosta dell'app sul tuo Google Drive** (`appDataFolder`): non compare tra i file
  del Drive e l'app non può vedere nient'altro. Il permesso chiesto è solo `drive.appdata` (più `email`, per mostrare l'account);
- si sincronizza all'apertura, qualche secondo dopo ogni modifica, tornando sull'app e quando torna la connessione;
- l'accesso fatto dal browser dura **un'ora**: dopo, in Oggi compare **Sincronizza** e basta un tocco. Intanto i dati restano
  salvati sul dispositivo, come sempre;
- ogni elemento (conto, movimento, debito, pagamento, posizione, categoria) ha la sua data di modifica: unendo due copie vince la più recente,
  e una cosa eliminata non "risorge" dall'altro dispositivo. La prima volta che un dispositivo con dati suoi si collega,
  l'app chiede se unirli a quelli dell'account o usare solo quelli dell'account;
- restano solo sul dispositivo: le chiavi API, il giorno dell'ultimo backup e la versione dei dati;
- i pagamenti futuri registrati in automatico hanno un id che dipende solo dal pagamento e dal giorno: se telefono e
  computer li registrano tutti e due, diventano un solo movimento. Il saldo di un conto modificato su due dispositivi
  mentre uno è senza connessione tiene l'ultima modifica.

Il codice è in `sincro/` (uguale in tutte le mie app: `registro.js` capisce cosa è cambiato e unisce le copie,
`google.js` fa l'accesso, `drive.js` legge e scrive il file, `sincro.js` mette insieme tutto) e in `sincronizzazione.js`
(cosa si sincronizza in questa app). L'ID client OAuth del progetto Google Cloud "Le mie app" è in `sincronizzazione.js`:
è pubblico. Il *client secret* non serve e non va mai messo nel codice.
