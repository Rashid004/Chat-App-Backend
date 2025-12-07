/**
 * Sanitizes user object by removing sensitive fields
 * @param user - User document from database
 * @returns Sanitized user object without sensitive fields
 */
export const sanitizeUser = (user: any) => {
  // Convert Mongoose document to plain object if needed
  const userObject = user.toObject ? user.toObject() : { ...user };

  // Remove sensitive fields
  const {
    password,
    refreshToken,
    forgetPasswordToken,
    forgetPasswordTokenExpiry,
    emailVerificationToken,
    emailVerificationTokenExpiry,
    ...sanitized
  } = userObject;

  return sanitized;
};
