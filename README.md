# Le Mie Finanze

App personale di finanza (conti correnti, entrate/uscite, debiti e crediti, pagamenti futuri, portafoglio investimenti) — pensata per uso **privato**, non pubblico.

Nata come [Claude Artifact](https://claude.ai) e portata in HTML/CSS/JS puro come **Progressive Web App (PWA)**, installabile sul telefono come un'app vera.

## Importante: dove vivono i tuoi dati

Tutti i dati che inserisci (conti, spese, debiti...) restano **solo nel browser del tuo telefono** (`localStorage`). Non vengono mai inviati a un server: questo repository contiene solo il codice dell'app vuota, mai le tue informazioni finanziarie.

Per lo stesso motivo: se disinstalli l'app o cancelli i dati del browser, i dati inseriti si perdono. Usa "Esporta CSV" ogni tanto per un backup dei movimenti.

## Come installarla sul telefono

1. Apri l'URL di GitHub Pages di questo progetto nel browser del telefono (Safari su iPhone, Chrome su Android).
2. **iPhone (Safari):** tocca l'icona di condivisione (il quadrato con la freccia) → "Aggiungi a Home".
3. **Android (Chrome):** tocca il menu (⋮) → "Aggiungi a schermata Home" (o comparirà un banner automatico "Installa app").
4. L'app apparirà come icona sulla home, si aprirà a schermo intero senza barra del browser e funzionerà anche offline dopo il primo caricamento.

## Sviluppo locale

Non serve alcun build. Basta servire la cartella con un qualsiasi server statico (per il service worker serve un'origine `http://localhost` o HTTPS, non `file://`), ad esempio con l'estensione "Live Server" di VS Code, oppure con `npx serve` se hai Node installato.
