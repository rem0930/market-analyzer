/**
 * @layer features
 * @segment store-management
 * @what サイドパネルの店舗リスト
 */

'use client';

import { useStoreList } from '../api/queries';
import { useDeleteStore } from '../api/mutations';
import { useStores } from '../model/useStores';
import { StoreListItem } from './StoreListItem';

export function StoreList() {
  const { data, isLoading, error } = useStoreList();
  const { selectedStoreId, selectStore } = useStores();
  const deleteMutation = useDeleteStore();

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-sm text-red-500">Failed to load stores</div>;
  }

  if (!data || data.stores.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        No stores yet. Create your first store!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-700">Stores ({data.stores.length})</h3>
      </div>
      {deleteMutation.isError && (
        <p className="text-xs text-red-500 px-1">Failed to delete store. Please try again.</p>
      )}
      <div className="space-y-1.5">
        {data.stores.map((store) => (
          <StoreListItem
            key={store.id}
            store={store}
            isSelected={selectedStoreId === store.id}
            onSelect={selectStore}
            onDelete={(id) => {
              if (window.confirm('Are you sure you want to delete this store?')) {
                deleteMutation.mutate(id);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
