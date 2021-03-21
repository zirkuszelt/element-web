/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2018, 2019 New Vector Ltd
Copyright 2019 The Matrix.org Foundation C.I.C.

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
import classNames from 'classnames';
import * as sdk from 'matrix-react-sdk/src/index';

import PropTypes from 'prop-types';
import AppTile from '../AppTile';
import dis from 'matrix-react-sdk/src/dispatcher/dispatcher';
import * as ScalarMessaging from 'matrix-react-sdk/src/ScalarMessaging';
import WidgetUtils from 'matrix-react-sdk/src/utils/WidgetUtils';
import WidgetEchoStore from "matrix-react-sdk/src/stores/WidgetEchoStore";
import {Container, WidgetLayoutStore} from "matrix-react-sdk/src/stores/widgets/WidgetLayoutStore";


export default class AppsDrawer extends React.Component<any, any> {
    dispatcherRef?: string
    static propTypes = {
        userId: PropTypes.string.isRequired,
        room: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            apps: this._getApps(),
        };
    }

    componentDidMount() {
        ScalarMessaging.startListening();
        WidgetLayoutStore.instance.on(WidgetLayoutStore.emissionForRoom(this.props.room), this._updateApps);
        this.dispatcherRef = dis.register(this.onAction);
    }

    componentWillUnmount() {
        ScalarMessaging.stopListening();
        WidgetLayoutStore.instance.off(WidgetLayoutStore.emissionForRoom(this.props.room), this._updateApps);
        if (this.dispatcherRef) dis.unregister(this.dispatcherRef);
    }

    // TODO: [REACT-WARNING] Replace with appropriate lifecycle event
    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(newProps) {
        // Room has changed probably, update apps
        this._updateApps();
    }

    onAction = (action) => {
        const hideWidgetKey = this.props.room.roomId + '_hide_widget_drawer';
        switch (action.action) {
            case 'appsDrawer':
                // Note: these booleans are awkward because localstorage is fundamentally
                // string-based. We also do exact equality on the strings later on.
                if (action.show) {
                    localStorage.setItem(hideWidgetKey, "false");
                } else {
                    // Store hidden state of widget
                    // Don't show if previously hidden
                    localStorage.setItem(hideWidgetKey, "true");
                }

                break;
        }
    };

    _getApps = () => WidgetLayoutStore.instance.getContainerWidgets(this.props.room, Container.Top);

    _updateApps = () => {
        this.setState({
            apps: this._getApps(),
        });
    };


    render() {

        const apps = this.state.apps.map((app, index, arr) => {
            return (<AppTile
                key={app.id}
                app={app}
                fullWidth={arr.length < 2}
                room={this.props.room}
                userId={this.props.userId}
                creatorUserId={app.creatorUserId}
                widgetPageTitle={WidgetUtils.getWidgetDataTitle(app)}
                waitForIframeLoad={app.waitForIframeLoad}
            />);
        });

        if (apps.length === 0) {
            return <div />;
        }

        let spinner;
        if (
            apps.length === 0 && WidgetEchoStore.roomHasPendingWidgets(
                this.props.room.roomId,
                WidgetUtils.getRoomWidgets(this.props.room),
            )
        ) {
            const Loader = sdk.getComponent("elements.Spinner");
            spinner = <Loader />;
        }

        const classes = classNames({
            mx_AppsDrawer: true,
            mx_AppsDrawer_fullWidth: apps.length < 2,
            mx_AppsDrawer_2apps: apps.length === 2,
            mx_AppsDrawer_3apps: apps.length === 3,
        });

        return (
            <div className={classes}>
                <div className="mx_AppsContainer">
                    { apps.map((app, i) => {
                        if (i < 1) return app;
                        return <React.Fragment key={app.key}>
                            { app }
                        </React.Fragment>;
                    }) }
                </div>
                { spinner }
            </div>
        );
    }
}