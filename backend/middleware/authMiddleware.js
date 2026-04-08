import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

export const requireAdmin = (req, res, next) => {
  const role = req.user?.role || req.user?.isAdmin;

  if (role === "admin" || role === true) {
    return next();
  }

  return res.status(403).json({ message: "Admin access required" });
};
