'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LeadRecord, LeadStatus, QualificationStatus } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Search,
  Filter,
  Sparkles,
  ArrowUpRight,
  Flame,
  SunMedium,
  Snowflake,
  ChevronLeft,
  ChevronRight,
  Mail,
  Building,
  Calendar,
} from 'lucide-react';

interface LeadListProps {
  initialLeads: LeadRecord[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  workspaceId: string;
}

export function LeadList({
  initialLeads,
  totalCount,
  currentPage,
  totalPages,
  workspaceId,
}: LeadListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  const filteredLeads = initialLeads.filter((lead) => {
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    if (tierFilter !== 'all' && lead.qualification_status !== tierFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        lead.name.toLowerCase().includes(q) ||
        (lead.company && lead.company.toLowerCase().includes(q)) ||
        (lead.email && lead.email.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getTierBadge = (status: QualificationStatus, score: number | null) => {
    switch (status) {
      case 'hot':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Flame className="h-3 w-3" />
            <span>HOT {score !== null ? `(${score})` : ''}</span>
          </span>
        );
      case 'warm':
      case 'qualified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <SunMedium className="h-3 w-3" />
            <span>WARM {score !== null ? `(${score})` : ''}</span>
          </span>
        );
      case 'cold':
      case 'unqualified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Snowflake className="h-3 w-3" />
            <span>COLD {score !== null ? `(${score})` : ''}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60">
            <span>Pending</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return <Badge variant="default">New</Badge>;
      case 'contacted':
        return <Badge variant="outline" className="text-purple-400 border-purple-500/30">Contacted</Badge>;
      case 'qualified':
        return <Badge variant="success">Qualified</Badge>;
      case 'converted':
        return <Badge variant="success" className="bg-emerald-500/20 text-emerald-300">Converted</Badge>;
      case 'unqualified':
      case 'lost':
        return <Badge variant="secondary">Lost</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search leads by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          {/* AI Tier Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All AI Tiers</option>
              <option value="hot">Hot Leads</option>
              <option value="warm">Warm Leads</option>
              <option value="cold">Cold Leads</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 font-medium">
            <tr>
              <th className="px-4 py-3">Lead / Contact</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">AI Qualification</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Captured</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                  No lead records match the selected filters.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-zinc-800/40 transition-colors group">
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-semibold text-zinc-100 group-hover:text-purple-400 transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>{lead.name}</span>
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      {lead.email ? (
                        <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Mail className="h-2.5 w-2.5 text-zinc-500" />
                          {lead.email}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-600">No email (ID: {lead.id.slice(0, 6)})</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {lead.company ? (
                      <span className="text-zinc-200 font-medium inline-flex items-center gap-1">
                        <Building className="h-3 w-3 text-zinc-500" />
                        {lead.company}
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {getTierBadge(lead.qualification_status, lead.qualification_score)}
                  </td>
                  <td className="px-4 py-3.5">{getStatusBadge(lead.status)}</td>
                  <td className="px-4 py-3.5">
                    <span className="capitalize text-zinc-400 font-mono text-[11px]">
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-zinc-400 font-mono text-[11px]">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/leads/${lead.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5">
                        View Lead
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
