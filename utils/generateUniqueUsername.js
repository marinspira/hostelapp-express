import Hostel from "../models/hostel.model.js";
import Guest from "../models/guest.model.js";

const generateUniqueUsername = async (name) => {
    let baseUsername = name.replace(/\s+/g, '').toLowerCase();

    let username = baseUsername;

    let hostelWithSameUsername = await Hostel.findOne({ username });
    let userWithSameUsername = await Guest.findOne({ username });

    let counter = 1;

    while (hostelWithSameUsername || userWithSameUsername) {
        username = `${baseUsername}${counter}`;
        hostelWithSameUsername = await Hostel.findOne({ username });
        userWithSameUsername = await Guest.findOne({ username });
        counter++;
    }

    return username;
}

export default generateUniqueUsername;