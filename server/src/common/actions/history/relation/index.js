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

const {
  saveListAvailableEmailAutomaticResentToResponsable,
} = require("../relation/listAvailableEmailAutomaticResentToResponsable");
const {
  saveListAvailableEmailAutomaticSentToResponsable,
} = require("../relation/listAvailableEmailAutomaticSentToResponsable");
const {
  saveListAvailableEmailManualResentToResponsable,
} = require("../relation/listAvailableEmailManualResentToResponsable");
const {
  saveListAvailableEmailManualSentToResponsable,
} = require("../relation/listAvailableEmailManualSentToResponsable");

const {
  saveUpdatedListAvailableEmailAutomaticResentToResponsable,
} = require("../relation/updatedListAvailableEmailAutomaticResentToResponsable");
const {
  saveUpdatedListAvailableEmailAutomaticSentToResponsable,
} = require("../relation/updatedListAvailableEmailAutomaticSentToResponsable");
const {
  saveUpdatedListAvailableEmailManualResentToResponsable,
} = require("../relation/updatedListAvailableEmailManualResentToResponsable");
const {
  saveUpdatedListAvailableEmailManualSentToResponsable,
} = require("../relation/updatedListAvailableEmailManualSentToResponsable");

const { saveListAvailableEmailAutomaticResentToDelegue } = require("./listAvailableEmailAutomaticResentToDelegue");
const { saveListAvailableEmailAutomaticSentToDelegue } = require("./listAvailableEmailAutomaticSentToDelegue");
const { saveListAvailableEmailManualResentToDelegue } = require("./listAvailableEmailManualResentToDelegue");
const { saveListAvailableEmailManualSentToDelegue } = require("./listAvailableEmailManualSentToDelegue");

const {
  saveUpdatedListAvailableEmailAutomaticResentToDelegue,
} = require("./updatedListAvailableEmailAutomaticResentToDelegue");
const {
  saveUpdatedListAvailableEmailAutomaticSentToDelegue,
} = require("./updatedListAvailableEmailAutomaticSentToDelegue");
const {
  saveUpdatedListAvailableEmailManualResentToDelegue,
} = require("./updatedListAvailableEmailManualResentToDelegue");
const { saveUpdatedListAvailableEmailManualSentToDelegue } = require("./updatedListAvailableEmailManualSentToDelegue");

module.exports = {
  saveDelegationCancelledByAdmin,
  saveDelegationCancelledByResponsable,
  saveDelegationCreatedByAdmin,
  saveDelegationCreatedByResponsable,
  saveDelegationUpdatedByAdmin,
  saveDelegationUpdatedByResponsable,

  saveListAvailable,
  saveUpdatedListAvailable,

  saveListAvailableEmailAutomaticResentToResponsable,
  saveListAvailableEmailAutomaticSentToResponsable,
  saveListAvailableEmailManualResentToResponsable,
  saveListAvailableEmailManualSentToResponsable,
  saveListDownloadedByDelegue,

  saveUpdatedListAvailableEmailAutomaticResentToResponsable,
  saveUpdatedListAvailableEmailAutomaticSentToResponsable,
  saveUpdatedListAvailableEmailManualResentToResponsable,
  saveUpdatedListAvailableEmailManualSentToResponsable,
  saveListDownloadedByResponsable,

  saveListAvailableEmailAutomaticResentToDelegue,
  saveListAvailableEmailAutomaticSentToDelegue,
  saveListAvailableEmailManualResentToDelegue,
  saveListAvailableEmailManualSentToDelegue,
  saveUpdatedListDownloadedByDelegue,

  saveUpdatedListAvailableEmailAutomaticResentToDelegue,
  saveUpdatedListAvailableEmailAutomaticSentToDelegue,
  saveUpdatedListAvailableEmailManualResentToDelegue,
  saveUpdatedListAvailableEmailManualSentToDelegue,
  saveUpdatedListDownloadedByResponsable,
};
