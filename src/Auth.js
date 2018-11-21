import auth0 from "auth0-js";

export default class Auth {
  auth0 = new auth0.WebAuth({
    domain: window.config.auth0Domain,
    clientID: window.config.clientID,
    redirectUri: window.config.callbackURL,
    responseType: window.config.extraParams.response_type,
    scope: window.config.extraParams.scope,
    state: window.config.extraParams.state,
    nonce: window.config.extraParams.nonce,
    _csrf: window.config.extraParams._csrf,
    audience: window.config.extraParams.audience
  });

  loginPasswordless(mobile, code, errorCB) {
    this.auth0.passwordlessVerify(
      {
        connection: "sms",
        phoneNumber: mobile,
        verificationCode: code
      },
      function(err, res) {
        if (err) {
          errorCB(err);
        }
      }
    );
  }

  loginPassword(realm, user, password, errorCB) {
    this.auth0.login(
      {
        username: user,
        password: password,
        realm: realm
      },
      function(err, res) {
        if (err) {
          errorCB(err);
        } else {
          console.log(res);
        }
      }
    );
  }

  loginEnterprise(email, connection, errorCB) {
    this.auth0.authorize(
      {
        login_hint: email,
        connection: connection
      },
      function(err, res) {
        if (err) {
          errorCB(err);
        } else {
          console.log(res);
        }
      }
    );
  }
}
