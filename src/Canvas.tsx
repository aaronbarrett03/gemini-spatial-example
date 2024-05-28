import {
  inkColorAtom,
  canvasRefAtom,
  responseAtom,
  activerHoverBoxAtom,
} from "./atoms";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { getStroke } from "perfect-freehand";
import { getSvgPathFromStroke } from "./utils";
import { XIcon } from "lucide-react";
import { useDrawImageToCanvas, useSaveCanvasToLocalStorage } from "./hooks";
import { ImageUploader } from "./ImageUploader";
import { canvasHeight, canvasWidth } from "./consts";
import { BoundingBoxOverlay } from "./BoundingBoxOverlay";

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const w = canvasWidth;
  const h = canvasHeight;
  // store points and line color
  const pointsRef = useRef<
    { line: [number, number, number][]; color: string }[]
  >([]);
  const timeoutRef = useRef(-1);
  const [inkColor, setInkColor] = useAtom(inkColorAtom);
  const setResponse = useSetAtom(responseAtom);
  const [canvasRefA] = useAtom(canvasRefAtom);
  const saveCanvasToLocalStorage = useSaveCanvasToLocalStorage();
  const drawImageToCanvas = useDrawImageToCanvas();
  const setActiveHoverBox = useSetAtom(activerHoverBoxAtom);

  function drawPoints() {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")!;
      for (const points of pointsRef.current!) {
        ctx.fillStyle = points.color;
        const outlinePoints: [number, number, number][] = getStroke(
          points.line,
          {
            size: 4,
            simulatePressure: false,
          },
        ) as [number, number, number][];
        const pathData = getSvgPathFromStroke(outlinePoints);
        const path = new Path2D(pathData);
        ctx.fill(path);
      }
    }
  }

  function resetTimeout() {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveCanvasToLocalStorage();
    }, 1000);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
    const bounds = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    pointsRef.current.push({ line: [[x, y, 1]], color: inkColor });
    drawPoints();
    resetTimeout();
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.buttons !== 1) return;
    e.preventDefault();
    const bounds = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    const currentPoints = pointsRef.current[pointsRef.current.length - 1].line;
    currentPoints.push([x, y, 1]);
    drawPoints();
    resetTimeout();
  }

  useEffect(() => {
    const prevCanvas = localStorage.getItem("canvas-1");
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    // load from localStorage
    if (prevCanvas) {
      drawImageToCanvas(prevCanvas);
    } else {
      drawImageToCanvas(
        "data:image/jpeg;base64,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",
      );
    }
    // intentionally leaving out dependency
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') {
        // Canvas seems to be clearing on tab change
        // So we need to redraw the image
        const prevCanvas = localStorage.getItem("canvas-1");
        const c = canvasRef.current!;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, c.width, c.height);
        // load from localStorage
        if (prevCanvas) {
          drawImageToCanvas(prevCanvas);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    canvasRefA.current = canvasRef.current;
  }, [canvasRefA]);

  return (
    <div className="bg-white border border-black relative">
      <canvas
        className="block cursor-crosshair touch-none"
        ref={canvasRef}
        width={w}
        height={h}
      />
      <BoundingBoxOverlay />
      <div className="flex border-t border-black justify-between">
        <div className="flex">
          <div className="flex gap-1 items-center border-r border-black">
            <ImageUploader />
          </div>
          <div className="flex gap-1 items-center border-r border-black">
            <button
              className="text-sm flex gap-1 items-center px-2 py-2 hover:bg-neutral-100"
              onClick={() => {
                const c = canvasRef.current!;
                const ctx = c.getContext("2d")!;
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, c.width, c.height);
                pointsRef.current = [];
                saveCanvasToLocalStorage();
                setResponse("");
              }}
            >
              <XIcon size={14} /> Clear Canvas
            </button>
          </div>
        </div>
        <div className="flex">
          <div className="flex gap-1 items-center px-2 py-1 border-l border-black">
            <label className="text-sm cursor-pointer" htmlFor="color">
              Ink color:
            </label>
            <input
              className="cursor-pointer"
              id="color"
              type="color"
              value={inkColor}
              onChange={(e) => {
                setInkColor(e.currentTarget.value);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
