import User from "../models/user.model.js"
import generateTokenAndSetCookie from "../utils/generateToken.js";
import { jwtDecode } from 'jwt-decode'
import Hostel from "../models/hostel.model.js"
import Guest from "../models/guest.model.js"
import { getGoogleUserInfo } from "../utils/getGoogleUserInfo.js";

export const isAuthenticated = async (req, res) => {
    try {
        const user = req.user

        console.log('check user on cookies:', user)

        // Verify if is a new user (have the birth date) or has a hostel
        const guest = await Guest.findOne({ user: user._id });
        const hostel = await Hostel.findOne({ owners: user.id })

        if ((guest && guest.birthday !== null) || hostel) {
            return res.status(200).json({
                data: {
                    name: user.name,
                    isNewUser: false,
                    role: user.role,
                },
                success: true,
                message: 'User authenticated successfully',
            });
        } else {
            return res.status(200).json({
                data: {
                    name: user.name,
                    isNewUser: true,
                    role: user.role
                },
                success: true,
                message: 'New user authenticated successfully',
            });
        }

    } catch (error) {
        console.log("Error in isAuthenticated controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const localhostLogin = async (req, res) => {
    try {
        const { credentials, role } = req.body

        const email = credentials.email

        const user = await User.findOne({ email })

        if (user) {
            const token = generateTokenAndSetCookie(user._id, res);

            user.sessionToken = token;
            await user.save();

            // Verify if is a new user (have the birth date) or has a hostel
            const guest = await Guest.findOne({ user: user._id });
            const hostel = await Hostel.findOne({ owners: user.id })

            if ((guest && guest.birthday !== null) || hostel) {
                return res.status(200).json({
                    data: {
                        name: user.name,
                        isNewUser: false,
                        role: user.role,
                    },
                    success: true,
                    message: 'User logged successfully',
                });
            } else {
                return res.status(200).json({
                    data: {
                        name: user.name,
                        isNewUser: true,
                        role: user.role
                    },
                    success: true,
                    message: 'New user logged successfully',
                });
            }

        }

        const newUser = new User({
            name: credentials.name,
            email: credentials.email,
            appleId: credentials.appleId,
            role
        });

        if (newUser) {
            await newUser.save();
            generateTokenAndSetCookie(newUser._id, res)
        } else {
            return res.status(400).json({ error: "Error creating new user" })
        }

        return res.status(201).json({
            data: {
                isNewUser: true,
                name: newUser.name,
                role: newUser.role
            },
            success: true,
            message: 'New user created with Google successfully'
        });

    } catch (error) {
        console.log("Error in signup controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const googleLogin = async (req, res) => {
    try {
        const { token, role } = req.body;

        const userInfo = await getGoogleUserInfo(token);
        if (!userInfo) {
            return res.status(400).json({ error: 'Invalid token' });
        }

        const email = userInfo.email
        const user = await User.findOne({ email });

        // Existing user logic
        if (user) {
            // Validate Google and Apple IDs
            if (user.googleId && user.googleId !== userInfo.id) {
                return res.status(400).json({ error: 'Invalid token' });
            }

            if (user.appleId && !user.googleId) {
                return res.status(400).json({
                    error: 'This email is already linked to a Apple account. Please log in using Apple.',
                });
            }

            generateTokenAndSetCookie(user._id, res);

            // Verify if is a new user (have the birth date) or has a hostel
            const guest = await Guest.findOne({ user: user._id });
            const hostel = await Hostel.findOne({ owners: user.id })

            if ((guest && guest.birthday !== null) || hostel) {
                return res.status(200).json({
                    data: {
                        name: user.name,
                        isNewUser: false,
                        role: user.role,
                    },
                    success: true,
                    message: 'User logged with Google successfully',
                });
            } else {
                return res.status(200).json({
                    data: {
                        name: user.name,
                        isNewUser: true,
                        role: user.role
                    },
                    success: true,
                    message: 'New user logged with Google successfully',
                });
            }
        }

        // New user creation logic
        const newUser = new User({
            name: userInfo.name,
            email: userInfo.email,
            googleId: userInfo.id,
            role
        });

        if (newUser) {
            await newUser.save();
            generateTokenAndSetCookie(newUser._id, res)
        } else {
            return res.status(400).json({ error: "Error creating new user" })
        }

        const username = await generateUniqueUsername(user.name);

        // Create Guest if user has a profile picture
        if (userInfo.picture) {
            const newGuest = new Guest({
                guestPhotos: [userInfo.picture],
                user: newUser._id,
                username
            })
            await newGuest.save()
        }

        return res.status(201).json({
            data: {
                isNewUser: true,
                name: newUser.name,
                role: newUser.role
            },
            success: true,
            message: 'New user created with Google successfully'
        });

    } catch (error) {
        console.log("Error in signup controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
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
                return res.status(400).json({ error: 'Invalid token' });
            }

            // If the email exists but is associated with Google
            if (user.googleId && !user.appleId) {
                return res.status(400).json({
                    error: 'This email is already linked to a Google account. Please log in using Google.',
                });
            }

            const token = generateTokenAndSetCookie(user._id, res);

            user.sessionToken = token;
            await user.save();

            // Verify if is a new user (have the birth date) or has a hostel
            const guest = await Guest.findOne({ user: user._id });
            const hostel = await Hostel.findOne({ owners: user.id })

            if ((guest && guest.birthday !== null) || hostel) {
                return res.status(200).json({
                    data: {
                        name: user.name,
                        isNewUser: false,
                        role: user.role,
                    },
                    success: true,
                    message: 'User logged with Apple successfully',
                });
            } else {
                return res.status(200).json({
                    data: {
                        name: user.name,
                        isNewUser: true,
                        role: user.role
                    },
                    success: true,
                    message: 'New user logged with Apple successfully',
                });
            }
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
            const token = generateToken(newUser._id);
            newUser.sessionToken = token;

            await newUser.save();

            return res.status(201).json({
                data: {
                    name: user.name,
                    isNewUser: true,
                    role: user.role
                },
                success: true,
                message: 'New user created successfully',
            });
        } else {
            return res.status(400).json({ error: "Invalid user data" })
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
            sameSite: "strict",
        });

        res.status(200).json({
            message: "Logged out successfully",
            success: true
        });
    } catch (error) {
        console.error("Error during logout:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
