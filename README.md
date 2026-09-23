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

## Pubblicare un aggiornamento

Quando modifichi il codice, aumenta `CACHE_NAME` in `sw.js` (es. `v2` → `v3`): così i telefoni scaricano la nuova versione e l'app mostra "Aggiorna".

## Come installarla sul telefono

1. Apri l'URL di GitHub Pages di questo progetto nel browser del telefono (Safari su iPhone, Chrome su Android).
2. **iPhone (Safari):** tocca l'icona di condivisione (il quadrato con la freccia) → "Aggiungi a Home".
3. **Android (Chrome):** tocca il menu (⋮) → "Aggiungi a schermata Home" (o comparirà un banner automatico "Installa app").
4. L'app apparirà come icona sulla home, si aprirà a schermo intero senza barra del browser e funzionerà anche offline dopo il primo caricamento.

## Sviluppo locale

Non serve alcun build. Basta servire la cartella con un qualsiasi server statico (per il service worker serve un'origine `http://localhost` o HTTPS, non `file://`), ad esempio con l'estensione "Live Server" di VS Code, oppure con `npx serve` se hai Node installato.
