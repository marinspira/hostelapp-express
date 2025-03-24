const MatchesSchema = new mongoose.Schema({
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Guest",
        required: true
    },
    liked_users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Guest"
    }],
    matches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Guest"
    }]
}, { timestamps: true });

const Matches = mongoose.model("Matches", MatchesSchema);
export default Matches;
