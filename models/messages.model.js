import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel'
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['User', 'Hostel']
    },
    text: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Message = mongoose.model("Message", MessageSchema);

export default Message
