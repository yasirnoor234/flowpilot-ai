'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LeadRecord, LeadActivityRecord, LeadStatus, QualificationStatus } from '@/types/crm';
import { updateLeadStatusAction, addLeadNoteAction } from '@/lib/actions/crm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  ChevronLeft,
  Building,
  Mail,
  Phone,
  DollarSign,
  Briefcase,
  Send,
  MessageSquare,
  Bot,
  Activity,
  CheckCircle2,
  FileText,
  User,
  Tag,
} from 'lucide-react';

interface LeadDetailProps {
  lead: LeadRecord;
  activities: LeadActivityRecord[];
  workspaceId: string;
}

export function LeadDetail({ lead, activities, workspaceId: _workspaceId }: LeadDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>(lead.status);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleStatusChange = (newStatus: LeadStatus) => {
    setCurrentStatus(newStatus);
    startTransition(async () => {
      const res = await updateLeadStatusAction(lead.id, newStatus);
      if (!res.success) {
        setFeedbackMsg({ type: 'error', text: res.error || 'Failed to update status' });
        setCurrentStatus(lead.status);
      } else {
        setFeedbackMsg({ type: 'success', text: `Lead status updated to ${newStatus}` });
        router.refresh();
      }
    });
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setSubmittingNote(true);
    setFeedbackMsg(null);
    try {
      const res = await addLeadNoteAction(lead.id, noteText);
      if (res.success) {
        setNoteText('');
        setFeedbackMsg({ type: 'success', text: 'Note appended to timeline' });
        router.refresh();
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Failed to add note' });
      }
    } finally {
      setSubmittingNote(false);
    }
  };

  const getTierDetails = (status: QualificationStatus, score: number | null) => {
    switch (status) {
      case 'hot':
        return {
          label: 'HOT LEAD',
          badgeVariant: 'success' as const,
          score: score !== null ? score : 90,
        };
      case 'warm':
      case 'qualified':
        return {
          label: 'WARM LEAD',
          badgeVariant: 'primary' as const,
          score: score !== null ? score : 75,
        };
      case 'cold':
      case 'unqualified':
        return {
          label: 'COLD LEAD',
          badgeVariant: 'secondary' as const,
          score: score !== null ? score : 40,
        };
      default:
        return {
          label: 'PENDING',
          badgeVariant: 'muted' as const,
          score: null,
        };
    }
  };

  const tier = getTierDetails(lead.qualification_status, lead.qualification_score);

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Leads</span>
        </Link>

        {feedbackMsg && (
          <span
            className={`text-xs font-medium ${
              feedbackMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {feedbackMsg.text}
          </span>
        )}
      </div>

      {/* Main Profile Header Card */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-base shrink-0">
              {lead.name.substring(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{lead.name}</h1>
                <Badge variant={tier.badgeVariant} size="sm">
                  {tier.label} {tier.score !== null ? `(${tier.score}/100)` : ''}
                </Badge>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                {lead.company && (
                  <span className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{lead.company}</span>
                  </span>
                )}
                {lead.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{lead.email}</span>
                  </span>
                )}
                {lead.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{lead.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Switcher Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs text-zinc-500 font-medium">Status:</label>
            <select
              value={currentStatus}
              disabled={isPending}
              onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-xs cursor-pointer"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted (Won)</option>
              <option value="lost">Lost</option>
              <option value="unqualified">Unqualified</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Grid Layout: Lead Metadata & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Details & AI Qualification (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Qualification Breakdown */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                  AI Qualification Analysis
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                Score: {lead.qualification_score !== null ? `${lead.qualification_score}/100` : '—'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-500 block mb-0.5">Evaluation Reasoning:</span>
                <p className="text-zinc-700 bg-zinc-50 p-3 rounded-lg border border-zinc-200/60 leading-relaxed">
                  {lead.qualification_reasoning ||
                    'Lead evaluated based on project scope, estimated budget compatibility, and customer contact fit.'}
                </p>
              </div>

              {lead.estimated_budget && (
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
                  <span className="text-zinc-500">Estimated Budget:</span>
                  <span className="font-semibold text-zinc-900 font-mono">
                    ${lead.estimated_budget.toLocaleString()}
                  </span>
                </div>
              )}

              {lead.service_interest && (
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
                  <span className="text-zinc-500">Service Interest:</span>
                  <span className="font-medium text-zinc-800">{lead.service_interest}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500">Intake Source:</span>
                <span className="font-mono text-zinc-700">{lead.source}</span>
              </div>
            </div>
          </Card>

          {/* Original Message Card */}
          {lead.message && (
            <Card className="p-5 space-y-2">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Original Message
              </div>
              <p className="text-xs text-zinc-700 bg-zinc-50 p-3 rounded-lg border border-zinc-200/60 leading-relaxed italic">
                "{lead.message}"
              </p>
            </Card>
          )}

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <Card className="p-5 space-y-2">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Tags & Segments
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Activity Timeline & Note Composer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Note Composer */}
          <Card className="p-5">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3">
              Add Activity Note
            </h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Log a call, meeting summary, or next action step..."
                rows={3}
                className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-2xs"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" isLoading={submittingNote}>
                  <span>Log Note</span>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          </Card>

          {/* Chronological Activity Timeline */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                  Activity Timeline ({activities.length})
                </h3>
              </div>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500">
                No activity records logged for this lead yet.
              </div>
            ) : (
              <div className="space-y-4 pl-2">
                {activities.map((act) => (
                  <div key={act.id} className="relative pl-6 border-l-2 border-zinc-200 pb-2 last:border-l-transparent last:pb-0">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-2 border-indigo-600" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-900">{act.title}</span>
                        <span className="text-[11px] text-zinc-400">
                          {new Date(act.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {act.description && (
                        <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                          {act.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
