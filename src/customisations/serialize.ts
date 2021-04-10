
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
    const md = mdSerialize(model).trim();

    // if it is only a short message
    // do not treat it as markdown
    if (md.length <= 4) {
        return md
    } else {
        // never treat first character as beginng of an list
        if (md[0].match(/[+\-*]/)) {
            model.parts[0].validateAndInsert(0, '\\', 'plain')
        }
        return htmlSerializeIfNeededOriginal(model)
    }
}
