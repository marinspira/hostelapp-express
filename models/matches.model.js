import mongoose from "mongoose";

const MatchesSchema = new mongoose.Schema({
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    liked_users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    matches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true });

const Matches = mongoose.model("Matches", MatchesSchema);
export default Matches;
