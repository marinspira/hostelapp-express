import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
    participants: [{
        hostel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hostel",
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    }],
    group: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const Conversation = mongoose.model("Conversation", ConversationSchema)

export default Conversation