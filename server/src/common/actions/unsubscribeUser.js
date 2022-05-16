const { User } = require("../model");

async function unsubscribeUser(id) {
  await User.updateOne(
    { $or: [{ username: id }, { "emails.token": id }] },
    {
      $set: {
        unsubscribe: true,
      },
    },
    { runValidators: true }
  );
}

module.exports = { unsubscribeUser };
