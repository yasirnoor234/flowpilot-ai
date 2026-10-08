'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LeadRecord, LeadStatus, QualificationStatus } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
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
  workspaceId: _workspaceId,
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
          <Badge variant="success" size="sm">
            HOT {score !== null ? `(${score})` : ''}
          </Badge>
        );
      case 'warm':
      case 'qualified':
        return (
          <Badge variant="primary" size="sm">
            WARM {score !== null ? `(${score})` : ''}
          </Badge>
        );
      case 'cold':
      case 'unqualified':
        return (
          <Badge variant="secondary" size="sm">
            COLD {score !== null ? `(${score})` : ''}
          </Badge>
        );
      default:
        return (
          <Badge variant="muted" size="sm">
            Pending
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return <Badge variant="primary" size="sm">New</Badge>;
      case 'contacted':
        return <Badge variant="secondary" size="sm">Contacted</Badge>;
      case 'qualified':
        return <Badge variant="success" size="sm">Qualified</Badge>;
      case 'converted':
        return <Badge variant="success" size="sm">Converted</Badge>;
      case 'unqualified':
      case 'lost':
        return <Badge variant="destructive" size="sm">{status}</Badge>;
      default:
        return <Badge variant="muted" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Leads"
        description="Manage captured leads, qualification scores, and CRM activity logs."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search leads by name, email, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 h-10 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-xs"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-xs"
          >
            <option value="all">All AI Tiers</option>
            <option value="hot">Hot Tier</option>
            <option value="warm">Warm Tier</option>
            <option value="cold">Cold Tier</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      {filteredLeads.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={initialLeads.length === 0 ? 'No leads captured yet' : 'No matching leads'}
          description={
            initialLeads.length === 0
              ? 'Leads ingested via webhook forms or manual test triggers will automatically appear here.'
              : 'Try adjusting your search query or filter settings.'
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 font-medium">
                <tr>
                  <th className="py-3 px-6">Name & Contact</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">AI Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Budget / Interest</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-6 text-right">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-semibold text-zinc-900 hover:text-indigo-600 transition-colors"
                      >
                        {lead.name}
                      </Link>
                      <div className="text-[11px] text-zinc-500">{lead.email || 'No email provided'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-zinc-700">
                      {lead.company || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {getTierBadge(lead.qualification_status, lead.qualification_score)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600">
                      <div>{lead.estimated_budget ? `$${lead.estimated_budget.toLocaleString()}` : '—'}</div>
                      <div className="text-[10px] text-zinc-400 truncate max-w-xs">{lead.service_interest || 'General Inquiry'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">
                      {lead.source}
                    </td>
                    <td className="py-3.5 px-6 text-right text-zinc-500 whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-500">
              <span>
                Showing {filteredLeads.length} of {totalCount} leads (Page {currentPage} of {totalPages})
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => router.push(`/leads?page=${currentPage - 1}`)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => router.push(`/leads?page=${currentPage + 1}`)}
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
