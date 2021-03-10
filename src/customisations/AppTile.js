import AppTile from 'matrix-react-sdk/src/components/views/elements/AppTile';
import SdkConfig from 'matrix-react-sdk/src/SdkConfig';
import WidgetUtils from 'matrix-react-sdk/src/utils/WidgetUtils.ts';

function isWhitelistedEdumeetWidget({ type, url, data}) {
    if (type !== 'edumeet') return false;
    if (url && !WidgetUtils.isScalarUrl(url)) return false;
    if (data.url && !WidgetUtils.isScalarUrl(data.url)) return false;
    const whitelistedDomains = SdkConfig.get().edumeet_whitelisted || ['edumeet-widget.zirkuszelt.org'];
    if (!whitelistedDomains.includes(data.domain)) return false;

    // maybe url is modified?
    if (url && (!url.match(/&domain=\$domain&/) || url.match(/domain=/g).length > 1)) return false;
    if (data.url && (!data.url.match(/&domain=\$domain&/) || data.url.match(/domain=/g).length > 1)) return false;
    return true;
}

export default class AppTileWrapped extends AppTile {
    constructor(props) {
        super(props);

        // wrap hasPermissionToLoad to allow edumeet widgets without a permission prompt
        const superHasPermissionToLoad = this.hasPermissionToLoad;
        this.hasPermissionToLoad = (props) => {
            if (isWhitelistedEdumeetWidget(props.app)) return true;
            return superHasPermissionToLoad(props);
        };
        this.state.hasPermissionToLoad = this.hasPermissionToLoad(props);
    }
}
