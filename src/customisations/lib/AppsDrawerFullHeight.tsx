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

import AppTile from '../AppTile';
import WidgetUtils from 'matrix-react-sdk/src/utils/WidgetUtils';
import WidgetEchoStore from "matrix-react-sdk/src/stores/WidgetEchoStore";
import ResizeHandle from "matrix-react-sdk/src/components/views/elements/ResizeHandle";
import AppsDrawer from "matrix-react-sdk/src/components/views/rooms/AppsDrawer";

export default class AppsDrawerFullHeight extends (AppsDrawer as any) {
    render() {
        if (!this.props.showApps) return <div />;

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
                pointerEvents={this.isResizing() ? 'none' : undefined}
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
            mx_AppsDrawer_resizing: this.state.resizing,
            mx_AppsDrawer_2apps: apps.length === 2,
            mx_AppsDrawer_3apps: apps.length === 3,
        });

        return (
            <div className={classes}>
                <div className="mx_AppsContainer" ref={this._collectResizer}>
                    { apps.map((app, i) => {
                        if (i < 1) return app;
                        return <React.Fragment key={app.key}>
                            <ResizeHandle reverse={i > apps.length / 2} />
                            { app }
                        </React.Fragment>;
                    }) }
                </div>
                { spinner }
            </div>
        );
    }
}