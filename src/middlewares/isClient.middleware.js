const isClient = (req, res, next) => {
  try {
    console.log(req.user);
    // Ensure user exists and has the client role
    if (!req.user || req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied: Clients only" });
    }
    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error while checking client role" });
  }
};

export default isClient;
