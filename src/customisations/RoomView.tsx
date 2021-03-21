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
import RoomView from 'matrix-react-sdk/src/components/structures/RoomView'
import classNames from 'classnames';
import { _t } from 'matrix-react-sdk/src/languageHandler';
import * as sdk from 'matrix-react-sdk/src/index';
// import AppsDrawer from 'matrix-react-sdk/src/components/views/rooms/AppsDrawer';
import SettingsStore from "matrix-react-sdk/src/settings/SettingsStore";
import {Layout} from "matrix-react-sdk/src/settings/Layout";
import RoomContext from "matrix-react-sdk/src/contexts/RoomContext";
import TimelinePanel from "matrix-react-sdk/src/components/structures/TimelinePanel";
import ErrorBoundary from "matrix-react-sdk/src/components/views/elements/ErrorBoundary";
import AppsDrawerNonResizeable from './lib/AppsDrawerNonResizable'

export default class FullscreenView extends RoomView {
    constructor(props, context) {
        super(props, context);
        (this.state as any).isInFullScreen = false

        // @ts-ignore
        this.onAppsClick = null
    }
    isFullScreenAvailable() {
        if (!this.state.room) return false
        if ((SettingsStore.getValue("feature_spaces") && this.state.room?.isSpaceRoom())) return false
        const myMembership = this.state.room.getMyMembership();
        if (myMembership === "invite") {
            return false
        }
        return true
    }

