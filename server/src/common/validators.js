const Joi = require("@hapi/joi");

const customJoi = Joi.extend((joi) => ({
  type: "arrayOf",
  base: joi.array(),
  // eslint-disable-next-line no-unused-vars
  coerce(value, helpers) {
    return { value: value.split ? value.split(",") : [value] };
  },
}));

function validate(obj, validators) {
  return Joi.object(validators).validateAsync(obj, { abortEarly: false });
}

module.exports = {
  arrayOf: () => customJoi.arrayOf().items(Joi.string()),
  password: () =>
    // https://owasp.org/www-community/password-special-characters
    Joi.string().regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[ !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~])[A-Za-z\d !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]{8,}$/
    ),
  validate,
};
