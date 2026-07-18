import { useLanguage } from '@/i18n';

import { PlaceholderScreen } from './placeholder-screen';

/** A localized "Feature coming soon" placeholder (DEMO_FEEDBACK_003 #5), shared by any tab that
 * isn't built yet. Not feature-specific — lives at the app level like PlaceholderScreen. */
export function ComingSoonScreen({ title }: { title: string }) {
  const { language } = useLanguage();
  const message = language === 'vi' ? 'Tính năng sắp ra mắt' : 'Feature coming soon';
  return <PlaceholderScreen title={title} description={message} />;
}
