import { describe, expect, it } from 'vitest';
import { edgePath } from '../src/graph/edgeRouting';
import type { LayoutNode } from '../src/graph/familyLayout';

describe('edgePath', () => {
  const parent: LayoutNode = { id: 'p', x: 0, y: 0, layer: 0 };
  const child: LayoutNode = { id: 'c', x: 0, y: 100, layer: 1 };

  it('creates vertical path for primary edges', () => {
    expect(edgePath(parent, child, 'bio')).toBe('M 0 0 V 100');
  });

  it('routes secondary edges to the side', () => {
    const stepParent: LayoutNode = { id: 's', x: 40, y: 0, layer: 0 };
    const stepChild: LayoutNode = { id: 'sc', x: 0, y: 100, layer: 1 };
    const path = edgePath(stepParent, stepChild, 'step');
    expect(path).toBe('M 40 0 H 60 V 100 H 0');
  });
});
