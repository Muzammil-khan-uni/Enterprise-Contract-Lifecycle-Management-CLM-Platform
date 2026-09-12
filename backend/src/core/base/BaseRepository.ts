import { Model, FilterQuery, UpdateQuery, Types } from 'mongoose';

export abstract class BaseRepository<T> {
  protected constructor(protected readonly model: Model<T>) {}

  async findById(id: string | Types.ObjectId) {
    return this.model.findById(id).exec();
  }

  async findOne(filter: FilterQuery<T>) {
    return this.model.findOne(filter).exec();
  }

  async find(filter: FilterQuery<T>, limit = 25) {
    return this.model.find(filter).limit(limit).exec();
  }

  async create(data: Partial<T>) {
    return this.model.create(data);
  }

  async updateById(id: string | Types.ObjectId, update: UpdateQuery<T>) {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async deleteById(id: string | Types.ObjectId) {
    return this.model.findByIdAndDelete(id).exec();
  }

  async count(filter: FilterQuery<T>) {
    return this.model.countDocuments(filter).exec();
  }
}
