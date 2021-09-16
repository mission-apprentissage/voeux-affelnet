const { connectToMongo } = require("./common/mongodb");
const createUsers = require("./common/users");
const createEmails = require("./common/emails");
const createCfas = require("./common/cfas");
const createMailer = require("./common/mailer");

module.exports = async (options = {}) => {
  let mailer = options.mailer || createMailer();
  let users = options.users || (await createUsers());

  return {
    users,
    emails: options.emails || createEmails(mailer),
    cfas: options.cfas || createCfas(),
    db: options.db || (await connectToMongo()).db,
  };
};
