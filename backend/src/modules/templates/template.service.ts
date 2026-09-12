import { templateRepository, clauseRepository } from './template.repository';
import { templateVersionRepository } from './template-version.repository';
import { diffContent } from '../contract-versions/version.diff.util';
import { AppError } from '../../core/errors/AppError';
import { renderTemplate, RenderSectionInput } from './template-render.util';
import { ITemplate } from './template.model';

interface PopulatedClause {
  title: string;
  text: string;
}
interface PopulatedSection {
  title: string;
  order: number;
  clauses: PopulatedClause[];
}

export const templateService = {
  async listActive() {
    return templateRepository.listActive();
  },

  

  async listAllForAdmin() {
    return templateRepository.listAllForAdmin();
  },

  async getByIdOrThrow(id: string) {
    const template = await templateRepository.findById(id);
    if (!template) throw AppError.notFound('Template not found');
    return template;
  },

  

  async getForAuthoringOrThrow(id: string) {
    const template = await templateRepository.findByIdPopulated(id);
    if (!template || !template.isActive) throw AppError.notFound('Template not found');
    return template;
  },

  async create(data: Partial<ITemplate>, createdBy: string) {
    const template = await templateRepository.create({ ...data, createdBy } as never);

    
    
    
    
    
    const version = await templateVersionRepository.create({
      template: template._id,
      versionNumber: 1,
      name: template.name,
      contractType: template.contractType,
      sections: template.sections,
      variables: template.variables,
      changeSummary: 'Initial version',
      editedBy: createdBy as never,
      isRollbackOf: null,
    });
    template.currentVersion = version._id;
    await template.save();

    return template;
  },

  

  async update(id: string, data: Partial<ITemplate> & { changeSummary?: string }, editedBy: string) {
    const { changeSummary, ...templateFields } = data;
    const template = await templateRepository.updateById(id, templateFields);
    if (!template) throw AppError.notFound('Template not found');

    const latest = await templateVersionRepository.getLatest(id);
    const nextVersionNumber = (latest?.versionNumber ?? 0) + 1;

    const version = await templateVersionRepository.create({
      template: template._id,
      versionNumber: nextVersionNumber,
      name: template.name,
      contractType: template.contractType,
      sections: template.sections,
      variables: template.variables,
      changeSummary: changeSummary ?? null,
      editedBy: editedBy as never,
      isRollbackOf: null,
    });
    template.currentVersion = version._id;
    await template.save();

    return template;
  },

  
  async listVersions(templateId: string) {
    return templateVersionRepository.listForTemplate(templateId);
  },

  async compareVersions(templateId: string, fromNumber: number, toNumber: number) {
    const [from, to] = await Promise.all([
      templateVersionRepository.getByVersionNumber(templateId, fromNumber),
      templateVersionRepository.getByVersionNumber(templateId, toNumber),
    ]);
    if (!to) throw AppError.notFound(`Version ${toNumber} not found for this template`);

    const diffs = diffContent(
      from ? { name: from.name, contractType: from.contractType, sections: from.sections, variables: from.variables } : null,
      { name: to.name, contractType: to.contractType, sections: to.sections, variables: to.variables }
    );
    return { from: from?.versionNumber ?? null, to: to.versionNumber, diffs };
  },

  

  async rollbackToVersion(templateId: string, targetVersionNumber: number, editedBy: string) {
    const template = await templateRepository.findById(templateId);
    if (!template) throw AppError.notFound('Template not found');

    const target = await templateVersionRepository.getByVersionNumber(templateId, targetVersionNumber);
    if (!target) throw AppError.notFound(`Version ${targetVersionNumber} not found for this template`);

    template.name = target.name;
    template.contractType = target.contractType as never;
    template.sections = target.sections;
    template.variables = target.variables;

    const latest = await templateVersionRepository.getLatest(templateId);
    const nextVersionNumber = (latest?.versionNumber ?? 0) + 1;

    const version = await templateVersionRepository.create({
      template: template._id,
      versionNumber: nextVersionNumber,
      name: target.name,
      contractType: target.contractType,
      sections: target.sections,
      variables: target.variables,
      changeSummary: `Rolled back to version ${targetVersionNumber}`,
      editedBy: editedBy as never,
      isRollbackOf: target._id,
    });
    template.currentVersion = version._id;
    await template.save();

    return template;
  },

  async listClauses(category?: string) {
    return clauseRepository.find(category ? { category } : {});
  },

  async createClause(data: Parameters<typeof clauseRepository.create>[0]) {
    return clauseRepository.create(data);
  },

  async updateClause(id: string, data: Parameters<typeof clauseRepository.updateById>[1]) {
    const clause = await clauseRepository.updateById(id, data);
    if (!clause) throw AppError.notFound('Clause not found');
    return clause;
  },

  async deleteClause(id: string) {
    const existing = await clauseRepository.findById(id);
    if (!existing) throw AppError.notFound('Clause not found');

    
    
    
    
    if (await clauseRepository.isReferencedByAnyTemplate(id)) {
      throw AppError.conflict('Cannot delete a clause that is still used in one or more templates');
    }

    await clauseRepository.deleteById(id);
  },

  

  async renderContentForContract(templateId: string, contractType: string, variableValues: Record<string, unknown>) {
    const template = await templateRepository.findByIdPopulated(templateId);
    if (!template || !template.isActive) {
      throw AppError.notFound('Template not found or inactive');
    }
    if (template.contractType !== contractType) {
      throw AppError.badRequest(
        `Template "${template.name}" is for contract type "${template.contractType}", not "${contractType}"`
      );
    }

    const content = renderTemplate({
      templateName: template.name,
      sections: template.sections as unknown as PopulatedSection[] as RenderSectionInput[],
      variables: template.variables,
      variableValues,
    });

    const currentVersion = await templateVersionRepository.getLatest(templateId);
    return { content, templateVersionNumber: currentVersion?.versionNumber ?? 1 };
  },
};
