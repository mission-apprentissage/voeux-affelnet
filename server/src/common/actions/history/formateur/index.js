const { saveAccountActivated } = require("./accountActivated");
const { saveAccountActivationEmailAutomaticResent } = require("./accountActivationEmailAutomaticResent");
const { saveAccountActivationEmailAutomaticSent } = require("./accountActivationEmailAutomaticSent");
const { saveAccountActivationEmailManualResent } = require("./accountActivationEmailManualResent");
const { saveAccountConfirmationEmailAutomaticResent } = require("./accountConfirmationEmailAutomaticResent");
const { saveAccountConfirmationEmailAutomaticSent } = require("./accountConfirmationEmailAutomaticSent");
const { saveAccountConfirmationEmailManualResent } = require("./accountConfirmationEmailManualResent");
const { saveAccountConfirmed } = require("./accountConfirmed");
const { saveAccountEmailUpdatedByAccount } = require("./accountEmailUpdatedByAccount");
const { saveAccountEmailUpdatedByAdmin } = require("./accountEmailUpdatedByAdmin");
const { saveDelegationCancelledByAdmin } = require("./delegationCancelledByAdmin");
const { saveDelegationCancelledByResponsable } = require("./delegationCancelledByResponsable");
const { saveDelegationCreatedByAdmin } = require("./delegationCreatedByAdmin");
const { saveDelegationCreatedByResponsable } = require("./delegationCreatedByResponsable");
const { saveDelegationUpdatedByAdmin } = require("./delegationUpdatedByAdmin");
const { saveDelegationUpdatedByResponsable } = require("./delegationUpdatedByResponsable");
const { saveListAvailableEmailAutomaticResent } = require("./listAvailableEmailAutomaticResent");
const { saveListAvailableEmailAutomaticSent } = require("./listAvailableEmailAutomaticSent");
const { saveListAvailableEmailManualResent } = require("./listAvailableEmailManualResent");
const { saveListAvailable } = require("./listAvailable");
const { saveListDownloadedByFormateur } = require("./listDownloadedByFormateur");
const { saveListDownloadedByResponsable } = require("./listDownloadedByResponsable");
const { saveUpdatedListAvailableEmailAutomaticResent } = require("./updatedListAvailableEmailAutomaticResent");
const { saveUpdatedListAvailableEmailAutomaticSent } = require("./updatedListAvailableEmailAutomaticSent");
const { saveUpdatedListAvailableEmailManualResent } = require("./updatedListAvailableEmailManualResent");
const { saveUpdatedListAvailable } = require("./updatedListAvailable");
const { saveUpdatedListDownloadedByFormateur } = require("./updatedListDownloadedByFormateur");
const { saveUpdatedListDownloadedByResponsable } = require("./updatedListDownloadedByResponsable");

module.exports = {
  saveAccountActivated,
  saveAccountActivationEmailAutomaticResent,
  saveAccountActivationEmailAutomaticSent,
  saveAccountActivationEmailManualResent,
  saveAccountConfirmationEmailAutomaticResent,
  saveAccountConfirmationEmailAutomaticSent,
  saveAccountConfirmationEmailManualResent,
  saveAccountConfirmed,
  saveAccountEmailUpdatedByAccount,
  saveAccountEmailUpdatedByAdmin,
  saveDelegationCancelledByAdmin,
  saveDelegationCancelledByResponsable,
  saveDelegationCreatedByAdmin,
  saveDelegationCreatedByResponsable,
  saveDelegationUpdatedByAdmin,
  saveDelegationUpdatedByResponsable,
  saveListAvailableEmailAutomaticResent,
  saveListAvailableEmailAutomaticSent,
  saveListAvailableEmailManualResent,
  saveListAvailable,
  saveListDownloadedByFormateur,
  saveListDownloadedByResponsable,
  saveUpdatedListAvailableEmailAutomaticResent,
  saveUpdatedListAvailableEmailAutomaticSent,
  saveUpdatedListAvailableEmailManualResent,
  saveUpdatedListAvailable,
  saveUpdatedListDownloadedByFormateur,
  saveUpdatedListDownloadedByResponsable,
};
