export interface SQLiteAdapter {
  exec(sql: string): void;
  prepare(sql: string): {
    run(params?: any): void;
    get<T = any>(params?: any): T | undefined;
    all<T = any>(params?: any): T[];
  };
}
