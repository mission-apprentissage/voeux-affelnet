const { saveAccountActivated } = require("./accountActivated");
const { saveAccountActivationEmailAutomaticResent } = require("./accountActivationEmailAutomaticResent");
const { saveAccountActivationEmailAutomaticSent } = require("./accountActivationEmailAutomaticSent");
const { saveAccountActivationEmailManualResent } = require("./accountActivationEmailManualResent");
const { saveAccountActivationEmailManualSent } = require("./accountActivationEmailManualSent");

const { saveAccountConfirmationEmailAutomaticResent } = require("./accountConfirmationEmailAutomaticResent");
const { saveAccountConfirmationEmailAutomaticSent } = require("./accountConfirmationEmailAutomaticSent");
const { saveAccountConfirmationEmailManualResent } = require("./accountConfirmationEmailManualResent");
const { saveAccountConfirmationEmailManualSent } = require("./accountConfirmationEmailManualSent");

const { saveAccountConfirmed } = require("./accountConfirmed");
const { saveAccountEmailUpdatedByAccount } = require("./accountEmailUpdatedByAccount");

const { saveListAvailableEmailAutomaticResent } = require("./listAvailableEmailAutomaticResent");
const { saveListAvailableEmailAutomaticSent } = require("./listAvailableEmailAutomaticSent");
const { saveListAvailableEmailManualResent } = require("./listAvailableEmailManualResent");
const { saveListAvailableEmailManualSent } = require("./listAvailableEmailManualSent");

const { saveUpdatedListAvailableEmailAutomaticResent } = require("./updatedListAvailableEmailAutomaticResent");
const { saveUpdatedListAvailableEmailAutomaticSent } = require("./updatedListAvailableEmailAutomaticSent");
const { saveUpdatedListAvailableEmailManualResent } = require("./updatedListAvailableEmailManualResent");
const { saveUpdatedListAvailableEmailManualSent } = require("./updatedListAvailableEmailManualSent");

module.exports = {
  saveAccountActivated,
  saveAccountActivationEmailAutomaticResent,
  saveAccountActivationEmailAutomaticSent,
  saveAccountActivationEmailManualResent,
  saveAccountActivationEmailManualSent,

  saveAccountConfirmationEmailAutomaticResent,
  saveAccountConfirmationEmailAutomaticSent,
  saveAccountConfirmationEmailManualResent,
  saveAccountConfirmationEmailManualSent,

  saveAccountConfirmed,
  saveAccountEmailUpdatedByAccount,

  saveListAvailableEmailAutomaticResent,
  saveListAvailableEmailAutomaticSent,
  saveListAvailableEmailManualResent,
  saveListAvailableEmailManualSent,

  saveUpdatedListAvailableEmailAutomaticResent,
  saveUpdatedListAvailableEmailAutomaticSent,
  saveUpdatedListAvailableEmailManualResent,
  saveUpdatedListAvailableEmailManualSent,
};
