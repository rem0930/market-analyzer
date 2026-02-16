/**
 * @layer widgets
 * @segment map-workspace
 * @what 全幅地図 + サイドパネル統合ウィジェット
 */

'use client';

import { useCallback, useEffect } from 'react';
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
import { StoreCreationMode, useStoreCreation } from '@/features/store-creation';
import { StoreList, useStores, useStoreList, useCreateStore } from '@/features/store-management';
import { StoreMarker } from '@/entities/store';
import { CompetitorMarker } from '@/entities/competitor';
import { CompetitorCreationMode, useCompetitorCreation } from '@/features/competitor-creation';
import {
  CompetitorList,
  useCompetitorsByStore,
  useCreateCompetitor,
  useCompetitors,
} from '@/features/competitor-management';
import { CompetitorSearchDialog, useCompetitorSearch } from '@/features/competitor-search';

export function MapWorkspace() {
  const tradeAreaCreation = useTradeAreaCreation();
  const { selectedTradeAreaId } = useTradeAreas();
  const { data: tradeAreasData } = useTradeAreaList();
  const createTradeAreaMutation = useCreateTradeArea();

  const storeCreation = useStoreCreation();
  const isStoreCreating = useStoreCreation((s) => s.isCreating);
  const setStoreClickPoint = useStoreCreation((s) => s.setClickPoint);
  const isTradeAreaCreating = useTradeAreaCreation((s) => s.isCreating);
  const setTradeAreaClickPoint = useTradeAreaCreation((s) => s.setClickPoint);
  const { selectedStoreId, selectStore } = useStores();
  const { data: storesData } = useStoreList();
  const createStoreMutation = useCreateStore();
  const competitorSearch = useCompetitorSearch();
  const closeSearchDialog = useCompetitorSearch((s) => s.closeDialog);

  const competitorCreation = useCompetitorCreation();
  const isCompetitorCreating = useCompetitorCreation((s) => s.isCreating);
  const setCompetitorClickPoint = useCompetitorCreation((s) => s.setClickPoint);
  const { selectedCompetitorId, selectCompetitor } = useCompetitors();
  const { data: competitorsData } = useCompetitorsByStore(selectedStoreId);
  const createCompetitorMutation = useCreateCompetitor();

  // Reset competitor search dialog when selected store changes
  useEffect(() => {
    closeSearchDialog();
  }, [selectedStoreId, closeSearchDialog]);

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (isStoreCreating) {
        setStoreClickPoint(e.lngLat.lng, e.lngLat.lat);
      } else if (isCompetitorCreating) {
        setCompetitorClickPoint(e.lngLat.lng, e.lngLat.lat);
      } else if (isTradeAreaCreating) {
        setTradeAreaClickPoint(e.lngLat.lng, e.lngLat.lat);
      }
    },
    [
      isStoreCreating,
      isCompetitorCreating,
      isTradeAreaCreating,
      setStoreClickPoint,
      setCompetitorClickPoint,
      setTradeAreaClickPoint,
    ]
  );

  const handleCreateTradeArea = useCallback(() => {
    if (
      tradeAreaCreation.longitude === null ||
      tradeAreaCreation.latitude === null ||
      !tradeAreaCreation.name.trim()
    ) {
      return;
    }
    createTradeAreaMutation.mutate(
      {
        name: tradeAreaCreation.name,
        longitude: tradeAreaCreation.longitude,
        latitude: tradeAreaCreation.latitude,
        radiusKm: tradeAreaCreation.radiusKm,
      },
      {
        onSuccess: () => {
          tradeAreaCreation.reset();
        },
      }
    );
  }, [tradeAreaCreation, createTradeAreaMutation]);

  const handleCreateStore = useCallback(() => {
    if (
      storeCreation.longitude === null ||
      storeCreation.latitude === null ||
      !storeCreation.name.trim() ||
      !storeCreation.address.trim()
    ) {
      return;
    }
    createStoreMutation.mutate(
      {
        name: storeCreation.name,
        address: storeCreation.address,
        longitude: storeCreation.longitude,
        latitude: storeCreation.latitude,
      },
      {
        onSuccess: () => {
          storeCreation.reset();
        },
      }
    );
  }, [storeCreation, createStoreMutation]);

  const handleCreateCompetitor = useCallback(() => {
    if (
      competitorCreation.longitude === null ||
      competitorCreation.latitude === null ||
      !competitorCreation.name.trim() ||
      !selectedStoreId
    ) {
      return;
    }
    createCompetitorMutation.mutate(
      {
        storeId: selectedStoreId,
        data: {
          name: competitorCreation.name,
          longitude: competitorCreation.longitude,
          latitude: competitorCreation.latitude,
          source: 'manual',
          category: competitorCreation.category.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          competitorCreation.reset();
        },
      }
    );
  }, [competitorCreation, createCompetitorMutation, selectedStoreId]);

  return (
    <div className="flex h-full">
      {/* Map Area */}
      <div className="flex-1 relative">
        <MapContainer onClick={handleMapClick}>
          {/* Saved stores */}
          {storesData?.stores.map((store) => (
            <StoreMarker
              key={store.id}
              id={store.id}
              longitude={store.longitude}
              latitude={store.latitude}
              isSelected={selectedStoreId === store.id}
              onClick={selectStore}
            />
          ))}

          {/* Preview marker during store creation */}
          <StoreCreationMode />

          {/* Saved competitors (red pins) */}
          {competitorsData?.competitors.map((comp) => (
            <CompetitorMarker
              key={comp.id}
              id={comp.id}
              longitude={comp.longitude}
              latitude={comp.latitude}
              isSelected={selectedCompetitorId === comp.id}
              onClick={selectCompetitor}
            />
          ))}

          {/* Preview marker during competitor creation */}
          <CompetitorCreationMode />

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

          {/* Preview circle during trade area creation */}
          <TradeAreaCreationMode />
        </MapContainer>
      </div>

      {/* Side Panel */}
      <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Store Creation Controls */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Stores</h3>

            {!storeCreation.isCreating ? (
              <button
                onClick={storeCreation.startCreation}
                disabled={tradeAreaCreation.isCreating || competitorCreation.isCreating}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                + New Store
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  {storeCreation.longitude === null
                    ? 'Click on the map to set the store location'
                    : 'Enter store details and save'}
                </p>

                <input
                  type="text"
                  value={storeCreation.name}
                  onChange={(e) => storeCreation.setName(e.target.value)}
                  placeholder="Store name"
                  aria-label="Store name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <input
                  type="text"
                  value={storeCreation.address}
                  onChange={(e) => storeCreation.setAddress(e.target.value)}
                  placeholder="Address"
                  aria-label="Address"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleCreateStore}
                    disabled={
                      storeCreation.longitude === null ||
                      !storeCreation.name.trim() ||
                      !storeCreation.address.trim() ||
                      createStoreMutation.isPending
                    }
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {createStoreMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={storeCreation.cancelCreation}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {createStoreMutation.isError && (
                  <p className="text-xs text-red-500">Failed to create store. Please try again.</p>
                )}
              </div>
            )}
          </div>

          {/* Store List */}
          <StoreList />

          {/* Competitor Search */}
          {selectedStoreId && (
            <div className="space-y-2">
              {!competitorSearch.isOpen ? (
                <button
                  onClick={competitorSearch.openDialog}
                  disabled={storeCreation.isCreating || tradeAreaCreation.isCreating}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Search Nearby Competitors
                </button>
              ) : (
                <CompetitorSearchDialog key={selectedStoreId} storeId={selectedStoreId} />
              )}
            </div>
          )}

          <hr className="border-gray-200" />

          {/* Competitor Creation Controls */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Competitors</h3>

            {!competitorCreation.isCreating ? (
              <button
                onClick={competitorCreation.startCreation}
                disabled={
                  !selectedStoreId || storeCreation.isCreating || tradeAreaCreation.isCreating
                }
                className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                + New Competitor
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  {competitorCreation.longitude === null
                    ? 'Click on the map to set the competitor location'
                    : 'Enter competitor details and save'}
                </p>

                <input
                  type="text"
                  value={competitorCreation.name}
                  onChange={(e) => competitorCreation.setName(e.target.value)}
                  placeholder="Competitor name"
                  aria-label="Competitor name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />

                <input
                  type="text"
                  value={competitorCreation.category}
                  onChange={(e) => competitorCreation.setCategory(e.target.value)}
                  placeholder="Category (optional)"
                  aria-label="Category"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleCreateCompetitor}
                    disabled={
                      competitorCreation.longitude === null ||
                      !competitorCreation.name.trim() ||
                      createCompetitorMutation.isPending
                    }
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {createCompetitorMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={competitorCreation.cancelCreation}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {createCompetitorMutation.isError && (
                  <p className="text-xs text-red-500">
                    Failed to create competitor. Please try again.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Competitor List */}
          <CompetitorList storeId={selectedStoreId} />

          <hr className="border-gray-200" />

          {/* Trade Area Creation Controls */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Trade Areas</h3>

            {!tradeAreaCreation.isCreating ? (
              <button
                onClick={tradeAreaCreation.startCreation}
                disabled={storeCreation.isCreating || competitorCreation.isCreating}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                + New Trade Area
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  {tradeAreaCreation.longitude === null
                    ? 'Click on the map to set the center point'
                    : 'Adjust radius and name, then save'}
                </p>

                <input
                  type="text"
                  value={tradeAreaCreation.name}
                  onChange={(e) => tradeAreaCreation.setName(e.target.value)}
                  placeholder="Trade area name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <RadiusSlider
                  value={tradeAreaCreation.radiusKm}
                  onChange={tradeAreaCreation.setRadius}
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleCreateTradeArea}
                    disabled={
                      tradeAreaCreation.longitude === null ||
                      !tradeAreaCreation.name.trim() ||
                      createTradeAreaMutation.isPending
                    }
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {createTradeAreaMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={tradeAreaCreation.cancelCreation}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

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
