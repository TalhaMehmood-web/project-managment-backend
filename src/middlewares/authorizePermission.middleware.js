export const authorizePermission = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: "User not authenticated." });
    }

    const requestEndpoint = req.baseUrl + req.path;
    const requestMethod = req.method;

    const hasPermission = req.user.permissions.some(
      (perm) =>
        perm.endpoint === requestEndpoint && perm.method === requestMethod
    );

    if (!hasPermission) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions." });
    }

    next();
  };
};
