export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']; // Get the auth header
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Missing token' });
    }

    if (token !== "only_a_test") {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }

    next();
};
