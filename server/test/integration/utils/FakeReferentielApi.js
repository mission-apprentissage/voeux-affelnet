class FakeReferentielApi {
  constructor(responses) {
    this.responses = responses;
  }

  getOrganisme(siret) {
    return this.responses[siret];
  }
}

module.exports = FakeReferentielApi;
