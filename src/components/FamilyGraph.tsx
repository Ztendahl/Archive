import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  LayoutResult,
  ParentChildEdge,
  PersonNode,
  Union,
  Visibility,
} from '../graph/familyLayout';
import { layoutFamilyGraph } from '../graph/familyLayout';
import { edgeStyle, filterEdgesByRole } from '../graph/edgeStyles';

interface FamilyGraphProps {
  people: PersonNode[];
  edges: ParentChildEdge[];
  unions: Union[];
  focusId: string;
  visibility: Visibility;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export default function FamilyGraph({
  people,
  edges,
  unions,
  focusId,
  visibility,
}: FamilyGraphProps): React.JSX.Element {
  const [layout, setLayout] = useState<LayoutResult>(() =>
    layoutFamilyGraph({ people, edges, unions, focusId, visibility }),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentFocus, setCurrentFocus] = useState(focusId);
  const [showRoles, setShowRoles] = useState(visibility.showRoles);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });

  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const scale = Math.min(Math.max(0.1, transform.scale * (e.deltaY > 0 ? 0.9 : 1.1)), 5);
      const rect = svgRef.current?.getBoundingClientRect();
      const cx = e.clientX - (rect?.left ?? 0);
      const cy = e.clientY - (rect?.top ?? 0);
      const x = cx - ((cx - transform.x) * scale) / transform.scale;
      const y = cy - ((cy - transform.y) * scale) / transform.scale;
      setTransform({ x, y, scale });
    },
    [transform],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
  };
  const endDrag = () => {
    dragging.current = false;
  };

  const handleClickNode = (id: string) => {
    setSelectedId(id);
  };
  const handleDoubleClickNode = (id: string) => {
    const newLayout = layoutFamilyGraph({
      people,
      edges,
      unions,
      focusId: id,
      visibility,
    });
    setLayout(newLayout);
    setCurrentFocus(id);
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  useEffect(() => {
    setLayout(layoutFamilyGraph({ people, edges, unions, focusId: currentFocus, visibility }));
  }, [people, edges, unions, currentFocus, visibility]);

  const visibleEdges = filterEdgesByRole(layout.edges, showRoles);

  const toggleRole = (role: 'step' | 'guardian' | 'foster') => {
    setShowRoles((s) => ({ ...s, [role]: !s[role] }));
  };

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        {(['step', 'guardian', 'foster'] as const).map((role) => (
          <label key={role} style={{ marginRight: 8 }}>
            <input
              type="checkbox"
              checked={showRoles[role]}
              onChange={() => toggleRole(role)}
            />
            {role}
          </label>
        ))}
        <button onClick={resetView}>Reset</button>
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height="600"
        onWheel={handleWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {visibleEdges.map((e) => {
            const parent = layout.nodes.find((n) => n.id === e.parentId);
            const child = layout.nodes.find((n) => n.id === e.childId);
            if (!parent || !child) return null;
            const style = edgeStyle(e);
            const dash =
              style.pattern === 'dashed'
                ? '4 4'
                : style.pattern === 'dotted'
                ? '1 4'
                : style.pattern === 'double'
                ? '2,2'
                : undefined;
            return (
              <line
                key={`${e.parentId}-${e.childId}`}
                x1={parent.x}
                y1={parent.y}
                x2={child.x}
                y2={child.y}
                stroke="black"
                strokeWidth={1.5}
                strokeOpacity={style.opacity}
                strokeDasharray={dash}
              />
            );
          })}
          {layout.nodes.map((n) => (
            <g
              key={n.id}
              transform={`translate(${n.x},${n.y})`}
              onClick={(ev) => {
                ev.stopPropagation();
                handleClickNode(n.id);
              }}
              onDoubleClick={(ev) => {
                ev.stopPropagation();
                handleDoubleClickNode(n.id);
              }}
            >
              <circle
                r={10}
                fill={n.id === selectedId ? 'orange' : n.union ? '#ccc' : '#fff'}
                stroke="#000"
              />
              {n.firstName && <text x={12} y={4}>{n.firstName}</text>}
            </g>
          ))}
        </g>
      </svg>
      {selectedId && <div>Selected: {selectedId}</div>}
    </div>
  );
}
