import Dexie, { type Table } from 'dexie';
import type { Exercise, Routine, Session, LiveSession, Settings } from '../domain/types';

export class WorkbookDB extends Dexie {
  exercises!: Table<Exercise, string>;
  routines!: Table<Routine, string>;
  sessions!: Table<Session, string>;
  live!: Table<LiveSession, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('workbook');
    this.version(1).stores({
      exercises: 'id, muscle, measurement, custom, name',
      routines: 'id, name, updatedAt',
      sessions: 'id, performedAt, routineId, *exerciseIds',
      live: 'id',
      settings: 'id',
    });
  }
}

export const db = new WorkbookDB();
