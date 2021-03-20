import MatrixChat from 'matrix-react-sdk/src/components/structures/MatrixChat'
import {MatrixClientPeg} from 'matrix-react-sdk/src/MatrixClientPeg';
import SdkConfig from 'matrix-react-sdk/src/SdkConfig';
import request from 'browser-request'
import { MatrixEvent } from "matrix-js-sdk/src/models/event";
import { retry } from 'matrix-react-sdk/src/utils/promise';
import { MatrixError } from "matrix-js-sdk/src/http-api";


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
                    // if we received a Gateway timeout then retry
                    return err.httpStatus === 504;
                });
            } catch (err) {
                console.error('error while auto accepting invite', err)
            }
        }
    });
}

export default class MatrixChatWrapped extends MatrixChat {
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
                    if(!r?.success) {
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
}
