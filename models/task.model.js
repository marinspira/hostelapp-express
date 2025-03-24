const TaskSchema = new mongoose.Schema({
    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VolunteerPosition',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: ["pendente", "em andamento", "concluída"],
        default: "pendente"
    },
    subtasks: [
        {
            title: { type: String, required: true },
            description: { type: String },
            status: { type: String, enum: ["pendente", "em andamento", "concluída"], default: "pendente" },
            photos: [{ type: String }], // URLs das imagens de comprovação
        }
    ],
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Task", TaskSchema);
