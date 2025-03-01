const isAdmin = (req, res, next) => {
  try {
    // Ensure user exists and has the admin role
    if (!req.user || req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error while checking admin role" });
  }
};

export default isAdmin;
