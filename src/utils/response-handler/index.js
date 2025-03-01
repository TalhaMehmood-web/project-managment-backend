export const sendResponse = (res, statusCode, message, data) => {
  return res.status(statusCode).json({
    status: statusCode,
    success: statusCode < 400,
    message,
    data: data || null,
  });
};
