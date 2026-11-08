import { Platform, Share } from 'react-native';

/**
 * Downloads or shares a plain text file across Web and Native.
 * On Web: Triggers direct browser download as a .txt file.
 * On Native: Opens system share sheet to save to Files or send to apps.
 */
export async function downloadTextFile(filename: string, content: string): Promise<boolean> {
  // 1. Web browser direct download
  if (Platform.OS === 'web' || (typeof document !== 'undefined' && document.createElement)) {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } catch (err) {
      console.warn('[downloadTextFile] Web download error:', err);
    }
  }

  // 2. Native share fallback (Android / iOS)
  try {
    await Share.share({
      title: filename,
      message: content,
    });
    return true;
  } catch (err) {
    console.warn('[downloadTextFile] Native share error:', err);
    return false;
  }
}
