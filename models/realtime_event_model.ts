import mongoose from "mongoose";

const realtimeEventSchema = new mongoose.Schema(
  {
    event: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    roomId: { type: String, default: null, index: true },
    targetUserId: { type: String, default: null, index: true },
    origin: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "realtime_events",
  },
);

const RealtimeEvent =
  (mongoose.models["RealtimeEvent"] as mongoose.Model<any> | undefined) ??
  mongoose.model<any>("RealtimeEvent", realtimeEventSchema);

export default RealtimeEvent;
