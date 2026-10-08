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
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-xs font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 transition-colors cursor-pointer"
        >
          <PanelLeftOpen className="h-4 w-4 text-indigo-600" />
          <span>Add steps</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 z-20 w-76 max-h-[calc(100%-2rem)] flex flex-col rounded-xl bg-white border border-zinc-200 shadow-lg overflow-hidden transition-all duration-150 animate-in fade-in slide-in-from-left-2">
      {/* Palette Header */}
      <div className="p-3 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-zinc-900">Step Palette</h3>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          title="Collapse Palette"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-zinc-100 bg-zinc-50/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search steps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 rounded-md border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Category Groups */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {PALETTE_CATEGORIES.map((category) => {
          const categoryItems = filteredItems.filter((item) => item.category === category.id);
          if (categoryItems.length === 0) return null;

          const isCollapsed = collapsedCategories[category.id];

          return (
            <div key={category.id} className="space-y-1.5">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-1 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-800 transition-colors cursor-pointer"
              >
                <span>{category.label}</span>
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-1.5">
                  {categoryItems.map((item: NodePaletteItem) => {
                    const Icon = getIcon(item.iconName);

                    return (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, item.type)}
                        onClick={() => onAddNode(item.type)}
                        className="group flex items-start gap-2.5 p-2 rounded-lg border border-zinc-200/80 bg-white hover:border-indigo-300 hover:bg-indigo-50/20 cursor-grab active:cursor-grabbing transition-colors shadow-2xs"
                      >
                        <div className="h-7 w-7 rounded-md bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 text-zinc-600 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                              {item.title}
                            </span>
                            <Plus className="h-3.5 w-3.5 text-zinc-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                          </div>
                          <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                        <GripVertical className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-400 shrink-0 self-center" />
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
