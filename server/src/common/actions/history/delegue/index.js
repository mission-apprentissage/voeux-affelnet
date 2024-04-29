const { saveAccountActivated } = require("./accountActivated");
const { saveAccountActivationEmailAutomaticResent } = require("./accountActivationEmailAutomaticResent");
const { saveAccountActivationEmailAutomaticSent } = require("./accountActivationEmailAutomaticSent");
const { saveAccountActivationEmailManualResent } = require("./accountActivationEmailManualResent");
const { saveAccountConfirmationEmailAutomaticResent } = require("./accountConfirmationEmailAutomaticResent");
const { saveAccountConfirmationEmailAutomaticSent } = require("./accountConfirmationEmailAutomaticSent");
const { saveAccountConfirmationEmailManualResent } = require("./accountConfirmationEmailManualResent");
const { saveAccountConfirmed } = require("./accountConfirmed");
const { saveAccountEmailUpdatedByAccount } = require("./accountEmailUpdatedByAccount");
const { saveListAvailableEmailAutomaticResent } = require("./listAvailableEmailAutomaticResent");
const { saveListAvailableEmailAutomaticSent } = require("./listAvailableEmailAutomaticSent");
const { saveListAvailableEmailManualResent } = require("./listAvailableEmailManualResent");

const { saveUpdatedListAvailableEmailAutomaticResent } = require("./updatedListAvailableEmailAutomaticResent");
const { saveUpdatedListAvailableEmailAutomaticSent } = require("./updatedListAvailableEmailAutomaticSent");
const { saveUpdatedListAvailableEmailManualResent } = require("./updatedListAvailableEmailManualResent");

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

  saveListAvailableEmailAutomaticResent,
  saveListAvailableEmailAutomaticSent,
  saveListAvailableEmailManualResent,

  saveUpdatedListAvailableEmailAutomaticResent,
  saveUpdatedListAvailableEmailAutomaticSent,
  saveUpdatedListAvailableEmailManualResent,
};
