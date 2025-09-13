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
      edges: [],
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
});
