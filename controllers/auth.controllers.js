import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";
import { jwtDecode } from "jwt-decode";
import Hostel from "../models/hostel.model.js";
import Guest from "../models/guest.model.js";
import { getGoogleUserInfo } from "../utils/getGoogleUserInfo.js";
import generateUniqueUsername from "../utils/generateUniqueUsername.js";
import EmailCode from "../models/emailCode.model.js";
import sendEmail from "../services/auth/sendEmail.js";
import bcrypt from "bcrypt";

export const isAuthenticated = async (req, res) => {
  const user = req.user;
  const guest = await Guest.findOne({ user: user._id });
  const hostel = await Hostel.findOne({ user_id_owners: user.id });

  if ((guest && guest.birthday) || hostel) {
    return res.status(200).json({
      data: {
        name: user.name,
        isNewUser: false,
        role: user.role,
      },
      success: true,
      message: "User authenticated successfully",
    });
  } else {
    return res.status(200).json({
      data: {
        name: user.name,
        isNewUser: true,
        role: user.role,
      },
      success: true,
      message: "New user authenticated successfully",
    });
  }
};

export const localhostLogin = async (req, res) => {
  const { credentials, role } = req.body;

  const email = credentials.email;

  const user = await User.findOne({ email });

  if (user) {
    const token = generateTokenAndSetCookie(user._id, res);

    user.sessionToken = token;
    await user.save();

    // Verify if is a new user (have the birth date) or has a hostel
    const guest = await Guest.findOne({ user: user._id });
    const hostel = await Hostel.findOne({ owners: user.id });

    if ((guest && guest.birthday !== null) || hostel) {
      return res.status(200).json({
        data: {
          name: user.name,
          isNewUser: false,
          role: user.role,
        },
        success: true,
        message: "User logged successfully",
      });
    } else {
      return res.status(200).json({
        data: {
          name: user.name,
          isNewUser: true,
          role: user.role,
        },
        success: true,
        message: "New user logged successfully",
      });
    }
  }

  const newUser = new User({
    name: credentials.name,
    email: credentials.email,
    appleId: credentials.appleId,
    role,
  });

  if (newUser) {
    await newUser.save();
    generateTokenAndSetCookie(newUser._id, res);
  } else {
    return res.status(400).json({ error: "Error creating new user" });
  }

  return res.status(201).json({
    data: {
      isNewUser: true,
      name: newUser.name,
      role: newUser.role,
    },
    success: true,
    message: "New user created with Google successfully",
  });
};

export const googleLogin = async (req, res) => {
  const { token, role } = req.body;

  const userInfo = await getGoogleUserInfo(token);

  if (!userInfo) {
    return res.status(400).json({ error: "Invalid token" });
  }

  const email = userInfo.email;
  const user = await User.findOne({ email });

  // Existing user logic
  if (user) {
    // Validate Google and Apple IDs
    if (user.googleId && user.googleId !== userInfo.id) {
      return res.status(400).json({ error: "Invalid token" });
    }

    if (user.appleId && !user.googleId) {
      return res.status(400).json({
        error:
          "This email is already linked to a Apple account. Please log in using Apple.",
      });
    }

    generateTokenAndSetCookie(user._id, res);

    // Verify if is a new user (have the birth date) or has a hostel
    const guest = await Guest.findOne({ user: user._id });
    const hostel = await Hostel.findOne({ owners: user.id });

    if ((guest && guest.birthday !== null) || hostel) {
      return res.status(200).json({
        data: {
          name: user.name,
          isNewUser: false,
          role: user.role,
        },
        success: true,
        message: "User logged with Google successfully",
      });
    } else {
      return res.status(200).json({
        data: {
          name: user.name,
          isNewUser: true,
          role: user.role,
        },
        success: true,
        message: "New user logged with Google successfully",
      });
    }
  }

  // New user creation logic
  const newUser = new User({
    name: userInfo.name,
    email: userInfo.email,
    googleId: userInfo.id,
    role,
  });

  if (newUser) {
    generateTokenAndSetCookie(newUser._id, res);
    await newUser.save();
  } else {
    return res.status(400).json({ error: "Error creating new user" });
  }

  const username = await generateUniqueUsername(newUser.name);

  // Create Guest if user has a profile picture
  if (userInfo.picture) {
    const newGuest = new Guest({
      guestPhotos: [userInfo.picture],
      user: newUser._id,
      username,
    });
    await newGuest.save();
  }

  return res.status(201).json({
    data: {
      isNewUser: true,
      name: newUser.name,
      role: newUser.role,
    },
    success: true,
    message: "New user created with Google successfully",
  });
};

