const mongoose = require("mongoose");

const VolunteerPositionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    requirements: [{
        type: String,
        trim: true
    }],
    candidates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    current_opportunities: [{
        assigned_staff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        status: {
            type: String,
            enum: ["open", "closed"],
            default: "open"
        },
        shift: {
            start_time: { type: String }, // Exemplo: "08:00"
            end_time: { type: String }, // Exemplo: "16:00"
            days_per_week: { type: Number }
        }
    }],
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    }],
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("VolunteerPosition", VolunteerPositionSchema);
