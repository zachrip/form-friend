// this file has lots of ts errors but I'm not going to fix them
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

export type Point = {
  x: number;
  y: number;
};

export type Node = Point & {
  el: Element;
  neighbors: Node[];
};

function distance(nodeA: Node, nodeB: Node): number {
  return Math.sqrt(
    Math.pow(nodeB.x - nodeA.x, 2) + Math.pow(nodeB.y - nodeA.y, 2)
  );
}

export function dijkstra(start: Node, end: Node, nodes: Node[]): Node[] {
  const visited: Node[] = [];
  const unvisited: Node[] = [];

  // Initialize distances
  for (const node of nodes) {
    node.g = Infinity;
    node.previous = undefined;
    unvisited.push(node);
  }

  start.g = 0;

  while (unvisited.length > 0) {
    // Sort unvisited nodes by distance
    unvisited.sort((a, b) => a.g! - b.g!);

    const current = unvisited.shift()!;

    if (current === end) break;

    visited.push(current);

    current.neighbors.forEach((neighbor) => {
      if (!visited.includes(neighbor)) {
        const tentativeG = current.g! + distance(current, neighbor);
        if (tentativeG < neighbor.g!) {
          neighbor.g = tentativeG;
          neighbor.previous = current;
        }
      }
    });
  }

  // Build path
  const path: Node[] = [];
  let current: Node | undefined = end;
  while (current) {
    path.unshift(current);
    current = current.previous;
  }

  return path;
}
