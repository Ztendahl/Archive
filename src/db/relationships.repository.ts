import { v4 as uuidv4 } from 'uuid';
import type { SQLiteAdapter } from './adapters/types';
import type { DbPersonWithId } from './people.repository';

export type ParentRole = 'bio' | 'adoptive' | 'step' | 'guardian' | 'foster';

export interface ParentLink {
  parentId: string;
  childId: string;
  role: ParentRole;
  startDate?: string;
  endDate?: string;
  certainty?: number;
}

export interface UnionInput {
  person1Id: string;
  person2Id: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface ParentDetail {
  parent: DbPersonWithId;
  role: ParentRole;
  via: 'explicit' | 'union';
  startDate?: string;
  endDate?: string;
  certainty?: number;
}

export interface SiblingDetail {
  person: DbPersonWithId;
  reason: string;
}

export interface SiblingGroups {
  full: SiblingDetail[];
  half: SiblingDetail[];
  step: SiblingDetail[];
}

export interface RelationshipsRepository {
  addParentLink(link: ParentLink): void;
  addUnion(union: UnionInput): string;
  getParents(childId: string): ParentDetail[];
  getSiblings(childId: string): SiblingGroups;
}

function rangesOverlap(
  aStart?: string,
  aEnd?: string,
  bStart?: string,
  bEnd?: string,
): boolean {
  const aS = aStart ? Date.parse(aStart) : Number.NEGATIVE_INFINITY;
  const aE = aEnd ? Date.parse(aEnd) : Number.POSITIVE_INFINITY;
  const bS = bStart ? Date.parse(bStart) : Number.NEGATIVE_INFINITY;
  const bE = bEnd ? Date.parse(bEnd) : Number.POSITIVE_INFINITY;
  return aS <= bE && bS <= aE;
}

function initialize(db: SQLiteAdapter): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS parent_child (
      parent_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      child_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('bio','adoptive','step','guardian','foster')),
      start_date TEXT,
      end_date TEXT,
      certainty REAL,
      PRIMARY KEY(parent_id, child_id)
    );
    CREATE INDEX IF NOT EXISTS idx_parent_child_child ON parent_child(child_id);
    CREATE TABLE IF NOT EXISTS unions (
      id TEXT PRIMARY KEY,
      person1_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      person2_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      start_date TEXT,
      end_date TEXT,
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_unions_person1 ON unions(person1_id);
    CREATE INDEX IF NOT EXISTS idx_unions_person2 ON unions(person2_id);
  `);
}

export function createRelationshipsRepository(db: SQLiteAdapter): RelationshipsRepository {
  initialize(db);

  const addParentLink = (link: ParentLink): void => {
    if (link.parentId === link.childId) {
      throw new Error('Parent and child cannot be the same person');
    }
    if (link.role === 'bio') {
      const count = db
        .prepare("SELECT COUNT(*) as c FROM parent_child WHERE child_id = ? AND role = 'bio'")
        .get(link.childId) as { c: number };
      if (count.c >= 2) {
        throw new Error('Child already has two biological parents');
      }
    }
    const conflict = db
      .prepare('SELECT role FROM parent_child WHERE parent_id = ? AND child_id = ?')
      .get([link.parentId, link.childId]) as { role?: ParentRole } | undefined;
    if (conflict) {
      if (
        (conflict.role === 'bio' && link.role === 'adoptive') ||
        (conflict.role === 'adoptive' && link.role === 'bio')
      ) {
        throw new Error('Parent cannot be both biological and adoptive for the same child');
      }
    }
    const cycle = db
      .prepare(`
        WITH RECURSIVE ancestors(id) AS (
          SELECT parent_id FROM parent_child WHERE child_id = @parent
          UNION ALL
          SELECT pc.parent_id FROM parent_child pc JOIN ancestors a ON pc.child_id = a.id
        )
        SELECT 1 FROM ancestors WHERE id = @child LIMIT 1;
      `)
      .get({ parent: link.parentId, child: link.childId });
    if (cycle) {
      throw new Error('Adding this parent creates a cycle');
    }

    if (conflict) {
      db
        .prepare(
          'UPDATE parent_child SET role=@role, start_date=@start, end_date=@end, certainty=@certainty WHERE parent_id=@parent AND child_id=@child'
        )
        .run({
          role: link.role,
          start: link.startDate ?? null,
          end: link.endDate ?? null,
          certainty: link.certainty ?? null,
          parent: link.parentId,
          child: link.childId,
        });
    } else {
      db
        .prepare(
          'INSERT INTO parent_child (parent_id, child_id, role, start_date, end_date, certainty) VALUES (@parent, @child, @role, @start, @end, @certainty)'
        )
        .run({
          parent: link.parentId,
          child: link.childId,
          role: link.role,
          start: link.startDate ?? null,
          end: link.endDate ?? null,
          certainty: link.certainty ?? null,
        });
    }
  };

  const addUnion = (union: UnionInput): string => {
    if (union.person1Id === union.person2Id) {
      throw new Error('Union requires two distinct people');
    }
    const id = uuidv4();
    const [p1, p2] =
      union.person1Id < union.person2Id
        ? [union.person1Id, union.person2Id]
        : [union.person2Id, union.person1Id];
    db
      .prepare(
        'INSERT INTO unions (id, person1_id, person2_id, start_date, end_date, notes) VALUES (@id,@p1,@p2,@start,@end,@notes)'
      )
      .run({
        id,
        p1,
        p2,
        start: union.startDate ?? null,
        end: union.endDate ?? null,
        notes: union.notes ?? null,
      });
    return id;
  };

  const getParents = (childId: string): ParentDetail[] => {
    const explicit = db
      .prepare(
        `SELECT pc.parent_id as id, pc.role, pc.start_date, pc.end_date, pc.certainty, p.first_name, p.last_name FROM parent_child pc JOIN people p ON pc.parent_id = p.id WHERE pc.child_id = ?`
      )
      .all(childId) as any[];
    const parents: ParentDetail[] = explicit.map((row) => ({
      parent: {
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
      },
      role: row.role,
      via: 'explicit',
      startDate: row.start_date ?? undefined,
      endDate: row.end_date ?? undefined,
      certainty: row.certainty ?? undefined,
    }));

    const existingIds = new Set(parents.map((p) => p.parent.id));
    const bioParents = parents.filter((p) => p.role === 'bio' || p.role === 'adoptive');
    for (const bp of bioParents) {
      const unions = db
        .prepare(
          'SELECT person1_id, person2_id, start_date, end_date FROM unions WHERE person1_id = ? OR person2_id = ?'
        )
        .all([bp.parent.id, bp.parent.id]) as {
        person1_id: string;
        person2_id: string;
        start_date?: string;
        end_date?: string;
      }[];
      for (const u of unions) {
        if (
          !rangesOverlap(
            bp.startDate,
            bp.endDate,
            u.start_date ?? undefined,
            u.end_date ?? undefined
          )
        )
          continue;
        const partnerId = u.person1_id === bp.parent.id ? u.person2_id : u.person1_id;
        if (existingIds.has(partnerId)) continue;
        const partner = db
          .prepare('SELECT id, first_name, last_name FROM people WHERE id = ?')
          .get(partnerId) as DbPersonWithId | undefined;
        if (partner) {
          parents.push({ parent: partner, role: 'step', via: 'union' });
          existingIds.add(partnerId);
        }
      }
    }
    return parents;
  };

  const getSiblings = (personId: string): SiblingGroups => {
    const full: SiblingDetail[] = [];
    const half: SiblingDetail[] = [];
    const step: SiblingDetail[] = [];
    const parentRows = db
      .prepare(
        "SELECT parent_id FROM parent_child WHERE child_id = ? AND role IN ('bio','adoptive')"
      )
      .all(personId) as { parent_id: string }[];
    const parentIds = parentRows.map((r) => r.parent_id);
    const nameMap = new Map<string, string>();
    const getName = (id: string): string => {
      let n = nameMap.get(id);
      if (!n) {
        const row = db
          .prepare('SELECT first_name, last_name FROM people WHERE id = ?')
          .get(id) as DbPersonWithId | undefined;
        n = `${row?.first_name ?? ''} ${row?.last_name ?? ''}`.trim();
        nameMap.set(id, n);
      }
      return n;
    };

    if (parentIds.length) {
      const placeholders = parentIds.map(() => '?').join(',');
      const rows = db
        .prepare(
          `SELECT child_id, parent_id FROM parent_child WHERE parent_id IN (${placeholders}) AND role IN ('bio','adoptive') AND child_id <> ?`
        )
        .all([...parentIds, personId]) as { child_id: string; parent_id: string }[];
      const map = new Map<string, Set<string>>();
      for (const r of rows) {
        if (!map.has(r.child_id)) map.set(r.child_id, new Set());
        map.get(r.child_id)!.add(r.parent_id);
      }
      for (const [cid, shared] of map.entries()) {
        const person = db
          .prepare('SELECT id, first_name, last_name FROM people WHERE id = ?')
          .get(cid) as DbPersonWithId;
        if (shared.size >= 2) {
          const parentsStr = Array.from(shared).map((id) => getName(id)).join(' and ');
          full.push({ person, reason: `Share parents ${parentsStr}` });
        } else if (shared.size === 1) {
          const parentName = getName(Array.from(shared)[0]);
          half.push({ person, reason: `Share parent ${parentName}` });
        }
      }
      const fullHalfIds = new Set([...full, ...half].map((s) => s.person.id));
      for (const pid of parentIds) {
        const unions = db
          .prepare('SELECT person1_id, person2_id FROM unions WHERE person1_id = ? OR person2_id = ?')
          .all([pid, pid]) as { person1_id: string; person2_id: string }[];
        for (const u of unions) {
          const partnerId = u.person1_id === pid ? u.person2_id : u.person1_id;
          const partnerChildren = db
            .prepare(
              "SELECT child_id FROM parent_child WHERE parent_id = ? AND role IN ('bio','adoptive') AND child_id <> ?"
            )
            .all([partnerId, personId]) as { child_id: string }[];
          for (const pc of partnerChildren) {
            if (fullHalfIds.has(pc.child_id)) continue;
            if (step.some((s) => s.person.id === pc.child_id)) continue;
            const sib = db
              .prepare('SELECT id, first_name, last_name FROM people WHERE id = ?')
              .get(pc.child_id) as DbPersonWithId;
            step.push({
              person: sib,
              reason: `Parent ${getName(pid)} partnered with ${getName(partnerId)}`,
            });
          }
        }
      }
    }

    return { full, half, step };
  };

  return { addParentLink, addUnion, getParents, getSiblings };
}
