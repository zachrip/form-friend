import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import getCaretCoordinates from "textarea-caret";
import { dijkstra, Point, Node } from "./dijkstra";

type Instruction = {
  type: "hop";
  from: Point;
  to: Point;
};

const Ball = () => {
  const ballRef = useRef<HTMLDivElement>(null);
  const currentBallPosition = useRef<Point | null>(null);
  const instructionsRef = useRef<Instruction[]>();
  const lockRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const processInstructions = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (lockRef.current) {
      return;
    }

    lockRef.current = true;

    const instruction = instructionsRef.current!.shift()!;

    if (!instruction) {
      lockRef.current = false;
      timerRef.current = setTimeout(() => {
        instructionsRef.current = [
          {
            type: "hop",
            from: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y,
            },
            to: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y - 8,
            },
          },
          {
            type: "hop",
            from: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y,
            },
            to: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y,
            },
          },
          {
            type: "hop",
            from: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y,
            },
            to: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y - 8,
            },
          },
          {
            type: "hop",
            from: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y,
            },
            to: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y,
            },
          },
          {
            type: "hop",
            from: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y,
            },
            to: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y - 8,
            },
          },
          {
            type: "hop",
            from: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y,
            },
            to: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y,
            },
          },
          {
            type: "hop",
            from: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y,
            },
            to: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y - 8,
            },
          },
          {
            type: "hop",
            from: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y,
            },
            to: {
              x: currentBallPosition.current!.x,
              y: currentBallPosition.current!.y,
            },
          },
        ];
        processInstructions();
      }, Math.random() * 3000 + 3000);
      return;
    }

    const ball = ballRef.current!;

    if (instruction.type === "hop") {
      const animation = ball.animate(
        [
          {
            offset: 0,
            transform: `translate(${instruction.from.x}px, ${instruction.from.y}px)`,
          },
          {
            offset: 0.25,
            transform: `translate(${instruction.from.x}px, ${
              instruction.from.y + 8
            }px)`,
            height: "0.5rem",
          },
          {
            offset: 0.75,
            height: "0.75rem",
            transform: `translate(${instruction.to.x}px, ${instruction.to.y}px)`,
          },
          {
            offset: 1,
            transform: `translate(${instruction.to.x}px, ${instruction.to.y}px)`,
          },
        ],
        {
          duration: 300,
          fill: "forwards",
          easing: "ease-in-out",
        }
      );

      currentBallPosition.current = {
        x: instruction.to.x,
        y: instruction.to.y,
      };

      animation.addEventListener(
        "finish",
        () => {
          animation.commitStyles();
          lockRef.current = false;
          processInstructions();
        },
        {
          once: true,
        }
      );
    }
  }, []);

  useEffect(() => {
    const handleEvent = (e: Event) => {
      // we use RAF to make sure we're getting the real caret position - not sure why this is necessary specifically for focusin
      requestAnimationFrame(() => {
        if (!(e.target instanceof HTMLInputElement)) {
          return;
        }

        const caretPosition = getCaretCoordinates(
          e.target,
          e.target.selectionStart || 0
        );

        const targetBoundingRect = e.target.getBoundingClientRect();

        const left = targetBoundingRect.left + caretPosition.left;
        const top = targetBoundingRect.top - 16;

        if (!currentBallPosition.current) {
          instructionsRef.current = [
            {
              type: "hop",
              from: {
                x: left,
                y: top,
              },
              to: {
                x: left,
                y: top,
              },
            },
          ];
          processInstructions();
          return;
        }

        const MAX_HORIZONTAL_DISTANCE = 50;
        const MAX_VERTICAL_DISTANCE = 10;

        // just to make it seem like the ball waits a bit before moving to follow the caret, this is mostly necessary when typing
        if (
          Math.abs(currentBallPosition.current.x - left) <
            MAX_HORIZONTAL_DISTANCE &&
          Math.abs(currentBallPosition.current.y - top) < MAX_VERTICAL_DISTANCE
        ) {
          return;
        }

        const NODE_DISTANCE = 8;
        // for each element in the array I want to create a node every NODE_DISTANCEpx on the x axis along the top of the element
        const nodes = Array.from(
          document.querySelectorAll("input, textarea, button")
        ).flatMap((el) => {
          const { x, y, width } = el.getBoundingClientRect();
          const nodes: Node[] = [];

          let lastNode: Node | null = null;
          for (let i = 0; i < width; i += NODE_DISTANCE) {
            nodes.push({
              el,
              x: x + i,
              y: y - 16,
              neighbors: lastNode ? [lastNode] : [],
            });

            if (lastNode) {
              lastNode.neighbors.push(nodes[nodes.length - 1]);
            }

            lastNode = nodes[nodes.length - 1];
          }

          nodes.push({
            el,
            x: x + width,
            y: y - 16,
            neighbors: lastNode ? [lastNode] : [],
          });

          return nodes;
        });

        const graph = nodes
          .map((node) => {
            node.neighbors = [
              ...node.neighbors,
              ...nodes
                .filter(
                  (otherNode) =>
                    otherNode !== node &&
                    otherNode.el !== node.el &&
                    Math.abs(otherNode.x - node.x) < 100 &&
                    Math.abs(otherNode.y - node.y) < 100
                )
                .sort((a, b) => {
                  const aDistance =
                    Math.abs(a.x - node.x) + Math.abs(a.y - node.y);

                  const bDistance =
                    Math.abs(b.x - node.x) + Math.abs(b.y - node.y);

                  return aDistance - bDistance;
                }),
              // TODO: make this a max per el instead of a global max
            ].slice(0, 6);

            return node;
          })
          .sort((a, b) => {
            const aDistance =
              Math.abs(a.x - currentBallPosition.current!.x) +
              Math.abs(a.y - currentBallPosition.current!.y);

            const bDistance =
              Math.abs(b.x - currentBallPosition.current!.x) +
              Math.abs(b.y - currentBallPosition.current!.y);

            return aDistance - bDistance;
          });

        // const canvas = document.createElement("canvas");
        // canvas.width = window.innerWidth;
        // canvas.height = window.innerHeight;
        // document.body.appendChild(canvas);

        // canvas.style.position = "absolute";
        // canvas.style.left = "0";
        // canvas.style.top = "0";
        // canvas.style.zIndex = "1000";
        // canvas.style.pointerEvents = "none";
        // canvas.style.width = "100vw";
        // canvas.style.height = "100vh";

        // const ctx = canvas.getContext("2d")!;
        // ctx.strokeStyle = "black";
        // ctx.fillStyle = "red";
        // ctx.lineWidth = 2;

        // graph.forEach((node) => {
        //   node.neighbors.forEach((neighbor) => {
        //     ctx.beginPath();
        //     ctx.moveTo(node.x, node.y);
        //     ctx.lineTo(neighbor.x, neighbor.y);
        //     ctx.stroke();
        //   });
        //   ctx.beginPath();
        //   ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
        //   ctx.fill();
        // });

        const END_NODE_DISTANCE = 20;

        const startNode = graph[0];
        const endNode = graph.find(
          (node) =>
            Math.abs(node.x - left) < END_NODE_DISTANCE &&
            Math.abs(node.y - top) < END_NODE_DISTANCE
        );

        const path = dijkstra(startNode, endNode!, graph);

        const hops: Array<Instruction> = path.map((node, index, array) => {
          const lastNode = array[index - 1] || startNode;

          return {
            type: "hop",
            from: {
              x: lastNode.x,
              y: lastNode.y,
            },
            to: {
              x: node.x,
              y: node.y,
            },
          };
        });

        hops.push({
          type: "hop",
          from: {
            x: hops[hops.length - 1].to.x,
            y: hops[hops.length - 1].to.y,
          },
          to: {
            x: left,
            y: top,
          },
        });

        instructionsRef.current = hops;
        processInstructions();
      });
    };

    // document.addEventListener("focusin", handleEvent);
    document.addEventListener("keyup", handleEvent);
    document.addEventListener("click", handleEvent);

    return () => {
      // document.removeEventListener("focusin", handleEvent);
      document.removeEventListener("keyup", handleEvent);
      document.removeEventListener("click", handleEvent);
    };
  }, [processInstructions]);

  return createPortal(
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <div
        ref={ballRef}
        style={
          {
            width: "1rem",
            height: "1rem",
            borderRadius: "50%",
            backgroundColor: "mediumpurple",
          } as React.CSSProperties
        }
      />
    </div>,
    document.body
  );
};

function App() {
  return (
    <>
      <Ball />
      <form
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        <input type="text" placeholder="First Name" />
        <input type="text" placeholder="Last Name" />
        <input type="text" placeholder="Email" />
        <input type="text" placeholder="Phone" />
        <input
          style={{
            position: "relative",
            transform: "translateX(-100px)",
          }}
          type="text"
          placeholder="Address"
        />

        <button>Submit</button>
      </form>
    </>
  );
}

export default App;
