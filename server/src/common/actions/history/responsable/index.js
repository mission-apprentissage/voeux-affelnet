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
};
