import AppTile from 'matrix-react-sdk/src/components/views/elements/AppTile';
import SdkConfig from 'matrix-react-sdk/src/SdkConfig';
import WidgetUtils from 'matrix-react-sdk/src/utils/WidgetUtils.ts';
import React from 'react';
import {MatrixClientPeg} from 'matrix-react-sdk/src/MatrixClientPeg';
import AccessibleButton from 'matrix-react-sdk/src/components/views/elements/AccessibleButton';
import { _t } from 'matrix-react-sdk/src/languageHandler';
import AppPermission from 'matrix-react-sdk/src/components/views/elements/AppPermission';
import AppWarning from 'matrix-react-sdk/src/components/views/elements/AppWarning';
import Spinner from 'matrix-react-sdk/src/components/views/elements/Spinner';
import classNames from 'classnames';
import PersistedElement from "matrix-react-sdk/src/components/views/elements/PersistedElement";
import {WidgetType} from "matrix-react-sdk/src/widgets/WidgetType";

function isWhitelistedEdumeetWidget({ type, url, data}) {
    if (type !== 'edumeet') return false;
    if (url && !WidgetUtils.isScalarUrl(url)) return false;
    if (data.url && !WidgetUtils.isScalarUrl(data.url)) return false;
    const whitelistedDomains = SdkConfig.get().edumeet_whitelisted || ['edumeet-widget.zirkuszelt.org'];
    if (!whitelistedDomains.includes(data.domain)) return false;

    // maybe url is modified?
    if (url && (!url.match(/&domain=\$domain&/) || url.match(/domain=/g).length > 1)) return false;
    if (data.url && (!data.url.match(/&domain=\$domain&/) || data.url.match(/domain=/g).length > 1)) return false;
    return true;
}
function isWhitelistedEtherpadWidget({ type, url, data }) {
    if (type !== 'm.etherpad') return false;
    if (url && !WidgetUtils.isScalarUrl(url)) return false;
    if (!url.startsWith(
        'https://dimension.zirkuszelt.org/widgets/generic?url=https%3A%2F%2Fpad.klimacamp-leipzigerland.de%2F'
    )) return false;
    if (!data.url.startsWith('https://pad.klimacamp-leipzigerland.de/')) return false;
    return true;
}
function isWhitelistedPresentationWidget({ type, url, data }) {
    console.log('whitelist?', { type, url, data }, WidgetUtils.isScalarUrl(url))
    if (type !== 'presentation') return false;
    // if (url && !WidgetUtils.isScalarUrl(url)) return false;
    return true;
}

export default class AppTileWrapped extends AppTile {
    constructor(props) {
        super(props);

        // wrap hasPermissionToLoad to allow edumeet widgets without a permission prompt
        const superHasPermissionToLoad = this.hasPermissionToLoad;
        this.hasPermissionToLoad = (props) => {
            if (isWhitelistedEdumeetWidget(props.app) || isWhitelistedEtherpadWidget(props.app) || isWhitelistedPresentationWidget(props.app)) return true;
            return superHasPermissionToLoad(props);
        };
        this.state.hasPermissionToLoad = this.hasPermissionToLoad(props);
    }

    _onPopoutWidgetClick = () => {
        // Ensure Jitsi conferences are closed on pop-out, to not confuse the user to join them
        // twice from the same computer, which Jitsi can have problems with (audio echo/gain-loop).
        if (this.props.app.type == 'edumeet' || WidgetType.JITSI.matches(this.props.app.type)) {
            this._endWidgetActions().then(() => {
                if (this.iframe) {
                    // Reload iframe
                    this.iframe.src = this._sgWidget.embedUrl;
                    this.setState({});
                }
            });
        }
        // Using Object.assign workaround as the following opens in a new window instead of a new tab.
        // window.open(this._getPopoutUrl(), '_blank', 'noopener=yes');
        Object.assign(document.createElement('a'),
            { target: '_blank', href: this._sgWidget.popoutUrl, rel: 'noreferrer noopener'}).click();
    };

