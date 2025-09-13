import { describe, it, expect } from 'vitest';
import { layoutFamilyGraph } from '../src/graph/familyLayout';
import type {
  PersonNode,
  ParentChildEdge,
  Visibility,
} from '../src/graph/familyLayout';

describe('layoutFamilyGraph', () => {
  it('places parents above and children below focus', () => {
    const people: PersonNode[] = [
      { id: 'p', firstName: 'Parent' },
      { id: 'f', firstName: 'Focus' },
      { id: 'c', firstName: 'Child' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'p', childId: 'f', role: 'bio' },
      { parentId: 'f', childId: 'c', role: 'bio' },
    ];
    const visibility: Visibility = {
      maxUpGenerations: 5,
      maxDownGenerations: 5,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const result = layoutFamilyGraph({
      people,
      edges,
      unions: [],
      focusId: 'f',
      visibility,
    });
    const parent = result.nodes.find((n) => n.id === 'p');
    const focus = result.nodes.find((n) => n.id === 'f');
    const child = result.nodes.find((n) => n.id === 'c');

    expect(parent && focus && child).toBeTruthy();
    expect(parent!.y).toBeLessThan(focus!.y);
    expect(child!.y).toBeGreaterThan(focus!.y);
  });

  it('creates union anchors and supports multiple unions', () => {
    const people: PersonNode[] = [
      { id: 'a', firstName: 'A', birthYear: 1980 },
      { id: 'b', firstName: 'B', birthYear: 1981 },
      { id: 'c', firstName: 'C', birthYear: 1982 },
      { id: 'd', firstName: 'D' },
      { id: 'e', firstName: 'E' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'a', childId: 'd', role: 'bio' },
      { parentId: 'b', childId: 'd', role: 'bio' },
      { parentId: 'a', childId: 'e', role: 'bio' },
      { parentId: 'c', childId: 'e', role: 'bio' },
    ];
    const unions = [
      { id: 'u1', aId: 'a', bId: 'b', start: 2000 },
      { id: 'u2', aId: 'a', bId: 'c', start: 2005 },
    ];
    const visibility: Visibility = {
      maxUpGenerations: 5,
      maxDownGenerations: 5,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const result = layoutFamilyGraph({
      people,
      edges,
      unions,
      focusId: 'a',
      visibility,
    });

    const union1 = result.nodes.find((n) => n.id === 'u1' && n.union);
    const union2 = result.nodes.find((n) => n.id === 'u2' && n.union);
    expect(union1 && union2).toBeTruthy();

    const edgeD = result.edges.find((e) => e.childId === 'd');
    const edgeE = result.edges.find((e) => e.childId === 'e');
    expect(edgeD?.parentId).toBe('u1');
    expect(edgeE?.parentId).toBe('u2');

    const childD = result.nodes.find((n) => n.id === 'd');
    const childE = result.nodes.find((n) => n.id === 'e');
    expect(childD?.x).toBe(union1!.x);
    expect(childE?.x).toBe(union2!.x);

    expect(result.nodes.filter((n) => n.id === 'a').length).toBe(1);
  });

  it('orders nodes by union start, birth year and name', () => {
    const people: PersonNode[] = [
      { id: 'a', firstName: 'Ann', birthYear: 1980 },
      { id: 'b', firstName: 'Bob', birthYear: 1975 },
      { id: 'c', firstName: 'Cal', birthYear: 1985 },
      { id: 'd', firstName: 'D' },
      { id: 'e', firstName: 'E' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'a', childId: 'd', role: 'bio' },
      { parentId: 'b', childId: 'd', role: 'bio' },
      { parentId: 'a', childId: 'e', role: 'bio' },
      { parentId: 'c', childId: 'e', role: 'bio' },
    ];
    const unions = [
      { id: 'u1', aId: 'a', bId: 'b', start: 1990 },
      { id: 'u2', aId: 'a', bId: 'c', start: 2005 },
    ];
    const visibility: Visibility = {
      maxUpGenerations: 1,
      maxDownGenerations: 1,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const result = layoutFamilyGraph({
      people,
      edges,
      unions,
      focusId: 'a',
      visibility,
    });
    const layer0 = result.nodes
      .filter((n) => n.layer === 0 && !n.union)
      .sort((a, b) => a.x - b.x)
      .map((n) => n.id);
    expect(layer0).toEqual(['b', 'a', 'c']);
  });

  it('respects generation caps', () => {
    const people: PersonNode[] = [
      { id: 'gp' },
      { id: 'p' },
      { id: 'f' },
      { id: 'c' },
      { id: 'gc' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'gp', childId: 'p', role: 'bio' },
      { parentId: 'p', childId: 'f', role: 'bio' },
      { parentId: 'f', childId: 'c', role: 'bio' },
      { parentId: 'c', childId: 'gc', role: 'bio' },
    ];
    const visibility1: Visibility = {
      maxUpGenerations: 1,
      maxDownGenerations: 1,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const r1 = layoutFamilyGraph({
      people,
      edges,
      unions: [],
      focusId: 'f',
      visibility: visibility1,
    });
    expect(r1.nodes.map((n) => n.id).sort()).toEqual(['c', 'f', 'p'].sort());

    const visibility2: Visibility = {
      maxUpGenerations: 2,
      maxDownGenerations: 2,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const r2 = layoutFamilyGraph({
      people,
      edges,
      unions: [],
      focusId: 'f',
      visibility: visibility2,
    });
    expect(r2.nodes.some((n) => n.id === 'gp')).toBe(true);
    expect(r2.nodes.some((n) => n.id === 'gc')).toBe(true);
    expect(r2.nodes.length).toBeGreaterThan(r1.nodes.length);
  });

  it('collapses and expands branches with placeholders', () => {
    const people: PersonNode[] = [
      { id: 'p1' },
      { id: 'p2' },
      { id: 'f' },
      { id: 'c1' },
      { id: 'c2' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'p1', childId: 'f', role: 'bio' },
      { parentId: 'p2', childId: 'f', role: 'bio' },
      { parentId: 'f', childId: 'c1', role: 'bio' },
      { parentId: 'f', childId: 'c2', role: 'bio' },
    ];
    const visibility: Visibility = {
      maxUpGenerations: 5,
      maxDownGenerations: 5,
      showRoles: { step: true, guardian: false, foster: false },
    };

    const collapsed = layoutFamilyGraph({
      people,
      edges,
      unions: [],
      focusId: 'f',
      visibility,
      expansions: { f: { showParents: false, showChildren: false } },
    });
    const placeholders = collapsed.nodes.filter((n) => n.placeholder);
    expect(placeholders.length).toBe(2);
    const parentPlaceholder = placeholders.find((n) => n.id.includes('parents'));
    const childPlaceholder = placeholders.find((n) => n.id.includes('children'));
    expect(parentPlaceholder?.count).toBe(2);
    expect(childPlaceholder?.count).toBe(2);

    const expanded = layoutFamilyGraph({
      people,
      edges,
      unions: [],
      focusId: 'f',
      visibility,
      expansions: { f: { showParents: false, showChildren: true } },
    });
    expect(expanded.nodes.some((n) => n.id === 'c1')).toBe(true);
    expect(expanded.nodes.some((n) => n.id === 'c2')).toBe(true);
    expect(expanded.nodes.filter((n) => n.id === 'f:children').length).toBe(0);
    const childXs = expanded.nodes
      .filter((n) => n.id === 'c1' || n.id === 'c2')
      .map((n) => n.x);
    expect(new Set(childXs).size).toBe(childXs.length);
  });

  it('includes partners for visible unions only', () => {
    const people: PersonNode[] = [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'a', childId: 'c', role: 'bio' },
      { parentId: 'b', childId: 'c', role: 'bio' },
    ];
    const unions = [{ id: 'u', aId: 'a', bId: 'b' }];
    const visibility: Visibility = {
      maxUpGenerations: 1,
      maxDownGenerations: 1,
      showRoles: { step: true, guardian: false, foster: false },
    };

    const showChild = layoutFamilyGraph({
      people,
      edges,
      unions,
      focusId: 'a',
      visibility,
      expansions: { a: { showChildren: true } },
    });
    expect(showChild.nodes.some((n) => n.id === 'b')).toBe(true);
    expect(showChild.nodes.some((n) => n.id === 'u' && n.union)).toBe(true);

    const hideChild = layoutFamilyGraph({
      people,
      edges,
      unions,
      focusId: 'a',
      visibility,
      expansions: { a: { showChildren: false } },
    });
    expect(hideChild.nodes.some((n) => n.id === 'b')).toBe(false);
    expect(hideChild.nodes.some((n) => n.id === 'u')).toBe(false);
  });
});
