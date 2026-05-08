# xAI Grok Voice Agent — PWA: PRD & Technical Specification

> **Versione:** 1.0  
> **Data:** 2026-05-08  
> **Destinatari:** Team di sviluppo interno  
> **Classificazione:** Uso interno — Non distribuire  

---

## 1. Executive Summary

Questo documento definisce il Product Requirements Document (PRD) e la Technical Specification completa per la realizzazione di una Progressive Web App (PWA) che espone l'interfaccia vocale realtime di xAI (modello `grok-voice-think-fast-1.0`) al team interno, con massima configurabilità via GUI e forte osservabilità tecnica. L'app ha profilo da *developer playground*, adatto a un team tecnico che deve testare, configurare e monitorare sessioni vocali realtime con il modello Grok.

La PWA è progettata come base quasi production-ready, con architettura React/Vite, trasporto WebSocket verso `wss://api.x.ai/v1/realtime`, turn detection server-side VAD, supporto completo a tutti i tipi di tool disponibili (`web_search`, `x_search`, `file_search`, `mcp`, `function`), transcript read-only a scopo diagnostico, reconnect automatico con exponential backoff e buffering audio, e stato completamente volatile (nessun storage persistente applicativo).

---

## 2. Obiettivi di prodotto

### 2.1 Obiettivo primario

Fornire al team interno uno strumento interattivo per interagire vocalmente con il modello xAI Grok Voice Agent, controllare in tempo reale tutti i parametri di sessione esposti dall'API, osservare il flusso di eventi WebSocket e il comportamento del modello durante le sessioni.

### 2.2 Obiettivi secondari

- Validare configurazioni di sessione prima di integrarle in altri sistemi.
- Testare strumenti (`tools`) nativi e custom `function` in contesti vocali reali.
- Costruire una base di codice riutilizzabile per future integrazioni voce.
- Documentare in tempo reale il comportamento dell'API tramite event log.

### 2.3 Non obiettivi (out of scope v1)

- Autenticazione e gestione utenti.
- Sicurezza avanzata, cifratura dei dati applicativi, audit log persistente.
- Supporto multiutente o sessioni condivise.
- Persistenza di trascrizioni, log o configurazioni tra sessioni.
- Deployment su infrastruttura pubblica.

---

## 3. Utenti target

**Unico profilo:** Team interno tecnico — developer, integratori, product manager tecnici. Gli utenti conoscono le API REST/WebSocket, comprendono concetti come VAD, PCM, WebSocket events, JSON Schema e tool calling.

---

## 4. PRD Funzionale

### 4.1 Overview funzionale

L'app è composta da quattro macro-funzionalità:

1. **Voice Session** — gestione della connessione WebSocket, streaming audio bidirezionale e interazione vocale con il modello.
2. **Settings Panel** — configurazione live di tutti i parametri di sessione tramite GUI strutturata (Basic → Advanced → Developer).
3. **Transcript View** — visualizzazione read-only del transcript di conversazione (solo uso diagnostico, non input).
4. **Event Log Drawer** — console di eventi WebSocket in formato human-readable e JSON raw.

### 4.2 Voice Session

#### 4.2.1 Connessione

- L'utente avvia la sessione tramite pulsante **Connect**.
- L'app apre una connessione WebSocket verso `wss://api.x.ai/v1/realtime?model=grok-voice-think-fast-1.0`.
- L'autenticazione avviene tramite API key passata nel protocollo WebSocket (`xai-client-secret.<TOKEN>`) — conforme alla restrizione browser che non consente header HTTP su WebSocket.
- Nota per i developer: il browser non può inviare header `Authorization` su WebSocket. La chiave deve essere passata come parametro del sub-protocollo WebSocket. Per ambienti production si raccomanda di generare ephemeral token lato server, ma questo è fuori scope v1.
- Appena il WebSocket è aperto, l'app invia `session.update` con tutti i parametri correnti della GUI.
- In parallelo alla connessione WebSocket, la cattura microfono parte subito (best practice xAI[cite:2]), con audio bufferizzato e inviato al WebSocket al momento dell'`open` event.

#### 4.2.2 Interazione vocale

- Modalità: **VAD automatico (server_vad)** — il modello rileva automaticamente la fine del turno utente.
- L'utente non deve premere alcun pulsante per parlare; il sistema è sempre in ascolto quando la sessione è attiva.
- **Barge-in**: se il modello sta producendo audio in output e l'utente inizia a parlare, il playback viene interrotto immediatamente e l'app torna in ascolto (`stop immediato playback + continua ascolto`).
- La sequenza di barge-in lato client è:
  1. Rilevazione VAD attività microfono mentre playback in corso.
  2. Stop immediato `AudioContext` output (drain del buffer).
  3. Continuazione `input_audio_buffer.append` normalmente — il server gestisce il barge-in lato VAD.

#### 4.2.3 Reset sessione

- Pulsante **Reset** sempre visibile nel top bar.
- Il reset svuota: contesto conversazionale, transcript visuale, buffer audio input e output, stato UI, log locale in memoria.
- Dopo il reset, la sessione WebSocket rimane aperta e viene reinizializzata con `session.update` usando le impostazioni correnti della GUI — non è richiesta una riconnessione.

#### 4.2.4 Disconnessione

- Pulsante **Disconnect** nel top bar.
- Chiude ordinatamente il WebSocket, ferma la cattura microfono e svuota tutti i buffer.

