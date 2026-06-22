import { useEffect, useState } from 'react';

/**
 * Tracks the dev (HMR) websocket connection — the channel the agent's edits and
 * live re-renders flow over. Vite dispatches `vite:ws:connect` / `vite:ws:disconnect`
 * on the hot client; we surface that as a boolean so the chrome can show a live
 * indicator (and reassure the user when the link drops). Always true in a build.
 */
export function useAgentSocketConnected(): boolean {
  const [connected, setConnected] = useState(true);
  useEffect(() => {
    const hot = import.meta.hot;
    if (!hot) return;
    const on = () => setConnected(true);
    const off = () => setConnected(false);
    hot.on('vite:ws:connect', on);
    hot.on('vite:ws:disconnect', off);
    return () => {
      hot.off?.('vite:ws:connect', on);
      hot.off?.('vite:ws:disconnect', off);
    };
  }, []);
  return connected;
}
