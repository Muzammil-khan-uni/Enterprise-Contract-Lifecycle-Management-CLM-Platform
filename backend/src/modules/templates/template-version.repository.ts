import { BaseRepository } from '../../core/base/BaseRepository';
import { TemplateVersionModel, ITemplateVersion } from './template-version.model';

class TemplateVersionRepository extends BaseRepository<ITemplateVersion> {
  constructor() {
    super(TemplateVersionModel);
  }

  async listForTemplate(templateId: string) {
    return TemplateVersionModel.find({ template: templateId }).sort({ versionNumber: -1 }).exec();
  }

  async getLatest(templateId: string) {
    return TemplateVersionModel.findOne({ template: templateId }).sort({ versionNumber: -1 }).exec();
  }

  async getByVersionNumber(templateId: string, versionNumber: number) {
    return TemplateVersionModel.findOne({ template: templateId, versionNumber }).exec();
  }
}

export const templateVersionRepository = new TemplateVersionRepository();
