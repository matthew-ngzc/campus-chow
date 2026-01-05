import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../services/error.utils.js';
import dotenv from "dotenv";

dotenv.config();

/**
 * *Middleware to authenticate requests using a JWT token.
 *
 * This function checks for a Bearer token in the Authorization header.
 * If the token is valid, it attaches the decoded user info to `req.user`
 * and allows the request to proceed.
 *
 * Usage:
 *   router.get('/protected-route', authenticateToken, handler);
 *
 * Expected Header:
 *   Authorization: Bearer <token>
 *
 * @param {import('express').Request} req - Express request Object
 * @param {import('express').Response} res - Express response Object
 * @param {function} next - Express next middleware function
 */
export function authenticateToken(req, res, next){

    const authHeader = req.headers['authorization']; //get the headers
    
    // the ? is in case no header, then wont crash
    const token = authHeader?.split(' ')[1]; //the header would look like "Bearer woeinowenron" so we want the 2nd part

    // Error handling : No Token
    if (!token) {
        return next(UnauthorizedError('Missing access token'));
    }

    // have token, check if valid
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(UnauthorizedError('Invalid or expired token'));
        }
        req.user = decoded; //extract the user id from the token
        next(); // move on from this middleware
    })
}