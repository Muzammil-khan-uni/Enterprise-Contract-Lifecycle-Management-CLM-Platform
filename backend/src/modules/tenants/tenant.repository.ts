import { BaseRepository } from '../../core/base/BaseRepository';
import { TenantModel, ITenant } from './tenant.model';

class TenantRepository extends BaseRepository<ITenant> {
  constructor() {
    super(TenantModel);
  }

  async findBySlug(slug: string) {
    return TenantModel.findOne({ slug: slug.toLowerCase() }).exec();
  }
}

export const tenantRepository = new TenantRepository();
