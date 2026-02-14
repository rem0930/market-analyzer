/**
 * @layer app
 * @what 地図ページ（/map ルート）
 */

'use client';

import { MapWorkspace } from '@/widgets/map-workspace';

export default function MapPage() {
  return (
    <div className="h-[calc(100vh-64px)] -m-8">
      <MapWorkspace />
    </div>
  );
}
