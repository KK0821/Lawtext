import { factory } from "../factory";
import { AppdxItemHeadLine, BlankLine, Line, LineType } from "../../../node/cst/line";
import { $blankLine, $optBNK_DEDENT, $optBNK_INDENT, WithErrorRule } from "../util";
import { isAppdxItemTitle, newStdEL, appdxItemTags, appdxItemTitleTags, StdELType, isRelatedArticleNum, isRemarks, isFigStruct, isTableStruct, isNoteLikeStruct, isArithFormula, isParagraphItem } from "../../../law/std";
import * as std from "../../../law/std";
import CST from "../toCSTSettings";
import { ErrorMessage } from "../../cst/error";
import { mergeAdjacentTexts } from "../../cst/util";
import { Control } from "../../../node/cst/inline";
import { rangeOfELs } from "../../../node/el";
import { assertNever } from "../../../util";
import $remarks, { remarksToLines } from "./$remarks";
import { $formatStruct, $noteStruct, $styleStruct, noteLikeStructToLines } from "./$noteLike";
import $figStruct, { figStructToLines } from "./$figStruct";
import $paragraphItem, { paragraphItemToLines } from "./$paragraphItem";
import $tableStruct, { tableStructToLines } from "./$tableStruct";
import $arithFormula, { arithFormulaToLines } from "./$arithFormula";
import { appdxItemTitlePtn } from "../../cst/rules/$appdxItemHeadLine";
import { sentenceChildrenToString } from "../../cst/rules/$sentenceChildren";
import { autoTagControls, tagControls } from "../../cst/rules/$tagControl";


export const appdxItemToLines = (appdxItem: std.AppdxItem, indentTexts: string[]): Line[] => {
    const lines: Line[] = [];

    const appdxItemTitleTag = appdxItemTitleTags[appdxItemTags.indexOf(appdxItem.tag)];

    const appdxItemTitleSentenceChildren = (
        (appdxItem.children as (typeof appdxItem.children)[number][])
            .find(el => el.tag === appdxItemTitleTag) as std.AppdxItemTitle | undefined
    )?.children;

    const relatedArticleNumSentenceChildren = (
        (appdxItem.children as (typeof appdxItem.children)[number][])
            .find(el => el.tag === "RelatedArticleNum") as std.AppdxItemTitle | undefined
    )?.children;

    lines.push(new AppdxItemHeadLine(
        null,
        indentTexts.length,
        indentTexts,
        appdxItem.tag,
        appdxItemTitleSentenceChildren && appdxItemTitlePtn[appdxItem.tag].exec(sentenceChildrenToString(appdxItemTitleSentenceChildren)) ? [
            new Control(
                autoTagControls[0],
                null,
                " ",
                null,
            )
        ] : [
            new Control(
                tagControls[appdxItem.tag],
                null,
                "",
                null,
            )
        ],
        mergeAdjacentTexts(appdxItemTitleSentenceChildren ?? []),
        mergeAdjacentTexts(relatedArticleNumSentenceChildren ?? []),
        CST.EOL,
    ));

    lines.push(new BlankLine(null, CST.EOL));

    const childrenIndentTexts = [...indentTexts, CST.INDENT];

    for (const child of appdxItem.children) {
        if (isAppdxItemTitle(child)) continue;
        if (isRelatedArticleNum(child)) continue;

        if (isNoteLikeStruct(child)) {
            lines.push(...noteLikeStructToLines(child, childrenIndentTexts));
            lines.push(new BlankLine(null, CST.EOL));
        } else if (isRemarks(child)) {
            lines.push(...remarksToLines(child, childrenIndentTexts));
            lines.push(new BlankLine(null, CST.EOL));
        } else if (isFigStruct(child)) {
            lines.push(...figStructToLines(child, childrenIndentTexts));
            lines.push(new BlankLine(null, CST.EOL));
        } else if (isParagraphItem(child)) {
            lines.push(...paragraphItemToLines(child, childrenIndentTexts));
            lines.push(new BlankLine(null, CST.EOL));
        } else if (isTableStruct(child)) {
            lines.push(...tableStructToLines(child, childrenIndentTexts));
            lines.push(new BlankLine(null, CST.EOL));
        } else if (isArithFormula(child)) {
            lines.push(...arithFormulaToLines(child, childrenIndentTexts));
            lines.push(new BlankLine(null, CST.EOL));
        }
        else { assertNever(child); }
    }

    return lines;
};

