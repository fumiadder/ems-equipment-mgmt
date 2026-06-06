/**
 * In-memory data store for EMS mock layer
 * Provides CRUD operations with auto-incrementing IDs
 * and optional localStorage persistence
 */

import {
  seedOrganizations,
  seedRoles,
  seedUsers,
  seedEquipments,
  seedWorkOrders,
  seedSpareParts,
  seedInspectionPlans,
  seedInspectionRecords,
  type Organization,
  type Role,
  type User,
  type Equipment,
  type WorkOrder,
  type SparePart,
  type InspectionPlan,
  type InspectionRecord,
} from './data';

const STORAGE_KEY = 'ems_mock_store';

/* ---------- helpers ---------- */

function now(): string {
  return new Date().toISOString();
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function nextId(items: { id: number }[]): number {
  return items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
}

/* ---------- store shape ---------- */

export interface StoreData {
  organizations: Organization[];
  roles: Role[];
  users: User[];
  equipments: Equipment[];
  workOrders: WorkOrder[];
  spareParts: SparePart[];
  inspectionPlans: InspectionPlan[];
  inspectionRecords: InspectionRecord[];
}

/* ---------- store class ---------- */

class MockStore {
  private data: StoreData;

  constructor() {
    this.data = this.load();
  }

  /* ---- persistence ---- */

  private load(): StoreData {
    if (typeof window === 'undefined') {
      // SSR / build-time fallback
      return this.freshData();
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as StoreData;
      }
    } catch {
      // ignore corrupt data
    }
    return this.freshData();
  }

  private freshData(): StoreData {
    return {
      organizations: deepClone(seedOrganizations),
      roles: deepClone(seedRoles),
      users: deepClone(seedUsers),
      equipments: deepClone(seedEquipments),
      workOrders: deepClone(seedWorkOrders),
      spareParts: deepClone(seedSpareParts),
      inspectionPlans: deepClone(seedInspectionPlans),
      inspectionRecords: deepClone(seedInspectionRecords),
    };
  }

  private save(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch {
        // quota exceeded or private browsing - silently degrade
      }
    }
  }

  /** Reset store back to seed data */
  public reset(): void {
    this.data = this.freshData();
    this.save();
  }

  /* ---- generic CRUD helpers ---- */

  /** Find all items of a collection, with optional filter predicate */
  public findAll<K extends keyof StoreData>(
    collection: K,
    filter?: (item: StoreData[K][number]) => boolean,
  ): StoreData[K][number][] {
    const items = this.data[collection] as unknown as StoreData[K][number][];
    if (!filter) return deepClone(items);
    return deepClone(items.filter(filter));
  }

  /** Find a single item by id */
  public findById<K extends keyof StoreData>(
    collection: K,
    id: number,
  ): StoreData[K][number] | undefined {
    const items = this.data[collection] as StoreData[K][number][];
    const found = items.find((item) => (item as { id: number }).id === id);
    return found ? deepClone(found) : undefined;
  }

  /** Create a new item (auto-assigns id + timestamps) */
  public create<K extends keyof StoreData>(
    collection: K,
    item: Partial<StoreData[K][number]>,
  ): StoreData[K][number] {
    const items = this.data[collection] as StoreData[K][number][];
    const newItem = {
      ...item,
      id: nextId(items),
    } as StoreData[K][number];

    // Assign createdAt / updatedAt if the schema has them
    if ('createdAt' in newItem) {
      (newItem as unknown as Record<string, unknown>).createdAt = now();
    }
    if ('updatedAt' in newItem) {
      (newItem as unknown as Record<string, unknown>).updatedAt = now();
    }

    items.push(newItem);
    this.save();
    return deepClone(newItem);
  }

  /** Update an existing item by id (partial merge + updatedAt) */
  public update<K extends keyof StoreData>(
    collection: K,
    id: number,
    updates: Partial<StoreData[K][number]>,
  ): StoreData[K][number] | undefined {
    const items = this.data[collection] as StoreData[K][number][];
    const idx = items.findIndex((item) => (item as { id: number }).id === id);
    if (idx === -1) return undefined;

    items[idx] = {
      ...items[idx],
      ...updates,
      id, // ensure id is never overwritten
    } as StoreData[K][number];

    if ('updatedAt' in items[idx]) {
      (items[idx] as unknown as Record<string, unknown>).updatedAt = now();
    }

    this.save();
    return deepClone(items[idx]);
  }

  /** Delete an item by id */
  public remove<K extends keyof StoreData>(
    collection: K,
    id: number,
  ): boolean {
    const items = this.data[collection] as StoreData[K][number][];
    const idx = items.findIndex((item) => (item as { id: number }).id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    this.save();
    return true;
  }

  /* ---- convenience accessors ---- */

  get organizations() { return this.data.organizations; }
  get roles() { return this.data.roles; }
  get users() { return this.data.users; }
  get equipments() { return this.data.equipments; }
  get workOrders() { return this.data.workOrders; }
  get spareParts() { return this.data.spareParts; }
  get inspectionPlans() { return this.data.inspectionPlans; }
  get inspectionRecords() { return this.data.inspectionRecords; }
}

/* ---------- singleton ---------- */

let _store: MockStore | null = null;

export function getStore(): MockStore {
  if (!_store) {
    _store = new MockStore();
  }
  return _store;
}

export default getStore;
