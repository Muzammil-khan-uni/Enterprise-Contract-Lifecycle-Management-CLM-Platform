import { BaseRepository } from '../../core/base/BaseRepository';
import { TemplateModel, ITemplate } from './template.model';
import { ClauseModel } from './clause.model';

class TemplateRepository extends BaseRepository<ITemplate> {
  constructor() {
    super(TemplateModel);
  }

  async listActive() {
    return TemplateModel.find({ isActive: true }).populate('sections.clauses').exec();
  }

  

  async listAllForAdmin() {
    return TemplateModel.find({}).populate('sections.clauses').sort({ name: 1 }).exec();
  }

  

  async findByIdPopulated(id: string) {
    return TemplateModel.findById(id).populate('sections.clauses').exec();
  }
}

export const templateRepository = new TemplateRepository();

export const clauseRepository = {
  find: (filter: Record<string, unknown> = {}) => ClauseModel.find(filter).sort({ title: 1 }).exec(),
  findById: (id: string) => ClauseModel.findById(id).exec(),
  create: (data: Partial<InstanceType<typeof ClauseModel>>) => ClauseModel.create(data),
  updateById: (id: string, data: Partial<InstanceType<typeof ClauseModel>>) =>
    ClauseModel.findByIdAndUpdate(id, data, { new: true }).exec(),
  deleteById: (id: string) => ClauseModel.findByIdAndDelete(id).exec(),
  
  isReferencedByAnyTemplate: async (clauseId: string) => {
    const count = await TemplateModel.countDocuments({ 'sections.clauses': clauseId }).exec();
    return count > 0;
  },
};
