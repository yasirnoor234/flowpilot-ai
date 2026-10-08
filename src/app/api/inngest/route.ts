import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { workflowExecutor } from '@/lib/inngest/functions/workflow-executor';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [workflowExecutor],
});
