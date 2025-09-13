import type { ParentChildEdge, ParentChildRole } from './familyLayout';

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
