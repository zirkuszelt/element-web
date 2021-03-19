import MatrixChat from 'matrix-react-sdk/src/components/structures/MatrixChat'
import {MatrixClientPeg} from 'matrix-react-sdk/src/MatrixClientPeg';
import SdkConfig from 'matrix-react-sdk/src/SdkConfig';
import request from 'browser-request'

let invitesRequestInProgress = false

export default class MatrixChatWrapped extends MatrixChat {
    showScreen(screen: string, params?: {[key: string]: any}) {
        const user = MatrixClientPeg.get()
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