    render() {
        let appTileBody;

        // Note that there is advice saying allow-scripts shouldn't be used with allow-same-origin
        // because that would allow the iframe to programmatically remove the sandbox attribute, but
        // this would only be for content hosted on the same origin as the element client: anything
        // hosted on the same origin as the client will get the same access as if you clicked
        // a link to it.
        const sandboxFlags = "allow-forms allow-popups allow-popups-to-escape-sandbox "+
            "allow-same-origin allow-scripts allow-presentation";

        // Additional iframe feature pemissions
        // (see - https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-permissions-in-cross-origin-iframes and https://wicg.github.io/feature-policy/)
        const iframeFeatures = "microphone; camera; encrypted-media; autoplay; display-capture; clipboard-write;";

        const appTileBodyClass = 'mx_AppTileBody' + (this.props.miniMode ? '_mini  ' : ' ');
        const appTileBodyStyles = {};
        if (this.props.pointerEvents) {
            appTileBodyStyles['pointer-events'] = this.props.pointerEvents;
        }

        const loadingElement = (
            <div className="mx_AppLoading_spinner_fadeIn">
                <Spinner message={_t("Loading...")} />
            </div>
        );
        if (!this.state.hasPermissionToLoad) {
            // only possible for room widgets, can assert this.props.room here
            const isEncrypted = MatrixClientPeg.get().isRoomEncrypted(this.props.room.roomId);
            appTileBody = (
                <div className={appTileBodyClass} style={appTileBodyStyles}>
                    <AppPermission
                        roomId={this.props.room.roomId}
                        creatorUserId={this.props.creatorUserId}
                        url={this._sgWidget.embedUrl}
                        isRoomEncrypted={isEncrypted}
                        onPermissionGranted={this._grantWidgetPermission}
                    />
                </div>
            );
        } else if (this.state.initialising) {
            appTileBody = (
                <div className={appTileBodyClass + (this.state.loading ? 'mx_AppLoading' : '')} style={appTileBodyStyles}>
                    { loadingElement }
                </div>
            );
        } else {
            if (this.isMixedContent()) {
                appTileBody = (
                    <div className={appTileBodyClass} style={appTileBodyStyles}>
                        <AppWarning errorMsg="Error - Mixed content" />
                    </div>
                );
            } else {
                appTileBody = (
                    <div className={appTileBodyClass + (this.state.loading ? 'mx_AppLoading' : '')} style={appTileBodyStyles}>
                        { this.state.loading && loadingElement }
                        <iframe
                            allow={iframeFeatures}
                            ref={this._iframeRefChange}
                            src={this._sgWidget.embedUrl}
                            allowFullScreen={true}
                            sandbox={sandboxFlags}
                        />
                    </div>
                );

                if (!this.props.userWidget) {
                    // All room widgets can theoretically be allowed to remain on screen, so we
                    // wrap them all in a PersistedElement from the get-go. If we wait, the iframe
                    // will be re-mounted later, which means the widget has to start over, which is
                    // bad.

                    // Also wrap the PersistedElement in a div to fix the height, otherwise
                    // AppTile's border is in the wrong place
                    appTileBody = <div className="mx_AppTile_persistedWrapper">
                        <PersistedElement persistKey={this._persistKey}>
                            {appTileBody}
                        </PersistedElement>
                    </div>;
                }
            }
        }

        let appTileClasses;
        if (this.props.miniMode) {
            appTileClasses = {mx_AppTile_mini: true};
        } else if (this.props.fullWidth) {
            appTileClasses = {mx_AppTileFullWidth: true};
        } else {
            appTileClasses = {mx_AppTile: true};
        }
        appTileClasses = classNames(appTileClasses);

        return <React.Fragment>
            <div className={appTileClasses} id={this.props.app.id}>
                { this.props.showMenubar &&
                <div className="mx_AppTileMenuBar">
                    <span className="mx_AppTileMenuBarTitle" style={{pointerEvents: (this.props.handleMinimisePointerEvents ? 'all' : false)}}>
                        { this.props.showTitle && this._getTileTitle() }
                    </span>
                    <span className="mx_AppTileMenuBarWidgets">
                        { this.props.showPopout && <AccessibleButton
                            className="mx_AppTileMenuBar_iconButton mx_AppTileMenuBar_iconButton_popout"
                            title={_t('Popout widget')}
                            onClick={this._onPopoutWidgetClick}
                        /> }
                    </span>
                </div> }
                { appTileBody }
            </div>
        </React.Fragment>;
    }
}
