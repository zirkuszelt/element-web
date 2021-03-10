import {
    StopGapWidgetDriver as SuperStopGapWidgetDriver,
} from 'matrix-react-sdk/src/stores/widgets/StopGapWidgetDriver'

import {
    Capability,
    MatrixCapabilities,
    Widget,
    WidgetKind,
} from "matrix-widget-api";


export class StopGapWidgetDriver extends SuperStopGapWidgetDriver {
    constructor(
        allowedCapabilities: Capability[],
        forWidget: Widget,
        forWidgetKind: WidgetKind,
        inRoomId?: string,
    ) {
        super(allowedCapabilities, forWidget, forWidgetKind, inRoomId);


        // allow AlwaysOnScreen for all widgets of type edumeet
        if (forWidget.type == 'edumeet' && forWidgetKind === WidgetKind.Room) {
            // @ts-ignore : allowedCapabilities is markes as private, but this is only a typescript concept
            this.allowedCapabilities.add(MatrixCapabilities.AlwaysOnScreen);
        }
    }
}
