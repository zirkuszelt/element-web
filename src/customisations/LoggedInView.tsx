import LoggedInView from 'matrix-react-sdk/src/components/structures/LoggedInView'
import dis from 'matrix-react-sdk/src/dispatcher/dispatcher';
import {Resizer, CollapseDistributor} from 'matrix-react-sdk/src/resizer';
import { ICollapseConfig } from "matrix-react-sdk/src/resizer/distributors/collapse";


export default class LoggedInViewWrapped extends LoggedInView {
    _createResizer() {
        let size;
        let collapsed;
        const collapseConfig: ICollapseConfig = {
            toggleSize: 150,
            onCollapsed: (_collapsed) => {
                collapsed = _collapsed;
                if (_collapsed) {
                    dis.dispatch({action: "hide_left_panel"}, true);
                    window.localStorage.setItem("mx_lhs_size", '0');
                } else {
                    dis.dispatch({action: "show_left_panel"}, true);
                }
            },
            onResized: (_size) => {
                size = _size;
                this.props.resizeNotifier.notifyLeftHandleResized();
            },
            onResizeStart: () => {
                this.props.resizeNotifier.startResizing();
            },
            onResizeStop: () => {
                if (!collapsed) window.localStorage.setItem("mx_lhs_size", '' + size);
                this.props.resizeNotifier.stopResizing();
            },
            isItemCollapsed: domNode => {
                return domNode.classList.contains("mx_LeftPanel_minimized");
            },
        };
        const resizer = new Resizer(this._resizeContainer.current, CollapseDistributor, collapseConfig);
        resizer.setClassNames({
            handle: "mx_ResizeHandle",
            vertical: "mx_ResizeHandle_vertical",
            reverse: "mx_ResizeHandle_reverse",
        });
        return resizer;
    }

    _loadResizerPreferences() {
        let lhsSize = parseInt(window.localStorage.getItem("mx_lhs_size"), 10);
        if (isNaN(lhsSize)) {
            lhsSize = 180;
        }
        this.resizer.forHandleAt(0).resize(lhsSize);
    }

}
