export interface PersonNode {
  id: string;
  firstName?: string;
  lastName?: string;
  birthYear?: number;
  deathYear?: number;
  gender?: string;
  tags?: string[];
}

export type ParentChildRole =
  | 'bio'
  | 'adoptive'
  | 'step'
  | 'guardian'
  | 'foster';

export interface ParentChildEdge {
  parentId: string;
  childId: string;
  role: ParentChildRole;
  start?: number;
  end?: number;
  certainty?: number;
}

export interface Union {
  id: string;
  aId: string;
  bId: string;
  start?: number;
  end?: number;
}

export interface Visibility {
  maxUpGenerations: number;
  maxDownGenerations: number;
  showRoles: {
    step: boolean;
    guardian: boolean;
    foster: boolean;
  };
}

export interface LayoutNode extends PersonNode {
  x: number;
  y: number;
  layer: number;
  /** true when representing a union anchor */
  union?: boolean;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: ParentChildEdge[];
}

export interface LayoutOptions {
  people: PersonNode[];
  edges: ParentChildEdge[];
  unions: Union[];
  focusId: string;
  visibility: Visibility;
}

/**
 * Very small layered layout. This is a simplified placeholder for the
 * genealogy renderer described in the project objectives. It computes relative
 * layers (generations) around a focus person and assigns basic x/y coordinates
 * so the graph can be rendered. The algorithm intentionally omits advanced
 * ordering, union bands and step/guardian/foster derivations but provides a
 * structure that can be expanded later.
 */
export function layoutFamilyGraph(options: LayoutOptions): LayoutResult {
  const { people, edges, unions, focusId, visibility } = options;

  const peopleMap = new Map(people.map((p) => [p.id, p]));

  // Compute generation offsets relative to focus
  const layers = new Map<string, number>();
  layers.set(focusId, 0);

  function traverseUp(id: string, depth: number): void {
    if (depth > visibility.maxUpGenerations) return;
    for (const e of edges) {
      if (e.childId === id) {
        const pId = e.parentId;
        if (!layers.has(pId) || (layers.get(pId) ?? 0) > -depth) {
          layers.set(pId, -depth);
          traverseUp(pId, depth + 1);
        }
      }
    }
  }

  function traverseDown(id: string, depth: number): void {
    if (depth > visibility.maxDownGenerations) return;
    for (const e of edges) {
      if (e.parentId === id) {
        const cId = e.childId;
        if (!layers.has(cId) || (layers.get(cId) ?? 0) < depth) {
          layers.set(cId, depth);
          traverseDown(cId, depth + 1);
        }
      }
    }
  }

  traverseUp(focusId, 1);
  traverseDown(focusId, 1);

  // Ensure union partners are placed on the same layer
  let changed = true;
  while (changed) {
    changed = false;
    for (const u of unions) {
      const aLayer = layers.get(u.aId);
      const bLayer = layers.get(u.bId);
      if (aLayer !== undefined && bLayer === undefined && peopleMap.has(u.bId)) {
        layers.set(u.bId, aLayer);
        changed = true;
      } else if (
        bLayer !== undefined &&
        aLayer === undefined &&
        peopleMap.has(u.aId)
      ) {
        layers.set(u.aId, bLayer);
        changed = true;
      }
    }
  }

  const nodesByLayer = new Map<number, string[]>();
  for (const [id, layer] of layers.entries()) {
    if (!nodesByLayer.has(layer)) nodesByLayer.set(layer, []);
    nodesByLayer.get(layer)!.push(id);
  }

  // determine earliest union start per person for ordering
  const earliestUnion = new Map<string, number>();
  for (const u of unions) {
    if (u.start === undefined) continue;
    for (const pid of [u.aId, u.bId]) {
      const prev = earliestUnion.get(pid);
      if (prev === undefined || u.start < prev) earliestUnion.set(pid, u.start);
    }
  }

  for (const ids of nodesByLayer.values()) {
    ids.sort((a, b) => {
      const ua = earliestUnion.get(a) ?? Number.MAX_SAFE_INTEGER;
      const ub = earliestUnion.get(b) ?? Number.MAX_SAFE_INTEGER;
      if (ua !== ub) return ua - ub;
      const pa = peopleMap.get(a)!;
      const pb = peopleMap.get(b)!;
      const byBirth = (pa.birthYear ?? Number.MAX_SAFE_INTEGER) -
        (pb.birthYear ?? Number.MAX_SAFE_INTEGER);
      if (byBirth !== 0) return byBirth;
      const byLast = (pa.lastName ?? '').localeCompare(pb.lastName ?? '');
      if (byLast !== 0) return byLast;
      return (pa.firstName ?? '').localeCompare(pb.firstName ?? '');
    });
  }

  const verticalSpacing = 140;
  const horizontalSpacing = 80;

  const layoutNodes: LayoutNode[] = [];
  for (const [layer, ids] of nodesByLayer.entries()) {
    ids.forEach((id, index) => {
      const person = peopleMap.get(id)!;
      layoutNodes.push({
        ...person,
        layer,
        x: index * horizontalSpacing,
        y: layer * verticalSpacing,
      });
    });
  }

  // create union anchors between partners
  const layoutMap = new Map(layoutNodes.map((n) => [n.id, n]));
  const unionNodes: LayoutNode[] = [];
  for (const u of unions) {
    const a = layoutMap.get(u.aId);
    const b = layoutMap.get(u.bId);
    if (a && b) {
      const x = (a.x + b.x) / 2;
      const y = a.y; // same layer as partners
      const node: LayoutNode = { id: u.id, x, y, layer: a.layer, union: true };
      unionNodes.push(node);
    }
  }

  // remap parent-child edges to union anchors when both parents are present
  const edgesByChild = new Map<string, ParentChildEdge[]>();
  for (const e of edges) {
    if (!edgesByChild.has(e.childId)) edgesByChild.set(e.childId, []);
    edgesByChild.get(e.childId)!.push(e);
  }

  const newEdges: ParentChildEdge[] = [];
  for (const [childId, list] of edgesByChild.entries()) {
    let handled = false;
    for (const u of unions) {
      const hasA = list.some((e) => e.parentId === u.aId);
      const hasB = list.some((e) => e.parentId === u.bId);
      if (hasA && hasB) {
        newEdges.push({ parentId: u.id, childId, role: 'bio' });
        handled = true;
        break;
      }
    }
    if (!handled) newEdges.push(...list);
  }

  // align children under their union anchors
  const anchorMap = new Map(unionNodes.map((n) => [n.id, n]));
  for (const e of newEdges) {
    const anchor = anchorMap.get(e.parentId);
    if (anchor) {
      const child = layoutMap.get(e.childId);
      if (child) child.x = anchor.x;
    }
  }

  return { nodes: [...layoutNodes, ...unionNodes], edges: newEdges };
}
