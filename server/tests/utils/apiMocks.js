const uuid = require("uuid");
const nock = require("nock"); // eslint-disable-line node/no-unpublished-require
const { merge } = require("lodash");
const faker = require("@faker-js/faker/locale/fr").faker;
const CatalogueApi = require("../../src/common/api/CatalogueApi.js");
const ReferentielApi = require("../../src/common/api/ReferentielApi.js");
const { createUAI } = require("../../src/common/utils/validationUtils.js");
const TableauDeBordApi = require("../../src/common/api/TableauDeBordApi.js");

function createNock(baseUrl) {
  const client = nock(baseUrl);
  return client.persist();
}

module.exports = {
  mockReferentielApi(callback) {
    const client = createNock(ReferentielApi.baseApiUrl);

    function createOrganisme(custom = {}) {
      const uai = createUAI(faker.helpers.replaceSymbols("075####"));

      return merge(
        {},
        {
          siret: faker.helpers.replaceSymbols("#########00015"),
          _meta: {
            anomalies: [],
            date_import: "2021-12-17T18:17:44.880Z",
            uai_probable: uai,
            nouveau: false,
          },
          certifications: [
            {
              type: "rncp",
              code: "RNCP1120",
              label: "Logistique",
              sources: ["catalogue"],
            },
          ],
          contacts: [
            {
              email: faker.internet.email(),
              confirmé: false,
              sources: ["catalogue"],
            },
          ],
          diplomes: [
            {
              type: "cfd",
              code: "01022105",
              niveau: "010",
              label: "MC5",
              sources: ["catalogue"],
            },
          ],
          lieux_de_formation: [
            {
              code: "5.692799_48.351221",
              adresse: {
                label: "Paris",
                code_postal: "75001",
                code_insee: "75101",
                localite: "Paris",
                geojson: {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [5.692799, 48.351221],
                  },
                  properties: {
                    score: 1,
                    source: "geo-adresse-api",
                  },
                },
                departement: {
                  code: "75",
                  nom: "Paris",
                },
                region: {
                  code: "01",
                  nom: "Paris",
                },
                academie: {
                  code: "01",
                  nom: "Paris",
                },
              },
              sources: ["catalogue"],
              uai: createUAI(faker.helpers.replaceSymbols("075####")),
            },
          ],
          referentiels: ["catalogue-etablissements", "sifa-ramsese", "datagouv"],
          relations: [],
          reseaux: [],
          uai,
          uai_potentiels: [
            {
              uai: createUAI(faker.helpers.replaceSymbols("075####")),
              sources: ["catalogue-etablissements", "opcoep", "sifa-ramsese", "deca"],
            },
          ],
          etat_administratif: "actif",
          forme_juridique: {
            code: "7331",
            label: "Établissement public local d'enseignement",
          },
          raison_sociale: "LYCEE POLYVALENT",
          siege_social: false,
          enseigne: "GRETA LORRAINE SUD",
          adresse: {
            academie: {
              code: "01",
              nom: "Paris",
            },
            code_insee: "75101",
            code_postal: "75001",
            departement: {
              code: "01",
              nom: "Paris",
            },
            geojson: {
              geometry: {
                coordinates: [6.583151, 48.022475],
                type: "Point",
              },
              properties: {
                score: 0.9586099999999999,
                source: "geo-adresse-api",
              },
              type: "Feature",
            },
            label: "36 rue des lilas",
            localite: "Paris",
            region: {
              code: "01",
              nom: "Paris",
            },
          },
          nature: "responsable_formateur",
          numero_declaration_activite: faker.helpers.replaceSymbols("###########"),
          qualiopi: true,
        },
        custom
      );
    }

    callback(client, {
      organismes(array = [{}]) {
        return {
          organismes: array.map((custom) => {
            return createOrganisme(custom);
          }),
          pagination: {
            page: 1,
            resultats_par_page: 1,
            nombre_de_page: 1,
            total: 1,
          },
        };
      },
      organisme(custom = {}) {
        return createOrganisme(custom);
      },
    });
  },
  mockCatalogueApi(callback) {
    const client = createNock(CatalogueApi.baseApiUrl);
    callback(client, {
      formations(array = [{}]) {
        return {
          formations: array.map((custom) => {
            return merge(
              {},
              {
                _id: "5fc6166c712d48a9881333ac",
                etablissement_gestionnaire_id: "5e8df8a420ff3b2161267c58",
                etablissement_gestionnaire_enseigne: null,
                etablissement_gestionnaire_uai: createUAI(faker.helpers.replaceSymbols("075####")),
                etablissement_gestionnaire_type: "CFA",
                etablissement_gestionnaire_conventionne: "OUI",
                etablissement_gestionnaire_declare_prefecture: "OUI",
                etablissement_gestionnaire_datadock: "datadocké",
                etablissement_gestionnaire_published: true,
                etablissement_gestionnaire_catalogue_published: true,
                etablissement_gestionnaire_adresse: "31 rue des lilas",
                etablissement_gestionnaire_code_postal: "75019",
                etablissement_gestionnaire_code_commune_insee: "75000",
                etablissement_gestionnaire_localite: "Paris",
                etablissement_gestionnaire_complement_adresse: "LYCEE",
                etablissement_gestionnaire_cedex: null,
                etablissement_gestionnaire_courriel: null,
                etablissement_gestionnaire_entreprise_raison_sociale: "Centre de formation",
                rncp_etablissement_gestionnaire_habilite: false,
                etablissement_gestionnaire_region: "Paris",
                etablissement_gestionnaire_num_departement: "75",
                etablissement_gestionnaire_nom_departement: "Paris",
                etablissement_gestionnaire_nom_academie: "Paris",
                etablissement_gestionnaire_num_academie: "01",
                etablissement_gestionnaire_siren: faker.helpers.replaceSymbols("#########"),
                etablissement_gestionnaire_siret: faker.helpers.replaceSymbols("#########00015"),
                etablissement_formateur_id: "5e8df8a420ff3b2161267c58",
                etablissement_formateur_enseigne: null,
                etablissement_formateur_siren: faker.helpers.replaceSymbols("#########"),
                etablissement_formateur_siret: faker.helpers.replaceSymbols("#########00015"),
                etablissement_formateur_uai: createUAI(faker.helpers.replaceSymbols("075####")),
                etablissement_formateur_type: "CFA",
                etablissement_formateur_conventionne: "OUI",
                etablissement_formateur_declare_prefecture: "OUI",
                etablissement_formateur_datadock: "datadocké",
                etablissement_formateur_published: true,
                etablissement_formateur_catalogue_published: true,
                etablissement_formateur_adresse: "31 rue des lilas",
                etablissement_formateur_code_postal: "75019",
                etablissement_formateur_code_commune_insee: "75000",
                etablissement_formateur_localite: "paris",
                etablissement_formateur_complement_adresse: "LYCEE",
                etablissement_formateur_cedex: null,
                etablissement_formateur_entreprise_raison_sociale: "Centre de formation",
                rncp_etablissement_formateur_habilite: false,
                etablissement_formateur_region: "Paris",
                etablissement_formateur_num_departement: "75",
                etablissement_formateur_nom_departement: "Paris",
                etablissement_formateur_nom_academie: "Paris",
                etablissement_formateur_num_academie: "01",
                etablissement_reference: "gestionnaire",
                etablissement_reference_type: "CFA",
                etablissement_reference_conventionne: "OUI",
                etablissement_reference_declare_prefecture: "OUI",
                etablissement_reference_datadock: "datadocké",
                etablissement_reference_published: true,
                etablissement_reference_catalogue_published: true,
                cfd: "40030001",
                cfd_specialite: null,
                mef_10_code: null,
                nom_academie: "Paris",
                num_academie: "01",
                code_postal: "75019",
                code_commune_insee: "75000",
                num_departement: "75",
                nom_departement: "Paris",
                region: "Paris",
                localite: "Paris",
                uai_formation: null,
                nom: null,
                intitule_long: "GESTION-ADMINISTRATION (BAC PRO)",
                intitule_court: "GESTION-ADMINISTRATION",
                diplome: "BAC PROFESSIONNEL",
                niveau: "4 (Bac...)",
                onisep_url: "http://www.onisep.fr/http/redirection/formation/identifiant/28226",
                rncp_code: "RNCP34606",
                rncp_intitule: "Assistance gestion des organisations et de leurs activités",
                rncp_eligible_apprentissage: true,
                rncp_details: {
                  date_fin_validite_enregistrement: "8/31/25",
                  active_inactive: "ACTIVE",
                  etat_fiche_rncp: "Publiée",
                  niveau_europe: "niveau4",
                  code_type_certif: "BAC PRO",
                  type_certif: "Baccalauréat professionnel",
                  ancienne_fiche: ["RNCP14695"],
                  nouvelle_fiche: [],
                  demande: 0,
                  certificateurs: [],
                  nsf_code: "324",
                  nsf_libelle: "Secrétariat, bureautique",
                  romes: [
                    {
                      etat_fiche: "",
                      rome: "D1401",
                      libelle: "Assistanat commercial",
                    },
                  ],
                  blocs_competences: [
                    {
                      numero_bloc: "RNCP34606BC01",
                      intitule: "Organiser et suivre l'activité de production (de biens ou de services)",
                    },
                  ],
                  voix_acces: [
                    {
                      code_libelle: "CANDIDATURE",
                      intitule: "Par candidature individuelle",
                    },
                  ],
                },
                rome_codes: ["D1401", "M1501", "M1607", "M1203"],
                periode: '["2020-09", "2021-09"]',
                capacite: null,
                duree: null,
                annee: null,
                email: faker.internet.email(),
                parcoursup_reference: false,
                parcoursup_a_charger: true,
                affelnet_reference: false,
                affelnet_a_charger: false,
                source: "WS RCO",
                commentaires: null,
                opcos: [
                  "OPCO Commerce",
                  "OPCO Mobilité",
                  "OPCO Cohésion sociale",
                  "OCAPIAT",
                  "OPCO entreprises et salariés des services à forte intensité de main-d'œuvre",
                  "OPCO 2i",
                  "OPCO entreprises de proximité",
                ],
                info_opcos: 1,
                info_opcos_intitule: "Trouvés",
                published: false,
                draft: false,
                last_update_who: null,
                to_verified: false,
                update_error: null,
                lieu_formation_adresse: "31 rue des lilas",
                lieu_formation_siret: null,
                id_rco_formation: "01_GE107880|01_GE339324|01_GE520062|76930",
                lieu_formation_geo_coordonnees: "48.879706,2.396444",
                geo_coordonnees_etablissement_gestionnaire: "48.879706,2.396444",
                geo_coordonnees_etablissement_formateur: "48.879706,2.396444",
                idea_geo_coordonnees_etablissement: "48.879706,2.396444",
                created_at: "2020-12-01T10:09:48.309Z",
                last_update_at: "2021-01-21T08:24:21.784Z",
                parcoursup_statut: "hors périmètre",
                affelnet_statut: "hors périmètre",
                tags: ["2020", "2021"],
                affelnet_error: null,
                parcoursup_error: null,
                id: "5fc6166c712d48a9881333ac",
              },
              custom
            );
          }),
          pagination: {
            page: 1,
            resultats_par_page: 1,
            nombre_de_page: 1,
            total: 1,
          },
        };
      },
    });
  },
  mockTableauDeBordApi(callback) {
    const client = createNock(TableauDeBordApi.baseApiUrl);
    callback(client, {
      login(custom = {}) {
        return merge(
          {},
          {
            id: "12345",
          },
          custom
        );
      },
      dossiers(array = [{}]) {
        return array.map((custom) => {
          return merge(
            {},
            {
              etablissement_nom_academie: null,
              ine_apprenant: "",
              etablissement_reseaux: null,
              etablissement_formateur_code_commune_insee: null,
              code_commune_insee_apprenant: null,
              niveau_formation_libelle: "3 (CAP...)",
              annee_formation: 1,
              contrat_date_fin: "2022-12-31T00:00:00Z",
              tel_apprenant: faker.phone.phoneNumber("06########"),
              prenom_apprenant: faker.name.firstName(),
              etablissement_num_academie: null,
              email_contact: faker.internet.email(),
              contrat_date_rupture: null,
              etablissement_localite: null,
              id_erp_apprenant: "123",
              etablissement_geo_coordonnees: null,
              siret_etablissement_valid: true,
              etablissement_num_departement: "77",
              periode_formation: [2022, 2022],
              etablissement_formateur_geo_coordonnees: null,
              nom_etablissement: faker.company.companyName(),
              etablissement_formateur_siret: null,
              libelle_court_formation: null,
              erps: null,
              date_de_naissance_apprenant: "2000-04-14T00:00:00Z",
              history_cleaned_date: null,
              niveau_formation: "3",
              siret_etablissement: faker.helpers.replaceSymbols("#########00015"),
              updated_at: "2022-09-01T18:09:43.023Z",
              etablissement_num_region: "11",
              formation_rncp: "RNCP8812",
              match_formation_mnaCatalog_cfd_siret: null,
              etablissement_adresse: null,
              historique_statut_apprenant: [
                {
                  valeur_statut: 3,
                  date_statut: "2022-03-14T00:00:00Z",
                  date_reception: "2022-08-01T20:33:23.15Z",
                },
              ],
              forced_annee_scolaire: null,
              source: "scform",
              etablissement_nom_departement: "Seine-et-Marne",
              etablissement_gestionnaire_siret: null,
              _id: uuid.v4(),
              formation_cfd: faker.helpers.replaceSymbols("4#######"),
              etablissement_code_postal: null,
              created_at: "2022-07-15T18:20:54.977Z",
              uai_etablissement: faker.helpers.replaceSymbols("075####"),
              nom_apprenant: faker.name.lastName(),
              annee_scolaire: "2022-2022",
              etablissement_nom_region: "Île-de-France",
              contrat_date_debut: "2022-03-18T00:00:00Z",
              libelle_long_formation: "EMPLOYE(E) COMMERCIAL(E) EN MAGASIN (TP)",
            },
            custom
          );
        });
      },
    });
  },
};
