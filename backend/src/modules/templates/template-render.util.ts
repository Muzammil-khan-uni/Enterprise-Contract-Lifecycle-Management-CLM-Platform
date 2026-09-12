import { AppError } from '../../core/errors/AppError';
import { TemplateVariable } from './template.model';

export interface RenderClauseInput {
  title: string;
  text: string; 
}

export interface RenderSectionInput {
  title: string;
  order: number;
  clauses: RenderClauseInput[];
}

export interface RenderTemplateInput {
  templateName: string;
  sections: RenderSectionInput[];
  variables: Pick<TemplateVariable, 'name' | 'label' | 'type' | 'required'>[];
  variableValues: Record<string, unknown>;
}

export type RenderedContent = Record<string, string | number | boolean>;

const PLACEHOLDER_PATTERN = /\{\{(\w+)\}\}/g;

function findPlaceholderNames(text: string): Set<string> {
  const names = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER_PATTERN)) {
    names.add(match[1]);
  }
  return names;
}

function validateVariableType(variable: RenderTemplateInput['variables'][number], value: unknown): void {
  switch (variable.type) {
    case 'text':
      if (typeof value !== 'string') {
        throw AppError.badRequest(
          `Variable "${variable.label}" (${variable.name}) must be text, got ${typeof value}`
        );
      }
      break;
    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw AppError.badRequest(
          `Variable "${variable.label}" (${variable.name}) must be a number, got ${typeof value}`
        );
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        throw AppError.badRequest(
          `Variable "${variable.label}" (${variable.name}) must be a boolean, got ${typeof value}`
        );
      }
      break;
    case 'date':
      if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
        throw AppError.badRequest(
          `Variable "${variable.label}" (${variable.name}) must be a valid date string, got ${JSON.stringify(value)}`
        );
      }
      break;
  }
}

function substitute(text: string, resolvedValues: Map<string, string | number | boolean>): string {
  return text.replace(PLACEHOLDER_PATTERN, (_match, name: string) => {
    const value = resolvedValues.get(name);
    return value === undefined ? '' : String(value);
  });
}

export function renderTemplate(input: RenderTemplateInput): RenderedContent {
  const { templateName, sections, variables, variableValues } = input;

  
  
  
  
  
  
  const declaredNames = new Set(variables.map((v) => v.name));
  const usedNames = new Set<string>();
  for (const section of sections) {
    for (const clause of section.clauses) {
      for (const name of findPlaceholderNames(clause.text)) {
        usedNames.add(name);
      }
    }
  }
  const undeclared = [...usedNames].filter((name) => !declaredNames.has(name));
  if (undeclared.length > 0) {
    throw AppError.badRequest(
      `Template "${templateName}" references undefined variable(s): ${undeclared.map((n) => `{{${n}}}`).join(', ')}`
    );
  }

  
  
  const resolvedValues = new Map<string, string | number | boolean>();
  const variableEntries: RenderedContent = {};
  for (const variable of variables) {
    const value = variableValues[variable.name];
    const isMissing = value === undefined || value === null;

    if (isMissing) {
      if (variable.required) {
        throw AppError.badRequest(`Missing required variable "${variable.label}" (${variable.name})`);
      }
      
      
      
      continue;
    }

    validateVariableType(variable, value);
    resolvedValues.set(variable.name, value as string | number | boolean);
    variableEntries[`Variable: ${variable.label}`] = value as string | number | boolean;
  }

  
  
  
  const sectionEntries: RenderedContent = {};
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  for (const section of sortedSections) {
    const renderedClauses = section.clauses.map((clause) => substitute(clause.text, resolvedValues));
    sectionEntries[`${section.order}. ${section.title}`] = renderedClauses.join('\n\n');
  }

  return { ...sectionEntries, ...variableEntries };
}
