import { factory } from "../factory";
import { Line, LineType, OtherLine } from "../../../node/cst/line";
import { WithErrorRule } from "../util";
import { newStdEL } from "../../../law/std";
import * as std from "../../../law/std";
import CST from "../toCSTSettings";
import { Control, Sentences } from "../../../node/cst/inline";
import { forceSentencesArrayToSentenceChildren } from "../../cst/rules/$sentencesArray";
import { rangeOfELs } from "../../../node/el";

export const supplNoteControl = ":suppl-note:";

export const supplNoteToLines = (supplNote: std.SupplNote, indentTexts: string[]): Line[] => {
    const lines: Line[] = [];

    lines.push(new OtherLine({
        range: null,
        indentTexts,
        controls: [
            new Control(
                supplNoteControl,
                null,
                "",
                null,
            ),
        ],
        sentencesArray: [
            new Sentences(
                "",
                null,
                [],
                [newStdEL("Sentence", {}, supplNote.children)],
            ),
        ],
        lineEndText: CST.EOL,
    }));

    return lines;
};

export const $supplNote: WithErrorRule<std.SupplNote> = factory
    .withName("supplNote")
    .sequence(s => s
        .and(r => r
            .oneMatch(({ item }) => {
                if (
                    item.type === LineType.OTH
                    && item.line.controls.some(c => c.control === supplNoteControl)
                ) {
                    return item;
                } else {
                    return null;
                }
            })
        , "line")
        .action(({ line }) => {
            // for (let i = 0; i < children.value.length; i++) {
            //     children.value[i].attr.Num = `${i + 1}`;
            // }
            const supplNoteChildren = forceSentencesArrayToSentenceChildren(line.line.sentencesArray);
            const supplNote = newStdEL(
                "SupplNote",
                {},
                supplNoteChildren,
                rangeOfELs(supplNoteChildren),
            );
            return {
                value: supplNote,
                errors: [],
            };
        })
    )
    ;

export default $supplNote;
