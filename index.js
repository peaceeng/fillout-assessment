const express = require("express");
const axios = require("axios");
const app = express();

app.get("/:formId/filteredResponses", async (req, res) => {
  try {
    const formId = req.params.formId;
    const apiKey =
      "sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912";
    // const filters = JSON.parse(req.query.filters);
    const limit = parseInt(req.query.limit) || 150;
    const afterDate = req.query.afterDate;
    const beforeDate = req.query.beforeDate;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status;
    const includeEditLink = req.query.includeEditLink === "true";
    const sort = req.query.sort || "asc";

    // Prepare the request URL
    const apiUrl = `https://api.fillout.com/v1/api/forms/${formId}/submissions`;
    // Fetch responses from Fillout.com API
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    let { responses } = response.data;
    if (sort === "asc")
      responses.sort((a, b) => a.submissionId.localeCompare(b.submissionId));
    else responses.sort((a, b) => b.submissionId.localeCompare(a.submissionId));
    // Apply filters
    const beforePaginationResponses = response.data.responses.filter(
      (response) => {
        // Filtering logic here
        const conditionInclude = includeEditLink ? response.editLink : true;
        const conditionStatus =
          status === "finished"
            ? new Date(response.lastUpdatedAt).getTime() < new Date().getTime()
            : new Date(response.lastUpdatedAt).getTime() >=
              new Date().getTime();
        const subDate = new Date(response.submissionTime);
        const after = new Date(afterDate);
        const before = new Date(beforeDate);
        const isAfter = afterDate ? subDate.getTime() > after.getTime() : true;
        const isBefore = beforeDate
          ? subDate.getTime() < before.getTime()
          : true;
        return conditionInclude && isAfter && isBefore && conditionStatus;
      }
    );
    const filteredResponses = beforePaginationResponses.slice(
      offset,
      offset + limit
    );
    // Prepare the response
    const filteredResponseData = {
      responses: filteredResponses,
      totalResponses: filteredResponses.length,
      pageCount:
        Math.floor(beforePaginationResponses.length / limit) +
        (beforePaginationResponses.length % limit ? 1 : 0),
    };

    res.json(filteredResponseData);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "An error occurred" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
