import { useCallback } from 'react';

import { useLanguage, resolveLabel, type LabelDefinition } from '@/i18n';

/** Same pattern as health-check's useT() — resolves a label against the current app language. */
export function useT() {
  const { language } = useLanguage();
  return useCallback((def: LabelDefinition) => resolveLabel(def, language), [language]);
}
