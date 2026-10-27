/** The app's translation function: the text for a key in the user's language, else the fallback. */
export type Translate = (key: string, fallback: string) => string;

let translate: Translate = (_key, fallback) => fallback;

/**
 * Plug the app's translations into every ui2 component, once, before the first render
 * (main.tsx: setTranslate((key, fallback) => t.translate(key, fallback))). Without it the
 * components show their English fallbacks.
 */
export function setTranslate(fn: Translate): void {
  translate = fn;
}

/** A component's UI text: tr('<trn-ui-search-placeholder>', 'Search…'). Call it while rendering. */
export function tr(key: string, fallback: string): string {
  return translate(key, fallback);
}
