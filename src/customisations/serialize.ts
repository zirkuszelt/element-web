
export {
    mdSerialize,
    textSerialize,
    containsEmote,
    startsWith,
    stripEmoteCommand,
    stripPrefix,
    unescapeMessage,
} from 'matrix-react-sdk/src/editor/serialize'
import EditorModel from 'matrix-react-sdk/src/editor/model'
import {
    mdSerialize,
    htmlSerializeIfNeeded as htmlSerializeIfNeededOriginal
} from 'matrix-react-sdk/src/editor/serialize'


export function htmlSerializeIfNeeded(model: EditorModel) {
    const md = mdSerialize(model);

    // if it is only a single character,
    // do not treat it as markdown
    if (md.trim().length <= 1) {
        return md
    } else {
        return htmlSerializeIfNeededOriginal(model)
    }
}
