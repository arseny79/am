import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Command } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
  action: () => void;
}

export function KeyboardShortcuts() {
  const [, setLocation] = useLocation();
  const [showHelp, setShowHelp] = useState(false);
  const [commandMode, setCommandMode] = useState(false);

  const shortcuts: Shortcut[] = [
    {
      keys: ["Ctrl", "K"],
      description: "Open command palette / search",
      action: () => {
        setCommandMode(true);
        // TODO: Implement command palette
      },
    },
    {
      keys: ["G", "M"],
      description: "Go to Messages",
      action: () => setLocation("/messages"),
    },
    {
      keys: ["G", "D"],
      description: "Go to Deals",
      action: () => setLocation("/my-deals"),
    },
    {
      keys: ["G", "H"],
      description: "Go to Home",
      action: () => setLocation("/"),
    },
    {
      keys: ["G", "P"],
      description: "Go to Profile",
      action: () => setLocation("/profile"),
    },
    {
      keys: ["G", "L"],
      description: "Go to My Listings",
      action: () => setLocation("/my-listings"),
    },
    {
      keys: ["G", "B"],
      description: "Go to Browse Listings",
      action: () => setLocation("/marketplace"),
    },
    {
      keys: ["?"],
      description: "Show keyboard shortcuts",
      action: () => setShowHelp(true),
    },
  ];

  useEffect(() => {
    let gPressed = false;
    let gTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Ctrl+K for command palette
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const shortcut = shortcuts.find(
          (s) => s.keys.length === 2 && s.keys[0] === "Ctrl" && s.keys[1] === "K"
        );
        shortcut?.action();
        return;
      }

      // ? for help
      if (e.key === "?" && !e.shiftKey) {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      // G+X shortcuts
      if (e.key.toLowerCase() === "g") {
        gPressed = true;
        clearTimeout(gTimeout);
        gTimeout = setTimeout(() => {
          gPressed = false;
        }, 1000);
        return;
      }

      if (gPressed) {
        const key = e.key.toUpperCase();
        const shortcut = shortcuts.find(
          (s) => s.keys.length === 2 && s.keys[0] === "G" && s.keys[1] === key
        );
        if (shortcut) {
          e.preventDefault();
          shortcut.action();
          gPressed = false;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(gTimeout);
    };
  }, [shortcuts]);

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Navigation</h3>
            <div className="space-y-2">
              {shortcuts
                .filter((s) => s.keys[0] === "G")
                .map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="px-2 py-1 text-xs font-semibold bg-muted rounded border"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Actions</h3>
            <div className="space-y-2">
              {shortcuts
                .filter((s) => s.keys[0] !== "G")
                .map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="px-2 py-1 text-xs font-semibold bg-muted rounded border"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>
              Press <kbd className="px-1 py-0.5 bg-muted rounded border">?</kbd>{" "}
              anytime to see this help dialog
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