export const appleLogin = async (req, res) => {
  const { identityToken, fullName, role } = req.body;

  if (!identityToken) {
    return res.status(400).json({ error: "Missing identity token" });
  }

  //   const decodedToken = await verifyAppleToken(identityToken);

  const decodedToken = jwtDecode(identityToken);
  const email = decodedToken.email;
  const appleId = decodedToken.sub;

  const user = await User.findOne({ email });

  // Login if user already exists
  if (user) {
    // If the email exists but the appleId does not match
    if (user.appleId && user.appleId !== appleId) {
      return res.status(400).json({ error: "Invalid token" });
    }

    // If the email exists but is associated with Google
    if (user.googleId && !user.appleId) {
      return res.status(400).json({
        error:
          "This email is already linked to a Google account. Please log in using Google.",
      });
    }

    const token = generateTokenAndSetCookie(user._id, res);

    user.sessionToken = token;
    await user.save();

    // Verify if is a new user (have the birth date) or has a hostel
    const guest = await Guest.findOne({ user: user._id });
    const hostel = await Hostel.findOne({ owners: user.id });

    if ((guest && guest.birthday !== null) || hostel) {
      return res.status(200).json({
        data: {
          name: user.name,
          isNewUser: false,
          role: user.role,
        },
        success: true,
        message: "User logged with Apple successfully",
      });
    } else {
      return res.status(200).json({
        data: {
          name: user.name,
          isNewUser: true,
          role: user.role,
        },
        success: true,
        message: "New user logged with Apple successfully",
      });
    }
  }

  // Create a new user
  const firstName = fullName.split(" ")[0];
  const lastName = fullName.split(" ")[1];

  if (firstName && lastName === "null") {
    return res.status(400).json({
      error:
        "Error with the information received. Please, try logging in with Google.",
    });
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
        role: user.role,
      },
      success: true,
      message: "New user created successfully",
    });
  } else {
    return res.status(400).json({ error: "Invalid user data" });
  }
};

export const updateUser = async (req, res) => {
  const { userData } = req.body;
  const user = req.user;

  if (!userData || Object.keys(userData).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'User data is required.',
    });
  }

  console.log('Updating user with data:', userData);

  try {
    Object.assign(user, userData);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully!',
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        isNewUser: user.isNewUser,
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user.',
    });
  }
};

export const logout = async (req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });

  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "strict",
  });

  res.status(200).json({
    message: "Logged out successfully",
    success: true,
  });
};

export const sendEmailCode = async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ message: "Missing email", success: false });

  const emailLowercase = email.toLowerCase();

  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  console.log(
    `[sendEmailCode] Code for ${emailLowercase}: ${code} (expires at ${expiresAt.toLocaleString()})`
  );

  // upsert code
  await EmailCode.findOneAndUpdate(
    { email: emailLowercase },
    { codeHash, expiresAt },
    { upsert: true, new: true }
  );

  // send email
  try {
    await sendEmail({
      to: emailLowercase,
      subject: "Your login code",
      text: `Your code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
    });
  } catch (e) {
    console.error("Failed to send verification email", e);
  }

  return res.status(200).json({ success: true, message: "Code sent" });
};

export const verifyEmailCode = async (req, res) => {
  const { email, code, role } = req.body;
  if (!email || !code)
    return res
      .status(400)
      .json({ message: "Missing email or code", success: false });

  const emailLowercase = email.toLowerCase();

  const record = await EmailCode.findOne({ email: emailLowercase });
  if (!record)
    return res
      .status(400)
      .json({ message: "Code not found or expired", success: false });

  const match = await bcrypt.compare(code, record.codeHash);
  if (!match)
    return res.status(401).json({ message: "Invalid code", success: false });

  // remove used code
  try {
    await EmailCode.deleteOne({ email: emailLowercase });
  } catch (e) {
    console.error("Failed to delete used email code", e);
  }

  // find or create user
  let user = await User.findOne({ email: emailLowercase });

  if (!user) {
    user = new User({ email: emailLowercase, role });
    await user.save();

    // Add new user to HostelApp even if it is a owner or guest
    try {
      const hostelAppId = "68de685a88b0f3797372e256";
      const hostel = await Hostel.findById(hostelAppId);

      if (!hostel.user_id_guests.includes(user._id)) {
        hostel.user_id_guests.push(user._id);
        await hostel.save();
      }
    } catch (error) {
      console.error("Error adding new user to HostelApp:", error);
    }
  }

  const sessionToken = generateTokenAndSetCookie(user._id, res);
  user.sessionToken = sessionToken;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Logged in",
    data: { name: user.name, isNewUser: true, role: user.role, sessionToken },
  });
};
