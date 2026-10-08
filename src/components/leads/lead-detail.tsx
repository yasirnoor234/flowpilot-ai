'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LeadRecord, LeadActivityRecord, LeadStatus, QualificationStatus } from '@/types/crm';
import { updateLeadStatusAction, addLeadNoteAction } from '@/lib/actions/crm';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Flame,
  SunMedium,
  Snowflake,
  Sparkles,
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
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  Tag,
} from 'lucide-react';

interface LeadDetailProps {
  lead: LeadRecord;
  activities: LeadActivityRecord[];
  workspaceId: string;
}

export function LeadDetail({ lead, activities, workspaceId }: LeadDetailProps) {
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
          icon: Flame,
          badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          gradient: 'from-rose-500/20 to-orange-500/10 border-rose-500/30',
          textColor: 'text-rose-400',
        };
      case 'warm':
      case 'qualified':
        return {
          label: 'WARM LEAD',
          icon: SunMedium,
          badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          gradient: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30',
          textColor: 'text-amber-400',
        };
      case 'cold':
      case 'unqualified':
        return {
          label: 'COLD LEAD',
          icon: Snowflake,
          badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          gradient: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
          textColor: 'text-blue-400',
        };
      default:
        return {
          label: 'PENDING QUALIFICATION',
          icon: Sparkles,
          badgeColor: 'bg-zinc-800 text-zinc-400 border-zinc-700/60',
          gradient: 'from-zinc-900 to-zinc-950 border-zinc-800',
          textColor: 'text-zinc-400',
        };
    }
  };

  const tier = getTierDetails(lead.qualification_status, lead.qualification_score);
  const TierIcon = tier.icon;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ai_qualified':
        return <Bot className="h-4 w-4 text-purple-400" />;
      case 'email_sent':
        return <Mail className="h-4 w-4 text-emerald-400" />;
      case 'status_changed':
        return <CheckCircle2 className="h-4 w-4 text-blue-400" />;
      case 'note_added':
        return <MessageSquare className="h-4 w-4 text-amber-400" />;
      case 'webhook_received':
        return <Activity className="h-4 w-4 text-cyan-400" />;
      default:
        return <FileText className="h-4 w-4 text-zinc-400" />;
    }
  };

  const recommendedAction =
    lead.custom_attributes?.recommended_action ||
    (lead.qualification_status === 'hot'
      ? 'Immediate executive outreach and calendar invite'
      : lead.qualification_status === 'warm'
      ? 'Send follow-up portfolio presentation & scheduling link'
      : null);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/leads">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full border border-zinc-800 bg-zinc-900">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{lead.name}</h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${tier.badgeColor}`}>
                <TierIcon className="h-3 w-3" />
                <span>{tier.label}</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Source: <span className="text-zinc-200 capitalize font-mono">{lead.source}</span> • Captured{' '}
              {new Date(lead.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Lead Status Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium">Status:</span>
          <select
            value={currentStatus}
            disabled={isPending}
            onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
            className="rounded-xl bg-zinc-900 border border-zinc-700/80 px-3 py-1.5 text-xs font-medium text-zinc-100 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Grid: AI Analysis Card + Lead Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details & AI Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Qualification Hero Card */}
          <div className={`p-5 rounded-2xl border bg-gradient-to-br ${tier.gradient} shadow-xl relative overflow-hidden`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">FlowPilot AI Qualification</h3>
                  <p className="text-[11px] text-zinc-400">Deterministic scoring & conversational intent analysis</p>
                </div>
              </div>
              {lead.qualification_score !== null && (
                <div className="text-right">
                  <span className="text-3xl font-black text-white font-mono tracking-tight">
                    {lead.qualification_score}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">/100</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-3 text-xs">
              {lead.qualification_reasoning ? (
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    AI Assessment Reasoning
                  </span>
                  <p className="text-zinc-200 leading-relaxed bg-zinc-950/40 p-3 rounded-xl border border-zinc-800">
                    {lead.qualification_reasoning}
                  </p>
                </div>
              ) : (
                <p className="text-zinc-500 italic">No detailed AI reasoning recorded for this lead record.</p>
              )}

              {recommendedAction && (
                <div className="flex items-center gap-2 text-xs bg-purple-950/30 border border-purple-800/40 p-2.5 rounded-xl text-purple-200">
                  <ShieldCheck className="h-4 w-4 text-purple-400 flex-shrink-0" />
                  <span>
                    <strong className="font-semibold text-purple-300">Recommended Action:</strong>{' '}
                    {recommendedAction}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <User className="h-4 w-4 text-purple-400" />
              <span>Contact & Inquiry Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-zinc-500 text-[11px] flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> Email Address
                </span>
                <p className="font-mono text-zinc-200 font-medium">{lead.email || 'None specified'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 text-[11px] flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> Phone
                </span>
                <p className="font-mono text-zinc-200">{lead.phone || 'None specified'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 text-[11px] flex items-center gap-1.5">
                  <Building className="h-3 w-3" /> Company
                </span>
                <p className="text-zinc-200 font-medium">{lead.company || 'Individual / Unknown'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 text-[11px] flex items-center gap-1.5">
                  <Briefcase className="h-3 w-3" /> Service Interest
                </span>
                <p className="text-zinc-200 capitalize">{lead.service_interest || 'General'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 text-[11px] flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3" /> Estimated Budget
                </span>
                <p className="text-zinc-200 font-mono">
                  {lead.estimated_budget ? `$${lead.estimated_budget.toLocaleString()}` : 'Unspecified'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 text-[11px] flex items-center gap-1.5">
                  <Tag className="h-3 w-3" /> Identity Reference Key
                </span>
                <p className="font-mono text-[11px] text-zinc-400 truncate">{lead.external_id || lead.id}</p>
              </div>
            </div>

            {lead.message && (
              <div className="pt-3 border-t border-zinc-800 space-y-1.5">
                <span className="text-zinc-400 text-[11px] font-medium flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-zinc-500" />
                  Initial Ingestion Message
                </span>
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {lead.message}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline & Add Note */}
        <div className="space-y-6">
          {/* Add Note Card */}
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-lg space-y-3">
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
              <span>Add Activity Note</span>
            </h4>
            <form onSubmit={handleAddNote} className="space-y-2.5">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Log a call, meeting note, or customer follow-up..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
              />
              <Button
                type="submit"
                size="sm"
                disabled={submittingNote || !noteText.trim()}
                className="w-full text-xs gap-1.5 bg-purple-600 hover:bg-purple-500"
              >
                <Send className="h-3 w-3" />
                <span>{submittingNote ? 'Saving...' : 'Add Note to Timeline'}</span>
              </Button>
            </form>
          </div>

          {/* Chronological Activity Feed */}
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-lg space-y-4">
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-purple-400" />
              <span>Activity History ({activities.length})</span>
            </h4>

            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800">
              {activities.length === 0 ? (
                <p className="text-xs text-zinc-500 italic pl-6">No activity history logged yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="relative flex items-start gap-3 pl-1 group">
                    <div className="p-1 rounded-full bg-zinc-900 border border-zinc-700 flex-shrink-0 z-10">
                      {getActivityIcon(act.activity_type)}
                    </div>
                    <div className="flex-1 min-w-0 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-850 text-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-zinc-200 truncate">{act.title}</span>
                        <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">
                          {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {act.description && (
                        <p className="text-zinc-400 mt-1 text-[11px] leading-relaxed whitespace-pre-wrap">
                          {act.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
