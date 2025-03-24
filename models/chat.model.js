const ChatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId, ref: "User", required: true
    }],
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId, ref: "User", required: true
        },
        text: {
            type: String, required: true
        },
        sent_at: {
            type: Date, default: Date.now
        }
    }],
    created_at: {
        type: Date, default: Date.now
    }
});

module.exports = mongoose.model("Chat", ChatSchema);