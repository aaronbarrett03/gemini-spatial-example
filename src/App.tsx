import {
  canvasRefAtom,
  isGeneratingAtom,
  responseAtom,
  promptAtom,
  visibleTextPromptAtom,
  activeModelAtom,
  responseFormatAtom,
  activerHoverBoxAtom,
} from "./atoms";
import { useAtom } from "jotai";
import Markdown from "react-markdown";
import { predictImage } from "./modelUtils";
import { useHandleDragAndDropImage } from "./hooks";
import { Canvas } from "./Canvas";
import { replaceLinkFormat } from "./utils";
import { useEffect, useRef } from "react";

function App() {
  const [prompt, setPrompt] = useAtom(promptAtom);
  const [response, setResponse] = useAtom(responseAtom);
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);
  const [canvasRefA] = useAtom(canvasRefAtom);
  const [visibleTextPrompt, setVisibleTextPrompt] = useAtom(
    visibleTextPromptAtom,
  );
  const [activeModel, setActiveModel] = useAtom(activeModelAtom);
  const [responseFormat, setResponseFormat] = useAtom(responseFormatAtom);
  useHandleDragAndDropImage();

  return (
    <div className="flex h-[100dvh] overflow-auto flex-col">
      <div className="max-w-[530px] mx-auto flex pt-4 px-2 flex-col gap-3">
        <div className="">
          <span className="font-bold">Gemini Spatial Example</span> using{" "}
          <a
            href="https://ai.google.dev/"
            target="_blank"
            className="underline"
          >
            Gemini
          </a>
        </div>
        <div className="flex gap-2 -my-2 text-sm">
          <div>Model:</div>
          <label className="flex gap-1">
            <input
              type="radio"
              name="model"
              value="flash"
              checked={activeModel === "flash"}
              onChange={() => {
                setActiveModel("flash");
              }}
            />
            <span>Flash</span>
          </label>
          <label className="flex ml-1 gap-1">
            <input
              type="radio"
              name="model"
              value="pro"
              checked={activeModel === "pro"}
              onChange={() => {
                setActiveModel("pro");
              }}
            />
            <span>Pro</span>
          </label>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="text-sm">Prompt</div>
            <button
              className="text-sm underline"
              onClick={() => {
                setVisibleTextPrompt(!visibleTextPrompt);
              }}
            >
              {visibleTextPrompt ? "hide" : "show"}
            </button>
          </div>
          {visibleTextPrompt ? (
            <textarea
              className="border resize-y border-black w-full px-2 py-1"
              rows={4}
              value={prompt}
              placeholder="prompt"
              onChange={(e) => {
                setPrompt(e.currentTarget.value);
              }}
            />
          ) : null}
        </div>
        <Canvas />
        <div>
          {isGenerating ? (
            <div className="border border-black animate-pulse text-center w-full py-1 rounded-full bg-neutral-200">
              Generating...
            </div>
          ) : (
            <button
              className="border border-black text-center w-full py-1 rounded-full hover:bg-neutral-100"
              onClick={async () => {
                setResponse("");
                setIsGenerating(true);
                try {
                  const imgUrl = canvasRefA
                    .current!.toDataURL("image/jpeg", 0.5)
                    .replace("data:image/jpeg;base64,", "");
                  const res = await predictImage(
                    "image/jpeg",
                    imgUrl,
                    prompt,
                    activeModel,
                  );
                  const val = res.text;
                  setResponse(val);
                } catch (e) {
                  setResponse("");
                  // @ts-expect-error need to set type
                  alert(e.error);
                }
                setIsGenerating(false);
              }}
            >
              Send
            </button>
          )}
        </div>
        {response.length > 0 ? (
          <div className="pb-6">
            <div className="flex justify-between text-sm mb-0.5">
              <div className="font-bold">Response</div>
              <div className="flex gap-2">
                <label className="flex gap-1">
                  <input
                    type="radio"
                    name="response-format"
                    value="raw"
                    checked={responseFormat === "raw"}
                    onChange={() => {
                      setResponseFormat("raw");
                    }}
                  />{" "}
                  <span>Raw</span>
                </label>
                <label className="flex gap-1 ml-1">
                  <input
                    type="radio"
                    name="response-format"
                    value="markdown+bb"
                    checked={responseFormat === "markdown+bb"}
                    onChange={() => {
                      setResponseFormat("markdown+bb");
                    }}
                  />{" "}
                  <span>Markdown+BB</span>
                </label>
              </div>
            </div>
            {responseFormat === "raw" ? (
              <div>{response}</div>
            ) : (
              <MardownResponse />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MardownResponse() {
  const [, setActiveHoverBox] = useAtom(activerHoverBoxAtom);
  const markdownWrapperRef = useRef<HTMLDivElement | null>(null);
  const [response] = useAtom(responseAtom);

  useEffect(() => {
    function handleMouseOver(event: MouseEvent) {
      // Check if the target of the event is an 'a' element
      const target = event.target as HTMLElement;
      if (target && target.tagName === "A") {
        const targetRef = target.getAttribute("href");
        if (targetRef && targetRef.startsWith("#bb-")) {
          setActiveHoverBox(targetRef.replace("#bb-", ""));
        }
      }
    }
    function handleMouseEnter() {
      setActiveHoverBox("active");
    }
    function handleMouseLeave() {
      setActiveHoverBox(null);
    }
    if (markdownWrapperRef.current) {
      markdownWrapperRef.current.addEventListener("mouseover", handleMouseOver);
      markdownWrapperRef.current.addEventListener(
        "mouseenter",
        handleMouseEnter,
      );
      markdownWrapperRef.current.addEventListener(
        "mouseleave",
        handleMouseLeave,
      );
    }
    return () => {
      if (markdownWrapperRef.current) {
        markdownWrapperRef.current.removeEventListener(
          "mouseover",
          handleMouseOver,
        );
        markdownWrapperRef.current.removeEventListener(
          "mouseenter",
          handleMouseEnter,
        );
        markdownWrapperRef.current.removeEventListener(
          "mouseleave",
          handleMouseLeave,
        );
      }
    };
  }, [markdownWrapperRef, setActiveHoverBox]);

  return (
    <div ref={markdownWrapperRef}>
      <Markdown className="w-full pb-4 mx-auto prose text-black">
        {replaceLinkFormat(response)}
      </Markdown>
    </div>
  );
}

export default App;
