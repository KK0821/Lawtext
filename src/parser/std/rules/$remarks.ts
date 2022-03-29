import { factory } from "../factory";
import { Line, LineType, OtherLine } from "../../../node/cst/line";
import { $blankLine, $optBNK_DEDENT, $optBNK_INDENT, WithErrorRule } from "../util";
import { newStdEL } from "../../../law/std";
import * as std from "../../../law/std";
import CST from "../toCSTSettings";
import { ErrorMessage } from "../../cst/error";
import $paragraphItem, { paragraphItemToLines } from "./$paragraphItem";
import { Control, Sentences } from "../../../node/cst/inline";
import { rangeOfELs } from "../../../node/el";
import { assertNever } from "../../../util";


const $remarksChildren: WithErrorRule<(std.Sentence | std.ParagraphItem)[]> = factory
    .withName("remarksChildren")
    .sequence(s => s
        .and(r => r
            .oneOrMore(r => r
                .sequence(s => s
                    .andOmit(r => r.zeroOrMore(() => $blankLine))
                    .and(r => r
                        .choice(c => c
                            .orSequence(s => s
                                .and(() => $paragraphItem, "paragraphItem")
                                .action(({ paragraphItem }) => {
                                    return {
                                        value: [paragraphItem.value],
                                        errors: paragraphItem.errors,
                                    };
                                })
                            )
                            .or(r => r
                                .oneMatch(({ item }) => {
                                    if (
                                        item.type === LineType.OTH
                                && item.line.type === LineType.OTH
                                && item.line.sentencesArray.length > 0
                                    ) {
                                        return {
                                            value: item.line.sentencesArray.flat().map(ss => ss.sentences).flat(),
                                            errors: [],
                                        };
                                    } else {
                                        return null;
                                    }
                                })
                            )
                        )
                    )
                )
            )
        , "children")
        .action(({ children }) => {
            return {
                value: children.map(c => c.value).flat(),
                errors: children.map(c => c.errors).flat(),
            };
        })
    );

export const remarksToLines = (remarks: std.Remarks, indentTexts: string[]): Line[] => {
    const lines: Line[] = [];

    const remarksLabelText = remarks.children.find(el => el.tag === "RemarksLabel")?.text ?? "";
    const controls = /^(?:備\s*考|注)\s*$/.exec(remarksLabelText) ? [] : [
        new Control(
            ":remarks:",
            null,
            "",
            null,
        ),
    ];

    lines.push(new OtherLine(
        null,
        indentTexts.length,
        indentTexts,
        controls,
        remarksLabelText ? [
            new Sentences(
                "",
                null,
                [],
                [newStdEL("Sentence", {}, [remarksLabelText])]
            )
        ] : [],
        CST.EOL,
    ));

    const childrenIndentTexts = [...indentTexts, CST.INDENT];

    for (const child of remarks.children) {
        if (child.tag === "RemarksLabel") continue;

        if (child.tag === "Sentence") {
            lines.push(new OtherLine(
                null,
                childrenIndentTexts.length,
                childrenIndentTexts,
                [],
                [
                    new Sentences(
                        "",
                        null,
                        [],
                        [child]
                    ),
                ],
                CST.EOL,
            ));
        } else if (child.tag === "Item") {
            const itemLines = paragraphItemToLines(child, childrenIndentTexts);
            lines.push(...itemLines);
        }
        else { assertNever(child); }
    }

    return lines;
};

export const $remarks: WithErrorRule<std.Remarks> = factory
    .withName("remarks")
    .sequence(s => s
        .and(r => r
            .oneMatch(({ item }) => {
                if (
                    item.type === LineType.OTH
                    && item.line.type === LineType.OTH
                    && (
                        (
                            item.line.controls.some(c => /^:remarks:$/.exec(c.control))
                        )
                        || (
                            item.line.sentencesArray.length > 0
                            && /^(?:備\s*考|注)\s*$/.exec(item.line.sentencesArray[0].sentences[0].text)
                        )
                    )
                ) {
                    return item;
                } else {
                    return null;
                }
            })
        , "labelLine")
        .and(r => r.zeroOrMore(() => $blankLine))
        .and(() => $optBNK_INDENT)
        .and(() => $remarksChildren, "children")
        .and(r => r
            .choice(c => c
                .or(() => $optBNK_DEDENT)
                .or(r => r
                    .noConsumeRef(r => r
                        .sequence(s => s
                            .and(r => r.zeroOrMore(() => $blankLine))
                            .and(r => r.anyOne(), "unexpected")
                            .action(({ unexpected }) => {
                                return new ErrorMessage(
                                    "$remarks: この前にある備考の終了時にインデント解除が必要です。",
                                    unexpected.virtualRange,
                                );
                            })
                        )
                    )
                )
            )
        , "error")
        .action(({ labelLine, children, error }) => {
            // for (let i = 0; i < children.value.length; i++) {
            //     children.value[i].attr.Num = `${i + 1}`;
            // }
            const remarksLabelText = labelLine.line.sentencesArray.map(ss => ss.sentences).flat().map(s => s.text).join("");
            const remarksLabel = remarksLabelText ? newStdEL(
                "RemarksLabel",
                {},
                [remarksLabelText],
                labelLine.virtualRange,
            ) : null;
            const remarks = newStdEL(
                "Remarks",
                {},
                [
                    ...(remarksLabel ? [remarksLabel] : []),
                    ...children.value
                ],
            );
            remarks.range = rangeOfELs(remarks.children);
            return {
                value: remarks,
                errors: [
                    ...children.errors,
                    ...(error instanceof ErrorMessage ? [error] : []),
                ],
            };
        })
    )
    ;

export default $remarks;
