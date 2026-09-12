import { BaseRepository } from '../../core/base/BaseRepository';
import { VendorModel, IVendor } from './vendor.model';

class VendorRepository extends BaseRepository<IVendor> {
  constructor() {
    super(VendorModel);
  }

  async incrementActiveContracts(vendorId: string, delta: 1 | -1) {
    return VendorModel.findByIdAndUpdate(vendorId, { $inc: { activeContractsCount: delta } }).exec();
  }

  

  async listAll(limit = 500) {
    return VendorModel.find({}).sort({ name: 1 }).limit(limit).exec();
  }
}

export const vendorRepository = new VendorRepository();
