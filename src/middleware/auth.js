const db = require("../db");
const { verifyToken } = require("../utils/auth");
const { ApiError } = require("./error");

const ROLES = ["owner", "manager", "staff", "vendor"];
// Roles allowed to manage the org, its members, and integration settings.
const MANAGER_ROLES = ["owner", "manager"];

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new ApiError(401, "Missing authorization token");

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new ApiError(401, "Invalid or expired token");
    }

    const user = await db("users").where({ id: payload.sub }).first();
    if (!user) throw new ApiError(401, "Account no longer exists");

    req.user = {
      id: user.id,
      org_id: user.org_id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    next();
  } catch (err) {
    next(err);
  }
}

// Usage: requireRole("owner", "manager")
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Not authenticated"));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to do that"));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole, ROLES, MANAGER_ROLES };