const appdxItemContentRule = {
    AppdxFig: (
        factory
            .sequence(s => s
                .and(r => r
                    .zeroOrMore(r => r
                        .sequence(s => s
                            .and(r => r
                                .choice(c => c
                                    .or(() => $figStruct)
                                    .or(() => $tableStruct)
                                )
                            )
                            .andOmit(r => r.zeroOrMore(() => $blankLine))
                        )
                    )
                , "content")
                .action(({ content }) => ({
                    value: content.map(c => c.value),
                    errors: content.map(c => c.errors).flat(),
                })),
            )
    ),
    AppdxStyle: (
        factory
            .sequence(s => s
                .and(r => r
                    .zeroOrMore(r => r
                        .sequence(s => s
                            .and(r => r
                                .choice(c => c
                                    .or(() => $styleStruct)
                                )
                            )
                            .andOmit(r => r.zeroOrMore(() => $blankLine))
                        )
                    )
                , "content1")
                .and(r => r
                    .zeroOrMore(r => r
                        .sequence(s => s
                            .and(r => r
                                .choice(c => c
                                    .or(() => $remarks)
                                )
                            )
                            .andOmit(r => r.zeroOrMore(() => $blankLine))
                        )
                    )
                , "content2")
                .action(({ content1, content2 }) => ({
                    value: [content1, content2].flat().map(c => c.value),
                    errors: [content1, content2].flat().map(c => c.errors).flat(),
                })),
            )
    ),
    AppdxFormat: (
        factory
            .sequence(s => s
                .and(r => r
                    .zeroOrMore(r => r
                        .sequence(s => s
                            .and(r => r
                                .choice(c => c
                                    .or(() => $formatStruct)
                                )
                            )
                            .andOmit(r => r.zeroOrMore(() => $blankLine))
                        )
                    )
                , "content1")
                .and(r => r
                    .zeroOrMore(r => r
                        .sequence(s => s
                            .and(r => r
                                .choice(c => c
                                    .or(() => $remarks)
                                )
                            )
                            .andOmit(r => r.zeroOrMore(() => $blankLine))
                        )
                    )
                , "content2")
                .action(({ content1, content2 }) => ({
                    value: [content1, content2].flat().map(c => c.value),
                    errors: [content1, content2].flat().map(c => c.errors).flat(),
                })),
            )
    ),
    AppdxTable: (
        factory
            .sequence(s => s
                .and(r => r
                    .zeroOrMore(r => r
                        .sequence(s => s
                            .and(r => r
                                .choice(c => c
                                    .or(() => $tableStruct)
                                    .or(() => $paragraphItem)
                                )
                            )
                            .andOmit(r => r.zeroOrMore(() => $blankLine))
                        )
                    )
                , "content1")
                .and(r => r
                    .zeroOrMore(r => r
                        .sequence(s => s
                            .and(r => r
                                .choice(c => c
                                    .or(() => $remarks)
                                )
                            )
                            .andOmit(r => r.zeroOrMore(() => $blankLine))
                        )
                    )
                , "content2")
                .action(({ content1, content2 }) => ({
                    value: [content1, content2].flat().map(c => c.value),
                    errors: [content1, content2].flat().map(c => c.errors).flat(),
                })),
            )
    ),
    AppdxNote: (
        factory
            .sequence(s => s
                .and(r => r
                    .zeroOrMore(r => r
                        .sequence(s => s
                            .and(r => r
                                .choice(c => c
                                    .or(() => $noteStruct)
                                    .or(() => $figStruct)
                                    .or(() => $tableStruct)
                                )
                            )
                            .andOmit(r => r.zeroOrMore(() => $blankLine))
                        )
                    )
                , "content1")
                .and(r => r
                    .zeroOrMore(r => r
                        .sequence(s => s
                            .and(r => r
                                .choice(c => c
                                    .or(() => $remarks)
                                )
                            )
                            .andOmit(r => r.zeroOrMore(() => $blankLine))
                        )
                    )
                , "content2")
                .action(({ content1, content2 }) => ({
                    value: [content1, content2].flat().map(c => c.value),
                    errors: [content1, content2].flat().map(c => c.errors).flat(),
                })),
            )
    ),
    Appdx: (
        factory
            .sequence(s => s
                .and(r => r
                    .zeroOrMore(r => r
                        .sequence(s => s
                            .and(r => r
                                .choice(c => c
                                    .or(() => $arithFormula)
                                )
                            )
                            .andOmit(r => r.zeroOrMore(() => $blankLine))
                        )
                    )
                , "content1")
                .and(r => r
                    .zeroOrMore(r => r
                        .sequence(s => s
                            .and(r => r
                                .choice(c => c
                                    .or(() => $remarks)
                                )
                            )
                            .andOmit(r => r.zeroOrMore(() => $blankLine))
                        )
                    )
                , "content2")
                .action(({ content1, content2 }) => ({
                    value: [content1, content2].flat().map(c => c.value),
                    errors: [content1, content2].flat().map(c => c.errors).flat(),
                })),
            )
    ),
} as const;

