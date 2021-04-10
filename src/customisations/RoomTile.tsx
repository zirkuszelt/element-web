/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 New Vector Ltd
Copyright 2018 Michael Telatynski <7t3chguy@gmail.com>
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

import React from "react";
import { _t } from "matrix-react-sdk/src/languageHandler";
import { ChevronFace, ContextMenuTooltipButton } from "matrix-react-sdk/src/components/structures/ContextMenu";
import { DefaultTagID } from "matrix-react-sdk/src/stores/room-list/models";
import RoomListStore from "matrix-react-sdk/src/stores/room-list/RoomListStore";
import IconizedContextMenu, {
    IconizedContextMenuCheckbox,
    IconizedContextMenuOption,
    IconizedContextMenuOptionList,
} from "matrix-react-sdk/src/components/views/context_menus/IconizedContextMenu";
import RoomTile from 'matrix-react-sdk/src/components/views/rooms/RoomTile'

type PartialDOMRect = Pick<DOMRect, "left" | "bottom">;


const contextMenuBelow = (elementRect: PartialDOMRect) => {
    // align the context menu's icons with the icon which opened the context menu
    const left = elementRect.left + window.pageXOffset - 9;
    const top = elementRect.bottom + window.pageYOffset + 17;
    const chevronFace = ChevronFace.None;
    return {left, top, chevronFace};
};

export default class RoomTileModified extends (RoomTile as any) {
    private renderGeneralMenu(): React.ReactElement {
        if (!this.showContextMenu) return null; // no menu to show

        let contextMenu = null;
        if (this.state.generalMenuPosition && this.props.tag === DefaultTagID.Archived) {
            contextMenu = <IconizedContextMenu
                {...contextMenuBelow(this.state.generalMenuPosition)}
                onFinished={this.onCloseGeneralMenu}
                className="mx_RoomTile_contextMenu"
                compact
            >
                <IconizedContextMenuOptionList red>
                    <IconizedContextMenuOption
                        iconClassName="mx_RoomTile_iconSignOut"
                        label={_t("Forget Room")}
                        onClick={this.onForgetRoomClick}
                    />
                </IconizedContextMenuOptionList>
            </IconizedContextMenu>;
        } else if (this.state.generalMenuPosition) {
            const roomTags = RoomListStore.instance.getTagsForRoom(this.props.room);

            const isFavorite = roomTags.includes(DefaultTagID.Favourite);
            const favouriteLabel = isFavorite ? _t("Favourited") : _t("Favourite");

            const isLowPriority = roomTags.includes(DefaultTagID.LowPriority);
            const lowPriorityLabel = _t("Low Priority");

            contextMenu = <IconizedContextMenu
                {...contextMenuBelow(this.state.generalMenuPosition)}
                onFinished={this.onCloseGeneralMenu}
                className="mx_RoomTile_contextMenu"
                compact
            >
                <IconizedContextMenuOptionList>
                    <IconizedContextMenuCheckbox
                        onClick={(e) => this.onTagRoom(e, DefaultTagID.Favourite)}
                        active={isFavorite}
                        label={favouriteLabel}
                        iconClassName="mx_RoomTile_iconStar"
                    />
                    <IconizedContextMenuCheckbox
                        onClick={(e) => this.onTagRoom(e, DefaultTagID.LowPriority)}
                        active={isLowPriority}
                        label={lowPriorityLabel}
                        iconClassName="mx_RoomTile_iconArrowDown"
                    />

                    <IconizedContextMenuOption
                        onClick={this.onOpenRoomSettings}
                        label={_t("Settings")}
                        iconClassName="mx_RoomTile_iconSettings"
                    />
                </IconizedContextMenuOptionList>
            </IconizedContextMenu>;
        }

        return (
            <React.Fragment>
                <ContextMenuTooltipButton
                    className="mx_RoomTile_menuButton"
                    onClick={this.onGeneralMenuOpenClick}
                    title={_t("Room options")}
                    isExpanded={!!this.state.generalMenuPosition}
                />
                {contextMenu}
            </React.Fragment>
        );
    }
}