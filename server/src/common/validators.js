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
  arrayOf: (itemSchema = Joi.string()) => customJoi.arrayOf().items(itemSchema),
  password: () =>
    // https://owasp.org/www-community/password-special-characters
    Joi.string().regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[ !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~])[A-Za-z\d !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]{8,}$/
    ),
  validate,
};
