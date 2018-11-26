import React, { Component } from "react";
import "./SocialButtons.css";

// SocialButtons determines which social providers
// are enabled for the given client and displays them.
export default class SocialButtons extends Component {
  constructor() {
    super();

    // The call to fetch client configuration dynamically
    // expects an Auth0.setClient function to be available on the window object.
    window.Auth0 = {
      setClient: config => {
        this.setState({
          config: config
        });
      }
    };

    // Fetch the client configuration
    const script = document.createElement("script");
    script.src = `${window.config.clientConfigurationBaseUrl}client/${
      window.config.clientID
    }.js`;
    script.async = true;
    document.body.appendChild(script);
  }

  state = {
    config: {
      strategies: []
    }
  };

  login = (connection, e) => {
    e.preventDefault();
    this.props.auth.loginSocial(connection, err => {
      console.log(err);
      alert(err);
    });
  };

  render() {
    return (
      <div className="social-providers">
        {this.state.config.strategies
          .filter(s => STRATEGIES[s.name])
          .map(s => (
            <button
              className="auth0-lock-social-button"
              data-provider={s.name}
              key={s.name}
              onClick={this.login.bind(this, s.name)}
            >
              <div className="auth0-lock-social-button-icon" />
            </button>
          ))}
      </div>
    );
  }
}

const STRATEGIES = {
  amazon: "Amazon",
  aol: "Aol",
  baidu: "百度",
  bitbucket: "Bitbucket",
  box: "Box",
  dropbox: "Dropbox",
  dwolla: "Dwolla",
  ebay: "ebay",
  exact: "Exact",
  facebook: "Facebook",
  fitbit: "Fitbit",
  github: "GitHub",
  "google-openid": "Google OpenId",
  "google-oauth2": "Google",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  miicard: "miiCard",
  paypal: "PayPal",
  "paypal-sandbox": "PayPal Sandbox",
  planningcenter: "Planning Center",
  renren: "人人",
  salesforce: "Salesforce",
  "salesforce-community": "Salesforce Community",
  "salesforce-sandbox": "Salesforce (sandbox)",
  evernote: "Evernote",
  "evernote-sandbox": "Evernote (sandbox)",
  shopify: "Shopify",
  soundcloud: "Soundcloud",
  thecity: "The City",
  "thecity-sandbox": "The City (sandbox)",
  thirtysevensignals: "37 Signals",
  twitter: "Twitter",
  vkontakte: "vKontakte",
  windowslive: "Microsoft Account",
  wordpress: "Wordpress",
  yahoo: "Yahoo!",
  yammer: "Yammer",
  yandex: "Yandex",
  weibo: "新浪微博"
};
