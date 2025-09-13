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
  const { people, edges, focusId, visibility } = options;

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

  const nodesByLayer = new Map<number, string[]>();
  for (const [id, layer] of layers.entries()) {
    if (!nodesByLayer.has(layer)) nodesByLayer.set(layer, []);
    nodesByLayer.get(layer)!.push(id);
  }

  for (const ids of nodesByLayer.values()) {
    ids.sort((a, b) => {
      const pa = peopleMap.get(a)!;
      const pb = peopleMap.get(b)!;
      const byBirth = (pa.birthYear ?? 0) - (pb.birthYear ?? 0);
      if (byBirth !== 0) return byBirth;
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

  return { nodes: layoutNodes, edges };
}