#### 4.2.5 Reconnect automatico

- In caso di chiusura inattesa del WebSocket (codice di errore, timeout, perdita rete), l'app tenta la riconnessione con **exponential backoff**: tentativi a 1s, 2s, 4s, 8s, 16s, poi con cap a 30s.
- Durante il tentativo di reconnect, la cattura audio continua e i campioni vengono bufferizzati in memoria.
- Al ripristino della connessione, l'app invia `session.update` e poi esegue il flush del buffer audio accumulato.
- Dopo 5 tentativi falliti, l'app mostra un errore esplicito e richiede azione manuale.
- Il top bar mostra lo stato: `Connected`, `Reconnecting (1/5)...`, `Disconnected`, `Error`.

### 4.3 Settings Panel

Il pannello delle impostazioni è organizzato in tre tab: **Basic**, **Advanced**, **Developer**.

#### Tab Basic

| Parametro | Tipo controllo | Valore default | Note |
|---|---|---|---|
| Voice | Select | `eve` | Opzioni: `eve`, `ara`, `rex`, `sal`, `leo` + campo libero custom voice ID |
| Instructions (system prompt) | Textarea | `"You are a helpful assistant."` | Modifica live, applicata via `session.update` |
| Language hint | Select | `(auto)` | Lista delle 20+ lingue supportate; se selezionata, aggiunta alle instructions |

#### Tab Advanced

| Parametro | Tipo controllo | Valore default | Note |
|---|---|---|---|
| VAD Threshold | Slider 0.1–0.9 | `0.85` | `turn_detection.threshold` |
| Silence duration | Slider 0–10000 ms | `500` | `turn_detection.silence_duration_ms` |
| Prefix padding | Slider 0–1000 ms | `333` | `turn_detection.prefix_padding_ms` |
| Audio input sample rate | Select | `24000` | Opzioni: 8000, 16000, 22050, 24000, 32000, 44100, 48000 |
| Audio output sample rate | Select | `24000` | Stesso set di opzioni |
| Tools configurati | Lista tools con toggle | tutti off | Vedi sezione 4.4 |

#### Tab Developer

| Parametro / Area | Tipo controllo | Note |
|---|---|---|
| Raw JSON session config | Editor JSON (monaco o textarea) | Mostra il JSON corrente della sessione; modificabile; sincronizzato con i controlli Basic/Advanced |
| Apply JSON | Pulsante | Invia il JSON corrente dell'editor come `session.update` |
| Diff viewer | Area read-only | Mostra differenza tra config attuale e ultimo `session.update` inviato |

#### Modifica live

Ogni modifica in Basic o Advanced invia immediatamente un `session.update` senza richiedere riconnessione. Il JSON dell'editor Developer si aggiorna di conseguenza. Se il JSON viene modificato manualmente nell'editor e applicato, i controlli Basic/Advanced si aggiornano di riflesso.

### 4.4 Tools

La configurazione degli strumenti è accessibile dal tab Advanced tramite lista di tool con toggle di abilitazione. Per ogni tool abilitato appare una form dedicata.

#### web_search

- Nessun parametro obbligatorio.
- Campo opzionale: `allowed_domains` (lista testuale, opzionale).

#### x_search

- Campo: `allowed_x_handles` — lista di handle separati da virgola (opzionale).

#### file_search

- Campo: `vector_store_ids` — lista di collection ID separati da virgola.
- Campo: `max_num_results` — numero intero, default `10`.

#### mcp

- Campo: `server_url` — URL del server MCP (Streaming HTTP o SSE).
- Campo: `server_label` — etichetta identificativa.
- Campo opzionale: `server_description`.
- Campo opzionale: `allowed_tools` — lista di nomi tool permessi.
- Campo opzionale: `authorization` — Bearer token.
- Pulsante **+ Add MCP server** per configurare multiple istanze MCP.

#### function (custom)

- Lista di function tools registrati nel mock registry.
- Pulsante **+ Add function** per definire un nuovo function tool con:
  - `name`
  - `description`
  - `parameters` (editor JSON Schema)
  - `mock implementation` (corpo JS da eseguire nel browser come mock)
- Il mock registry è in memoria volatile.
- Il contratto function call è gestito lato app (vedi sezione 5.6).

> **Nota architetturale — tool server-side vs client-side:**  
> I tool `web_search`, `x_search`, `file_search` e `mcp` sono **server-managed**: xAI gestisce l'esecuzione in modo automatico, il client non deve gestire eventi di risposta per questi tool.  
> I tool `function` sono **client-managed**: il client deve intercettare `response.function_call_arguments.done`, eseguire il mock, inviare `conversation.item.create` con `function_call_output` e infine `response.create` (dopo il completamento del playback audio).

### 4.5 Transcript View

