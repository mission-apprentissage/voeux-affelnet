const config = require("../../config");
const passport = require("passport");
const Boom = require("boom");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const { Strategy: LocalStrategy } = require("passport-local");
const sha512Utils = require("../../common/utils/passwordUtils");
const { getUser } = require("../../common/actions/getUser");
const { isAdmin, isAcademie } = require("../../common/utils/aclUtils");
const { USER_STATUS } = require("../../common/constants/UserStatus");

const UAI_LOWERCASE_PATTERN = /([0-9]{7}[a-z]{1})/;

module.exports = () => {
  const checkUsernameAndPassword = () => {
    passport.use(
      new LocalStrategy(
        {
          usernameField: "username",
          passwordField: "password",
          passReqToCallback: true,
        },
        async (req, username, password, done) => {
          // return getUser(username?.replace(/\s/g, "")?.trim()).then((user) => done(null, user));
          const fixed = UAI_LOWERCASE_PATTERN.test(username) ? username.toUpperCase() : username;
          return getUser(fixed?.trim())
            .then((user) => {
              if (!user || !user.password || !sha512Utils.compare(password, user.password)) {
                req.errorMessage = `Echec de l'authentification pour l'utilisateur ${fixed}`;
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
  };

  const jwtStrategy = (strategyName, jwtStrategyOptions) => {
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
  };

  return {
    checkUsernameAndPassword,
    checkIsActive: () => {
      return (req, res, next) => {
        console.log("checkIsActive", req.user);
        if (req.user.statut !== USER_STATUS.ACTIVE) {
          req.errorMessage = `L'utilisateur ${req.user.username} n'a pas activé son compte ou a été désactivé`;
          next(Boom.forbidden(req.errorMessage));
        } else {
          next();
        }
      };
    },
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
        if (!isAdmin(req.user)) {
          next(Boom.forbidden());
        } else {
          next();
        }
      };
    },
    checkIsAcademie: () => {
      return (req, res, next) => {
        if (!isAcademie(req.user)) {
          next(Boom.forbidden());
        } else {
          next();
        }
      };
    },
    checkIsAdminOrAcademie: () => {
      return (req, res, next) => {
        if (!isAdmin(req.user) && !isAcademie(req.user)) {
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
