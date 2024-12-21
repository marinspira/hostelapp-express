import User from "../models/user.model.js"
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/generateToken.js";

export const signup = async (req, res) => {
    try {
        const {
            fullName,
            email,
            password,
            // confirmPassword,
            userType
        } = req.body;

        console.log(req.body)

        // if (password !== confirmPassword) {
        //     return res.status(400).json({ error: "Password don't match" });
        // }

        const user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ error: "email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user with the provided data and hashed password
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            // confirmPassword,
            userType,
        });

        if (newUser) {
            generateTokenAndSetCookie(newUser._id, res)

            // Save the new user to the database
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
            });
        } else {
            res.status(400).json({ error: "Invalid user data" })
        }

    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email })
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "")

        if (!user) {
            return res.status(400).json({ error: "Email did not find" })
        }

        if (!isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid Password" })
        }

        generateTokenAndSetCookie(user._id, res)

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
        });

    } catch (error) {
        console.log("Error:", error.message)
        res.status(500).json({ error: "Error Server" })
    }
}

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 })
        res.status(200).json({ message: "Logged out successfully" })
    } catch (error) {
        console.log("Error:", error.message)
        res.status(500).json({ error: "Error Server" })
    }
}