- Pannello centrale, read-only.
- Mostra il transcript della conversazione in tempo reale, con distinzione visiva tra turni utente e turni modello.
- Il transcript è costruito dagli eventi `conversation.item.input_audio_transcription.completed` (per l'utente) e `response.text.delta` (per il modello).
- Non è un canale di input; l'utente non può digitare nel transcript.
- Svuotato completamente al reset.

### 4.6 Event Log Drawer

- Drawer a scorrimento verticale posizionato nella parte inferiore dell'app, collassabile/espandibile.
- Ogni evento WebSocket ricevuto o inviato viene aggiunto al log in tempo reale.
- Visualizzazione dual-mode con toggle:
  - **Human-readable**: tipo evento, timestamp, summary del contenuto.
  - **Raw JSON**: payload JSON completo dell'evento.
- Colore degli eventi per categoria: eventi audio (`blue`), eventi function call (`orange`), eventi di sessione/config (`teal`), errori (`red`), eventi di stato connessione (`grey`).
- Pulsante **Clear log**.
- Pulsante **Copy all** (copia in clipboard tutti gli eventi in JSON newline-delimited).
- Log volatile: svuotato al reset e alla disconnessione.

### 4.7 VU Meter e audio feedback

- VU meter input (microfono) sempre visibile quando sessione attiva: barra verticale o orizzontale con livello RMS aggiornato a ~30fps.
- VU meter output (playback): barra analoga per il segnale in uscita dal modello.
- Indicatore stato microfono: `Listening`, `VAD active`, `Muted` (se mic silenziata manualmente).
- Indicatore stato playback: `Playing`, `Idle`, `Buffering`.

### 4.8 Layout a 3 pannelli

```
┌──────────────────────────────────────────────────────────────────┐
│  TOP BAR: stato connessione | modello | VU input | VU output     │
│           [Connect] [Disconnect] [Reset]                         │
├───────────────────────┬─────────────────────────────────────────┤
│  LEFT SIDEBAR         │  CENTER: TRANSCRIPT                     │
│  - Navigation tabs    │  [utente] ...                           │
│    Voice Session      │  [modello] ...                          │
│    Settings           │  Aggiornato in realtime                 │
│    About              │                                         │
│                       ├──────────────── RIGHT PANEL ────────────┤
│                       │  Tab: Basic | Advanced | Developer       │
│                       │  [form parametri sessione]              │
│                       │                                         │
├───────────────────────┴─────────────────────────────────────────┤
│  DRAWER LOG (collassabile)                                       │
│  [Human-readable ↔ Raw JSON] [Clear] [Copy all]                 │
│  evento 1... evento 2... evento N...                             │
└──────────────────────────────────────────────────────────────────┘
```

### 4.9 PWA requirements

- Web App Manifest con nome, icona, `display: standalone`, `start_url`.
- Service Worker per caching degli asset statici (strategia Cache-First per JS/CSS/fonts).
- Installabile su desktop (Chrome, Edge) e mobile (iOS Safari, Android Chrome).
- Offline: se offline, mostrare schermata "Connessione assente — la sessione vocale richiede rete".

---

## 5. Technical Specification

### 5.1 Stack tecnologico

| Layer | Tecnologia | Note |
|---|---|---|
| Frontend framework | React 18+ con Vite 5+ | TypeScript obbligatorio |
| PWA | `vite-plugin-pwa` (Workbox) | Manifest e Service Worker generati automaticamente |
| State management | Zustand | Store separati per `sessionState`, `audioState`, `uiState`, `logState` |
| UI components | Shadcn/ui + Tailwind CSS v4 | Design system consistente, temi dark/light |
| Audio | Web Audio API nativa | AudioContext, MediaDevices, ScriptProcessor o AudioWorklet |
| WebSocket | API nativa browser | Nessuna libreria wrapper |
| Code editor (Developer tab) | Monaco Editor (via CDN/npm) | Per l'editor JSON raw |
| Icon set | Lucide React | |
| Build | Vite | Output: static files deployabili su qualsiasi hosting |
| Lint | ESLint + Prettier | |

### 5.2 Struttura progetto

```
grok-voice-pwa/
├── public/
│   ├── manifest.webmanifest
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── CenterPanel.tsx
│   │   │   ├── RightPanel.tsx
│   │   │   └── LogDrawer.tsx
│   │   ├── voice/
│   │   │   ├── ConnectButton.tsx
│   │   │   ├── ResetButton.tsx
│   │   │   ├── VUMeter.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── transcript/
│   │   │   ├── TranscriptView.tsx
│   │   │   └── TranscriptMessage.tsx
│   │   ├── settings/
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── tabs/
│   │   │   │   ├── BasicTab.tsx
│   │   │   │   ├── AdvancedTab.tsx
│   │   │   │   └── DeveloperTab.tsx
│   │   │   └── tools/
│   │   │       ├── WebSearchForm.tsx
│   │   │       ├── XSearchForm.tsx
│   │   │       ├── FileSearchForm.tsx
│   │   │       ├── McpForm.tsx
│   │   │       └── FunctionToolForm.tsx
│   │   └── log/
│   │       ├── EventLog.tsx
│   │       └── EventLogItem.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   ├── useAudio.ts
│   │   ├── useReconnect.ts
│   │   └── useVUMeter.ts
│   ├── stores/
│   │   ├── sessionStore.ts
│   │   ├── audioStore.ts
│   │   ├── uiStore.ts
│   │   └── logStore.ts
│   ├── services/
│   │   ├── wsService.ts
│   │   ├── audioService.ts
│   │   └── functionRegistry.ts
│   ├── types/
│   │   ├── xai.ts
│   │   └── session.ts
│   └── utils/
│       ├── pcm.ts
│       ├── base64.ts
│       └── backoff.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 5.3 Modello dati — SessionConfig

```typescript
// src/types/session.ts

export type AudioFormat = {
  type: "audio/pcm" | "audio/pcmu" | "audio/pcma";
  rate?: 8000 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000;
};

export type TurnDetection = {
  type: "server_vad" | null;
  threshold?: number;        // 0.1–0.9, default 0.85
  silence_duration_ms?: number; // 0–10000
  prefix_padding_ms?: number;   // 0–10000, default 333
};

export type WebSearchTool = {
  type: "web_search";
  allowed_domains?: string[];
};

export type XSearchTool = {
  type: "x_search";
  allowed_x_handles?: string[];
};

export type FileSearchTool = {
  type: "file_search";
  vector_store_ids: string[];
  max_num_results?: number; // default 10
};

export type McpTool = {
  type: "mcp";
  server_url: string;
  server_label: string;
  server_description?: string;
  allowed_tools?: string[];
  authorization?: string;
  headers?: Record<string, string>;
};

export type FunctionTool = {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
};

export type Tool =
  | WebSearchTool
  | XSearchTool
  | FileSearchTool
  | McpTool
  | FunctionTool;

export type SessionConfig = {
  voice: "eve" | "ara" | "rex" | "sal" | "leo" | string;
  instructions: string;
  turn_detection: TurnDetection;
  audio: {
    input: { format: AudioFormat };
    output: { format: AudioFormat };
  };
  tools: Tool[];
};

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  voice: "eve",
  instructions: "You are a helpful assistant.",
  turn_detection: {
    type: "server_vad",
    threshold: 0.85,
    silence_duration_ms: 500,
    prefix_padding_ms: 333,
  },
  audio: {
    input: { format: { type: "audio/pcm", rate: 24000 } },
    output: { format: { type: "audio/pcm", rate: 24000 } },
  },
  tools: [],
};
```

### 5.4 WebSocket Service

```typescript
// src/services/wsService.ts — contratto essenziale

