import { Schema, Document } from "mongoose";
import { broadcastEntityChange, EntityChangeAction } from "./realtime-bus";

export function realtimeBroadcastPlugin(schema: Schema): void {
  schema.pre("save", function (next) {
    
    
    
    (this as unknown as { $wasNew?: boolean }).$wasNew = this.isNew;
    next();
  });

  schema.post("save", function (doc) {
    emit(
      doc as unknown as Document,
      (doc as unknown as { $wasNew?: boolean }).$wasNew ? "created" : "updated",
    );
  });

  schema.post("findOneAndUpdate", function (doc) {
    if (doc) emit(doc as Document, "updated");
  });

  schema.post("findOneAndDelete", function (doc) {
    if (doc) emit(doc as Document, "deleted");
  });
}

function emit(doc: Document, action: EntityChangeAction): void {
  const modelName = (doc.constructor as { modelName?: string }).modelName;
  if (!modelName || !doc._id) return;
  broadcastEntityChange(modelName, action, doc._id.toString());
}
