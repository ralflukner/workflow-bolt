import { useEffect, useRef, useState } from 'react';

export interface AgentUpdate {
  id: string;
  agent: string;
  msg: string;
  ts: string;
  type: string;
  correlationId?: string;
}

/**
 * useRedisEventBus – experimental hook that listens for updates on the
 * `agent_updates` Redis stream.
 *
 * In production we intend to leverage a small proxy endpoint that exposes the
 * stream via Server-Sent Events (SSE).  For now the hook simply polls that
 * endpoint if `VITE_REDIS_SSE_URL` is defined, otherwise it no-ops so that the
 * application continues to compile when Redis isn't available in the browser.
 */
export function useRedisEventBus(onUpdate?: (u: AgentUpdate) => void) {
  const [updates, setUpdates] = useState<AgentUpdate[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const sseUrl = import.meta.env.VITE_REDIS_SSE_URL as string | undefined;
    if (!sseUrl) {
      // No SSE endpoint configured; abort.
      return;
    }

    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onmessage = (ev) => {
      try {
        const payload: AgentUpdate = JSON.parse(ev.data);
        setUpdates((prev) => [...prev, payload].slice(-100)); // keep last 100
        onUpdate?.(payload);
      } catch (err) {
        // swallow JSON errors silently for now
      }
    };

    es.onerror = () => {
      // Browser will automatically attempt to reconnect; nothing required here.
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [onUpdate]);

  return updates;
} 