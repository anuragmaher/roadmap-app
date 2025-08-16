// Tag color mapping utility
export interface TagColor {
  background: string;
  text: string;
  border: string;
}

export interface TagColorScheme {
  light: TagColor;
  dark: TagColor;
}

// Color mapping for different tag types
const tagColorMap: Record<string, TagColorScheme> = {
  productivity: {
    light: {
      background: '#fef3c7', // amber-100
      text: '#92400e',       // amber-800
      border: '#fcd34d'      // amber-300
    },
    dark: {
      background: '#451a03', // amber-950
      text: '#fbbf24',       // amber-400
      border: '#92400e'      // amber-800
    }
  },
  efficiency: {
    light: {
      background: '#dcfce7', // green-100
      text: '#14532d',       // green-900
      border: '#86efac'      // green-300
    },
    dark: {
      background: '#052e16', // green-950
      text: '#4ade80',       // green-400
      border: '#15803d'      // green-700
    }
  },
  'customer insight': {
    light: {
      background: '#e0e7ff', // indigo-100
      text: '#312e81',       // indigo-900
      border: '#a5b4fc'      // indigo-300
    },
    dark: {
      background: '#1e1b4b', // indigo-950
      text: '#818cf8',       // indigo-400
      border: '#4338ca'      // indigo-700
    }
  },
  'table stake': {
    light: {
      background: '#fce7f3', // pink-100
      text: '#831843',       // pink-900
      border: '#f9a8d4'      // pink-300
    },
    dark: {
      background: '#500724', // pink-950
      text: '#f472b6',       // pink-400
      border: '#be185d'      // pink-700
    }
  },
  quality: {
    light: {
      background: '#f3e8ff', // purple-100
      text: '#581c87',       // purple-900
      border: '#c4b5fd'      // purple-300
    },
    dark: {
      background: '#2e1065', // purple-950
      text: '#a855f7',       // purple-500
      border: '#7c3aed'      // purple-600
    }
  },
  // Default colors for unknown tags
  default: {
    light: {
      background: '#f1f5f9', // slate-100
      text: '#334155',       // slate-700
      border: '#cbd5e1'      // slate-300
    },
    dark: {
      background: '#0f172a', // slate-950
      text: '#94a3b8',       // slate-400
      border: '#475569'      // slate-600
    }
  }
};

/**
 * Get color scheme for a tag based on its name
 */
export const getTagColors = (tagName: string, isDark: boolean = false): TagColor => {
  const normalizedTag = tagName.toLowerCase().trim();
  const colorScheme = tagColorMap[normalizedTag] || tagColorMap.default;
  return isDark ? colorScheme.dark : colorScheme.light;
};

/**
 * Get CSS custom properties for a tag
 */
export const getTagCSSProperties = (tagName: string, isDark: boolean = false): React.CSSProperties => {
  const colors = getTagColors(tagName, isDark);
  return {
    '--tag-bg': colors.background,
    '--tag-text': colors.text,
    '--tag-border': colors.border,
  } as React.CSSProperties;
};

/**
 * Get all available tag types
 */
export const getAvailableTagTypes = (): string[] => {
  return Object.keys(tagColorMap).filter(key => key !== 'default');
};