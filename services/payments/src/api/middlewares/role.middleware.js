import { UnauthorizedError } from "../../services/error.utils.js";

/**
 * Middleware to restrict access based on user role.
 *
 * This function returns another middleware that checks if the
 * authenticated user's role matches one of the allowed roles.
 *
 * Usage:
 *   router.post('/menu', authenticateToken, requireRole('merchant', 'admin'), handler);
 *
 * @param {...string} allowedRoles - One or more user roles that are permitted to access the route
 * @returns {function} Express middleware function
 */
export function requireRole(...allowedRoles){
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole || !allowedRoles.includes(userRole)){
            return next(UnauthorizedError('You are not authorised to perform this action'));
        }
        next();
    }
}