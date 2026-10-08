import type { ExecutionContext } from '@/types/execution';

/**
 * Safely extracts a nested property from a JSON object using dot notation (e.g. "trigger.user.email")
 * Never calls eval or Function constructor.
 */
export function getNestedValue(obj: any, path: string): any {
  if (obj === null || obj === undefined || !path) {
    return undefined;
  }

  // Sanitize path to prevent prototype pollution
  const cleanPath = path.trim();
  if (cleanPath.includes('__proto__') || cleanPath.includes('constructor') || cleanPath.includes('prototype')) {
    return undefined;
  }

  const parts = cleanPath.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Resolves all {{source.field}} template tags within a string using the execution context.
 */
export function resolveStringTemplate(template: string, context: ExecutionContext): string {
  if (!template || typeof template !== 'string') {
    return '';
  }

  const templateRegex = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

  return template.replace(templateRegex, (_match, expression: string) => {
    const trimmed = expression.trim();
    const firstDotIndex = trimmed.indexOf('.');

    if (firstDotIndex === -1) {
      // Direct root identifier check
      if (trimmed === 'trigger') {
        return typeof context.triggerPayload === 'object'
          ? JSON.stringify(context.triggerPayload)
          : String(context.triggerPayload ?? '');
      }
      return '';
    }

    const rootNamespace = trimmed.substring(0, firstDotIndex);
    const subPath = trimmed.substring(firstDotIndex + 1);

    let targetObject: any;

    if (rootNamespace === 'trigger') {
      targetObject = context.triggerPayload;
    } else if (context.nodeOutputs[rootNamespace]) {
      targetObject = context.nodeOutputs[rootNamespace];
    } else {
      // Find output by matching node type alias
      const matchingNodeId = Object.keys(context.nodeOutputs).find((nId) => {
        return (
          nId === rootNamespace ||
          nId.replace('node_', '') === rootNamespace ||
          nId.replace('action_', '') === rootNamespace
        );
      });
      if (matchingNodeId) {
        targetObject = context.nodeOutputs[matchingNodeId];
      }
    }

    if (!targetObject) {
      return '';
    }

    const value = getNestedValue(targetObject, subPath);
    if (value === undefined || value === null) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  });
}

/**
 * Recursively resolves all template expressions in an object or primitive.
 */
export function resolveConfigExpressions<T>(config: T, context: ExecutionContext): T {
  if (config === null || config === undefined) {
    return config;
  }

  if (typeof config === 'string') {
    return resolveStringTemplate(config, context) as unknown as T;
  }

  if (Array.isArray(config)) {
    return config.map((item) => resolveConfigExpressions(item, context)) as unknown as T;
  }

  if (typeof config === 'object') {
    const resolvedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(config)) {
      resolvedObj[key] = resolveConfigExpressions(value, context);
    }
    return resolvedObj as T;
  }

  return config;
}
