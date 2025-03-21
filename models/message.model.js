import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    text: { type: String, required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    conversationId: {},
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Message", MessageSchema);