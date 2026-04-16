/**
 * Signs a JWT, sets an httpOnly cookie, and sends a unified response.
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.getSignedJwtToken();

  const cookieOptions = {
    expires:  new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'strict',
    secure:   process.env.NODE_ENV === 'production',
  };

  // Strip sensitive fields before sending user object
  const userData = {
    _id:   user._id,
    name:  user.name,
    email: user.email,
    phone: user.phone,
    role:  user.role,
    avatar: user.avatar,
    isVerified:       user.isVerified,
    isProfileComplete: user.isProfileComplete,
    labourProfile: user.labourProfile,
    clientProfile: user.clientProfile,
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({ success: true, message, token, data: userData });
};

module.exports = { sendTokenResponse };
