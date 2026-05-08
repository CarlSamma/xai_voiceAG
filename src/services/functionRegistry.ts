// Function Registry - Manages custom function tools and their mock implementations

import { wsService } from './wsService';

export type MockHandler = (args: Record<string, unknown>) => Promise<unknown>;

interface FunctionToolConfig {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  mockBody: string;
}

interface PendingFunctionCall {
  callId: string;
  name: string;
  arguments: string;
}

// Store for registered functions
const mockRegistry: Record<string, MockHandler> = {
  // Default mock functions
  get_time: async () => ({
    iso: new Date().toISOString(),
    timestamp: Date.now(),
  }),
  echo: async (args) => ({
    echoed: args,
  }),
};

// Pending function calls to be sent after playback completes
const pendingFunctionCalls: PendingFunctionCall[] = [];

// Promise to track when playback completes
let playbackCompletePromise: Promise<void> | null = null;
let playbackResolve: (() => void) | null = null;

/**
 * Register a new function tool
 */
export function registerFunction(config: FunctionToolConfig): void {
  const { name, mockBody } = config;
  
  try {
    // Create async function from mock body
    // eslint-disable-next-line no-new-func
    const handler: MockHandler = new Function(
      'args',
      `return (async () => { ${mockBody} })()`
    ) as MockHandler;
    
    mockRegistry[name] = handler;
    console.log(`[FunctionRegistry] Registered function: ${name}`);
  } catch (err) {
    console.error(`[FunctionRegistry] Failed to register function ${name}:`, err);
    throw err;
  }
}

/**
 * Unregister a function tool
 */
export function unregisterFunction(name: string): void {
  if (mockRegistry[name]) {
    delete mockRegistry[name];
    console.log(`[FunctionRegistry] Unregistered function: ${name}`);
  }
}

/**
 * Get all registered function names
 */
export function getRegisteredFunctions(): string[] {
  return Object.keys(mockRegistry);
}

/**
 * Handle incoming function call from the server
 */
export async function handleFunctionCall(event: {
  call_id: string;
  name: string;
  arguments: string;
}): Promise<void> {
  const { call_id, name, arguments: argsRaw } = event;
  
  console.log(`[FunctionRegistry] Function call: ${name}`, { call_id, argsRaw });
  
  // Parse arguments
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(argsRaw);
  } catch {
    console.error('[FunctionRegistry] Failed to parse function arguments');
  }

  // Execute mock handler
  let result: unknown;
  const handler = mockRegistry[name];
  
  if (handler) {
    try {
      result = await handler(args);
    } catch (err) {
      result = { error: `Handler error: ${err}` };
    }
  } else {
    result = { error: `Unknown function: ${name}` };
  }

  // Store pending function call
  pendingFunctionCalls.push({ callId: call_id, name, arguments: argsRaw });

  // If we have a playback completion promise, wait for it
  if (playbackCompletePromise) {
    try {
      await playbackCompletePromise;
    } catch {
      // Ignore errors
    }
  }

  // Send all accumulated function outputs
  await sendFunctionOutputs();

  // Request new response after function outputs
  wsService.requestResponse();
}

/**
 * Send accumulated function outputs to the server
 */
async function sendFunctionOutputs(): Promise<void> {
  const outputs = [...pendingFunctionCalls];
  pendingFunctionCalls.length = 0;

  for (const call of outputs) {
    let result: unknown;
    const handler = mockRegistry[call.name];
    
    if (handler) {
      try {
        const args = JSON.parse(call.arguments);
        result = await handler(args);
      } catch (err) {
        result = { error: `Handler error: ${err}` };
      }
    } else {
      result = { error: `Unknown function: ${call.name}` };
    }

    wsService.sendFunctionOutput(call.callId, JSON.stringify(result));
  }
}

/**
 * Create a promise that resolves when playback completes
 */
export function createPlaybackPromise(): void {
  playbackCompletePromise = new Promise((resolve) => {
    playbackResolve = resolve;
  });
}

/**
 * Resolve playback completion
 */
export function resolvePlayback(): void {
  if (playbackResolve) {
    playbackResolve();
    playbackResolve = null;
    playbackCompletePromise = null;
  }
}

/**
 * Clear pending function calls
 */
export function clearPendingCalls(): void {
  pendingFunctionCalls.length = 0;
  playbackResolve?.();
  playbackResolve = null;
  playbackCompletePromise = null;
}

/**
 * Get mock registry for display in UI
 */
export function getMockRegistry(): Record<string, string> {
  return Object.keys(mockRegistry).reduce((acc, name) => {
    acc[name] = 'Mock handler registered';
    return acc;
  }, {} as Record<string, string>);
}