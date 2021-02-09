const express = require("express");
const router = express.Router();
const userService = require("../users/user.service");
const authorize = require("../_helpers/authorize");

// routes
router.get("/", authorize(["Auditor"]), getAll);

module.exports = router;

function getAll(req, res, next) {
  const pageNo = req.query.page === "All" ? -1 : req.query.page;
  const limit = 10;
  userService
    .getAll(pageNo, limit)
    .then(({ totalRecords, records }) => {
      const page = framePageObject({ pageNo, limit, totalRecords });
      return { records, page };
    })
    .then(({ records, page }) => {
      return res.json({ data: records, page });
    })
    .catch((err) => next(err));
}
const initialPage = {
  pageSize: 0,
  totalPages: 1,
  startIndex: 0,
  endIndex: 0,
  currentPage: 1,
  totalRecords: 0,
};
const framePageObject = ({ pageNo, limit, totalRecords }) => {
  if (pageNo === -1)
    return { ...initialPage, pageSize: totalRecords, totalRecords };
  const page = parseInt(pageNo);
  return {
    ...initialPage,
    totalRecords,
    pageSize: limit,
    totalPages: Math.ceil(totalRecords / limit),
    startIndex: parseInt(limit) * (page - 1) + 1,
    endIndex: page * limit > totalRecords ?  totalRecords : page * limit,
    currentPage: page
  };
};
