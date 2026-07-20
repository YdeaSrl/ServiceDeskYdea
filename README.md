# 🏋️ Scheda di Allenamento (PWA)

Web app **PWA** molto semplice per gestire la tua scheda di allenamento:
vedere gli esercizi, far partire i **timer di recupero** e **conteggiare le ripetizioni**.

- HTML/CSS/JS puro — **nessuna dipendenza, nessun build**.
- Funziona **offline** (service worker) ed è **installabile** su telefono/desktop.
- I dati (scheda e progressi) sono salvati **solo sul tuo dispositivo** (`localStorage`).

## Funzionalità

- **Scheda**: giornate di allenamento con esercizi (serie × ripetizioni, recupero, peso, note).
- **Contatore ripetizioni/serie** per l'esercizio in corso, con indicatori delle serie completate.
- **Timer di recupero**: countdown con avvio/pausa/reset, preset rapidi (30/60/90/120/180 s),
  regolazione ±15 s, **beep** e **vibrazione** a fine tempo.
- **Modifica**: aggiungi/modifica/elimina giornate ed esercizi. È inclusa una scheda di esempio,
  che puoi sostituire con la tua. Pulsante "Ripristina esempio" per ripartire da zero.

## Avvio in locale

Serve un piccolo server statico (il service worker non funziona aprendo il file
direttamente con `file://`, ma funziona su `localhost`):

```bash
# dalla cartella del progetto
python3 -m http.server 8000
```

Poi apri **http://localhost:8000** nel browser.

In alternativa, con Node:

```bash
npx serve .
```

## Installazione come app

Apri l'app in Chrome/Edge/Safari e usa "**Installa app**" / "**Aggiungi alla schermata Home**".
Da installata parte a schermo intero e funziona anche senza connessione.

## Struttura

```
index.html              # markup e viste (Scheda / Timer / Modifica)
css/style.css           # stile mobile-first, tema chiaro/scuro automatico
js/data.js              # scheda di esempio precaricata
js/store.js             # salvataggio su localStorage
js/timer.js             # logica del timer di recupero
js/app.js               # rendering, navigazione, contatore, editor
manifest.webmanifest    # metadati PWA
sw.js                   # service worker (cache offline)
icons/                  # icone dell'app
```

## Note

- I dati restano sul dispositivo: svuotando i dati del browser si azzera anche la scheda.
- Nessun account, nessun server, nessuna sincronizzazione cloud (per ora).
