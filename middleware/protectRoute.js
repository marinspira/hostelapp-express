import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Middleware function to protect routes
const protectRoute = async (req, res, next) => {
    try {
        // Get the token from request cookies
        const token = req.cookies.jwt;

        // If no token is provided, respond with a 401 status
        if (!token) {
            return res.status(401).json({ error: "Unauthorized - No Token Provided" });
        }

        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // If token verification fails, respond with a 401 status
        if (!decoded) {
            return res.status(401).json({ error: "Unauthorized - Invalid Token" });
        }

        // Find the user by the ID decoded from the token, excluding the password field
        const user = await User.findById(decoded.userId);

        // If the user is not found, respond with a 404 status
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Attach the user object to the request for use in the next middleware/route handler
        req.user = user;

        console.log(user)

        // Call the next middleware or route handler
        next();

    } catch (error) {
        console.error("Error in protectRoute middleware", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export default protectRoute;