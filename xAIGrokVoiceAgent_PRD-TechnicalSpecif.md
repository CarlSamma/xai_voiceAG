<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# xAI Grok Voice Agent — PWA: PRD \& Technical Specification

> **Versione:** 1.0
> **Data:** 2026-05-08
> **Destinatari:** Team di sviluppo interno
> **Classificazione:** Uso interno — Non distribuire

***

## 1. Executive Summary

Questo documento definisce il Product Requirements Document (PRD) e la Technical Specification completa per la realizzazione di una Progressive Web App (PWA) che espone l'interfaccia vocale realtime di xAI (modello `grok-voice-think-fast-1.0`) al team interno, con massima configurabilità via GUI e forte osservabilità tecnica. L'app ha profilo da *developer playground*, adatto a un team tecnico che deve testare, configurare e monitorare sessioni vocali realtime con il modello Grok.

La PWA è progettata come base quasi production-ready, con architettura React/Vite, trasporto WebSocket verso `wss://api.x.ai/v1/realtime`, turn detection server-side VAD, supporto completo a tutti i tipi di tool disponibili (`web_search`, `x_search`, `file_search`, `mcp`, `function`), transcript read-only a scopo diagnostico, reconnect automatico con exponential backoff e buffering audio, e stato completamente volatile (nessun storage persistente applicativo).

***

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

***

## 3. Utenti target

**Unico profilo:** Team interno tecnico — developer, integratori, product manager tecnici. Gli utenti conoscono le API REST/WebSocket, comprendono concetti come VAD, PCM, WebSocket events, JSON Schema e tool calling.

***

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
- In parallelo alla connessione WebSocket, la cattura microfono parte subito (best practice xAI[^1]

<div align="center">⁂</div>

[^1]: https://docs.x.ai/developers/model-capabilities/audio/voice-agent

