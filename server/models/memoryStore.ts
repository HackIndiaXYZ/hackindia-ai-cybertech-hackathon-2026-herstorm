/**
 * High-fidelity in-memory document store that mirrors Mongoose model behavior
 * when MongoDB Atlas is not yet connected or offline.
 */

export class MemoryCollection<T extends Record<string, any>> {
  private items: Map<string, T> = new Map();

  constructor(private name: string) {}

  private generateId(): string {
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const random = Math.floor(Math.random() * 0xffffffffffff).toString(16).padStart(12, '0');
    return `${timestamp}${random}`;
  }

  private matchesQuery(item: T, query: Record<string, any>): boolean {
    if (!query || Object.keys(query).length === 0) return true;

    for (const [key, val] of Object.entries(query)) {
      if (key === '_id' || key === 'id') {
        const itemId = String(item._id || item.id);
        const queryId = String(val?._id || val);
        if (itemId !== queryId) return false;
        continue;
      }

      if (val && typeof val === 'object' && !Array.isArray(val)) {
        if ('$gte' in val && item[key] < val.$gte) return false;
        if ('$gt' in val && item[key] <= val.$gt) return false;
        if ('$lte' in val && item[key] > val.$lte) return false;
        if ('$lt' in val && item[key] >= val.$lt) return false;
        if ('$in' in val && Array.isArray(val.$in) && !val.$in.map(String).includes(String(item[key]))) return false;
        if ('$nin' in val && Array.isArray(val.$nin) && val.$nin.map(String).includes(String(item[key]))) return false;
        if ('$ne' in val && String(item[key]) === String(val.$ne)) return false;
        continue;
      }

      if (String(item[key]) !== String(val)) {
        return false;
      }
    }
    return true;
  }

  async find(query: Record<string, any> = {}): Promise<T[]> {
    const results: T[] = [];
    for (const item of this.items.values()) {
      if (this.matchesQuery(item, query)) {
        results.push(JSON.parse(JSON.stringify(item)));
      }
    }
    return results;
  }

  async findOne(query: Record<string, any> = {}): Promise<T | null> {
    for (const item of this.items.values()) {
      if (this.matchesQuery(item, query)) {
        return JSON.parse(JSON.stringify(item));
      }
    }
    return null;
  }

  async findById(id: string | any): Promise<T | null> {
    const stringId = String(id?._id || id);
    const item = this.items.get(stringId);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  async create(data: Partial<T> | Partial<T>[]): Promise<any> {
    if (Array.isArray(data)) {
      const created: T[] = [];
      for (const entry of data) {
        created.push(await this.create(entry));
      }
      return created;
    }

    const _id = (data as any)._id ? String((data as any)._id) : this.generateId();
    const doc: any = {
      ...data,
      _id,
      id: _id,
      createdAt: (data as any).createdAt || new Date(),
    };
    this.items.set(_id, doc);
    return JSON.parse(JSON.stringify(doc));
  }

  async insertMany(docs: Partial<T>[]): Promise<T[]> {
    return this.create(docs);
  }

  async findOneAndUpdate(
    query: Record<string, any>,
    update: Record<string, any>,
    options: { new?: boolean } = { new: true }
  ): Promise<T | null> {
    const existing = await this.findOne(query);
    if (!existing) return null;

    const id = String(existing._id);
    const target = this.items.get(id);
    if (!target) return null;

    if (update.$inc) {
      for (const [k, incVal] of Object.entries(update.$inc)) {
        (target as any)[k] = ((target as any)[k] || 0) + (incVal as number);
      }
    }

    if (update.$set) {
      Object.assign(target, update.$set);
    } else {
      for (const [k, v] of Object.entries(update)) {
        if (!k.startsWith('$')) {
          (target as any)[k] = v;
        }
      }
    }

    const updated = JSON.parse(JSON.stringify(target));
    return options.new ? updated : existing;
  }

  async findByIdAndUpdate(id: string | any, update: Record<string, any>, options: { new?: boolean } = { new: true }): Promise<T | null> {
    return this.findOneAndUpdate({ _id: String(id?._id || id) }, update, options);
  }

  async deleteOne(query: Record<string, any>): Promise<{ deletedCount: number }> {
    const item = await this.findOne(query);
    if (!item) return { deletedCount: 0 };
    this.items.delete(String(item._id));
    return { deletedCount: 1 };
  }

  async findByIdAndDelete(id: string | any): Promise<T | null> {
    const item = await this.findById(id);
    if (!item) return null;
    this.items.delete(String(item._id));
    return item;
  }

  async deleteMany(query: Record<string, any> = {}): Promise<{ deletedCount: number }> {
    let count = 0;
    for (const [id, item] of Array.from(this.items.entries())) {
      if (this.matchesQuery(item, query)) {
        this.items.delete(id);
        count++;
      }
    }
    return { deletedCount: count };
  }

  async countDocuments(query: Record<string, any> = {}): Promise<number> {
    const list = await this.find(query);
    return list.length;
  }

  clear() {
    this.items.clear();
  }
}

export const memoryStore = {
  users: new MemoryCollection<any>('users'),
  listings: new MemoryCollection<any>('listings'),
  orders: new MemoryCollection<any>('orders'),
  deliveryGroups: new MemoryCollection<any>('delivery_groups'),
  mandiRates: new MemoryCollection<any>('mandi_rates'),
};
