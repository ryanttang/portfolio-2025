import { Suspense } from 'react';
import HomePageClient from '@/components/HomePageClient';

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageClient />
    </Suspense>
  );
}