    // @ts-ignore
    componentDidUpdate(prevProps, prevState) {
        const isInFullScreen = (this.state as any).isInFullScreen
        if(prevState.isInFullScreen !== isInFullScreen) {
            // toggle leftpanel visibility
            const leftPanel = document.querySelector('.mx_LeftPanel') as HTMLElement
            if(isInFullScreen) {
                leftPanel.style.display = 'none'
            } else {
                // @
                leftPanel.style.display = 'flex'
            }
        }
    }
    componentDidMount() {
        super.componentDidMount()
        window.addEventListener("message", this._handleMessage)
        document.addEventListener('fullscreenchange', this._onFullscreenChange)
    }
    componentWillUnmount() {
        super.componentWillUnmount()
        window.removeEventListener("message", this._handleMessage)
        document.removeEventListener('fullscreenchange', this._onFullscreenChange)
    }
    _onFullscreenChange = () => {
        if (!document.fullscreenElement) {
            this.setState({
                // @ts-ignore
                isInFullScreen: false,
            })
        }
    }
    _handleMessage = async (ev: MessageEvent) => {
        if (ev.data === 'toggleRoomFullscreen') {
            const { isInFullScreen } = this.state as any
            // @ts-ignore
            const view = document.body
            if (!isInFullScreen) {
                try {
                    this.setState({
                        // @ts-ignore
                        isInFullScreen: true,
                    })
                    await view.requestFullscreen({
                        navigationUI: 'hide',
                    })
                } catch (err) {
                    console.error('error requesting fullscreen', err)
                    this.setState({
                        // @ts-ignore
                        isInFullScreen: false,
                    })
                }
            } else {
                document.exitFullscreen();
                this.setState({
                    // @ts-ignore
                    isInFullScreen: false,
                })
            }
        }
    }
    render() {
        if (!this.isFullScreenAvailable() || !(this.state as any).isInFullScreen) {
            // render normal view
            return super.render()
        }
        let isStatusAreaExpanded = true;

        const RoomStatusBar = sdk.getComponent('structures.RoomStatusBar');
        isStatusAreaExpanded = this.state.statusBarVisible;

        const myMembership = this.state.room.getMyMembership();
        const statusBar = <RoomStatusBar
            room={this.state.room}
            isPeeking={myMembership !== "join"}
            onInviteClick={
                // @ts-ignore
                this.onInviteButtonClick
            }
            onVisible={
                // @ts-ignore
                this.onStatusBarVisible
            }
            onHidden={
                // @ts-ignore
                this.onStatusBarHidden
            }
        />;

        let messageComposer;
        const canSpeak = (
            // joined and not showing search results
            myMembership === 'join'
        );
        if (canSpeak) {
            const MessageComposer = sdk.getComponent('rooms.MessageComposer');
            messageComposer =
                <MessageComposer
                    room={this.state.room}
                    callState={this.state.callState}
                    showApps={this.state.showApps}
                    e2eStatus={this.state.e2eStatus}
                    resizeNotifier={this.props.resizeNotifier}
                    replyToEvent={this.state.replyToEvent}
                    permalinkCreator={
                        // @ts-ignore
                        this.getPermalinkCreatorForRoom(this.state.room)
                    }
                />;
        }

        const shouldHighlight = this.state.isInitialEventHighlighted;
        let highlightedEventId = null;
        if (this.state.forwardingEvent) {
            highlightedEventId = this.state.forwardingEvent.getId();
        } else if (shouldHighlight) {
            highlightedEventId = this.state.initialEventId;
        }

        const messagePanelClassNames = classNames(
            "mx_RoomView_messagePanel",
            {
                "mx_IRCLayout": this.state.layout == Layout.IRC,
                "mx_GroupLayout": this.state.layout == Layout.Group,
            });

        // console.info("ShowUrlPreview for %s is %s", this.state.room.roomId, this.state.showUrlPreview);
        const messagePanel = (
            <TimelinePanel
                ref={
                    // @ts-ignore
                    this.gatherTimelinePanelRef
                }
                timelineSet={this.state.room.getUnfilteredTimelineSet()}
                showReadReceipts={false}
                manageReadReceipts={!this.state.isPeeking}
                manageReadMarkers={!this.state.isPeeking}
                hidden={false}
                highlightedEventId={highlightedEventId}
                eventId={this.state.initialEventId}
                eventPixelOffset={this.state.initialEventPixelOffset}
                onScroll={
                    // @ts-ignore
                    this.onMessageListScroll
                }
                onReadMarkerUpdated={
                    // @ts-ignore
                    this.updateTopUnreadMessagesBar
                }
                showUrlPreview = {this.state.showUrlPreview}
                className={messagePanelClassNames}
                membersLoaded={this.state.membersLoaded}
                permalinkCreator={
                    // @ts-ignore
                    this.getPermalinkCreatorForRoom(this.state.room)
                }
                resizeNotifier={this.props.resizeNotifier}
                showReactions={true}
                layout={this.state.layout}
            />);

        let topUnreadMessagesBar = null;
        // Do not show TopUnreadMessagesBar if we have search results showing, it makes no sense
        if (this.state.showTopUnreadMessagesBar) {
            const TopUnreadMessagesBar = sdk.getComponent('rooms.TopUnreadMessagesBar');
            topUnreadMessagesBar = (
                <TopUnreadMessagesBar onScrollUpClick={
                    // @ts-ignore
                    this.jumpToReadMarker
                } onCloseClick={
                    // @ts-ignore
                    this.forgetReadMarker
                } />
            );
        }
        let jumpToBottom;
        // Do not show JumpToBottomButton if we have search results showing, it makes no sense
        if (!this.state.atEndOfLiveTimeline) {
            const JumpToBottomButton = sdk.getComponent('rooms.JumpToBottomButton');
            jumpToBottom = (<JumpToBottomButton
                highlight={this.state.room.getUnreadNotificationCount('highlight') > 0}
                numUnreadMessages={this.state.numUnreadMessages}
                onScrollToBottomClick={
                    // @ts-ignore
                    this.jumpToLiveTimeline
                }
            />);
        }

        const statusBarAreaClass = classNames("mx_RoomView_statusArea", {
            "mx_RoomView_statusArea_expanded": isStatusAreaExpanded,
        });

        return (
            <RoomContext.Provider value={this.state}>
                <main className="mx_RoomView mx_RoomView_fullscreenView" ref={
                    // @ts-ignore
                    this.roomView
                } onKeyDown={
                    // @ts-ignore
                    this.onReactKeyDown
                }>
                    <ErrorBoundary>
                        <AppsDrawerNonResizeable
                            room={this.state.room}
                            userId={this.context.credentials.userId}

                            maxHeight={window.innerHeight}
                            showApps={true}
                            resizeNotifier={{on: () => {}}}
                        />
                        <div className="mx_RoomView_body">
                            <div className="mx_RoomView_timeline">
                                {topUnreadMessagesBar}
                                {jumpToBottom}
                                {messagePanel}
                            </div>
                            <div className={statusBarAreaClass}>
                                <div className="mx_RoomView_statusAreaBox">
                                    <div className="mx_RoomView_statusAreaBox_line" />
                                    {statusBar}
                                </div>
                            </div>
                            {messageComposer}
                        </div>
                    </ErrorBoundary>
                </main>
            </RoomContext.Provider>
        );
    }
}
