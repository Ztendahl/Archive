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
});
