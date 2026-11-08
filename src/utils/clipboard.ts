import * as ExpoClipboard from 'expo-clipboard';

/**
 * Copies plain text to clipboard across all platforms (Web, iOS, Android).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Web navigator.clipboard (fast and native in modern browsers)
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback
    }
  }

  // 2. Web fallback using document.execCommand('copy')
  if (typeof document !== 'undefined' && document.createElement) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (success) return true;
    } catch {
      // fallback to ExpoClipboard
    }
  }

  // 3. Expo Clipboard module (works seamlessly on Android/iOS)
  try {
    if (ExpoClipboard && typeof ExpoClipboard.setStringAsync === 'function') {
      await ExpoClipboard.setStringAsync(text);
      return true;
    }
  } catch (err) {
    console.warn('[Clipboard] Failed to copy via ExpoClipboard:', err);
  }

  return false;
}
