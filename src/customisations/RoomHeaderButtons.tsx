import React from 'react';
import RoomHeaderButtons from 'matrix-react-sdk/src/components/views/right_panel/RoomHeaderButtons'
import HeaderButton from 'matrix-react-sdk/src/components/views/right_panel/HeaderButton';
import { RightPanelPhases } from 'matrix-react-sdk/src/stores/RightPanelStorePhases';

import { _t } from 'matrix-react-sdk/src/languageHandler';
import defaultDispatcher from "matrix-react-sdk/src/dispatcher/dispatcher";
import {Action} from "matrix-react-sdk/src/dispatcher/actions";
import {SetRightPanelPhasePayload} from "matrix-react-sdk/src/dispatcher/payloads/SetRightPanelPhasePayload";


const ROOM_INFO_PHASES = [
    RightPanelPhases.RoomSummary,
    RightPanelPhases.Widget,
    RightPanelPhases.FilePanel,
    RightPanelPhases.RoomMemberInfo,
    RightPanelPhases.EncryptionPanel,
    RightPanelPhases.Room3pidMemberInfo,
];

export default class RoomHeaderButtonsModified extends RoomHeaderButtons {
    openMembersList() {
        defaultDispatcher.dispatch<SetRightPanelPhasePayload>({
            action: Action.SetRightPanelPhase,
            phase: RightPanelPhases.RoomMemberList,
        });
    }
    private onRoomSummaryClicked = () => {
        this.setPhase(RightPanelPhases.RoomSummary);
    };
    public renderButtons() {
        return [
            <HeaderButton
                key="notifsButton"
                name="membersButton"
                title={_t("Members")}
                isHighlighted={this.isPhase(RightPanelPhases.RoomMemberList)}
                onClick={this.openMembersList}
                analytics={['Right Panel', 'Members Button', 'click']}
            />,
            <HeaderButton
                key="roomSummaryButton"
                name="roomSummaryButton"
                title={_t('Room Info')}
                isHighlighted={this.isPhase(ROOM_INFO_PHASES)}
                onClick={
                    this.onRoomSummaryClicked
                }
                analytics={['Right Panel', 'Room Summary Button', 'click']}
            />,
        ];
    }
}