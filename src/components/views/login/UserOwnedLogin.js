/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from "react";
import PropTypes from "prop-types";
import { _t } from "../../../languageHandler";
import * as blockstack from "blockstack";
import { getPublicKeyFromPrivate } from "blockstack/lib/keys";
/**
 * A pure UI component which displays a username/password form.
 */
class UserOwnedLogin extends React.Component {
    static defaultProps = {
        hsDomain: ""
    };

    constructor(props) {
        super(props);
        this.state = {
            userData: undefined,
            txid: undefined,
            challenge: undefined
        };

        this.onSubmitForm = this.onSubmitForm.bind(this);
        this.onBlockstackSignoutClick = this.onBlockstackSignoutClick.bind(
            this
        );
        this.submitUserResponse = this.submitUserResponse.bind(this);
    }

    componentDidMount() {
        if (blockstack.isUserSignedIn()) {
            const userData = blockstack.loadUserData();
            this.stateFromUserData(userData).then(state => {
                this.setState(state);
                this.submitUserResponse(
                    state.challenge,
                    state.userData.username,
                    state.txid
                );
            })
        } else if (blockstack.isSignInPending()) {
            blockstack.handlePendingSignIn().then(userData => {
                this.stateFromUserData(userData).then(state => {
                    this.setState(state);
                    this.submitUserResponse(
                        state.challenge,
                        state.userData.username,
                        state.txid);
                    history.replaceState(
                        {},
                        "OI Chat",
                        window.location.origin + window.location.pathname,
                    );
                });                
            });
        }
    }

    stateFromUserData(userData) {
        console.log(userData);
        const txid = getPublicKeyFromPrivate(userData.appPrivateKey) + Math.random();
        return fetch("http://auth.openintents.org/c/" + txid, {
            method: "POST",
        }).then(response => {return response.json();})
        .then(challengeObject => {
            const challenge = challengeObject.challenge;
            console.log("challenge", challenge);
            return { userData, txid, challenge};
        }); 
    }

    onBlockstackLoginClick(ev) {
        blockstack.redirectToSignIn(
            window.location.origin + "/",
            window.location.origin + "/manifest.json",
            ["store_write", "publish_data"]
        );
    }

    onBlockstackSignoutClick(ev) {
        blockstack.signUserOut();
        this.setState({ userData: undefined });
    }

    submitUserResponse(challenge, username, txid) {
        blockstack
            .putFile("mxid.json", challenge, { encrypt: false, sign: true })
            .then(() => {
                this.props.onSubmit(
                    username,
                    "",
                    "",
                    txid + "|" + window.origin
                );
            });
    }

    onSubmitForm(ev) {
        ev.preventDefault();
        this.submitUserResponse(
            this.state.challenge,
            this.state.username,
            this.state.txid
        );
    }

    render() {
        let username = "";
        if (this.state && this.state.userData) {
            username = this.state.userData.username;
        }
        const disableForgetBlockstackId = !this.state.userData;
        return (
            <div>
                <button
                    className="mx_Login_blockstack"
                    onClick={this.onBlockstackLoginClick}
                    disabled={!!this.state.userData}
                >
                    {_t("Use your Blockstack ID")}
                </button>
                <button
                    className="mx_Login_blockstack"
                    onClick={this.onBlockstackSignoutClick}
                    disabled={disableForgetBlockstackId}
                >
                    {_t("Forget Blockstack ID")}
                </button>
                {username && (
                    <div className="mx_Login_fieldlabel">
                        Your Blockstack Id: {username}
                    </div>
                )}
                {!username && (
                    <div className="mx_Login_fieldlabel">
                        <a href="https://blockstack.org/install">
                            Don't have Blockstack yet? Click here
                        </a>
                    </div>
                )}
                <form onSubmit={this.onSubmitForm} />
            </div>
        );
    }
}

UserOwnedLogin.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired
};

module.exports = UserOwnedLogin;
