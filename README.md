# xAI Grok Voice Agent PWA

Una Progressive Web App per interagire con l'agente vocale Grok di xAI tramite WebSocket real-time API.

## 🚀 Avvio Rapido

### 1. Installazione Dipendenze

```bash
npm install
```

### 2. Avvio in Modalità Sviluppo

```bash
npm run dev
```

L'app sarà disponibile su: **http://localhost:5173/**

### 3. Build per Produzione

```bash
npm run build
```

Output nella cartella `dist/`

### 4. Anteprima Build Produzione

```bash
npm run preview
```

---

## 📋 Prerequisiti

- **Node.js** 18+ 
- **xAI API Key** - Ottenibile da [xAI Console](https://console.x.ai/)
- **Browser moderno** - Chrome, Edge, Firefox (con supporto WebSocket e AudioWorklet)

---

## 🎯 Guida all'Utilizzo

### Connessione all'API xAI

1. **Apri l'app** nel browser
2. Vai nella scheda **Basic** nel pannello impostazioni
3. **Inserisci la tua API Key** nel campo dedicato
4. Clicca sul pulsante **"Connect"** nel TopBar

### Conversazione Vocale

1. Una volta connesso, **fai click sul pulsante centrale** grande (pulsante del microfono)
2. **Parla** con l'assistente Grok - la VAD (Voice Activity Detection) rileva automaticamente quando inizi e finisci di parlare
3. L'assistente risponderà vocalmente
4. Per **interrompere** l'assistente (barge-in), parla di nuovo o clicca sul pulsante centrale

### Controlli Audio

- **Microfono On/Off**: Usa l'interruttore nel TopBar per disattivare temporaneamente il microfono
- **VU Meter**: Visualizza i livelli audio di input (microfono) e output (risposta)
- **Barge-in**: Interrompi la riproduzione parlando - il sistema rileva la nuova voce e ferma l'output precedente

---

## ⚙️ Pannello Impostazioni

### Scheda Basic

| Impostazione | Descrizione |
|--------------|-------------|
| **API Key** | Chiave API xAI per autenticazione |
| **Voice** | Seleziona la voce: `alloy`, `ash`, `ballad`, `charcoal`, `converse`, `echo`, `emerald`, `eve`, `fern`, `fable`, `onyx`, `nova`, `sand`, `shimmer` |
| **Instructions** | Istruzioni di sistema per personalizzare il comportamento dell'assistente |

### Scheda Advanced

#### Voice Activity Detection (VAD)

| Impostazione | Valore Default | Descrizione |
|--------------|----------------|-------------|
| **Threshold** | 0.85 | Soglia di sensibilità VAD (0.1-0.9). Valori più alti = meno sensibile |
| **Silence Duration** | 500ms | Tempo di silenzio dopo il quale termina il turno |
| **Prefix Padding** | 333ms | Quantità di audio pre-vocalizzazione da includere |

#### Audio Settings

| Impostazione | Valore Default |
|--------------|----------------|
| **Input Sample Rate** | 24000 Hz |
| **Output Sample Rate** | 24000 Hz |

#### Tools

Attiva/disattiva gli strumenti disponibili:

- **web_search** - Ricerca web
- **x_search** - Ricerca su X
- **file_search** - Ricerca file/vettoriale
- **mcp** - Model Context Protocol
- **function** - Funzioni personalizzate

### Scheda Developer

- **Event Log**: Visualizza in tempo reale tutti gli eventi WebSocket (input/output)
- **Connection Endpoint**: Configura l'endpoint wss:// (default: `wss://api.x.ai/v1/realtime`)
- **Config JSON**: Editor Monaco per modificare manualmente la configurazione JSON

---

## 🖥️ Struttura UI

```
┌─────────────────────────────────────────────────────────────────┐
│  TopBar                                                          │
│  [Logo] [Status] [API Key Status] [Mic Toggle] [Settings] [Logs] │
├──────────┬────────────────────────────────┬──────────────────────┤
│ Sidebar │ Center Panel                   │ Right Panel          │
│          │                                │                      │
│ [Voice] │  ┌──────────────────────────┐  │ [Transcript]         │
│ [VAD]   │  │                          │  │                      │
│ [Tools] │  │      Pulsante grande     │  │ [Session Controls]   │
│          │  │      per interagire     │  │                      │
│          │  │      con l'assistente   │  │ [Connection Info]    │
│          │  │                          │  │                      │
│          │  └──────────────────────────┘  │                      │
│          │                                │                      │
│          │  [VU Meter Input] [VU Output]  │                      │
└──────────┴────────────────────────────────┴──────────────────────┘
```

---

## 🔧 Struttura Tecnica

### Stack Tecnologico

- **React 18** - UI Framework
- **Vite 6** - Build tool
- **TypeScript** - Type safety
- **Zustand** - State management
- **Tailwind CSS v4** - Styling
- **VitePWA** - Progressive Web App support

### Architettura State Management

| Store | Responsabilità |
|-------|----------------|
| `sessionStore` | Configurazione sessione, stato connessione |
| `audioStore` | Stato microfono, playback, livelli RMS |
| `uiStore` | UI state, sidebar, log drawer |
| `logStore` | Eventi WebSocket, log debugging |
| `transcriptStore` | Cronologia conversazione |

### Servizi Core

| Servizio | Descrizione |
|----------|-------------|
| `wsService` | Gestione WebSocket con riconnessione automatica |
| `audioService` | Cattura audio, riproduzione, VU metering |
| `functionRegistry` | Gestione tool function |

---

## 🔄 Gestione Connessione

### Stati Connessione

| Stato | Descrizione |
|-------|-------------|
| `IDLE` | Disconnesso |
| `CONNECTING` | Connessione in corso |
| `CONNECTED` | Connesso e pronto |
| `RECONNECTING` | Riconnessione automatica |
| `RESETTING` | Reset sessione |
| `ERROR` | Errore di connessione |

### Logica Riconnessione

- **Ritardo iniziale**: 1 secondo
- **Backoff esponenziale**: x2 ogni tentativo
- **Massimo ritardo**: 32 secondi
- **Ritardo massimo con jitter**: 60 secondi

---

## 📱 Installazione PWA (Offline)

1. Apri l'app nel browser Chrome/Edge
2. Clicca sull'icona di installazione nella barra degli indirizzi
3. L'app sarà disponibile come applicazione desktop/mobile

### Funzionalità Offline

- Cache di tutte le risorse statiche
- Service Worker per caching avanzato
- Funzionamento base senza connessione (richiede comunque API xAI)

---

## 🔐 Sicurezza

- L'API Key viene salvata in `localStorage` del browser
- Comunicazione solo via HTTPS/wss
- Nessun dato inviato a server terzi

---

## 🐛 Troubleshooting

### "Microphone access denied"
- Verifica di aver concesso i permessi del microfono
- Controlla che nessun altra app stia usando il microfono

### "Connection failed"
- Verifica la validità della API Key
- Controlla la connessione internet
- Verifica che non ci siano firewall che bloccano wss://api.x.ai

### "Audio playback failed"
- Assicurati che il browser supporti Web Audio API
- Prova a ricaricare la pagina

### "VAD not triggering"
- Abbassa la soglia threshold nella scheda Advanced
- Avvicinati al microfono
- Riduci il rumore ambientale

---

## 📄 License

MIT License - Vedi LICENSE file per dettagli.