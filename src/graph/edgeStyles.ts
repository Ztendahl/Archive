import type { ParentChildEdge, ParentChildRole, Visibility } from './familyLayout';

export type EdgePattern = 'solid' | 'double' | 'dashed' | 'dotted';

const ROLE_PATTERN: Record<ParentChildRole, EdgePattern> = {
  bio: 'solid',
  adoptive: 'double',
  step: 'dashed',
  guardian: 'dotted',
  foster: 'dotted',
};

export interface EdgeStyle {
  pattern: EdgePattern;
  opacity: number;
}

const CERTAINTY_THRESHOLD = 0.5;

export function edgeStyle(edge: ParentChildEdge): EdgeStyle {
  const opacity =
    edge.certainty === undefined || edge.certainty >= CERTAINTY_THRESHOLD ? 1 : 0.4;
  return { pattern: ROLE_PATTERN[edge.role], opacity };
}

export function patternForRole(role: ParentChildRole): EdgePattern {
  return ROLE_PATTERN[role];
}

export type RoleVisibility = Visibility['showRoles'];

export function filterEdgesByRole<T extends ParentChildEdge>(
  edges: T[],
  visibility: RoleVisibility,
): T[] {
  return edges.filter((e) => {
    if (e.role === 'step' && !visibility.step) return false;
    if (e.role === 'guardian' && !visibility.guardian) return false;
    if (e.role === 'foster' && !visibility.foster) return false;
    return true;
  });
}
