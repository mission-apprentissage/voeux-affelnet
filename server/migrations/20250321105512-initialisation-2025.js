const { USER_TYPE } = require("../src/common/constants/UserType");

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    // Suppression des candidatures de la campagne précédente.
    await db.collection("voeux").deleteMany({});

    // Suppression des relations de la campagne précédente.
    await db.collection("relations").deleteMany({});

    // Mise à jour des utilisateurs admin vers le nouveau model.
    await db.collection("users").updateMany({ type: { $exists: false } }, { $set: { type: USER_TYPE.ADMIN } });
    await db.collection("users").updateMany({}, { $unset: { isAdmin: "" } });

    // Suppression des emails envoyés à la campagne précédente.
    await db.collection("users").updateMany({}, { $set: { emails: [] } });

    // Suppression des entrées d'historique de la campagne précédente.
    await db.collection("users").updateMany({}, { $set: { histories: [] } });
    await db.collection("relations").updateMany({}, { $set: { histories: [] } });

    // Désactivation des délégations de la campagne précédente.
    await db.collection("users").updateMany(
      { type: USER_TYPE.DELEGUE, "relations.0": { $exists: true } },
      {
        $set: {
          "relations.$[].active": false,
        },
      }
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down() {},
};
