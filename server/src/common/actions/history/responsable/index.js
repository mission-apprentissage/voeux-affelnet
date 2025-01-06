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
const { saveAccountEmailUpdatedByAdmin } = require("./accountEmailUpdatedByAdmin");

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
  saveAccountEmailUpdatedByAdmin,
};
