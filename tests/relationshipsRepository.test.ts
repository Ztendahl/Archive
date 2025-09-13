import Database from 'better-sqlite3';
import { describe, it, expect, beforeEach } from 'vitest';
import { createPeopleRepository, type PeopleRepository } from '../src/db/people.repository';
import {
  createRelationshipsRepository,
  type RelationshipsRepository,
} from '../src/db/relationships.repository';

let people: PeopleRepository;
let relations: RelationshipsRepository;

beforeEach(() => {
  const db = new Database(':memory:');
  people = createPeopleRepository(db as any);
  relations = createRelationshipsRepository(db as any);
});

describe('relationships repository', () => {
  const addPerson = (name: string) => people.savePerson({ first_name: name, last_name: 'Smith' });

  it('adds parents with roles and enforces invariants', () => {
    const child = addPerson('Child');
    const mom = addPerson('Mom');
    const dad = addPerson('Dad');
    const extra = addPerson('Extra');
    relations.addParentLink({ parentId: mom.id, childId: child.id, role: 'bio' });
    relations.addParentLink({ parentId: dad.id, childId: child.id, role: 'bio' });
    expect(() =>
      relations.addParentLink({ parentId: extra.id, childId: child.id, role: 'bio' })
    ).toThrow('Child already has two biological parents');
    expect(() =>
      relations.addParentLink({ parentId: mom.id, childId: child.id, role: 'adoptive' })
    ).toThrow('Parent cannot be both biological and adoptive for the same child');
    expect(() =>
      relations.addParentLink({ parentId: child.id, childId: mom.id, role: 'bio' })
    ).toThrow('Adding this parent creates a cycle');
  });

  it('adds partners via unions', () => {
    const a = addPerson('A');
    const b = addPerson('B');
    const id = relations.addUnion({ person1Id: a.id, person2Id: b.id });
    expect(id).toBeTruthy();
  });

  it('derives step-parents and classifies siblings', () => {
    const mom = addPerson('Mom');
    const dad = addPerson('Dad');
    const stepDad = addPerson('StepDad');
    const otherMom = addPerson('OtherMom');
    const otherDad = addPerson('OtherDad');
    const child = addPerson('Target');
    const fullSib = addPerson('Full');
    const halfDad = addPerson('HalfDad');
    const halfMom = addPerson('HalfMom');
    const stepSib = addPerson('StepSib');

    // parental links
    relations.addParentLink({ parentId: mom.id, childId: child.id, role: 'bio' });
    relations.addParentLink({ parentId: dad.id, childId: child.id, role: 'bio' });
    relations.addParentLink({ parentId: mom.id, childId: fullSib.id, role: 'bio' });
    relations.addParentLink({ parentId: dad.id, childId: fullSib.id, role: 'bio' });
    relations.addParentLink({ parentId: dad.id, childId: halfDad.id, role: 'bio' });
    relations.addParentLink({ parentId: otherMom.id, childId: halfDad.id, role: 'bio' });
    relations.addParentLink({ parentId: mom.id, childId: halfMom.id, role: 'bio' });
    relations.addParentLink({ parentId: otherDad.id, childId: halfMom.id, role: 'bio' });
    relations.addParentLink({ parentId: stepDad.id, childId: stepSib.id, role: 'bio' });
    relations.addParentLink({ parentId: otherMom.id, childId: stepSib.id, role: 'bio' });

    // union to derive step relationships
    relations.addUnion({ person1Id: mom.id, person2Id: stepDad.id });

    const parents = relations.getParents(child.id);
    const step = parents.find((p) => p.role === 'step');
    expect(step?.parent.id).toBe(stepDad.id);

    const sibs = relations.getSiblings(child.id);
    expect(sibs.full.map((s) => s.person.id)).toEqual([fullSib.id]);
    expect(sibs.half.map((s) => s.person.id).sort()).toEqual([halfDad.id, halfMom.id].sort());
    expect(sibs.step.map((s) => s.person.id)).toEqual([stepSib.id]);
  });

  it('derives step-parent only when union overlaps', () => {
    const mom = addPerson('Mom');
    const step = addPerson('Step');
    const child = addPerson('Kid');
    relations.addParentLink({ parentId: mom.id, childId: child.id, role: 'bio', startDate: '2000-01-01', endDate: '2010-01-01' });
    // union outside parent-child range
    relations.addUnion({ person1Id: mom.id, person2Id: step.id, startDate: '2011-01-01', endDate: '2012-01-01' });
    expect(relations.getParents(child.id).some((p) => p.parent.id === step.id)).toBe(false);
    // overlapping union
    relations.addUnion({ person1Id: mom.id, person2Id: step.id, startDate: '2005-01-01', endDate: '2006-01-01' });
    expect(relations.getParents(child.id).some((p) => p.parent.id === step.id && p.role === 'step')).toBe(true);
  });
});
