'use client';

import * as React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function Dialog({
  open,
  isOpen,
  onOpenChange,
  onClose,
  title,
  description,
  children,
}: DialogProps) {
  const isCurrentlyOpen = open !== undefined ? open : !!isOpen;

  const handleClose = React.useCallback(() => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  }, [onOpenChange, onClose]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (isCurrentlyOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCurrentlyOpen, handleClose]);

  if (!isCurrentlyOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl z-10 transition-all max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 rounded-md p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
        {title && (
          <div className="flex flex-col space-y-1 mb-4">
            <h2 className="text-base font-semibold text-zinc-900 tracking-tight">{title}</h2>
            {description && <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-1.5 mb-4 ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-lg font-semibold text-zinc-900 tracking-tight ${className}`}>{children}</h2>;
}

export function DialogDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-zinc-500 leading-relaxed ${className}`}>{children}</p>;
}

export function DialogFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100 mt-6 ${className}`}>{children}</div>;
}

export function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 rounded-md p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
      aria-label="Close dialog"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

