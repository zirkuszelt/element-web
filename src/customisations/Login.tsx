import React, {ReactNode} from 'react';

import {_t, _td} from 'matrix-react-sdk/src/languageHandler';
import * as sdk from 'matrix-react-sdk/src/index';
import SdkConfig from 'matrix-react-sdk/src/SdkConfig';
import classNames from "classnames";
import AuthPage from "matrix-react-sdk/src/components/views/auth/AuthPage";
import PlatformPeg from 'matrix-react-sdk/src/PlatformPeg';
import SettingsStore from "matrix-react-sdk/src/settings/SettingsStore";
import {UIFeature} from "matrix-react-sdk/src/settings/UIFeature";
import InlineSpinner from "matrix-react-sdk/src/components/views/elements/InlineSpinner";
import Spinner from "matrix-react-sdk/src/components/views/elements/Spinner";
import ServerPicker from "matrix-react-sdk/src/components/views/elements/ServerPicker";


import LoginComponent from 'matrix-react-sdk/src/components/structures/auth/Login'


export default class LoginComponentWrapped extends LoginComponent {

    loginWithAnonymProvider = ev => {

        // @ts-ignore : loginLogic is marked as private
        const matrixClient = this.loginLogic.createTemporaryClient()
        PlatformPeg.get().startSingleSignOn(matrixClient, 'sso', this.props.fragmentAfterLogin);
    }

    renderLoginComponentForFlows() {

        if(this.props.serverConfig.hsUrl == SdkConfig.get().default_server_config['m.homeserver'].base_url) {
            // for our homeserver, replace the button label
            return (<div className="mx_SSOButtons" onClick={this.loginWithAnonymProvider}>
                <div role="button" tabIndex={0} className="mx_AccessibleButton mx_SSOButton mx_SSOButton_default mx_SSOButton_primary">
                    Ohne Registration einloggen
                </div>
            </div>
            )
        }

        return super.renderLoginComponentForFlows()
    }


    render() {
        const AuthHeader = sdk.getComponent("auth.AuthHeader");
        const AuthBody = sdk.getComponent("auth.AuthBody");
        const loader = this.isBusy() && !this.state.busyLoggingIn ?
            <div className="mx_Login_loader"><Spinner /></div> : null;

        const errorText = this.state.errorText;

        let errorTextSection;
        if (errorText) {
            errorTextSection = (
                <div className="mx_Login_error">
                    { errorText }
                </div>
            );
        }

        let serverDeadSection;
        if (!this.state.serverIsAlive) {
            const classes = classNames({
                "mx_Login_error": true,
                "mx_Login_serverError": true,
                "mx_Login_serverErrorNonFatal": !this.state.serverErrorIsFatal,
            });
            serverDeadSection = (
                <div className={classes}>
                    {this.state.serverDeadError}
                </div>
            );
        }

        let footer;
        if (this.props.isSyncing || this.state.busyLoggingIn) {
            footer = <div className="mx_AuthBody_paddedFooter">
                <div className="mx_AuthBody_paddedFooter_title">
                    <InlineSpinner w={20} h={20} />
                    { this.props.isSyncing ? _t("Syncing...") : _t("Signing In...") }
                </div>
                { this.props.isSyncing && <div className="mx_AuthBody_paddedFooter_subtitle">
                    {_t("If you've joined lots of rooms, this might take a while")}
                </div> }
            </div>;
        } else if (SettingsStore.getValue(UIFeature.Registration)) {
            footer = (
                <span className="mx_AuthBody_changeFlow">
                    {_t("New? <a>Create account</a>", {}, {
                        a: sub => <a onClick={this.onTryRegisterClick} href="#">{ sub }</a>,
                    })}
                </span>
            );
        }

        return (
            <AuthPage>
                <AuthHeader disableLanguageSelector={this.props.isSyncing || this.state.busyLoggingIn} />
                <AuthBody>
                    <h2>
                        {SdkConfig.get()['brand']}
                        {loader}
                    </h2>
                    <p>
                        Willkommen im Zirkuszelt, unserem Ort für Video-Großkonferenzen.
                    </p>
                    { errorTextSection }
                    { serverDeadSection }
                    <ServerPicker
                        serverConfig={this.props.serverConfig}
                        onServerConfigChange={this.props.onServerConfigChange}
                    />
                    { this.renderLoginComponentForFlows() }
                    { footer }
                </AuthBody>
            </AuthPage>
        );
    }
}
