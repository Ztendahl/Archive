import type { LayoutNode, ParentChildRole } from './familyLayout';

/**
 * Compute an SVG path for a parent-child edge. Primary edges are mostly
 * vertical with an optional horizontal segment. Secondary roles route to the
 * side before descending to avoid obscuring union bands.
 */
export function edgePath(
  parent: LayoutNode,
  child: LayoutNode,
  role: ParentChildRole,
): string {
  if (role === 'bio' || role === 'adoptive') {
    // straight/orthogonal: vertical then horizontal when needed
    const parts = [`M ${parent.x} ${parent.y}`, `V ${child.y}`];
    if (parent.x !== child.x) parts.push(`H ${child.x}`);
    return parts.join(' ');
  }
  // secondary edges routed outside main lane
  const offset = parent.x < child.x ? -20 : 20;
  return `M ${parent.x} ${parent.y} H ${parent.x + offset} V ${child.y} H ${child.x}`;
}
