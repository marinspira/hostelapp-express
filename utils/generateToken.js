import jwt from "jsonwebtoken"
import * as dotenv from 'dotenv';

// Function to generate a JWT token and set it in a cookie in the HTTP response
function generateTokenAndSetCookie(userId, res) {

    // Generate a JWT token using the user's ID and a secret key
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "15d" // Set the token's validity to 15 days
    });

    // Set a cookie named "jwt" in the HTTP response with the generated token
    res.cookie("jwt", token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, // Set the cookie's validity to 15 days in milliseconds
        httpOnly: true, // The cookie can only be accessed by the server (not available to client-side JavaScript)
        sameSite: "strict" // The cookie will only be sent for requests from the same site, enhancing security
    });
}

// Export the function so it can be used in other parts of the application
export default generateTokenAndSetCookie;