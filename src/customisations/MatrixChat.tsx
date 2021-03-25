/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2017-2019 New Vector Ltd
Copyright 2019, 2020 The Matrix.org Foundation C.I.C.

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
import MatrixChat, { Views } from 'matrix-react-sdk/src/components/structures/MatrixChat'
import {MatrixClientPeg} from 'matrix-react-sdk/src/MatrixClientPeg';
import SdkConfig from 'matrix-react-sdk/src/SdkConfig';
import request from 'browser-request'
import { MatrixEvent } from "matrix-js-sdk/src/models/event";
import { retry } from 'matrix-react-sdk/src/utils/promise';
import { MatrixError } from "matrix-js-sdk/src/http-api";

import dis from "matrix-react-sdk/src/dispatcher/dispatcher";
import {getCurrentLanguage} from 'matrix-react-sdk/src/languageHandler';
import ThemeController from "matrix-react-sdk/src/settings/controllers/ThemeController";
import ThreepidInviteStore from "matrix-react-sdk/src/stores/ThreepidInviteStore";
import { DefaultTagID } from 'matrix-react-sdk/src/stores/room-list/models';
import RoomListActions from 'matrix-react-sdk/src/actions/RoomListActions';
import { EchoChamber } from 'matrix-react-sdk/src/stores/local-echo/EchoChamber';
import { MENTIONS_ONLY } from "matrix-react-sdk/src/RoomNotifs";


let invitesRequestInProgress = false

let isAutoAcceptActivated = false
function initAutoAcceptor() {
    if (isAutoAcceptActivated) return
    const user = MatrixClientPeg.get()
    if (!user) return
    const botUser = SdkConfig.get()['inviteBotUser'] || '@zirkuszelt_bot:livingutopia.org'
    isAutoAcceptActivated = true
    user.on('event', async (ev: MatrixEvent) => {
        if (ev.getSender() == botUser && ev.getType() == 'm.room.member' && ev.getContent().membership == 'invite') {
            try {
                const roomId = ev.getRoomId()
                await retry<void, MatrixError>(() => user.joinRoom(roomId), 5, (err) => {
                    return err.httpStatus >= 500;
                });
                const room = user.getRoom(roomId)
                const roomEchoChamber = EchoChamber.forRoom(room)

                // breakout rooms -> low priority
                if (room.name.match(/breakout/i)) {
                    console.log(`tag room ${room.name} as low priority`)
                    const removeTag = DefaultTagID.Favourite;
                    const addTag = DefaultTagID.LowPriority;
                    dis.dispatch(RoomListActions.tagRoom(
                        MatrixClientPeg.get(),
                        room,
                        removeTag,
                        addTag,
                        undefined,
                        0,
                    ));
                    roomEchoChamber.notificationVolume = MENTIONS_ONLY
                }
                // mute tech support channel
                if (room.name.match(/tech[- ]support/i)) {
                    roomEchoChamber.notificationVolume = MENTIONS_ONLY
                }
            } catch (err) {
                console.error('error while auto accepting invite', err)
            }
        }
    });
}

// @ts-ignore
export default class MatrixChatWrapped extends MatrixChat {
    viewUser(userId: string, subAction: string) {
        console.log('DEBUG', 'viewUser')
        // @ts-ignore
        super.viewUser(userId, subAction)
        if (document.fullscreenElement) {
            document.exitFullscreen()
        }
    }

    showScreen(screen: string, params?: {[key: string]: any}) {
        const user = MatrixClientPeg.get()
        if (user && !isAutoAcceptActivated) initAutoAcceptor()

        if (user && screen.startsWith('invite/') && !invitesRequestInProgress) {
            invitesRequestInProgress = true

            const inviteCode = screen.slice(7)
            const userId = user?.credentials?.userId
            const url = SdkConfig.get()['inviteBotUrl']
            console.log('invite', url, inviteCode, userId)

            request({
                method: 'POST',
                url,
                body: JSON.stringify({
                    inviteCode: inviteCode,
                    matrixId: userId,
                }),
                json: true,
            }, (err, res) => {
                invitesRequestInProgress = false
                if (err) {
                    console.error(err)
                } else {
                    const r = JSON.parse(res.response)
                    if (!r?.success) {
                        console.error('invitation request failed', r.error)
                    }
                }
                setTimeout( () => {
                    // @ts-ignore
                    this.viewHome(false);
                }, 1000)
            })
        } else {
            super.showScreen(screen, params)
        }
        // console.log('showScreen', {screen, params})
    }

    /**
     * Called when a new logged in session has started
     */
    async onLoggedIn() {
        ThemeController.isLogin = false;
        // @ts-ignore
        this.themeWatcher.recheck();
        this.setStateForNewView({ view: Views.LOGGED_IN });
        // If a specific screen is set to be shown after login, show that above
        // all else, as it probably means the user clicked on something already.
        const { screenAfterLogin } = this as any
        if (screenAfterLogin && screenAfterLogin.screen) {
            this.showScreen(
                screenAfterLogin.screen,
                screenAfterLogin.params,
            );
            // @ts-ignore
            this.screenAfterLogin = null;
        } else if (MatrixClientPeg.currentUserIsJustRegistered()) {
            MatrixClientPeg.setJustRegisteredUserId(null);

            if (this.props.config.welcomeUserId && getCurrentLanguage().startsWith("en")) {
                // @ts-ignore
                const welcomeUserRoom = await this.startWelcomeUserChat();
                if (welcomeUserRoom === null) {
                    // We didn't redirect to the welcome user room, so show
                    // the homepage.
                    dis.dispatch({action: 'view_home_page', justRegistered: true});
                }
            } else if (ThreepidInviteStore.instance.pickBestInvite()) {
                // The user has a 3pid invite pending - show them that
                const threepidInvite = ThreepidInviteStore.instance.pickBestInvite();

                // HACK: This is a pretty brutal way of threading the invite back through
                // our systems, but it's the safest we have for now.
                const params = ThreepidInviteStore.instance.translateToWireFormat(threepidInvite);
                this.showScreen(`room/${threepidInvite.roomId}`, params)
            } else {
                // The user has just logged in after registering,
                // so show the homepage.
                dis.dispatch({action: 'view_home_page', justRegistered: true});
            }
        } else {
            // @ts-ignore
            this.showScreenAfterLogin();
        }

        // deactivated calls
        /*
        StorageManager.tryPersistStorage();

        // defer the following actions by 30 seconds to not throw them at the user immediately
        await sleep(30);
        if (SettingsStore.getValue("showCookieBar") &&
            (Analytics.canEnable() || CountlyAnalytics.instance.canEnable())
        ) {
            showAnalyticsToast(this.props.config.piwik?.policyUrl);
        }
        if (SdkConfig.get().mobileGuideToast) {
            // The toast contains further logic to detect mobile platforms,
            // check if it has been dismissed before, etc.
            showMobileGuideToast();
        }
        */
    }
}
