const EventSchema = new mongoose.Schema({
    title: {
        type: String, required: true
    },
    description: {
        type: String
    },
    price: {
        type: Number, required: true
    },
    date: {
        type: Date, required: true
    },
    suggested_by: {
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    }, // Hóspede que sugeriu
    attendees: [{
        type: mongoose.Schema.Types.ObjectId, ref: "User"
    }], // Quem confirmou presença
    status: {
        type: String, enum: ["pendente", "aprovado"], default: "pendente"
    },
    icon: {
        type: String, // URLs das imagens de comprovação
    },
    photos_last_event: {
        type: [String]
    },
    photos_this_event: {
        type: [String]
    },
    created_at: {
        type: Date, default: Date.now
    }
});

module.exports = mongoose.model("Event", EventSchema);
