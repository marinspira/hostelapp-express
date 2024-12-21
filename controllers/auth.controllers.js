import User from "../models/user.model.js"
import generateTokenAndSetCookie from "../utils/generateToken.js";

export const login = async (req, res) => {
    try {
        const {
            name,
            email,
            googleId,
            appleId,
            picture,
            role,
        } = req.body;

        const user = await User.findOne({ email });

        // Login if user already exists
        if (user) {
            generateTokenAndSetCookie(user._id, res);

            return res.status(200).json({
                isNewUser: false,
                role: user.role
            });
        }

        // Create a new user with the provided data
        const newUser = new User({
            name,
            email,
            googleId,
            appleId,
            picture,
            role,
        });

        if (newUser) {
            generateTokenAndSetCookie(newUser._id, res)

            // Save the new user to the database
            await newUser.save();

            res.status(201).json({
                isNewUser: false,
                role: newUser.role
            });
        } else {
            res.status(400).json({ error: "Invalid user data" })
        }

    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const logout = (req, res) => {
    // try {
    //     res.cookie("jwt", "", { maxAge: 0 })
    //     res.status(200).json({ message: "Logged out successfully" })
    // } catch (error) {
    //     console.log("Error:", error.message)
    //     res.status(500).json({ error: "Error Server" })
    // }
}