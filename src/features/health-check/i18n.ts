import { useCallback } from 'react';

import { useLanguage } from '@/i18n';

import { resolveLabel, type LabelDefinition } from './logic/labels';

/**
 * Returns a `t(label)` resolver bound to the current app language (DEMO_FEEDBACK_002 #1).
 * Components call `const t = useT()` and render `t(HEALTH_LABELS.x)` instead of reading `.fallback`,
 * so text re-renders when the language changes.
 */
export function useT() {
  const { language } = useLanguage();
  return useCallback((def: LabelDefinition) => resolveLabel(def, language), [language]);
}