const WS_ENDPOINT = "wss://api.x.ai/v1/realtime";
const WS_MODEL = "grok-voice-think-fast-1.0";

export class WsService {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private onEvent: (event: XaiEvent) => void;

  connect(apiKey: string, sessionConfig: SessionConfig): void {
    // Browser non supporta Authorization header su WS.
    // L'API key viene passata come sub-protocollo:
    // new WebSocket(url, [`xai-client-secret.${apiKey}`])
    this.ws = new WebSocket(
      `${WS_ENDPOINT}?model=${WS_MODEL}`,
      [`xai-client-secret.${apiKey}`]
    );
    this.ws.onopen = () => this.sendSessionUpdate(sessionConfig);
    this.ws.onmessage = (msg) => this.onEvent(JSON.parse(msg.data));
    this.ws.onclose = (ev) => this.handleClose(ev);
    this.ws.onerror = (err) => this.handleError(err);
  }

  sendSessionUpdate(config: SessionConfig): void {
    this.send({ type: "session.update", session: config });
  }

  appendAudio(base64Pcm: string): void {
    this.send({ type: "input_audio_buffer.append", audio: base64Pcm });
  }

  sendFunctionOutput(callId: string, output: string): void {
    this.send({
      type: "conversation.item.create",
      item: { type: "function_call_output", call_id: callId, output },
    });
  }

  requestResponse(): void {
    this.send({ type: "response.create" });
  }

  private send(payload: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
}
```

### 5.5 Audio Service

Il servizio audio gestisce cattura microfono, conversione PCM16, base64 encoding, playback e VU meter.

**Cattura input:**
1. `navigator.mediaDevices.getUserMedia({ audio: true })` — avviato immediatamente al click su Connect, prima che il WebSocket sia aperto.
2. `AudioContext` con `sampleRate: 24000`.
3. `AudioWorkletProcessor` (preferibile rispetto a `ScriptProcessor` deprecato) per catturare chunk Float32, convertirli a PCM16 little-endian, codificarli in base64 e accumularli nel buffer.
4. Al WebSocket `open`: flush del buffer accumulato con `input_audio_buffer.append`, poi streaming continuo.

**Conversione Float32 → PCM16 base64:**
```typescript
// src/utils/pcm.ts
export function float32ToPcm16Base64(float32: Float32Array): string {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm16.buffer);
  return btoa(String.fromCharCode(...bytes));
}
```

**Playback output:**
1. Evento `response.output_audio.delta` porta chunk audio base64 PCM16.
2. Decodifica base64 → PCM16 → Float32.
3. Creazione di `AudioBuffer` e scheduling con `AudioBufferSourceNode` in coda continua per playback fluido senza gap.
4. In caso di barge-in: stop immediato di tutti i `AudioBufferSourceNode` in coda, svuoto del playback queue, continuazione cattura input senza interruzione.

**VU Meter:**
- Calcolo RMS su ogni chunk Float32 per input e output.
- Aggiornamento store a ~30fps.

### 5.6 Function Tools — Contratto e Mock Registry

#### Contratto client per function call

```typescript
// src/services/functionRegistry.ts

export type MockHandler = (args: Record<string, unknown>) => Promise<unknown>;

export const mockRegistry: Record<string, MockHandler> = {
  // Handler di esempio pre-registrato
  get_time: async () => ({ iso: new Date().toISOString() }),
  echo: async (args) => ({ echoed: args }),
};

