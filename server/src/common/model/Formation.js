const { Schema, model } = require("mongoose");

const schema = new Schema({
  id: {
    type: String,
  },
  cle_ministere_educatif: {
    type: String,
  },
  libelle_type_etablissement: {
    type: String,
  },
  libelle_etablissement: {
    type: String,
  },
  adresse: {
    type: String,
  },
  cp: {
    type: String,
  },
  commune: {
    type: String,
  },
  academie: {
    type: String,
  },
  ministere: {
    type: String,
  },
  public_prive: {
    type: String,
  },
  type_contrat: {
    type: String,
  },
  code_type_etablissement: {
    type: String,
  },
  code_nature: {
    type: String,
  },

  code_district: {
    type: String,
  },
  code_bassin: {
    type: String,
  },
  cio: {
    type: String,
  },

  internat: {
    type: String,
  },

  reseau_ambition_reussite: {
    type: String,
  },

  mnemonique: {
    type: String,
  },

  code_specialite: {
    type: String,
  },
  libelle_ban: {
    type: String,
  },
  code_mef: {
    type: String,
  },
  code_voie: {
    type: String,
  },
  libelle_voie: {
    type: String,
  },
  saisie_possible_3eme: {
    type: String,
  },
  saisie_resrevee_segpa: {
    type: String,
  },
  saisie_possible_2de: {
    type: String,
  },
  visible_portail: {
    type: String,
  },
  libelle_formation: {
    type: String,
  },
  url_onisep_formation: {
    type: String,
  },
  // libelle_etablissement: { // Duplicated column name in affelnet file
  //   type: String,
  // },
  url_onisep_etablissement: {
    type: String,
  },
  libelle_ville: {
    type: String,
  },
  campus_metier: {
    type: String,
  },
  modalites_particulieres: {
    type: String,
  },
  coordonnees_gps_latitude: {
    type: String,
  },
  coordonnees_gps_longitude: {
    type: String,
  },

  uai: {
    type: String,
  },

  siret_uai_gestionnaire: {
    type: String,
  },

  uai_formateur: {
    type: String,
  },

  uai_responsable: {
    type: String,
  },

  integree_catalogue: {
    type: String,
  },

  capacite: {
    type: String,
  },
});

const Formation = model("Formation", schema, "formations");

module.exports = Formation;
