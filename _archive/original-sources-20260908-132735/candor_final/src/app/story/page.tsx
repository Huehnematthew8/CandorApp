import StoryPage from '@/components/story/StoryPage';
import { ToastProvider } from '@/components/ui/Toast';

export default function StoryRoute() {
  return (
    <ToastProvider>
      <StoryPage />
    </ToastProvider>
  );
}
