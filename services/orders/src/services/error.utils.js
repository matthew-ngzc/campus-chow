/**
 * Creates a 404 Not Found error with a descriptive message.
 *
 * @param {string} resource - The name of the resource (e.g., 'User')
 * @param {string} identifier - The name of the identifier (e.g., 'ID')
 * @param {string|number} id - The value of the identifier for the resource (e.g., 123)
 * @returns {Error} - An Error object with `.status` and `.code` set
 *
 * @example
 * throw NotFoundError('User', 'ID', 123);
 *  => Error: User with ID 123 does not exist
 */
export function NotFoundError(resource = 'Resource', identifier = "ID", id = 0) {
  const err = new Error(`${resource} with ${identifier} = ${id} does not exist`);
  err.status = 404;
  err.code = `NOT_FOUND_${resource.toUpperCase()}`;
  return err;
}


/**
 * Creates a 409 Conflict error for an existing resource.
 *
 * @param {string} resource - The name of the resource (e.g., 'User')
 * @param {string} identifier - The type of identifier (e.g., 'email', 'ID')
 * @param {string|number} id - The identifier value (e.g., 123 or 'student@smu.edu.sg')
 * @returns {Error} - An Error object with `.status` set to 409 and a unique `.code`
 *
 * @example
 * throw DuplicateError('User', 'email', 'student@smu.edu.sg');
 *  => Error: User already exists with email = student@smu.edu.sg
 */
export function DuplicateError(resource = 'Resource', identifier = "ID", id = 0){
  const err = new Error(`${resource} already exists with ${identifier} = ${id}`);
  err.status = 409;
  err.code = `CONFLICT_${resource.toUpperCase()}`;
  return err;
}

export function BadRequestError(message = 'Bad request') {
  const err = new Error(message);
  err.status = 400;
  err.code = 'BAD_REQUEST';
  return err;
}

export function UnauthorizedError(message = 'Unauthorized') {
  const err = new Error(message);
  err.status = 401;
  err.code = 'UNAUTHORIZED';
  return err;
}
