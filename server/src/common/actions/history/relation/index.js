const { saveDelegationCancelledByAdmin } = require("./delegationCancelledByAdmin");
const { saveDelegationCancelledByResponsable } = require("./delegationCancelledByResponsable");
const { saveDelegationCreatedByAdmin } = require("./delegationCreatedByAdmin");
const { saveDelegationCreatedByResponsable } = require("./delegationCreatedByResponsable");
const { saveDelegationUpdatedByAdmin } = require("./delegationUpdatedByAdmin");
const { saveDelegationUpdatedByResponsable } = require("./delegationUpdatedByResponsable");

const { saveListAvailable } = require("./listAvailable");
const { saveListDownloadedByDelegue } = require("./listDownloadedByDelegue");
const { saveListDownloadedByResponsable } = require("./listDownloadedByResponsable");
const { saveUpdatedListAvailable } = require("./updatedListAvailable");
const { saveUpdatedListDownloadedByDelegue } = require("./updatedListDownloadedByDelegue");
const { saveUpdatedListDownloadedByResponsable } = require("./updatedListDownloadedByResponsable");

module.exports = {
  saveDelegationCancelledByAdmin,
  saveDelegationCancelledByResponsable,
  saveDelegationCreatedByAdmin,
  saveDelegationCreatedByResponsable,
  saveDelegationUpdatedByAdmin,
  saveDelegationUpdatedByResponsable,

  saveListAvailable,
  saveListDownloadedByDelegue,
  saveListDownloadedByResponsable,
  saveUpdatedListAvailable,
  saveUpdatedListDownloadedByDelegue,
  saveUpdatedListDownloadedByResponsable,
};
