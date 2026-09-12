export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
}

export interface Clause {
  _id: string;
  title: string;
  category: string;
  text: string;
  isMandatory: boolean;
  applicableContractTypes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSection {
  title: string;
  order: number;
  clauses: (string | Clause)[];
}

export interface Template {
  _id: string;
  name: string;
  contractType: string;
  sections: TemplateSection[];
  variables: TemplateVariable[];
  isActive: boolean;
  createdBy: string;
  
  
  
  
  currentVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVersion {
  _id: string;
  template: string;
  versionNumber: number;
  name: string;
  contractType: string;
  sections: TemplateSection[];
  variables: TemplateVariable[];
  changeSummary: string | null;
  editedBy: string;
  isRollbackOf: string | null;
  createdAt: string;
}

export interface TemplateVersionDiff {
  field: string;
  before: unknown;
  after: unknown;
}

export interface TemplateVersionComparison {
  from: number | null;
  to: number;
  diffs: TemplateVersionDiff[];
}
