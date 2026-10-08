import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'flowpilot-ai',
  eventKey: process.env.INNGEST_EVENT_KEY || 'local-dev-key',
});
