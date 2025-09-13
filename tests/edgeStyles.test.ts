import { describe, it, expect } from 'vitest';
import { edgeStyle, filterEdgesByRole } from '../src/graph/edgeStyles';
import type { ParentChildEdge } from '../src/graph/familyLayout';

describe('edgeStyle', () => {
  it('maps roles to patterns', () => {
    const roles: ParentChildEdge['role'][] = ['bio', 'adoptive', 'step', 'guardian', 'foster'];
    const patterns = roles.map((role) => edgeStyle({ parentId: 'a', childId: 'b', role }).pattern);
    expect(patterns).toEqual(['solid', 'double', 'dashed', 'dotted', 'dotted']);
  });

  it('lowers opacity for uncertain links', () => {
    const certain = edgeStyle({ parentId: 'a', childId: 'b', role: 'bio', certainty: 0.8 });
    const uncertain = edgeStyle({ parentId: 'a', childId: 'b', role: 'bio', certainty: 0.2 });
    expect(certain.opacity).toBeGreaterThan(uncertain.opacity);
    expect(uncertain.opacity).toBeLessThan(1);
  });

  it('filters edges by visibility', () => {
    const edges: ParentChildEdge[] = [
      { parentId: 'a', childId: 'b', role: 'bio' },
      { parentId: 'a', childId: 'c', role: 'step' },
      { parentId: 'a', childId: 'd', role: 'guardian' },
      { parentId: 'a', childId: 'e', role: 'foster' },
    ];
    const visible = filterEdgesByRole(edges, {
      step: false,
      guardian: true,
      foster: false,
    });
    expect(visible.map((e) => e.childId)).toEqual(['b', 'd']);
  });
});
