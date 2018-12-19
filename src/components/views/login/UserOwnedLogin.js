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

import React from 'react';
import PropTypes from 'prop-types';
import { _t } from '../../../languageHandler';
import * as blockstack from 'blockstack';
import { getPublicKeyFromPrivate } from 'blockstack/lib/keys';
/**
 * A pure UI component which displays a username/password form.
 */
class UserOwnedLogin extends React.Component {
    static defaultProps = {        
        hsDomain: "",
    }

    constructor(props) {
        super(props);
        this.state = {
            userData: undefined,
            txid: undefined,
            challenge: undefined,
        };

        this.onSubmitForm = this.onSubmitForm.bind(this);   
        this.onBlockstackSignoutClick = this.onBlockstackSignoutClick.bind(this);        
    }   

    componentDidMount() {
        if (blockstack.isUserSignedIn()) {
            const userData = blockstack.loadUserData();
            this.updateFromUserData(userData);
          } else if (blockstack.isSignInPending()) {
            blockstack.handlePendingSignIn()
            .then(userData => {
              this.updateFromUserData(userData);
            });
          }
    }

    updateFromUserData(userData) {
        console.log(userData);
        const txid = getPublicKeyFromPrivate(userData.appPrivateKey);
        const challenge = "mychallengefromserver"; //TODO fetch from server
        this.setState({userData, txid, challenge});    
    }

    onBlockstackLoginClick(ev) {
        blockstack.redirectToSignIn(window.location.origin + "/", window.location.origin + "/manifest.json", ["store_write", "publish_data"]);
    }

    onBlockstackSignoutClick(ev) {
        blockstack.signUserOut();
        this.setState({userData: undefined});
    }

    onSubmitForm(ev) {
        ev.preventDefault();
        blockstack.putFile("mxid.json", this.state.challenge, {encrypt:false, sign:true}).then(
            () => {
                this.props.onSubmit(this.state.userData.username, '', '', this.state.txid + "|" + window.origin);
            }
        );
    }

    
    render() {
        let username = "";
        if (this.state && this.state.userData) {
            username = this.state.userData.username;
        }
        return (
            <div>
                <button className="mx_Login_submit" style={{marginTop: "10px", marginBottom: "10px"}} onClick={this.onBlockstackLoginClick} disabled={!!this.state.userData} >
                    {_t('Use your Blockstack ID')}
                </button>
                <button className="mx_Login_submit" style={{marginTop: "10px", marginBottom: "10px"}} onClick={this.onBlockstackSignoutClick} disabled={!this.state.userData} >
                    {_t('Forget Blockstack ID')}
                </button>
                <div className="mx_Login_fieldlabel">{username}</div>
                <form onSubmit={this.onSubmitForm}>                                
                <input className="mx_Login_submit" type="submit" value={_t('Sign in')} disabled={!this.state.userData} />
                </form>
            </div>
        );
    }
}

UserOwnedLogin.propTypes = {
    onSubmit: PropTypes.func.isRequired, // fn()
};

module.exports = UserOwnedLogin;
