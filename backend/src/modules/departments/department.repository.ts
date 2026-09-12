import { BaseRepository } from '../../core/base/BaseRepository';
import { DepartmentModel, IDepartment } from './department.model';

class DepartmentRepository extends BaseRepository<IDepartment> {
  constructor() {
    super(DepartmentModel);
  }

  async listAll(limit = 500) {
    return DepartmentModel.find({}).populate('businessUnit', 'name code').sort({ name: 1 }).limit(limit).exec();
  }

  async listByBusinessUnit(businessUnitId: string) {
    return DepartmentModel.find({ businessUnit: businessUnitId }).sort({ name: 1 }).exec();
  }
}

export const departmentRepository = new DepartmentRepository();
