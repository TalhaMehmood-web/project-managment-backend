const buildQueryFilters = (filters, additionalFilters = {}) => {
  const filterQuery = { ...additionalFilters }; // Add any default filters (e.g., { isAdmin: false })

  Object.keys(filters || {}).forEach((key) => {
    if (filters[key]) {
      filterQuery[key] = { $regex: filters[key], $options: "i" }; // Case-insensitive search
    }
  });

  return filterQuery;
};
export default buildQueryFilters;
