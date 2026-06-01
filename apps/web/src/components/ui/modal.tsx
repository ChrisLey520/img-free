"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ModalAction {
  label: string;
  variant?: "default" | "outline" | "destructive";
  onClick: () => void;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  actions?: ModalAction[];
}

export function Modal({ open, onClose, title, description, children, actions }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
            "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-200",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border bg-background p-6 shadow-xl",
            "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
            "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
            "transition-all duration-200",
          )}
        >
          <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">
              {description}
            </Dialog.Description>
          )}
          {children && <div className="mt-3">{children}</div>}
          {actions && actions.length > 0 && (
            <div className="mt-4 flex justify-end gap-2">
              {actions.map((a) => (
                <Button key={a.label} variant={a.variant ?? "default"} size="sm" onClick={a.onClick}>
                  {a.label}
                </Button>
              ))}
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
