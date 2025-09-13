import React from 'react';
import type { ParentChildRole } from '../graph/familyLayout';
import { patternForRole } from '../graph/edgeStyles';

const roles: ParentChildRole[] = ['bio', 'adoptive', 'step', 'guardian', 'foster'];

function dashFor(pattern: string): string | undefined {
  return pattern === 'dashed'
    ? '4 4'
    : pattern === 'dotted'
    ? '1 4'
    : pattern === 'double'
    ? '2,2'
    : undefined;
}

export default function RoleLegend(): React.JSX.Element {
  return (
    <ul
      aria-label="Relationship role legend"
      style={{ listStyle: 'none', padding: 0, display: 'flex', gap: 8 }}
    >
      {roles.map((role) => {
        const dash = dashFor(patternForRole(role));
        return (
          <li key={role} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="24" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="24"
                y2="4"
                stroke="black"
                strokeWidth={2}
                strokeDasharray={dash}
              />
            </svg>
            <span>{role}</span>
          </li>
        );
      })}
    </ul>
  );
}
