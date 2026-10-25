const { DEPARTMENTS } = require("./dataGenerator");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseMetricFilters(query) {
  const { startDate, endDate, departments } = query;
  if (startDate !== undefined && !isValidDate(startDate)) {
    return { error: "startDate must be a valid date in YYYY-MM-DD format." };
  }
  if (endDate !== undefined && !isValidDate(endDate)) {
    return { error: "endDate must be a valid date in YYYY-MM-DD format." };
  }
  if (startDate && endDate && startDate > endDate) {
    return { error: "startDate must be on or before endDate." };
  }

  const departmentValues = departments === undefined
    ? []
    : Array.isArray(departments)
      ? departments
      : [departments];
  if (departmentValues.some((value) => typeof value !== "string")) {
    return { error: "departments must be a comma-separated list of valid facilities." };
  }

  const selectedDepartments = departmentValues
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  const invalidDepartment = selectedDepartments.find(
    (department) => !DEPARTMENTS.includes(department)
  );
  if (invalidDepartment) {
    return { error: `Unknown department: ${invalidDepartment}.` };
  }

  return {
    filters: {
      startDate,
      endDate,
      departments: [...new Set(selectedDepartments)],
    },
  };
}

function validateMetricFilters(req, res, next) {
  const result = parseMetricFilters(req.query);
  if (result.error) {
    return res.status(400).json({ success: false, error: result.error });
  }
  req.metricFilters = result.filters;
  return next();
}

function validateMultiplier(req, res, next) {
  const rawMultiplier = req.query.multiplier;
  const multiplier = rawMultiplier === undefined ? 2 : Number(rawMultiplier);
  if (
    typeof rawMultiplier === "object" ||
    !Number.isFinite(multiplier) ||
    multiplier < 1 ||
    multiplier > 4
  ) {
    return res.status(400).json({
      success: false,
      error: "multiplier must be a number between 1 and 4.",
    });
  }
  req.anomalyMultiplier = multiplier;
  return next();
}

module.exports = {
  parseMetricFilters,
  validateMetricFilters,
  validateMultiplier,
};