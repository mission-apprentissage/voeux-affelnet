const { User } = require("./model");
const sha512Utils = require("./utils/passwordUtils");

module.exports = async () => {
  return {
    getUser(username) {
      return User.findOne({ username });
    },
    async activate(username, password, options = {}) {
      let user = await User.findOneAndUpdate(
        { username },
        {
          $set: {
            statut: "activé",
            password: options.hash || sha512Utils.hash(password),
          },
        },
        { new: true }
      ).lean();

      if (!user) {
        throw new Error(`Utilisateur ${username} inconnu`);
      }

      return user;
    },
    async removeUser(username) {
      let user = await User.findOne({ username });
      if (!user) {
        throw new Error(`Unable to find user ${username}`);
      }

      await user.deleteOne({ username });
    },
    async changePassword(username, newPassword) {
      let user = await User.findOne({ username });
      if (!user) {
        throw new Error(`Unable to find user ${username}`);
      }

      user.password = sha512Utils.hash(newPassword);
      await user.save();

      return user.toObject();
    },
    async unsubscribe(id) {
      await User.updateOne(
        { $or: [{ username: id }, { "emails.token": id }] },
        {
          $set: {
            unsubscribe: true,
          },
        },
        { runValidators: true }
      );
    },
  };
};
