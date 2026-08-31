// Viewer copy assertions read the shipped catalog instead of hardcoding a
// language. archify-ja renders Japanese by default, and pinning the literal
// here would break again on the next wording change — or silently pass if a
// translation regressed to English.
import { DEFAULT_LOCALE, translateCliMessage, translateMessage } from '../../renderers/shared/i18n.mjs';

/** Rendered copy for a catalog key in the artifact's default locale. */
export function copy(key, values) {
  const value = translateMessage(DEFAULT_LOCALE, key, values);
  if (!value || value === key) throw new Error(`viewer catalog has no message for ${key}`);
  return value;
}

/** The same copy, escaped for embedding in a RegExp. */
export function copyPattern(key, values) {
  return escapeRegExp(copy(key, values));
}

export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The `lang` attribute every artifact carries in the default locale. */
export const DEFAULT_LANG = DEFAULT_LOCALE;

/** Rendered CLI diagnostic for a key, in the CLI's default locale. */
export function cliCopy(key, values) {
  const value = translateCliMessage(key, values);
  if (!value || value === key) throw new Error(`CLI catalog has no message for ${key}`);
  return value;
}

/** The same diagnostic, escaped for embedding in a RegExp. */
export function cliPattern(key, values) {
  return escapeRegExp(cliCopy(key, values));
}

/**
 * A RegExp-escaped fragment of a templated message: the longest literal run
 * between `{placeholders}`. Lets a test assert the wording without knowing the
 * runtime values that fill it.
 */
export function cliFragment(key) {
  const template = translateCliMessage(key);
  if (!template || template === key) throw new Error(`CLI catalog has no message for ${key}`);
  const literals = template.split(/\{[^}]*\}/).map((part) => part.trim()).filter(Boolean);
  const longest = literals.sort((a, b) => b.length - a.length)[0];
  if (!longest) throw new Error(`${key} is only placeholders`);
  return escapeRegExp(longest);
}
