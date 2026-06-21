/** Push a client-side route and notify the tiny `usePath` router in app.tsx. */
export function navigate(to: string) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
