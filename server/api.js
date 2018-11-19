const express = require("express");
const bodyParser = require("body-parser");
const request = require("request-promise-native");

const app = express();
const port = process.env.PORT || 5000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const domain = "picklerick.au.auth0.com";

const AuthenticationClient = require("auth0").AuthenticationClient;
const auth0 = new AuthenticationClient({
  domain: domain,
  clientId: "FKMA3bQarN9HoxQaCaEixwd4WPBzFKHZ",
  clientSecret:
    "zgXMuMHbGfmg8QzLSP8wBDCMWjX_ULGH9jHJ4rHCzNWI7nnFbr84Lc5Qyors9rNa"
});

let mgmtAccessToken = "NOT_SET";

// updateMgmtAccessToken calls the Auth0 authentication API
// to retrieve a new Management API access token.
// It should be called periodically to prevent token expiry errors.
const updateMgmtAccessToken = () => {
  auth0.clientCredentialsGrant(
    {
      audience: "https://picklerick.au.auth0.com/api/v2/",
      scope: "read:users"
    },
    function(err, response) {
      if (err) {
        console.log(err, response);
      }
      mgmtAccessToken = response.access_token;
    }
  );
};

// Get the Management API Access token for the first time.
updateMgmtAccessToken();

// Update the Management API Access token every 5 minutes
setInterval(updateMgmtAccessToken, 5 * 60 * 1000);

const findUserByEmail = email => {
  let options = {
    method: "GET",
    json: true,
    url: `https://${domain}/api/v2/users`,
    qs: { q: `email:"${email}"`, search_engine: "v3" },
    headers: { authorization: `Bearer ${mgmtAccessToken}` }
  };

  return request(options);
};

const findUserByUsername = username => {
  let options = {
    method: "GET",
    json: true,
    url: `https://${domain}/api/v2/users`,
    qs: { q: `username:"${username}"`, search_engine: "v3" },
    headers: { authorization: `Bearer ${mgmtAccessToken}` }
  };

  return request(options);
};

const findUserByMobile = mobile => {
  let options = {
    method: "GET",
    json: true,
    url: `https://${domain}/api/v2/users`,
    qs: {
      q: `identities.profileData.phone_number:"${mobile}"`,
      search_engine: "v3"
    },
    headers: { authorization: `Bearer ${mgmtAccessToken}` }
  };

  return request(options);
};

const getFederatedIdentityConnection = (email, clientID) => {
  let options = {
    method: "GET",
    json: true,
    url: `https://${domain}/api/v2/connections`,
    headers: { authorization: `Bearer ${mgmtAccessToken}` }
  };

  const emailDomain = email.replace(/.*@/, "");

  return (
    request(options)
      // only look at connections enabled for this client
      .then(body =>
        body.filter(conn => conn.enabled_clients.includes(clientID))
      )
      // check if domain aliases match the email
      .then(body =>
        body.filter(conn =>
          (conn.options.domain_aliases || []).includes(emailDomain)
        )
      )
      // If we somehow matched multiple connections, just return the first one
      .then(body => (body.length === 0 ? null : body[0]))
  );
};

const emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

const mobileRegex = /\+(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\d{1,14}$/;

app.post("/api/identifier", (req, res) => {
  // Check if the user entered an email address
  if (emailRegex.test(req.body.userID)) {
    // check if the email belongs to an enterprise connection
    getFederatedIdentityConnection(req.body.userID, req.body.clientID).then(
      conn => {
        if (conn) {
          res.json({
            enterpriseConnection: conn.name
          });
        } else {
          // not an enterprise connection, see if the user exists
          findUserByEmail(req.body.userID)
            .then(body => {
              if (body.length === 0) {
                res.json({
                  mustSignup: true
                });
              } else {
                res.json({
                  askPassword: true
                });
              }
            })
            .catch(error => {
              res.status(500).send(error);
            });
        }
      }
    );
  } else if (mobileRegex.test(req.body.userID)) {
    // User entered a mobile number
    findUserByMobile(req.body.userID)
      .then(body => {
        auth0.passwordless.sendSMS({ phone_number: req.body.userID }, err => {
          if (err) {
            res.status(500).send(err);
            return;
          }
          if (body.length === 0) {
            res.json({
              mustSignup: true
            });
          } else {
            res.json({
              passwordless: true
            });
          }
        });
      })
      .catch(error => {
        res.status(500).send(error);
      });
  } else {
    // Check if it's a valid username.
    findUserByUsername(req.body.userID)
      .then(body => {
        if (body.length === 0) {
          res.json({
            mustSignup: true
          });
        } else {
          res.json({
            askPassword: true
          });
        }
      })
      .catch(error => {
        res.status(500).send(error);
      });
  }
});

app.listen(port, () => console.log(`Listening on port ${port}`));
