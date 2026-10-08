'use client';

import React, { useState } from 'react';
import { PALETTE_CATEGORIES, PALETTE_ITEMS, type NodePaletteItem } from './types';
import type { WorkflowNodeType } from '@/types/workflow';
import {
  Play,
  Webhook,
  Sliders,
  GitFork,
  Bot,
  Database,
  Mail,
  MessageSquare,
  Clock,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface NodePaletteProps {
  onAddNode: (type: WorkflowNodeType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function NodePalette({ onAddNode, isOpen, onToggle }: NodePaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Play':
        return Play;
      case 'Webhook':
        return Webhook;
      case 'Sliders':
        return Sliders;
      case 'GitFork':
        return GitFork;
      case 'Bot':
        return Bot;
      case 'Database':
        return Database;
      case 'Mail':
        return Mail;
      case 'MessageSquare':
        return MessageSquare;
      case 'Clock':
        return Clock;
      default:
        return Plus;
    }
  };

  const filteredItems = PALETTE_ITEMS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)
    );
  });

  const onDragStart = (event: React.DragEvent, nodeType: WorkflowNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  if (!isOpen) {
    return (
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={onToggle}
          title="Open Node Palette"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-semibold text-zinc-200 shadow-xl backdrop-blur-md hover:bg-zinc-800 hover:text-white transition-all"
        >
          <PanelLeftOpen className="h-4 w-4 text-purple-400" />
          <span>Add Nodes</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 z-20 w-80 max-h-[calc(100%-2rem)] flex flex-col rounded-2xl bg-zinc-900/95 border border-zinc-800 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-left-4">
      {/* Palette Header */}
      <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-white tracking-tight">Node Palette</h3>
          <p className="text-[11px] text-zinc-400">Drag & drop or click + to add</p>
        </div>
        <button
          onClick={onToggle}
          title="Collapse palette"
          className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-zinc-800/60">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Category List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {PALETTE_CATEGORIES.map((category) => {
          const catItems = filteredItems.filter((item) => item.category === category.id);
          if (catItems.length === 0) return null;

          const isCollapsed = collapsedCategories[category.id] || false;

          return (
            <div key={category.id} className="space-y-1.5">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <span>{category.label} ({catItems.length})</span>
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-1.5">
                  {catItems.map((item) => {
                    const Icon = getIcon(item.iconName);
                    return (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, item.type)}
                        onClick={() => onAddNode(item.type)}
                        className="group flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-purple-500/50 hover:bg-zinc-800/40 cursor-grab active:cursor-grabbing transition-all select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <GripVertical className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 group-hover:text-purple-400 group-hover:border-purple-500/40 transition-colors">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                              {item.title}
                            </h4>
                            <p className="text-[10px] text-zinc-500 truncate">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddNode(item.type);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-purple-400 hover:bg-purple-500/20 transition-all shrink-0"
                          title="Click to add to canvas"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
