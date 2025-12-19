import jwt from "jsonwebtoken";
import User from "../Models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

export const authMiddleware = async (req, res, next) => {
  //method 1
  //const token = req.header("Authorization");
  //method 2 bearer token
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(404).json({ message: "Token Missing" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //console.log("decoded", decoded);
    req.user = await User.findById(decoded._id).select("-password");
    //console.log("req.user", req.user);
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const adminMiddleware = async (req, res, next) => {
  if (req.user.role != "admin") {
    return res
      .status(404)
      .json({ message: "Access denied only admin can view" });
  }
  next();
};