import React, { Component } from "react";
import "./App.css";
import { Button, Form, FormGroup, Label, Input, FormText } from "reactstrap";
import Auth from "./Auth";
import SocialButtons from "./SocialButtons";

class App extends Component {
  constructor() {
    super();

    this.auth = new Auth();
  }

  state = {
    userID: "",
    otp: "",
    password: "",
    showOTPEntry: false,
    showPasswordEntry: false,
    submitDisabled: false,
    dbConnectionName: ""
  };

  onIdUpdated = e => {
    this.setState({
      userID: e.target.value
    });
  };

  onOtpUpdated = e => {
    this.setState({
      otp: e.target.value
    });
  };

  onPasswordUpdated = e => {
    this.setState({
      password: e.target.value
    });
  };

  checkID = () => {
    this.setState({
      submitDisabled: true
    });
    fetch(`${window.serverURL || ""}/api/identifier`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        userID: this.state.userID,
        clientID: window.config.clientID
      })
    })
      .then(response => response.json())
      .then(this.handleCheckIDResponse);
  };

  handleCheckIDResponse = response => {
    if (response.passwordless) {
      this.setState({
        submitDisabled: false,
        showOTPEntry: true
      });
    } else if (response.askPassword && response.connection) {
      this.setState({
        submitDisabled: false,
        showPasswordEntry: true,
        dbConnectionName: response.connection
      });
    } else if (response.enterpriseConnection) {
      this.auth.loginEnterprise(
        this.state.userID,
        response.enterpriseConnection,
        err => console.log(err)
      );
    }
  };

  submitOTP = () => {
    this.setState({
      submitDisabled: true
    });
    this.auth.loginPasswordless(this.state.userID, this.state.otp, err =>
      console.log(err)
    );
  };

  submitPassword = () => {
    this.setState({
      submitDisabled: true
    });
    this.auth.loginPassword(
      this.state.dbConnectionName,
      this.state.userID,
      this.state.password,
      err => console.log(err)
    );
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <Form>
            <FormGroup>
              <h1>ID first example</h1>
            </FormGroup>
            {this.state.showOTPEntry && (
              <div>
                <FormGroup>
                  <Label for="exampleEmail">Enter the code sent to you</Label>
                  <Input
                    type="text"
                    name="otp"
                    id="otp"
                    value={this.state.otp}
                    onChange={this.onOtpUpdated}
                  />
                </FormGroup>
                <Button
                  onClick={this.submitOTP}
                  disabled={this.state.submitDisabled}
                  type="submit"
                >
                  Submit
                </Button>
              </div>
            )}
            {this.state.showPasswordEntry && (
              <div>
                <FormGroup>
                  <Label for="exampleEmail">Enter your password</Label>
                  <Input
                    type="password"
                    name="password"
                    id="password"
                    onChange={this.onPasswordUpdated}
                  />
                </FormGroup>
                <Button
                  onClick={this.submitPassword}
                  disabled={this.state.submitDisabled}
                  type="submit"
                >
                  Submit
                </Button>
              </div>
            )}
            {!this.state.showOTPEntry && !this.state.showPasswordEntry && (
              <div>
                <FormGroup>
                  <Label for="exampleEmail">
                    Enter your email address, mobile number, or username
                  </Label>
                  <Input
                    type="text"
                    name="identifier"
                    id="identifier"
                    placeholder="Email, Mobile, Username"
                    value={this.state.userID}
                    onChange={this.onIdUpdated}
                  />
                </FormGroup>
                <Button
                  onClick={this.checkID}
                  disabled={this.state.submitDisabled}
                  type="submit"
                >
                  Next
                </Button>
                <FormGroup>
                  <SocialButtons auth={this.auth} />
                </FormGroup>
              </div>
            )}
          </Form>
        </header>
      </div>
    );
  }
}

export default App;
