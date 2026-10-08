export interface SyntheticLeadData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  service_interest: string;
  message: string;
  estimated_budget?: number;
  qualification_status: 'qualified' | 'unqualified' | 'pending' | 'review_required';
  qualification_score: number;
  status: 'new' | 'contacted' | 'meeting_scheduled' | 'proposal_sent' | 'won' | 'lost';
}

export const SYNTHETIC_DEMO_LEADS: SyntheticLeadData[] = [
  {
    name: 'Elena Rostova',
    email: 'elena@cyberdynamix.tech',
    phone: '+1 (415) 890-1234',
    company: 'CyberDynamix AI',
    source: 'Website Inbound Form',
    service_interest: 'Enterprise AI Workflow Orchestration',
    message: 'We are expanding our autonomous agent pipelines and need a robust workflow engine with multi-tenant RLS and Inngest durable delays.',
    estimated_budget: 45000,
    qualification_status: 'qualified',
    qualification_score: 94,
    status: 'meeting_scheduled',
  },
  {
    name: 'Marcus Vance',
    email: 'marcus.vance@vanguardlogistics.io',
    phone: '+1 (312) 555-0198',
    company: 'Vanguard Global Logistics',
    source: 'Partner Referral',
    service_interest: 'Lead Routing & Slack CRM Synchronization',
    message: 'Looking to automate high-priority freight lead notifications to our account execs on Slack within 5 seconds of form submission.',
    estimated_budget: 25000,
    qualification_status: 'qualified',
    qualification_score: 88,
    status: 'contacted',
  },
  {
    name: 'Chloe Zhang',
    email: 'chloe@apexfintech.co',
    phone: '+1 (212) 777-9081',
    company: 'Apex Digital Capital',
    source: 'Product Hunt Launch',
    service_interest: 'AI Text Classification & Sentiment Scoring',
    message: 'Need an evaluation of FlowPilot for automating compliance lead triage across our 12 regional branch hubs.',
    estimated_budget: 60000,
    qualification_status: 'qualified',
    qualification_score: 96,
    status: 'proposal_sent',
  },
  {
    name: 'David Kim',
    email: 'david.k@solarmotion.dev',
    phone: '+1 (650) 444-2319',
    company: 'SolarMotion Labs',
    source: 'Direct Webhook Intake',
    service_interest: 'Proposal Follow-up Reminders',
    message: 'Interested in setting up 3-day durable delays that automatically check our CRM status before sending executive reminders.',
    estimated_budget: 18000,
    qualification_status: 'qualified',
    qualification_score: 82,
    status: 'new',
  },
  {
    name: 'Jordan Miller',
    email: 'jordan@freelance-design.me',
    phone: '+1 (503) 222-1100',
    company: 'Miller Creative',
    source: 'Website Inbound Form',
    service_interest: 'Basic Contact Form Intake',
    message: 'Just exploring tools for personal freelance client notifications. Low budget.',
    estimated_budget: 500,
    qualification_status: 'unqualified',
    qualification_score: 35,
    status: 'lost',
  },
];