export const makeAppdxItemRule = <TTag extends (typeof std.appdxItemTags)[number]>(tag: TTag): WithErrorRule<StdELType<TTag>> => {

    const contentRule = appdxItemContentRule[tag];

    const ret = factory
        .withName("appdxItem")
        .sequence(s => s
            .and(r => r
                .oneMatch(({ item }) => {
                    if (
                        item.type === LineType.APP
                        && item.line.mainTag === tag
                    ) {
                        return item;
                    } else {
                        return null;
                    }
                })
            , "titleLine")
            .and(r => r.zeroOrMore(() => $blankLine))
            .and(() => $optBNK_INDENT)
            .and(() => contentRule, "content")
            .and(r => r
                .choice(c => c
                    .or(() => $optBNK_DEDENT)
                    .or(r => r
                        .noConsumeRef(r => r
                            .sequence(s => s
                                .and(r => r.zeroOrMore(() => $blankLine))
                                .and(r => r.anyOne(), "unexpected")
                                .action(({ unexpected, newErrorMessage }) => {
                                    return newErrorMessage(
                                        "appdxItem: この前にある別記類の終了時にインデント解除が必要です。",
                                        unexpected.virtualRange,
                                    );
                                })
                            )
                        )
                    )
                )
            , "error")
            .action(({ titleLine, content, error }) => {
            // for (let i = 0; i < children.value.length; i++) {
            //     children.value[i].attr.Num = `${i + 1}`;
            // }

                const title = titleLine.line.title.length > 0 ? newStdEL(
                    std.appdxItemTitleTags[std.appdxItemTags.indexOf(tag)],
                    {},
                    titleLine.line.title,
                    titleLine.line.titleRange,
                ) : null;
                const relatedArticleNum = titleLine.line.relatedArticleNum.length > 0 ? newStdEL(
                    "RelatedArticleNum",
                    {},
                    titleLine.line.relatedArticleNum,
                    titleLine.line.relatedArticleNumRange,
                ) : null;
                const appdxItem = newStdEL(
                    tag,
                    {},
                    [
                        ...(title ? [title] : []),
                        ...(relatedArticleNum ? [relatedArticleNum] : []),
                        ...content.value,
                    ],
                );
                appdxItem.range = rangeOfELs(appdxItem.children);
                return {
                    value: appdxItem,
                    errors: [
                        ...content.errors,
                        ...(error instanceof ErrorMessage ? [error] : []),
                    ],
                };
            })
        )
    ;
    return ret;
};

export const $appdxFig = makeAppdxItemRule("AppdxFig");
export const $appdxTable = makeAppdxItemRule("AppdxTable");
export const $appdxStyle = makeAppdxItemRule("AppdxStyle");
export const $appdxNote = makeAppdxItemRule("AppdxNote");
export const $appdxFormat = makeAppdxItemRule("AppdxFormat");
export const $appdx = makeAppdxItemRule("Appdx");


