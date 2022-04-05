import { Line, LineType, OtherLine } from "../../../node/cst/line";
import { newStdEL } from "../../../law/std";
import * as std from "../../../law/std";
import { sentencesArrayToColumnsOrSentences } from "./columnsOrSentences";
import CST from "../toCSTSettings";
import { assertNever } from "../../../util";
import { SentenceChildEL, Sentences } from "../../../node/cst/inline";
import { WithErrorRule } from "../util";
import factory from "../factory";
import { VirtualOnlyLineType } from "../virtualLine";
import { $blankLine } from "../util";
import $paragraphItem, { $autoParagraphItemChildrenOuter, paragraphItemFromAuto, paragraphItemToLines } from "./$paragraphItem";
import $supplNote, { supplNoteToLines } from "./$supplNote";

export const articleToLines = (el: std.Article, indentTexts: string[]): Line[] => {
    const lines: Line[] = [];

    const ArticleCaption: (string | SentenceChildEL)[] = [];
    const ArticleTitle: (string | SentenceChildEL)[] = [];
    const Paragraphs: std.Paragraph[] = [];
    const SupplNotes: std.SupplNote[] = [];
    for (const child of el.children) {

        if (child.tag === "ArticleCaption") {
            ArticleCaption.push(...child.children);

        } else if (child.tag === "ArticleTitle") {
            ArticleTitle.push(...child.children);

        } else if (child.tag === "Paragraph") {
            Paragraphs.push(child);

        } else if (child.tag === "SupplNote") {
            SupplNotes.push(child);

        }
        else { assertNever(child); }
    }

    if (ArticleCaption.length > 0) {
        const newIndentTexts = [...indentTexts, CST.INDENT];

        lines.push(new OtherLine(
            null,
            newIndentTexts.length,
            newIndentTexts,
            [],
            [
                new Sentences(
                    "",
                    null,
                    [],
                    [newStdEL("Sentence", {}, ArticleCaption)]
                )
            ],
            CST.EOL,
        ));
    }

    for (let i = 0; i < Paragraphs.length; i++) {
        const Paragraph = Paragraphs[i];
        const paragraphLines = paragraphItemToLines(
            Paragraph,
            indentTexts,
            {
                firstArticleParagraphArticleTitle: (i === 0 && ArticleTitle) ? ArticleTitle : undefined,
                secondaryArticleParagraph: i >= 1,
                defaultTag: "Paragraph",
            },
        );
        lines.push(...paragraphLines);
    }

    for (const SupplNote of SupplNotes) {
        lines.push(...supplNoteToLines(SupplNote, indentTexts));
    }

    return lines;
};


export const $article: WithErrorRule<std.Article> = factory
    .withName("article")
    .sequence(s => s
        .and(r => r
            .zeroOrOne(r => r
                .sequence(s => s
                    .and(r => r
                        .oneMatch(({ item }) => {
                            if (
                                item.type === VirtualOnlyLineType.CAP
                            ) {
                                return item;
                            } else {
                                return null;
                            }
                        })
                    )
                    .andOmit(r => r.zeroOrMore(() => $blankLine))
                )
            )
        , "captionLine")
        .and(r => r
            .oneMatch(({ item }) => {
                if (
                    item.type === LineType.ART
                ) {
                    return item;
                } else {
                    return null;
                }
            })
        , "firstParagraphItemLine")
        .andOmit(r => r.zeroOrMore(() => $blankLine))
        .and(r => r
            .zeroOrOne(() => $autoParagraphItemChildrenOuter)
        , "firstAutoParagraphChildren")
        .andOmit(r => r.zeroOrMore(() => $blankLine))
        .and(r => r
            .zeroOrMore(r => r
                .sequence(s => s
                    .andOmit(r => r.zeroOrMore(() => $blankLine))
                    .and(() => $paragraphItem("Paragraph"))
                )
            )
        , "otherParagraphs")
        .andOmit(r => r.zeroOrMore(() => $blankLine))
        .and(r => r
            .zeroOrMore(() => $supplNote)
        , "supplNotes")
        .action(({ captionLine, firstParagraphItemLine, firstAutoParagraphChildren, otherParagraphs, supplNotes }) => {
            const article = newStdEL("Article");
            const errors = [
                ...(firstAutoParagraphChildren?.errors ?? []),
                ...otherParagraphs.map(p => p.errors).flat(),
                ...supplNotes.map(n => n.errors).flat(),
            ];

            article.attr.Delete = "false";
            article.attr.Hide = "false";

            if (captionLine) {
                article.append(
                    newStdEL(
                        "ArticleCaption",
                        {},
                        captionLine.line.sentencesArray
                            .map(sa =>
                                sa.sentences.map(s => s.children)
                            )
                            .flat(2),
                        captionLine.line.sentencesArrayRange,
                    ));
            }

            if (firstParagraphItemLine.line.title) {
                article.append(
                    newStdEL(
                        "ArticleTitle",
                        {},
                        [firstParagraphItemLine.line.title],
                        firstParagraphItemLine.line.titleRange,
                    ));
            }

            const firstParagraph = newStdEL("Paragraph");
            firstParagraph.attr.OldStyle = "false";

            firstParagraph.append(newStdEL("ParagraphNum"));
            firstParagraph.append(
                newStdEL(
                    "ParagraphSentence",
                    {},
                    sentencesArrayToColumnsOrSentences(firstParagraphItemLine.line.sentencesArray),
                    firstParagraphItemLine.line.sentencesArrayRange
                )
            );

            if (firstAutoParagraphChildren) {
                firstParagraph.extend(firstAutoParagraphChildren.value);
            }

            firstParagraph.setRangeFromChildren();
            article.append(paragraphItemFromAuto("Paragraph", firstParagraph) as std.Paragraph);

            article.extend(otherParagraphs.map(p => p.value));

            article.extend(supplNotes.map(n => n.value));

            return {
                value: article.setRangeFromChildren(),
                errors,
            };
        })
    )
    ;

export default $article;