export async function handleFunctionCall(
  ws: WsService,
  event: FunctionCallDoneEvent,
  playbackCompletePromise: Promise<void>
): Promise<void> {
  const { name, call_id, arguments: argsRaw } = event;
  const args = JSON.parse(argsRaw);

  let result: unknown;
  const handler = mockRegistry[name];
  if (handler) {
    result = await handler(args);
  } else {
    result = { error: `Unknown function: ${name}` };
  }

  // Invia il risultato immediatamente
  ws.sendFunctionOutput(call_id, JSON.stringify(result));

  // Attendi fine playback corrente prima di richiedere la risposta
  await playbackCompletePromise;
  ws.requestResponse();
}
```

**Gestione parallel tool calls:**
- Se arrivano più eventi `response.function_call_arguments.done` prima di audio output, il client accumula tutti i `call_id` in un array.
- Esegue tutti i mock handler in parallelo (`Promise.all`).
- Invia tutti i `conversation.item.create` (function_call_output).
- Attende la fine del playback audio.
- Invia un unico `response.create`.

#### GUI per la configurazione function tools

- Form con campi: `name`, `description`, `parameters` (editor JSON Schema), `mock body` (textarea JS).
- Il mock body è una funzione asincrona: `async (args) => { /* corpo */ return result; }`.
- Valutazione con `new Function(...)` — accettabile in contesto interno developer.
- La funzione viene registrata nel `mockRegistry` in memoria.

### 5.7 State Machine della sessione

```
           ┌──────────────┐
           │    IDLE       │◄───────────────────────────┐
           └──────┬───────┘                             │
                  │ Connect click                       │ Disconnect / max retry
           ┌──────▼───────┐                            │
           │  CONNECTING   │                            │
           └──────┬───────┘                             │
                  │ ws.onopen                           │
           ┌──────▼───────┐      ws.onclose (error)    │
           │   CONNECTED   ├──────────────►RECONNECTING─┘
           │               │              (backoff 1s..30s)
           │  [streaming]  │
           └──────┬───────┘
                  │ Reset click
           ┌──────▼───────┐
           │  RESETTING    │── session.update ──► CONNECTED
           └──────────────┘
```

**Stati:**
- `IDLE` — nessuna connessione, form configurazione editabile.
- `CONNECTING` — WebSocket in apertura, mic avviata, audio in buffering.
- `CONNECTED` — sessione attiva, streaming bidirezionale.
- `RECONNECTING` — backoff in corso, mic continua a bufferizzare.
- `RESETTING` — svuoto asincrono di tutti i buffer + reinvio `session.update`.
- `ERROR` — max retry superato, richiede azione manuale.

### 5.8 Reconnect con Exponential Backoff

```typescript
// src/utils/backoff.ts

export async function withExponentialBackoff(
  fn: () => Promise<void>,
  maxAttempts = 5,
  baseDelayMs = 1000,
  onAttempt?: (attempt: number, delay: number) => void
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fn();
      return;
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), 30000);
      onAttempt?.(attempt, delay);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
```

- Sequenza delay: 1s → 2s → 4s → 8s → 16s → cap a 30s.
- Il `logStore` registra ogni tentativo come evento con timestamp e codice errore WebSocket.
- L'audio continua a bufferizzare durante il backoff.

### 5.9 Zustand Stores

```typescript
// Struttura schematica degli store — implementazione in src/stores/

// sessionStore.ts
type SessionStore = {
  status: "IDLE" | "CONNECTING" | "CONNECTED" | "RECONNECTING" | "RESETTING" | "ERROR";
  config: SessionConfig;
  apiKey: string;
  reconnectAttempt: number;
  setConfig: (partial: Partial<SessionConfig>) => void;
  setStatus: (s: SessionStore["status"]) => void;
  applyJsonConfig: (raw: string) => void; // parse e merge da editor Developer
};

// audioStore.ts
type AudioStore = {
  inputRms: number;       // per VU meter
  outputRms: number;
  isPlaying: boolean;
  isMicActive: boolean;
  earlyAudioBuffer: Float32Array[];
};

// uiStore.ts
type UiStore = {
  activeTab: "basic" | "advanced" | "developer";
  logDrawerOpen: boolean;
  logViewMode: "human" | "raw";
};

// logStore.ts
type LogEntry = {
  id: string;
  ts: number;
  direction: "in" | "out";
  type: string;
  summary: string;
  raw: object;
  category: "audio" | "function" | "session" | "error" | "status";
};

