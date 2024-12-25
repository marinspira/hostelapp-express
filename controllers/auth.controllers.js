import User from "../models/user.model.js"
import generateTokenAndSetCookie from "../utils/generateToken.js";
import { jwtDecode } from 'jwt-decode'
import Guest from "../models/guest.model.js"

export const googleLogin = async (req, res) => {
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
                name: user.name,
                role: user.role
            });
        }

        // Create a new user with the provided data
        const newUser = new User({
            name,
            email,
            googleId,
            appleId,
            role,
        });

        if (newUser) {
            generateTokenAndSetCookie(newUser._id, res)

            // Save the new user to the database
            await newUser.save();

            if (picture) {
                // Check if guest exists
                const guest = await Guest.findOne({ user: newUser._id });

                if (!guest) {
                    // Create a new guest associate to user
                    const newGuest = new Guest({
                        user: newUser._id,
                        guestPhotos: [picture]
                    });

                    await newGuest.save();
                }
            }

            res.status(201).json({
                isNewUser: true,
                name: newUser.name,
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

export const appleLogin = async (req, res) => {
    try {
        const { identityToken, fullName, role } = req.body

        if (!identityToken) {
            return res.status(400).json({ error: 'Missing identity token' });
        }

        // Verificar a assinatura e validade do token
        //   const decodedToken = await verifyAppleToken(identityToken);

        const decodedToken = jwtDecode(identityToken)
        const email = decodedToken.email
        const appleId = decodedToken.sub

        const user = await User.findOne({ email });

        // Login if user already exists
        if (user) {
            // If the email exists but the appleId does not match
            if (user.appleId && user.appleId !== appleId) {
                return res.status(400).json({
                    error: 'Invalid token',
                });
            }

            // If the email exists but is associated with Google
            if (user.googleId && !user.appleId) {
                return res.status(400).json({
                    error: 'This email is already linked to a Google account. Please log in using Google.',
                });
            }

            generateTokenAndSetCookie(user._id, res);

            // Verify if is a new user (have the birth date)
            const guest = await Guest.findOne({ user: user._id });

            if (guest.birthday !== null) {
                return res.status(200).json({
                    id: user._id,
                    name: user.name,
                    isNewUser: false,
                    role: user.role
                });
            }

            return res.status(200).json({
                id: user._id,
                name: user.name,
                isNewUser: true,
                role: user.role
            });
        }

        // Create a new user
        const firstName = fullName.split(' ')[0]
        const lastName = fullName.split(' ')[1]

        if (firstName && lastName === 'null') {
            return res.status(400).json({ error: "Error with the information received. Please, try logging in with Google." });
        }

        const newUser = new User({
            name: fullName,
            appleId: decodedToken.sub,
            email: decodedToken.email,
            googleId: null,
            role,
        });

        if (newUser) {
            generateTokenAndSetCookie(newUser._id, res)

            // Save the new user to the database
            await newUser.save();

            res.status(201).json({
                id: newUser._id,
                isNewUser: true,
                role: newUser.role
            });
        } else {
            res.status(400).json({ error: "Invalid user data" })
        }


    } catch (error) {
        console.log("Error in appleAuth controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 })

        res.clearCookie("jwt", {
            httpOnly: true,
            // secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Error during logout:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
