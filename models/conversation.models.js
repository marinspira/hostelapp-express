import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Conversation", ConversationSchema);