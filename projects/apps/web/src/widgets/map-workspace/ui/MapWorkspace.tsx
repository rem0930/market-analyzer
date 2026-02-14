/**
 * @layer widgets
 * @segment map-workspace
 * @what 全幅地図 + サイドパネル統合ウィジェット
 */

'use client';

import { useCallback } from 'react';
import type { MapMouseEvent } from 'react-map-gl';
import { MapContainer } from '@/features/map-view';
import {
  TradeAreaCreationMode,
  RadiusSlider,
  useTradeAreaCreation,
} from '@/features/trade-area-creation';
import {
  TradeAreaList,
  useTradeAreas,
  useTradeAreaList,
  useCreateTradeArea,
} from '@/features/trade-area-management';
import { DemographicPanel } from '@/features/demographic-analysis';
import { TradeAreaCircle } from '@/entities/trade-area';

export function MapWorkspace() {
  const creation = useTradeAreaCreation();
  const { selectedTradeAreaId } = useTradeAreas();
  const { data: tradeAreasData } = useTradeAreaList();
  const createMutation = useCreateTradeArea();

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (creation.isCreating) {
        creation.setClickPoint(e.lngLat.lng, e.lngLat.lat);
      }
    },
    [creation]
  );

  const handleCreate = useCallback(() => {
    if (creation.longitude === null || creation.latitude === null || !creation.name.trim()) {
      return;
    }
    createMutation.mutate(
      {
        name: creation.name,
        longitude: creation.longitude,
        latitude: creation.latitude,
        radiusKm: creation.radiusKm,
      },
      {
        onSuccess: () => {
          creation.reset();
        },
      }
    );
  }, [creation, createMutation]);

  return (
    <div className="flex h-full">
      {/* Map Area */}
      <div className="flex-1 relative">
        <MapContainer onClick={handleMapClick}>
          {/* Saved trade areas */}
          {tradeAreasData?.tradeAreas.map((ta) => (
            <TradeAreaCircle
              key={ta.id}
              id={ta.id}
              longitude={ta.longitude}
              latitude={ta.latitude}
              radiusKm={ta.radiusKm}
              color={selectedTradeAreaId === ta.id ? '#3b82f6' : '#6b7280'}
              opacity={selectedTradeAreaId === ta.id ? 0.4 : 0.2}
              isSelected={selectedTradeAreaId === ta.id}
            />
          ))}

          {/* Preview circle during creation */}
          <TradeAreaCreationMode />
        </MapContainer>
      </div>

      {/* Side Panel */}
      <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Creation Controls */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Create Trade Area</h3>

            {!creation.isCreating ? (
              <button
                onClick={creation.startCreation}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + New Trade Area
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  {creation.longitude === null
                    ? 'Click on the map to set the center point'
                    : 'Adjust radius and name, then save'}
                </p>

                <input
                  type="text"
                  value={creation.name}
                  onChange={(e) => creation.setName(e.target.value)}
                  placeholder="Trade area name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <RadiusSlider value={creation.radiusKm} onChange={creation.setRadius} />

                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={
                      creation.longitude === null ||
                      !creation.name.trim() ||
                      createMutation.isPending
                    }
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {createMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={creation.cancelCreation}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* Trade Area List */}
          <TradeAreaList />

          {/* Demographics */}
          {selectedTradeAreaId && (
            <>
              <hr className="border-gray-200" />
              <DemographicPanel />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