type LogStore = {
  entries: LogEntry[];
  addEntry: (entry: Omit<LogEntry, "id" | "ts">) => void;
  clear: () => void;
};
```

### 5.10 xAI Events — riferimento per implementazione

I principali eventi da gestire, basati sulla documentazione ufficiale xAI:

#### Client → Server (eventi inviati dall'app)

| Evento | Quando | Note |
|---|---|---|
| `session.update` | connect, ogni modifica settings, reset | Payload: `{ session: SessionConfig }` |
| `input_audio_buffer.append` | streaming continuo durante sessione | `{ audio: base64Pcm16 }` |
| `conversation.item.create` (function_call_output) | dopo esecuzione function tool | `{ item: { type, call_id, output } }` |
| `response.create` | dopo invio tutti i function_call_output | Solo dopo fine playback corrente |

#### Server → Client (eventi ricevuti)

| Evento | Gestione |
|---|---|
| `session.created` | log, update stato UI a CONNECTED |
| `session.updated` | log, conferma sync config |
| `response.output_audio.delta` | decodifica base64 → PCM → scheduling playback |
| `response.output_audio.done` | segnala fine chunk audio del turno |
| `response.text.delta` | append al transcript modello (read-only) |
| `conversation.item.input_audio_transcription.completed` | append al transcript utente |
| `response.function_call_arguments.done` | avvia function call handling (vedi 5.6) |
| `response.done` | fine turno modello, update VU meter output |
| `error` | log categoria error, valuta reconnect |

> **Nota:** I seguenti eventi OpenAI non sono emessi da xAI e non devono essere attesi:  
> `conversation.item.done`, `conversation.item.input_audio_transcription.delta`,  
> `conversation.item.input_audio_transcription.failed`, `rate_limits.updated`.

### 5.11 PWA — Manifest e Service Worker

```json
// public/manifest.webmanifest
{
  "name": "Grok Voice Agent",
  "short_name": "GrokVoice",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0d1117",
  "theme_color": "#4f98a3",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Service Worker (via Workbox tramite `vite-plugin-pwa`):
- Strategia **Cache-First** per asset statici (JS, CSS, fonts).
- Strategia **Network-First** per `index.html`.
- Nessuna cache per chiamate WebSocket (non applicabile).
- Fallback offline: pagina statica con messaggio "Sessione vocale non disponibile offline".

### 5.12 Note di sicurezza per i developer

La scelta corrente di usare l'API key direttamente nel browser è accettabile per uso interno, ma espone il segreto nel client. Il meccanismo browser-compatible documentato da xAI è il sub-protocollo WebSocket:

```typescript
new WebSocket(
  "wss://api.x.ai/v1/realtime?model=grok-voice-think-fast-1.0",
  [`xai-client-secret.${apiKey}`]
);
```

Per ambienti production o semi-pubblici: implementare un micro-endpoint `/api/session` che genera ephemeral token lato server con l'API key protetta, restituisce il token al client, il quale usa `xai-client-secret.${ephemeralToken}`. Questo è fuori scope v1 ma deve essere pianificato prima di qualsiasi deployment non-privato.

---

## 6. Backlog MVP

### 6.1 Epiche e User Stories

---

#### Epic 1 — Voice Session Core

**US-01: Connessione WebSocket**  
*Come developer interno, voglio poter avviare una sessione WebSocket verso xAI con un click, in modo da iniziare immediatamente a testare il modello vocale.*  
**Acceptance Criteria:**
- Click su "Connect" apre WebSocket a `wss://api.x.ai/v1/realtime?model=grok-voice-think-fast-1.0`.
- L'API key è passata come sub-protocollo `xai-client-secret.<key>`.
- Immediatamente all'open viene inviato `session.update` con la config corrente.
- Il top bar mostra lo stato "Connected" con colore verde.
- Se la connessione fallisce, lo stato diventa "Error" con messaggio descrittivo.

**US-02: Streaming audio input**  
*Come utente, voglio che il mio microfono venga acquisito immediatamente alla connessione e i campioni audio inviati in streaming, in modo che il modello possa sentirmi senza latenza percepita.*  
**Acceptance Criteria:**
- `getUserMedia` è richiamato al click su "Connect", prima dell'open WebSocket.
- `AudioContext` a 24000 Hz, campioni buffered durante la connessione.
- Al WebSocket open, flush del buffer e streaming continuo con `input_audio_buffer.append`.
- VU meter input visibile e reattivo.

**US-03: Playback audio output**  
*Come utente, voglio sentire le risposte vocali del modello in modo fluido e senza interruzioni o click audio, in modo da avere un'esperienza di conversazione naturale.*  
**Acceptance Criteria:**
- `response.output_audio.delta` decodificato e schedulato in coda `AudioBufferSourceNode`.
- Nessun gap o artefatto audio percepibile tra chunk consecutivi.
- VU meter output visibile durante playback.

**US-04: Turn detection VAD**  
*Come utente, voglio che il sistema rilevi automaticamente quando smetto di parlare senza che io debba premere nulla, in modo che la conversazione fluisca naturalmente.*  
**Acceptance Criteria:**
- `session.update` contiene `turn_detection: { type: "server_vad" }`.
- Nessun pulsante "stop speaking" necessario.
- Il parametro VAD threshold rispetta il valore impostato nella GUI.

**US-05: Barge-in**  
*Come utente, voglio poter interrompere il modello mentre sta parlando semplicemente iniziando a parlare io, in modo che la conversazione sia bidirezionale e naturale.*  
**Acceptance Criteria:**
- Quando VAD rileva input microfono durante playback output, il playback si ferma immediatamente.
- Tutti i `AudioBufferSourceNode` pendenti vengono fermati e rimossi dalla coda.
- L'acquisizione microfono e lo streaming continuano senza interruzione.
- Il VU meter output torna a zero. Il VU meter input mostra l'input attivo.

**US-06: Reset sessione**  
*Come developer, voglio poter resettare la sessione con un click senza riconnettermi, in modo da ripartire da zero rapidamente durante i test.*  
**Acceptance Criteria:**
- Click su "Reset" svuota: transcript, audio buffer input e output, playback queue, log in memoria, stato UI locale.
- Il WebSocket rimane aperto.
- Viene immediatamente inviato un `session.update` con la config corrente della GUI.
- Il top bar torna a mostrare "Connected" (non "Idle").

**US-07: Reconnect automatico**  
*Come developer, voglio che l'app tenti automaticamente di riconnettersi in caso di caduta del WebSocket, in modo da non dover ricaricare la pagina per riprendere il lavoro.*  
**Acceptance Criteria:**
- Su `ws.onclose` con codice di errore, lo stato diventa "Reconnecting (N/5)".
- Tentativi con delay: 1s, 2s, 4s, 8s, 16s (cap 30s).
- Durante il reconnect la cattura audio continua e i campioni vengono bufferizzati.
- Al reconnect riuscito, flush del buffer e invio `session.update`.
- Dopo 5 tentativi falliti, stato "Error" con messaggio e bottone "Try again".

**US-08: Disconnessione**  
*Come utente, voglio poter chiudere ordinatamente la sessione con un click, in modo da liberare la connessione e fermare il microfono.*  
**Acceptance Criteria:**
- Click su "Disconnect" chiude il WebSocket con `ws.close()`.
- Ferma la cattura microfono (`MediaStreamTrack.stop()`).
- Ferma il playback audio.
- Svuota tutti i buffer.
- Stato: "Idle".

---

#### Epic 2 — Settings Panel

**US-09: Impostazioni Basic**  
*Come developer, voglio poter cambiare voce, instructions e language hint da una form semplice, in modo che le modifiche vengano applicate subito alla sessione senza ricaricare.*  
**Acceptance Criteria:**
- Ogni modifica invia `session.update` entro 500ms (debounce).
- La voce selezionabile tra `eve`, `ara`, `rex`, `sal`, `leo` + campo custom voice ID.
- Il JSON nell'editor Developer si aggiorna di riflesso.

**US-10: Impostazioni Advanced**  
*Come developer, voglio poter regolare i parametri VAD (threshold, silence duration, prefix padding) e il sample rate audio da una form con slider/select, in modo da testare configurazioni diverse senza editare JSON a mano.*  
**Acceptance Criteria:**
- Tutti i parametri del tab Advanced hanno valori min/max validati.
- Ogni modifica invia `session.update`.
- I valori sono visibili nell'editor JSON del tab Developer.

**US-11: Editor JSON Developer**  
*Come developer, voglio poter editare direttamente il JSON della configurazione di sessione e applicarlo con un click, in modo da testare configurazioni avanzate o non ancora disponibili nella GUI.*  
**Acceptance Criteria:**
- Editor Monaco con syntax highlighting e validazione JSON.
- Pulsante "Apply JSON" invia `session.update` con il payload editato.
- Se il JSON è invalido, mostra errore inline prima di inviare.
- Al click su Apply, i controlli Basic/Advanced si sincronizzano con il nuovo JSON.
- Diff viewer mostra la differenza tra config attuale e ultimo `session.update` inviato.

---

#### Epic 3 — Tools

**US-12: Abilitazione e configurazione tool web_search**  
*Come developer, voglio poter abilitare web_search con un toggle e configurarlo tramite form, in modo da testare rapidamente la capacità del modello di cercare in rete durante le conversazioni vocali.*  
**Acceptance Criteria:**
- Toggle abilita/disabilita il tool.
- Campo `allowed_domains` opzionale.
- Il tool viene incluso o escluso dal prossimo `session.update`.

**US-13: Abilitazione e configurazione tool x_search**  
**Acceptance Criteria:**
- Toggle + campo `allowed_x_handles` (lista separata da virgola).

**US-14: Abilitazione e configurazione tool file_search**  
**Acceptance Criteria:**
- Toggle + campo `vector_store_ids` + campo `max_num_results`.

**US-15: Abilitazione e configurazione tool mcp**  
**Acceptance Criteria:**
- Toggle + campi: `server_url`, `server_label`, `server_description` (opt), `allowed_tools` (opt), `authorization` (opt), `headers` (opt, editor JSON key-value).
- Pulsante "+ Add MCP server" per aggiungere istanze multiple.
- Ogni istanza rimuovibile.

**US-16: Definizione e test custom function tools**  
*Come developer, voglio poter definire function tools con nome, descrizione, JSON Schema parametri e mock implementation JS, in modo da simulare l'integrazione di funzioni personalizzate durante i test vocali.*  
**Acceptance Criteria:**
- Form con campi: `name`, `description`, `parameters` (editor JSON Schema), `mock body` (textarea JS asincrono).
- Il function tool viene registrato nel mock registry in memoria.
- Viene incluso nel prossimo `session.update`.
- Quando il modello chiama la funzione, il mock viene eseguito e il risultato inviato correttamente.
- Gestione parallel tool calls (vedi sezione 5.6).

---

#### Epic 4 — Transcript e Observability

**US-17: Transcript read-only**  
*Come developer, voglio vedere in tempo reale il transcript della conversazione, distinto per turno utente/modello, in modo da validare la comprensione del modello e il comportamento del VAD.*  
**Acceptance Criteria:**
- Transcript aggiornato in tempo reale da `conversation.item.input_audio_transcription.completed` (utente) e `response.text.delta` (modello).
- Distingue visivamente turni utente e modello (colore, allineamento).
- Non accetta input da tastiera.
- Svuotato al reset.

**US-18: Event log human-readable**  
*Come developer, voglio vedere tutti gli eventi WebSocket in forma leggibile nel drawer log, in modo da capire velocemente il flusso della conversazione e identificare anomalie.*  
**Acceptance Criteria:**
- Ogni evento (in e out) appare nel drawer con: timestamp, direzione, tipo, summary.
- Colore per categoria: audio (blue), function call (orange), session/config (teal), error (red), stato connessione (grey).
- Pulsante "Clear log".

**US-19: Event log raw JSON**  
*Come developer, voglio poter passare in modalità "raw JSON" nel log, in modo da ispezionare il payload esatto di ogni evento WebSocket.*  
**Acceptance Criteria:**
- Toggle "Human-readable ↔ Raw JSON" nel log drawer.
- In modalità raw, ogni voce mostra il payload JSON completo dell'evento.
- Pulsante "Copy all" copia tutti gli eventi in clipboard come JSON newline-delimited.

**US-20: VU meter input/output**  
*Come developer, voglio vedere i livelli audio input e output in tempo reale, in modo da verificare che il microfono stia catturando e che il playback del modello sia attivo.*  
**Acceptance Criteria:**
- VU meter input aggiornato a ~30fps dal livello RMS del segnale microfono.
- VU meter output aggiornato a ~30fps dal livello RMS del segnale playback.
- Visibili nel top bar quando sessione attiva.

---

#### Epic 5 — PWA

**US-21: Installabilità PWA**  
*Come developer interno, voglio poter installare la PWA sul desktop o mobile, in modo da avere accesso rapido senza dover aprire un browser e navigare all'URL.*  
**Acceptance Criteria:**
- `manifest.webmanifest` valido con nome, icone 192x512, `display: standalone`.
- Service Worker registrato via `vite-plugin-pwa`.
- Banner di installazione visibile su Chrome/Edge desktop e Android Chrome.
- App installata si apre in modalità standalone senza barra browser.

**US-22: Fallback offline**  
**Acceptance Criteria:**
- Se offline, l'app mostra una schermata dedicata con messaggio "Connessione assente — la sessione vocale richiede rete".
- Gli asset statici (JS, CSS, fonts) sono serviti dalla cache Service Worker anche offline.

---

### 6.2 Backlog prioritizzato

| # | US | Priorità | Sprint |
|---|---|---|---|
| 1 | US-01 Connessione WebSocket | Must | 1 |
| 2 | US-02 Streaming audio input | Must | 1 |
| 3 | US-03 Playback audio output | Must | 1 |
| 4 | US-04 Turn detection VAD | Must | 1 |
| 5 | US-05 Barge-in | Must | 1 |
| 6 | US-06 Reset sessione | Must | 1 |
| 7 | US-09 Impostazioni Basic | Must | 1 |
| 8 | US-17 Transcript read-only | Must | 1 |
| 9 | US-18 Event log human-readable | Must | 1 |
| 10 | US-07 Reconnect automatico | Should | 2 |
| 11 | US-08 Disconnessione | Should | 2 |
| 12 | US-10 Impostazioni Advanced | Should | 2 |
| 13 | US-11 Editor JSON Developer | Should | 2 |
| 14 | US-12 Tool web_search | Should | 2 |
| 15 | US-13 Tool x_search | Should | 2 |
| 16 | US-14 Tool file_search | Should | 2 |
| 17 | US-19 Event log raw JSON | Should | 2 |
| 18 | US-20 VU meter | Should | 2 |
| 19 | US-15 Tool mcp | Could | 3 |
| 20 | US-16 Custom function tools | Could | 3 |
| 21 | US-21 Installabilità PWA | Could | 3 |
| 22 | US-22 Fallback offline | Could | 3 |

---

## 7. Vincoli e dipendenze

- La PWA richiede che il browser abbia accesso al microfono — richiesta permesso gestita esplicitamente dall'app.
- Il browser non supporta header HTTP su WebSocket: il token/API key deve usare il meccanismo sub-protocollo.
- `AudioWorklet` richiede contesto HTTPS (o localhost) — il dev server Vite deve girare su `localhost` o con certificato self-signed.
- Il Service Worker richiede HTTPS in produzione — deployment su hosting con SSL.
- Nessuna libreria di astrazione WebSocket: uso dell'API nativa per trasparenza e controllo diretto degli eventi, coerente con il profilo osservabilità.
- La documentazione xAI segnala che `grok-voice-fast-1.0` è deprecated — **non usare mai questo modello**. Solo `grok-voice-think-fast-1.0`.

---

## Appendice A — xAI Voice Agent API: riferimento rapido

| Parametro | Dove | Valore/Note |
|---|---|---|
| WebSocket endpoint | URL | `wss://api.x.ai/v1/realtime?model=grok-voice-think-fast-1.0` |
| Autenticazione browser | Sub-protocollo WS | `xai-client-secret.<token>` |
| Modello raccomandato | Query param URL | `grok-voice-think-fast-1.0` |
| Voce default app | `session.update` | `eve` |
| Turn detection | `session.update` | `server_vad`, threshold 0.85 |
| Audio input | `session.update` | `audio/pcm`, 24000 Hz |
| Audio output | `session.update` | `audio/pcm`, 24000 Hz |
| Audio encoding | Client | PCM16 little-endian, base64 |
| Tool server-managed | Nessuna gestione client | `web_search`, `x_search`, `file_search`, `mcp` |
| Tool client-managed | Contratto function call | `function` — vedi sezione 5.6 |
| Event transcript modello | Server → Client | `response.text.delta` (non `response.output_text.delta`) |
| Transcript utente | Server → Client | `conversation.item.input_audio_transcription.completed` |

## Appendice B — Events non emessi da xAI (non attendere)

Non attendere mai: `conversation.item.done`, `conversation.item.input_audio_transcription.delta`, `conversation.item.input_audio_transcription.failed`, `rate_limits.updated`, `output_audio_buffer.started`, `output_audio_buffer.stopped`, `output_audio_buffer.cleared`.

