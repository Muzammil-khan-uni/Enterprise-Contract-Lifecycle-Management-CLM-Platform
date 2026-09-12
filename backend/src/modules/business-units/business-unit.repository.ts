import { BaseRepository } from '../../core/base/BaseRepository';
import { BusinessUnitModel, IBusinessUnit } from './business-unit.model';

class BusinessUnitRepository extends BaseRepository<IBusinessUnit> {
  constructor() {
    super(BusinessUnitModel);
  }

  async listAll(limit = 500) {
    return BusinessUnitModel.find({}).sort({ name: 1 }).limit(limit).exec();
  }

  async hasChildren(id: string) {
    const count = await BusinessUnitModel.countDocuments({ parentUnit: id }).exec();
    return count > 0;
  }
}

export const businessUnitRepository = new BusinessUnitRepository();
