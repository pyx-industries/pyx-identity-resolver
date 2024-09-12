export type SaveParams = { id: string; [k: string]: any };

export interface IRepositoryProvider {
  save(data: SaveParams): Promise<void>;
  one<T>(id: string): Promise<T>;
  all<T>(category: string): Promise<T[]>;
  delete(id: string): Promise<void>;
}
