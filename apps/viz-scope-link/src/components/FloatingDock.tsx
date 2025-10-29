import { useEffect, useState } from "react";
import { Hand, MousePointer2, Undo, Redo } from "lucide-react";
import * as go from "gojs";

interface FloatingDockProps {
  diagram: go.Diagram | null;
}

type ToolMode = "pan" | "select";

export function FloatingDock({ diagram }: FloatingDockProps) {
  const [toolMode, setToolMode] = useState<ToolMode>("pan");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Set pan mode as default when diagram is ready
  useEffect(() => {
    if (!diagram) return;
    
    // One-time initialization: enable infinite scroll
    diagram.commit(d => {
      d.allowHorizontalScroll = true;
      d.allowVerticalScroll = true;
      d.scrollMode = go.Diagram.InfiniteScroll;
    }, 'init-scroll');
    
    // Set pan mode as default
    diagram.commit(d => {
      d.toolManager.panningTool.isEnabled = true;
      d.toolManager.dragSelectingTool.isEnabled = false;
      d.toolManager.draggingTool.isEnabled = false;
      d.defaultCursor = 'grab';
    }, 'tool-pan');
    
    // Update cursor during panning
    const panTool = diagram.toolManager.panningTool;
    const originalDoMouseDown = panTool.doMouseDown;
    const originalDoMouseUp = panTool.doMouseUp;
    
    panTool.doMouseDown = function() {
      if (diagram.defaultCursor === 'grab') {
        diagram.div.style.cursor = "grabbing";
      }
      originalDoMouseDown.call(this);
    };
    
    panTool.doMouseUp = function() {
      if (diagram.defaultCursor === 'grab') {
        diagram.div.style.cursor = "grab";
      }
      originalDoMouseUp.call(this);
    };
  }, [diagram]);

  useEffect(() => {
    if (!diagram) return;

    const updateUndoRedoState = () => {
      setCanUndo(diagram.commandHandler.canUndo());
      setCanRedo(diagram.commandHandler.canRedo());
    };

    // Listen to model changes to update undo/redo state
    const listener = () => updateUndoRedoState();
    diagram.addModelChangedListener(listener);
    
    // Initial state
    updateUndoRedoState();

    return () => {
      diagram.removeModelChangedListener(listener);
    };
  }, [diagram]);

  const handlePanClick = () => {
    if (!diagram) return;
    
    diagram.commit(d => {
      d.toolManager.panningTool.isEnabled = true;
      d.toolManager.dragSelectingTool.isEnabled = false;
      d.toolManager.draggingTool.isEnabled = false;
      d.defaultCursor = 'grab';
    }, 'tool-pan');
    
    diagram.div.style.cursor = "grab";
    setToolMode("pan");
  };

  const handleSelectClick = () => {
    if (!diagram) return;
    
    diagram.commit(d => {
      d.toolManager.panningTool.isEnabled = false;
      d.toolManager.dragSelectingTool.isEnabled = true;
      d.toolManager.draggingTool.isEnabled = true;
      d.defaultCursor = 'default';
    }, 'tool-select');
    
    diagram.div.style.cursor = "default";
    setToolMode("select");
  };

  const handleUndo = () => {
    if (!diagram || !canUndo) return;
    diagram.commandHandler.undo();
  };

  const handleRedo = () => {
    if (!diagram || !canRedo) return;
    diagram.commandHandler.redo();
  };

  return (
    <div 
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 h-11 px-2 rounded-full bg-card border border-border shadow-lg backdrop-blur-sm"
      style={{
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Pan button */}
      <button
        onClick={handlePanClick}
        disabled={!diagram}
        className={`
          w-9 h-9 rounded-full flex items-center justify-center
          transition-colors duration-150
          ${toolMode === "pan" 
            ? "bg-muted text-foreground" 
            : "text-muted-foreground hover:bg-muted/50"
          }
          ${!diagram ? "opacity-40 cursor-not-allowed" : ""}
        `}
        title="Pan (Hand tool)"
        aria-label="Pan tool"
      >
        <Hand size={18} strokeWidth={2} />
      </button>

      {/* Select button */}
      <button
        onClick={handleSelectClick}
        disabled={!diagram}
        className={`
          w-9 h-9 rounded-full flex items-center justify-center
          transition-colors duration-150
          ${toolMode === "select" 
            ? "bg-muted text-foreground" 
            : "text-muted-foreground hover:bg-muted/50"
          }
          ${!diagram ? "opacity-40 cursor-not-allowed" : ""}
        `}
        title="Select"
        aria-label="Select tool"
      >
        <MousePointer2 size={18} strokeWidth={2} />
      </button>

      {/* Separator */}
      <div className="w-px h-5 bg-border mx-0.5" />

      {/* Undo button */}
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        className={`
          w-9 h-9 rounded-full flex items-center justify-center
          transition-colors duration-150
          ${canUndo
            ? "text-muted-foreground hover:bg-muted/50 cursor-pointer"
            : "text-muted-foreground/40 cursor-not-allowed"
          }
        `}
        title="Undo"
        aria-label="Undo"
      >
        <Undo size={18} strokeWidth={2} />
      </button>

      {/* Redo button */}
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        className={`
          w-9 h-9 rounded-full flex items-center justify-center
          transition-colors duration-150
          ${canRedo
            ? "text-muted-foreground hover:bg-muted/50 cursor-pointer"
            : "text-muted-foreground/40 cursor-not-allowed"
          }
        `}
        title="Redo"
        aria-label="Redo"
      >
        <Redo size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
