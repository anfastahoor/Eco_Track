const test = require("node:test");
const assert = require("node:assert/strict");
const { app } = require("../index");
const {
  parseMetricFilters,
  validateMultiplier,
} = require("../utils/requestValidation");

test("parses and deduplicates valid metric filters", () => {
  assert.deepEqual(
    parseMetricFilters({
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      departments: "HQ Operations,Data Center,HQ Operations",
    }),
    {
      filters: {
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        departments: ["HQ Operations", "Data Center"],
      },
    }
  );
});

test("rejects invalid dates and reversed ranges", () => {
  assert.match(
    parseMetricFilters({ startDate: "2025-02-30" }).error,
    /valid date/
  );
  assert.match(
    parseMetricFilters({
      startDate: "2025-02-01",
      endDate: "2025-01-31",
    }).error,
    /on or before/
  );
});

test("rejects unknown departments", () => {
  assert.match(
    parseMetricFilters({ departments: "Unknown Facility" }).error,
    /Unknown department/
  );
});

test("validates the anomaly threshold range", () => {
  for (const multiplier of ["1", "2.5", "4"]) {
    const req = { query: { multiplier } };
    let nextCalled = false;
    const res = {
      status() {
        return this;
      },
      json() {
        assert.fail("Valid multiplier should not return an error.");
      },
    };
    validateMultiplier(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  }

  for (const multiplier of ["0.9", "4.1", "NaN", "Infinity"]) {
    const req = { query: { multiplier } };
    let statusCode;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        assert.equal(body.success, false);
      },
    };
    validateMultiplier(req, res, () => assert.fail("Invalid multiplier passed."));
    assert.equal(statusCode, 400);
  }
});

test("API returns clear client errors and blocks production reseeding", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal((await health.json()).canReseed, false);

    const invalidDate = await fetch(
      `${baseUrl}/api/metrics?startDate=2025-02-30`
    );
    assert.equal(invalidDate.status, 400);
    assert.equal((await invalidDate.json()).success, false);

    const dashboard = await fetch(`${baseUrl}/api/kpi/dashboard?multiplier=2`);
    assert.equal(dashboard.status, 200);
    const dashboardBody = await dashboard.json();
    assert.equal(dashboardBody.success, true);
    assert.ok(Array.isArray(dashboardBody.records));
    assert.ok(Array.isArray(dashboardBody.departments));
    assert.ok(Array.isArray(dashboardBody.anomalies));

    const invalidMultiplier = await fetch(
      `${baseUrl}/api/kpi/dashboard?multiplier=5`
    );
    assert.equal(invalidMultiplier.status, 400);
    await invalidMultiplier.arrayBuffer();

    const reseed = await fetch(`${baseUrl}/api/metrics/seed`, {
      method: "POST",
    });
    assert.equal(reseed.status, 403);
    await reseed.arrayBuffer();
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});