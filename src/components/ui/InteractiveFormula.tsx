import Text from './Text';
import React, { useRef, useState, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import BottomSheetModal from './BottomSheetModal';
import { colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';

interface InteractiveFormulaProps {
  formulaLatex: string;
  tokensMetadata: Record<string, string>;
}

const MiniMathView = ({ latex }: { latex: string }) => {
  const safeLatex = latex.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: transparent;
      overflow: hidden;
    }
    .katex { font-size: 1.5em; color: ${colors.primary}; }
  </style>
</head>
<body>
  <div id="math"></div>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      katex.render(\`${safeLatex}\`, document.getElementById('math'), {
        throwOnError: false,
        displayMode: true
      });
    });
  </script>
</body>
</html>
  `;
  return (
    <View style={{ height: 80, width: '100%', opacity: 0.99, overflow: 'hidden' }}>
      <WebView 
        source={{ html: htmlContent }} 
        originWhitelist={['*']}
        style={{ flex: 1, backgroundColor: 'transparent' }} 
        scrollEnabled={false} 
        showsVerticalScrollIndicator={false} 
        showsHorizontalScrollIndicator={false} 
      />
      {/* Invisible overlay to capture touches so they pass to the parent ScrollView */}
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' }} />
    </View>
  );
};

const LegendMathView = ({ keys, onSelect }: { keys: string[], onSelect: (key: string) => void }) => {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <style>
    body {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 0 16px;
      background-color: transparent;
    }
    .chip {
      background-color: #E5E7EB;
      padding: 4px 12px;
      border-radius: 16px;
      border: 1px solid #D1D5DB;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .chip:active {
      background-color: #D1D5DB;
    }
    .katex { font-size: 1.1em; color: ${colors.primary}; }
  </style>
</head>
<body>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      const keys = ${JSON.stringify(keys)};
      keys.forEach((key, index) => {
         const chip = document.createElement('div');
         chip.className = 'chip';
         // Pass the raw LaTeX key (braces are valid in KaTeX and needed for frac)
         katex.render(key, chip, { throwOnError: false });
         chip.addEventListener('click', () => {
             window.ReactNativeWebView.postMessage(JSON.stringify({ index: index }));
         });
         document.body.appendChild(chip);
      });
    });
  </script>
</body>
</html>
  `;
  return (
    <View style={{ width: '100%', height: 100, overflow: 'hidden' }}>
      <WebView 
        source={{ html: htmlContent }}
        originWhitelist={['*']}
        style={{ backgroundColor: 'transparent' }}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            onSelect(keys[data.index]);
          } catch(err) {}
        }}
      />
    </View>
  );
};

export default function InteractiveFormula({ formulaLatex, tokensMetadata }: InteractiveFormulaProps) {
  const [loading, setLoading] = useState(true);
  const [selectedTokenKey, setSelectedTokenKey] = useState<string | null>(null);

  const [zoomLevel, setZoomLevel] = useState(1.3);

  // Backticks and single quotes are safely escaped
  const safeLatex = formulaLatex.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
  const tokenKeys = Object.keys(tokensMetadata);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5.0, user-scalable=yes">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: transparent;
      overflow: hidden;
    }
    .katex { font-size: ${zoomLevel}em; color: ${colors.text}; transition: font-size 0.3s; }
  </style>
</head>
<body>
  <div id="math"></div>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      try {
        katex.render(\`${safeLatex}\`, document.getElementById('math'), {
          throwOnError: false,
          trust: true,
          strict: false,
          displayMode: true
        });
        
        // Let React Native know we loaded
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message }));
      }
    });
  </script>
</body>
</html>
  `;

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
      <WebView
        source={{ html: htmlContent }}
        style={styles.webview}
        originWhitelist={['*']}
        scrollEnabled={true}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'loaded') {
              setLoading(false);
            }
          } catch (e) {}
        }}
      />
      
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => setZoomLevel(prev => Math.max(0.8, prev - 0.2))}>
          <Ionicons name="remove" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => setZoomLevel(prev => Math.min(3.0, prev + 0.2))}>
          <Ionicons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.hintContainer}>
        <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.hintText}>Select a symbol from the list below</Text>
      </View>

      <LegendMathView keys={tokenKeys} onSelect={setSelectedTokenKey} />
      
      <BottomSheetModal 
        visible={!!selectedTokenKey} 
        onClose={() => setSelectedTokenKey(null)} 
        title="Formula Breakdown"
      >
        {selectedTokenKey && (
          <>
            <View style={styles.tokenBox}>
              <Text style={styles.tokenTitle}>Expression</Text>
              <MiniMathView latex={selectedTokenKey} />
            </View>
            <Text style={styles.modalText}>
              {tokensMetadata[selectedTokenKey]}
            </Text>
          </>
        )}
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 8,
  },
  webview: {
    backgroundColor: 'transparent',
    height: 120, // Give fixed height to the webview directly instead of container
  },
  zoomControls: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
    opacity: 0.7,
  },
  hintText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  legendChip: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  legendChipText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    zIndex: 1,
  },
  tokenBox: {
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  tokenTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tokenLatex: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  }
});
