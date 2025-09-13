import { describe, it, expect } from 'vitest';
import { performance } from 'node:perf_hooks';
import { layoutFamilyGraph } from '../src/graph/familyLayout';
import type {
  PersonNode,
  ParentChildEdge,
  Visibility,
  LayoutResult,
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

  it('creates union anchors and supports multiple unions', () => {
    const people: PersonNode[] = [
      { id: 'a', firstName: 'A', birthYear: 1980 },
      { id: 'b', firstName: 'B', birthYear: 1981 },
      { id: 'c', firstName: 'C', birthYear: 1982 },
      { id: 'd', firstName: 'D' },
      { id: 'e', firstName: 'E' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'a', childId: 'd', role: 'bio' },
      { parentId: 'b', childId: 'd', role: 'bio' },
      { parentId: 'a', childId: 'e', role: 'bio' },
      { parentId: 'c', childId: 'e', role: 'bio' },
    ];
    const unions = [
      { id: 'u1', aId: 'a', bId: 'b', start: 2000 },
      { id: 'u2', aId: 'a', bId: 'c', start: 2005 },
    ];
    const visibility: Visibility = {
      maxUpGenerations: 5,
      maxDownGenerations: 5,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const result = layoutFamilyGraph({
      people,
      edges,
      unions,
      focusId: 'a',
      visibility,
    });

    const union1 = result.nodes.find((n) => n.id === 'u1' && n.union);
    const union2 = result.nodes.find((n) => n.id === 'u2' && n.union);
    expect(union1 && union2).toBeTruthy();

    const edgeD = result.edges.find((e) => e.childId === 'd');
    const edgeE = result.edges.find((e) => e.childId === 'e');
    expect(edgeD?.parentId).toBe('u1');
    expect(edgeE?.parentId).toBe('u2');

    const childD = result.nodes.find((n) => n.id === 'd');
    const childE = result.nodes.find((n) => n.id === 'e');
    expect(childD?.x).toBe(union1!.x);
    expect(childE?.x).toBe(union2!.x);

    expect(result.nodes.filter((n) => n.id === 'a').length).toBe(1);
  });

  it('orders nodes by union start, birth year and name', () => {
    const people: PersonNode[] = [
      { id: 'a', firstName: 'Ann', birthYear: 1980 },
      { id: 'b', firstName: 'Bob', birthYear: 1975 },
      { id: 'c', firstName: 'Cal', birthYear: 1985 },
      { id: 'd', firstName: 'D' },
      { id: 'e', firstName: 'E' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'a', childId: 'd', role: 'bio' },
      { parentId: 'b', childId: 'd', role: 'bio' },
      { parentId: 'a', childId: 'e', role: 'bio' },
      { parentId: 'c', childId: 'e', role: 'bio' },
    ];
    const unions = [
      { id: 'u1', aId: 'a', bId: 'b', start: 1990 },
      { id: 'u2', aId: 'a', bId: 'c', start: 2005 },
    ];
    const visibility: Visibility = {
      maxUpGenerations: 1,
      maxDownGenerations: 1,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const result = layoutFamilyGraph({
      people,
      edges,
      unions,
      focusId: 'a',
      visibility,
    });
    const layer0 = result.nodes
      .filter((n) => n.layer === 0 && !n.union)
      .sort((a, b) => a.x - b.x)
      .map((n) => n.id);
    expect(layer0).toEqual(['b', 'a', 'c']);
  });

  it('respects generation caps', () => {
    const people: PersonNode[] = [
      { id: 'gp' },
      { id: 'p' },
      { id: 'f' },
      { id: 'c' },
      { id: 'gc' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'gp', childId: 'p', role: 'bio' },
      { parentId: 'p', childId: 'f', role: 'bio' },
      { parentId: 'f', childId: 'c', role: 'bio' },
      { parentId: 'c', childId: 'gc', role: 'bio' },
    ];
    const visibility1: Visibility = {
      maxUpGenerations: 1,
      maxDownGenerations: 1,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const r1 = layoutFamilyGraph({
      people,
      edges,
      unions: [],
      focusId: 'f',
      visibility: visibility1,
    });
    expect(r1.nodes.map((n) => n.id).sort()).toEqual(
      ['c', 'c:children', 'f', 'p', 'p:parents'].sort(),
    );

    const visibility2: Visibility = {
      maxUpGenerations: 2,
      maxDownGenerations: 2,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const r2 = layoutFamilyGraph({
      people,
      edges,
      unions: [],
      focusId: 'f',
      visibility: visibility2,
    });
    expect(r2.nodes.some((n) => n.id === 'gp')).toBe(true);
    expect(r2.nodes.some((n) => n.id === 'gc')).toBe(true);
    expect(r2.nodes.some((n) => n.id === 'p:parents')).toBe(false);
    expect(r2.nodes.some((n) => n.id === 'c:children')).toBe(false);
    expect(r2.nodes.length).toBe(r1.nodes.length);
  });

  it('collapses and expands branches with placeholders', () => {
    const people: PersonNode[] = [
      { id: 'p1' },
      { id: 'p2' },
      { id: 'f' },
      { id: 'c1' },
      { id: 'c2' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'p1', childId: 'f', role: 'bio' },
      { parentId: 'p2', childId: 'f', role: 'bio' },
      { parentId: 'f', childId: 'c1', role: 'bio' },
      { parentId: 'f', childId: 'c2', role: 'bio' },
    ];
    const visibility: Visibility = {
      maxUpGenerations: 5,
      maxDownGenerations: 5,
      showRoles: { step: true, guardian: false, foster: false },
    };

    const collapsed = layoutFamilyGraph({
      people,
      edges,
      unions: [],
      focusId: 'f',
      visibility,
      expansions: { f: { showParents: false, showChildren: false } },
    });
    const placeholders = collapsed.nodes.filter((n) => n.placeholder);
    expect(placeholders.length).toBe(2);
    const parentPlaceholder = placeholders.find((n) => n.id.includes('parents'));
    const childPlaceholder = placeholders.find((n) => n.id.includes('children'));
    expect(parentPlaceholder?.count).toBe(2);
    expect(childPlaceholder?.count).toBe(2);

    const expanded = layoutFamilyGraph({
      people,
      edges,
      unions: [],
      focusId: 'f',
      visibility,
      expansions: { f: { showParents: false, showChildren: true } },
    });
    expect(expanded.nodes.some((n) => n.id === 'c1')).toBe(true);
    expect(expanded.nodes.some((n) => n.id === 'c2')).toBe(true);
    expect(expanded.nodes.filter((n) => n.id === 'f:children').length).toBe(0);
    const childXs = expanded.nodes
      .filter((n) => n.id === 'c1' || n.id === 'c2')
      .map((n) => n.x);
    expect(new Set(childXs).size).toBe(childXs.length);
  });

  it('includes partners for visible unions only', () => {
    const people: PersonNode[] = [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'a', childId: 'c', role: 'bio' },
      { parentId: 'b', childId: 'c', role: 'bio' },
    ];
    const unions = [{ id: 'u', aId: 'a', bId: 'b' }];
    const visibility: Visibility = {
      maxUpGenerations: 1,
      maxDownGenerations: 1,
      showRoles: { step: true, guardian: false, foster: false },
    };

    const showChild = layoutFamilyGraph({
      people,
      edges,
      unions,
      focusId: 'a',
      visibility,
      expansions: { a: { showChildren: true } },
    });
    expect(showChild.nodes.some((n) => n.id === 'b')).toBe(true);
    expect(showChild.nodes.some((n) => n.id === 'u' && n.union)).toBe(true);

    const hideChild = layoutFamilyGraph({
      people,
      edges,
      unions,
      focusId: 'a',
      visibility,
      expansions: { a: { showChildren: false } },
    });
    expect(hideChild.nodes.some((n) => n.id === 'b')).toBe(false);
    expect(hideChild.nodes.some((n) => n.id === 'u')).toBe(false);
  });

  it('maintains positions when toggling children', () => {
    const people: PersonNode[] = [
      { id: 'gp' },
      { id: 'p' },
      { id: 'c1' },
      { id: 'c2' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'gp', childId: 'p', role: 'bio' },
      { parentId: 'p', childId: 'c1', role: 'bio' },
      { parentId: 'p', childId: 'c2', role: 'bio' },
    ];
    const visibility: Visibility = {
      maxUpGenerations: 5,
      maxDownGenerations: 5,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const expanded = layoutFamilyGraph({
      people,
      edges,
      unions: [],
      focusId: 'p',
      visibility,
      expansions: { p: { showChildren: true } },
    });
    const collapsed = layoutFamilyGraph({
      people,
      edges,
      unions: [],
      focusId: 'p',
      visibility,
      expansions: { p: { showChildren: false } },
    });
    const deltas = ['gp', 'p'].map((id) => {
      const a = expanded.nodes.find((n) => n.id === id)!;
      const b = collapsed.nodes.find((n) => n.id === id)!;
      return { id, dx: b.x - a.x, dy: b.y - a.y };
    });
    expect(deltas).toMatchInlineSnapshot(`
      [
        {
          "dx": 0,
          "dy": 0,
          "id": "gp",
        },
        {
          "dx": 0,
          "dy": 0,
          "id": "p",
        },
      ]
    `);
  });

  it('stacks dense sibling groups into a placeholder', () => {
    const people: PersonNode[] = [{ id: 'p' }, ...Array.from({ length: 12 }, (_, i) => ({ id: `c${i}` }))];
    const edges: ParentChildEdge[] = people
      .filter((p) => p.id !== 'p')
      .map((c) => ({ parentId: 'p', childId: c.id, role: 'bio' }));
    const visibility: Visibility = {
      maxUpGenerations: 5,
      maxDownGenerations: 5,
      showRoles: { step: true, guardian: true, foster: true },
    };
    const r = layoutFamilyGraph({ people, edges, unions: [], focusId: 'p', visibility });
    const placeholder = r.nodes.find((n) => n.id === 'p:siblings');
    expect(placeholder?.placeholder).toBe(true);
    expect(placeholder?.count).toBe(2);
    const childNodes = r.nodes.filter((n) => n.layer === 1 && !n.placeholder);
    expect(childNodes.length).toBe(10);

    const expanded = layoutFamilyGraph({
      people,
      edges,
      unions: [],
      focusId: 'p',
      visibility,
      expansions: { p: { showAllChildren: true } },
    });
    expect(expanded.nodes.filter((n) => n.layer === 1 && !n.placeholder).length).toBe(12);
    expect(expanded.nodes.some((n) => n.id === 'p:siblings')).toBe(false);
  });

  it('spaces siblings at least 40px apart', () => {
    const people: PersonNode[] = [
      { id: 'p' },
      { id: 'c1' },
      { id: 'c2' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'p', childId: 'c1', role: 'bio' },
      { parentId: 'p', childId: 'c2', role: 'bio' },
    ];
    const visibility: Visibility = {
      maxUpGenerations: 5,
      maxDownGenerations: 5,
      showRoles: { step: true, guardian: true, foster: true },
    };
    const r = layoutFamilyGraph({ people, edges, unions: [], focusId: 'p', visibility });
    const xs = r.nodes
      .filter((n) => n.layer === 1 && !n.placeholder)
      .map((n) => n.x)
      .sort((a, b) => a - b);
    expect(xs[1] - xs[0]).toBeGreaterThanOrEqual(40);
  });

  it('keeps existing node positions stable when adding an edge', () => {
    const people: PersonNode[] = [
      { id: 'p' },
      { id: 'c1' },
      { id: 'c2' },
    ];
    const edges1: ParentChildEdge[] = [{ parentId: 'p', childId: 'c1', role: 'bio' }];
    const edges2: ParentChildEdge[] = [
      { parentId: 'p', childId: 'c1', role: 'bio' },
      { parentId: 'p', childId: 'c2', role: 'bio' },
    ];
    const visibility: Visibility = {
      maxUpGenerations: 5,
      maxDownGenerations: 5,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const r1 = layoutFamilyGraph({
      people,
      edges: edges1,
      unions: [],
      focusId: 'p',
      visibility,
    });
    const r2 = layoutFamilyGraph({
      people,
      edges: edges2,
      unions: [],
      focusId: 'p',
      visibility,
    });
    const deltas = ['p', 'c1'].map((id) => {
      const a = r1.nodes.find((n) => n.id === id)!;
      const b = r2.nodes.find((n) => n.id === id)!;
      return { id, dx: b.x - a.x, dy: b.y - a.y };
    });
    expect(deltas).toMatchInlineSnapshot(`
      [
        {
          "dx": 0,
          "dy": 0,
          "id": "p",
        },
        {
          "dx": 0,
          "dy": 0,
          "id": "c1",
        },
      ]
    `);
  });

  it('anchors children consistently regardless of partner order', () => {
    const people: PersonNode[] = [
      { id: 'a' },
      { id: 'b' },
      { id: 'x' },
      { id: 'y' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'a', childId: 'x', role: 'bio' },
      { parentId: 'b', childId: 'x', role: 'bio' },
      { parentId: 'a', childId: 'y', role: 'bio' },
      { parentId: 'b', childId: 'y', role: 'bio' },
    ];
    const unions1 = [{ id: 'u', aId: 'a', bId: 'b' }];
    const unions2 = [{ id: 'u', aId: 'b', bId: 'a' }];
    const visibility: Visibility = {
      maxUpGenerations: 5,
      maxDownGenerations: 5,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const r1 = layoutFamilyGraph({
      people,
      edges,
      unions: unions1,
      focusId: 'a',
      visibility,
    });
    const r2 = layoutFamilyGraph({
      people,
      edges,
      unions: unions2,
      focusId: 'a',
      visibility,
    });
    const childOrder = (r: LayoutResult) =>
      r.nodes
        .filter((n) => n.layer === 1 && !n.union)
        .sort((a, b) => a.x - b.x)
        .map((n) => n.id);
    expect(childOrder(r1)).toEqual(childOrder(r2));
    const anchor1 = r1.nodes.find((n) => n.id === 'u');
    const anchor2 = r2.nodes.find((n) => n.id === 'u');
    const childX1 = r1.nodes.find((n) => n.id === 'x');
    const childX2 = r2.nodes.find((n) => n.id === 'x');
    expect(childX1?.x).toBe(anchor1?.x);
    expect(childX2?.x).toBe(anchor2?.x);
  });

  it('derives step edges from unions without duplicates', () => {
    const people: PersonNode[] = [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
      { id: 'e' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'a', childId: 'c', role: 'bio' },
      { parentId: 'a', childId: 'e', role: 'bio' },
      { parentId: 'b', childId: 'e', role: 'bio' },
    ];
    const unions = [{ id: 'u', aId: 'a', bId: 'b' }];
    const visibility: Visibility = {
      maxUpGenerations: 5,
      maxDownGenerations: 5,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const withUnion = layoutFamilyGraph({
      people,
      edges,
      unions,
      focusId: 'c',
      visibility,
    });
    expect(
      withUnion.edges.some(
        (e) => e.parentId === 'b' && e.childId === 'c' && e.role === 'step',
      ),
    ).toBe(true);

    const withUnionE = layoutFamilyGraph({
      people,
      edges,
      unions,
      focusId: 'e',
      visibility,
    });
    const eEdges = withUnionE.edges.filter((e) => e.childId === 'e');
    expect(eEdges).toEqual([{ parentId: 'u', childId: 'e', role: 'bio' }]);

    const withoutUnion = layoutFamilyGraph({
      people,
      edges,
      unions: [],
      focusId: 'c',
      visibility,
    });
    expect(
      withoutUnion.edges.some((e) => e.parentId === 'b' && e.childId === 'c'),
    ).toBe(false);
  });

  it('provides placeholders when generation caps hide relatives', () => {
    const people: PersonNode[] = [
      { id: 'gp' },
      { id: 'p' },
      { id: 'f' },
      { id: 'c' },
      { id: 'gc' },
    ];
    const edges: ParentChildEdge[] = [
      { parentId: 'gp', childId: 'p', role: 'bio' },
      { parentId: 'p', childId: 'f', role: 'bio' },
      { parentId: 'f', childId: 'c', role: 'bio' },
      { parentId: 'c', childId: 'gc', role: 'bio' },
    ];
    const visibility: Visibility = {
      maxUpGenerations: 1,
      maxDownGenerations: 1,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const r = layoutFamilyGraph({
      people,
      edges,
      unions: [],
      focusId: 'f',
      visibility,
    });
    const up = r.nodes.filter((n) => n.layer === -1 && !n.placeholder);
    const down = r.nodes.filter((n) => n.layer === 1 && !n.placeholder);
    expect(up.map((n) => n.id)).toEqual(['p']);
    expect(down.map((n) => n.id)).toEqual(['c']);
    const pPlaceholder = r.nodes.find((n) => n.id === 'p:parents');
    const cPlaceholder = r.nodes.find((n) => n.id === 'c:children');
    expect(pPlaceholder?.count).toBe(1);
    expect(cPlaceholder?.count).toBe(1);
  });

  it('captures golden layouts for key scenarios', () => {
    const visibility: Visibility = {
      maxUpGenerations: 5,
      maxDownGenerations: 5,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const simple = (res: LayoutResult) => ({
      nodes: res.nodes
        .map((n) => ({
          id: n.id,
          x: n.x,
          y: n.y,
          layer: n.layer,
          union: !!n.union,
          placeholder: !!n.placeholder,
          count: n.count,
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
      edges: res.edges
        .map((e) => ({ parentId: e.parentId, childId: e.childId, role: e.role }))
        .sort((a, b) => a.childId.localeCompare(b.childId)),
    });

    // single union
    const people1: PersonNode[] = [
      { id: 'a', birthYear: 1980 },
      { id: 'b', birthYear: 1981 },
      { id: 'c' },
    ];
    const edges1: ParentChildEdge[] = [
      { parentId: 'a', childId: 'c', role: 'bio' },
      { parentId: 'b', childId: 'c', role: 'bio' },
    ];
    const unions1 = [{ id: 'u1', aId: 'a', bId: 'b', start: 2000 }];
    const r1 = simple(
      layoutFamilyGraph({ people: people1, edges: edges1, unions: unions1, focusId: 'a', visibility }),
    );

    // multiple unions
    const people2: PersonNode[] = [
      { id: 'a', birthYear: 1980 },
      { id: 'b', birthYear: 1978 },
      { id: 'c', birthYear: 1982 },
      { id: 'd' },
      { id: 'e' },
    ];
    const edges2: ParentChildEdge[] = [
      { parentId: 'a', childId: 'd', role: 'bio' },
      { parentId: 'b', childId: 'd', role: 'bio' },
      { parentId: 'a', childId: 'e', role: 'bio' },
      { parentId: 'c', childId: 'e', role: 'bio' },
    ];
    const unions2 = [
      { id: 'u1', aId: 'a', bId: 'b', start: 2000 },
      { id: 'u2', aId: 'a', bId: 'c', start: 2005 },
    ];
    const r2 = simple(
      layoutFamilyGraph({ people: people2, edges: edges2, unions: unions2, focusId: 'a', visibility }),
    );

    // step edges
    const people3: PersonNode[] = [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
    ];
    const edges3: ParentChildEdge[] = [{ parentId: 'a', childId: 'c', role: 'bio' }];
    const unions3 = [{ id: 'u', aId: 'a', bId: 'b' }];
    const r3 = simple(
      layoutFamilyGraph({ people: people3, edges: edges3, unions: unions3, focusId: 'c', visibility }),
    );

    // large sibling set
    const people4: PersonNode[] = [
      { id: 'p' },
      ...Array.from({ length: 12 }, (_, i) => ({ id: `c${i}` })),
    ];
    const edges4: ParentChildEdge[] = people4
      .filter((p) => p.id !== 'p')
      .map((c) => ({ parentId: 'p', childId: c.id, role: 'bio' }));
    const r4 = simple(
      layoutFamilyGraph({ people: people4, edges: edges4, unions: [], focusId: 'p', visibility }),
    );

    expect({ r1, r2, r3, r4 }).toMatchInlineSnapshot(`
      {
        "r1": {
          "edges": [
            {
              "childId": "c",
              "parentId": "u1",
              "role": "bio",
            },
          ],
          "nodes": [
            {
              "count": undefined,
              "id": "a",
              "layer": 0,
              "placeholder": false,
              "union": false,
              "x": 0,
              "y": 0,
            },
            {
              "count": undefined,
              "id": "b",
              "layer": 0,
              "placeholder": false,
              "union": false,
              "x": 120,
              "y": 0,
            },
            {
              "count": undefined,
              "id": "c",
              "layer": 1,
              "placeholder": false,
              "union": false,
              "x": 60,
              "y": 100,
            },
            {
              "count": undefined,
              "id": "u1",
              "layer": 0,
              "placeholder": false,
              "union": true,
              "x": 60,
              "y": 0,
            },
          ],
        },
        "r2": {
          "edges": [
            {
              "childId": "d",
              "parentId": "u1",
              "role": "bio",
            },
            {
              "childId": "e",
              "parentId": "u2",
              "role": "bio",
            },
          ],
          "nodes": [
            {
              "count": undefined,
              "id": "a",
              "layer": 0,
              "placeholder": false,
              "union": false,
              "x": 120,
              "y": 0,
            },
            {
              "count": undefined,
              "id": "b",
              "layer": 0,
              "placeholder": false,
              "union": false,
              "x": 0,
              "y": 0,
            },
            {
              "count": undefined,
              "id": "c",
              "layer": 0,
              "placeholder": false,
              "union": false,
              "x": 240,
              "y": 0,
            },
            {
              "count": undefined,
              "id": "d",
              "layer": 1,
              "placeholder": false,
              "union": false,
              "x": 60,
              "y": 100,
            },
            {
              "count": undefined,
              "id": "e",
              "layer": 1,
              "placeholder": false,
              "union": false,
              "x": 180,
              "y": 100,
            },
            {
              "count": undefined,
              "id": "u1",
              "layer": 0,
              "placeholder": false,
              "union": true,
              "x": 60,
              "y": 0,
            },
            {
              "count": undefined,
              "id": "u2",
              "layer": 0,
              "placeholder": false,
              "union": true,
              "x": 180,
              "y": 0,
            },
          ],
        },
        "r3": {
          "edges": [
            {
              "childId": "c",
              "parentId": "a",
              "role": "bio",
            },
            {
              "childId": "c",
              "parentId": "b",
              "role": "step",
            },
          ],
          "nodes": [
            {
              "count": undefined,
              "id": "a",
              "layer": -1,
              "placeholder": false,
              "union": false,
              "x": 0,
              "y": -100,
            },
            {
              "count": undefined,
              "id": "b",
              "layer": -1,
              "placeholder": false,
              "union": false,
              "x": 120,
              "y": -100,
            },
            {
              "count": undefined,
              "id": "c",
              "layer": 0,
              "placeholder": false,
              "union": false,
              "x": 0,
              "y": 0,
            },
            {
              "count": undefined,
              "id": "u",
              "layer": -1,
              "placeholder": false,
              "union": true,
              "x": 60,
              "y": -100,
            },
          ],
        },
        "r4": {
          "edges": [
            {
              "childId": "c0",
              "parentId": "p",
              "role": "bio",
            },
            {
              "childId": "c1",
              "parentId": "p",
              "role": "bio",
            },
            {
              "childId": "c2",
              "parentId": "p",
              "role": "bio",
            },
            {
              "childId": "c3",
              "parentId": "p",
              "role": "bio",
            },
            {
              "childId": "c4",
              "parentId": "p",
              "role": "bio",
            },
            {
              "childId": "c5",
              "parentId": "p",
              "role": "bio",
            },
            {
              "childId": "c6",
              "parentId": "p",
              "role": "bio",
            },
            {
              "childId": "c7",
              "parentId": "p",
              "role": "bio",
            },
            {
              "childId": "c8",
              "parentId": "p",
              "role": "bio",
            },
            {
              "childId": "c9",
              "parentId": "p",
              "role": "bio",
            },
          ],
          "nodes": [
            {
              "count": undefined,
              "id": "c0",
              "layer": 1,
              "placeholder": false,
              "union": false,
              "x": 0,
              "y": 100,
            },
            {
              "count": undefined,
              "id": "c1",
              "layer": 1,
              "placeholder": false,
              "union": false,
              "x": 120,
              "y": 100,
            },
            {
              "count": undefined,
              "id": "c2",
              "layer": 1,
              "placeholder": false,
              "union": false,
              "x": 240,
              "y": 100,
            },
            {
              "count": undefined,
              "id": "c3",
              "layer": 1,
              "placeholder": false,
              "union": false,
              "x": 360,
              "y": 100,
            },
            {
              "count": undefined,
              "id": "c4",
              "layer": 1,
              "placeholder": false,
              "union": false,
              "x": 480,
              "y": 100,
            },
            {
              "count": undefined,
              "id": "c5",
              "layer": 1,
              "placeholder": false,
              "union": false,
              "x": 600,
              "y": 100,
            },
            {
              "count": undefined,
              "id": "c6",
              "layer": 1,
              "placeholder": false,
              "union": false,
              "x": 720,
              "y": 100,
            },
            {
              "count": undefined,
              "id": "c7",
              "layer": 1,
              "placeholder": false,
              "union": false,
              "x": 840,
              "y": 100,
            },
            {
              "count": undefined,
              "id": "c8",
              "layer": 1,
              "placeholder": false,
              "union": false,
              "x": 960,
              "y": 100,
            },
            {
              "count": undefined,
              "id": "c9",
              "layer": 1,
              "placeholder": false,
              "union": false,
              "x": 1080,
              "y": 100,
            },
            {
              "count": undefined,
              "id": "p",
              "layer": 0,
              "placeholder": false,
              "union": false,
              "x": 0,
              "y": 0,
            },
            {
              "count": 2,
              "id": "p:siblings",
              "layer": 1,
              "placeholder": true,
              "union": false,
              "x": 1200,
              "y": 100,
            },
          ],
        },
      }
    `);
  });

  it('meets basic performance thresholds', () => {
    const people: PersonNode[] = Array.from({ length: 200 }, (_, i) => ({ id: `p${i}` }));
    const edges: ParentChildEdge[] = [];
    for (let i = 1; i < people.length; i++) {
      edges.push({ parentId: `p${Math.floor((i - 1) / 2)}`, childId: `p${i}`, role: 'bio' });
    }
    const visibility: Visibility = {
      maxUpGenerations: 10,
      maxDownGenerations: 10,
      showRoles: { step: true, guardian: false, foster: false },
    };
    const start = performance.now();
    const r = layoutFamilyGraph({
      people,
      edges,
      unions: [],
      focusId: 'p0',
      visibility,
    });
    const layoutMs = performance.now() - start;
    const drawStart = performance.now();
    let sink = 0;
    for (const n of r.nodes) sink += n.x + n.y;
    for (const e of r.edges) sink += e.parentId.length + e.childId.length;
    const drawMs = performance.now() - drawStart;
    const fpsMin = 1000 / (layoutMs + drawMs);
    expect(layoutMs).toBeLessThanOrEqual(60);
    expect(drawMs).toBeLessThanOrEqual(12);
    expect(fpsMin).toBeGreaterThanOrEqual(55);
    expect(sink).toBeGreaterThan(0); // prevent dead code elimination
  });
});
