import { ComingSoonScreen } from '@/components/coming-soon-screen';

// DEMO_FEEDBACK_003 #5: 3rd tab repurposed from "Tracking" (MAP_TRACKING) to "Lucky Draw" — not a
// KB business feature, a future gamification idea. Shows "Feature coming soon" for now.
// MAP_TRACKING itself (src/features/map-tracking/) is untouched and simply has no tab pointing to
// it anymore; see DECISIONS.md D-DEMO3 for the KB-reconciliation flag this raises.
export default function LuckyDrawRoute() {
  return <ComingSoonScreen title="LUCKY DRAW" />;
}
