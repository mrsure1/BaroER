/**
 * Inline script injected into <head> BEFORE React hydrates.
 * Reads localStorage['theme'] and applies the dark class synchronously
 * to prevent a flash of incorrect theme (FOUC).
 *
 * Default: light. Only applies dark when explicitly chosen, or when
 * 'system' is selected and the OS prefers dark.
 */
const script = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.style.colorScheme='light';}}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
