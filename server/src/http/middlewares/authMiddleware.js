const config = require("../../config");
const passport = require("passport");
const Boom = require("boom");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const { Strategy: LocalStrategy } = require("passport-local");
const sha512Utils = require("../../common/utils/passwordUtils");
const { getUser } = require("../../common/actions/getUser");

const UAI_LOWERCASE_PATTERN = /([0-9]{7}[a-z]{1})/;

module.exports = () => {
  function checkUsernameAndPassword() {
    passport.use(
      new LocalStrategy(
        {
          usernameField: "username",
          passwordField: "password",
          passReqToCallback: true,
        },
        async (req, username, password, done) => {
          const fixed = UAI_LOWERCASE_PATTERN.test(username) ? username.toUpperCase() : username;
          return getUser(fixed?.replace(/\s/g, "")?.trim())
            .then((user) => {
              if (!user || !user.password || !sha512Utils.compare(password, user.password)) {
                req.errorMessage = `Echec de l'authentification pour l'utilisateur ${username}`;
                done(null, false);
              } else {
                done(null, user);
              }
            })
            .catch((err) => done(err));
        }
      )
    );

    return passport.authenticate("local", { session: false, failWithError: true });
  }

  function jwtStrategy(strategyName, jwtStrategyOptions) {
    passport.use(
      strategyName,
      new JwtStrategy({ ...jwtStrategyOptions, passReqToCallback: true }, (req, jwt_payload, done) => {
        return getUser(jwt_payload.sub)
          .then((user) => {
            if (!user) {
              req.errorMessage = `Echec de l'authentification via token pour l'utilisateur ${jwt_payload.sub}`;
              done(null, false);
            } else {
              done(null, user);
            }
          })
          .catch((err) => done(err));
      })
    );

    return passport.authenticate(strategyName, { session: false, failWithError: true });
  }

  return {
    checkUsernameAndPassword,
    checkApiToken: () => {
      return jwtStrategy("passeport-jwt-api", {
        secretOrKey: config.auth.apiToken.jwtSecret,
        jwtFromRequest: ExtractJwt.fromExtractors([
          ExtractJwt.fromUrlQueryParameter("token"),
          ExtractJwt.fromAuthHeaderAsBearerToken(),
        ]),
      });
    },
    checkActionToken: () => {
      return jwtStrategy("passeport-jwt-action", {
        secretOrKey: config.auth.actionToken.jwtSecret,
        ignoreExpiration: true, // Allow expired token to work.
        jwtFromRequest: ExtractJwt.fromExtractors([
          ExtractJwt.fromUrlQueryParameter("token"),
          ExtractJwt.fromBodyField("actionToken"),
        ]),
      });
    },
    checkResetPasswordToken: () => {
      return jwtStrategy("passeport-jwt-password", {
        secretOrKey: config.auth.resetPasswordToken.jwtSecret,
        jwtFromRequest: ExtractJwt.fromBodyField("resetPasswordToken"),
      });
    },
    checkIsAdmin: () => {
      return (req, res, next) => {
        if (!req.user.isAdmin) {
          next(Boom.forbidden());
        } else {
          next();
        }
      };
    },
    ensureIs: (type) => {
      return (req, res, next) => {
        if (req.user.type !== type) {
          next(Boom.forbidden());
        } else {
          next();
        }
      };
    },
    ensureIsOneOf: (types) => {
      return (req, res, next) => {
        if (!types.includes(req.user.type)) {
          next(Boom.forbidden());
        } else {
          next();
        }
      };
    },
  };
};
