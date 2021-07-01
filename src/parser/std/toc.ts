/* eslint-disable no-irregular-whitespace */
import { EL, articleGroupTitleTag, parseNamedNum, articleGroupType, __Parentheses } from "@coresrc/util";
import { factory, ValueRule } from "../common";
import { $OUTSIDE_ROUND_PARENTHESES_INLINE, $ROUND_PARENTHESES_INLINE } from "../inline";
import { $NEWLINE, $DEDENT, $INDENT } from "../lexical";


export const $toc_label = factory
    .withName("toc_label")
    .sequence(c => c
        .and(r => r
            .nextIsNot(r => r
                .ref(() => $INDENT),
            ),
        )
        .and(r => r
            .nextIsNot(r => r
                .ref(() => $DEDENT),
            ),
        )
        .and(r => r
            .nextIsNot(r => r
                .ref(() => $NEWLINE),
            ),
        )
        .and(r => r
            .sequence(c => c
                .and(r => r
                    .zeroOrMore(r => r
                        .regExp(/^[^\r\n目]/),
                    ),
                )
                .and(r => r
                    .seqEqual("目次"),
                ),
            ),
        )
        .and(r => r
            .nextIs(r => r
                .ref(() => $NEWLINE),
            ),
        ),
    )
    ;

export const $toc = factory
    .withName("toc")
    .action(r => r
        .sequence(c => c
            .and(r => r
                .asSlice(r => r
                    .ref(() => $toc_label),
                )
            , "toc_label")
            .and(r => r
                .ref(() => $NEWLINE),
            )
            .and(r => r
                .ref(() => $INDENT),
            )
            .and(r => r
                .ref(() => $toc_item)
            , "first")
            .and(r => r
                .zeroOrMore(r => r
                    .action(r => r
                        .sequence(c => c
                            .and(r => r
                                .ref(() => $toc_item)
                            , "target"),
                        )
                    , (({ target }) => {
                        return target;
                    }),
                    ),
                )
            , "rest")
            .and(r => r
                .zeroOrMore(r => r
                    .ref(() => $NEWLINE),
                ),
            )
            .and(r => r
                .ref(() => $DEDENT),
            ),
        )
    , (({ toc_label, first, rest }) => {
        const children = [first].concat(rest);

        const toc = new EL("TOC", {}, []);
        toc.append(new EL("TOCLabel", {}, [toc_label]));
        toc.extend(children);

        return toc;
    }),
    )
    ;

export const $toc_item: ValueRule<EL> = factory
    .withName("toc_item")
    .action(r => r
        .sequence(c => c
            .and(r => r
                .nextIsNot(r => r
                    .ref(() => $INDENT),
                ),
            )
            .and(r => r
                .nextIsNot(r => r
                    .ref(() => $DEDENT),
                ),
            )
            .and(r => r
                .nextIsNot(r => r
                    .ref(() => $NEWLINE),
                ),
            )
            .and(r => r
                .action(r => r
                    .sequence(c => c
                        .and(r => r
                            .oneOrMore(r => r
                                .choice(c => c
                                    .or(r => r
                                        .action(r => r
                                            .sequence(c => c
                                                .and(r => r
                                                    .ref(() => $OUTSIDE_ROUND_PARENTHESES_INLINE)
                                                , "target"),
                                            )
                                        , (({ target }) => {
                                            return target.content;
                                        }),
                                        ),
                                    )
                                    .or(r => r
                                        .action(r => r
                                            .sequence(c => c
                                                .and(r => r
                                                    .ref(() => $ROUND_PARENTHESES_INLINE)
                                                , "target"),
                                            )
                                        , (({ target }) => {
                                            return [target];
                                        }),
                                        ),
                                    ),
                                ),
                            )
                        , "sets"),
                    )
                , (({ sets }) => {
                    const ret: EL[] = [];
                    for (const set of sets) {
                        ret.push(...set);
                    }
                    return ret;
                }),
                )
            , "fragments")
            .and(r => r
                .ref(() => $NEWLINE),
            )
            .and(r => r
                .zeroOrOne(r => r
                    .action(r => r
                        .sequence(c => c
                            .and(r => r
                                .ref(() => $INDENT),
                            )
                            .and(r => r
                                .ref(() => $toc_item)
                            , "first")
                            .and(r => r
                                .zeroOrMore(r => r
                                    .action(r => r
                                        .sequence(c => c
                                            .and(r => r
                                                .ref(() => $toc_item)
                                            , "target"),
                                        )
                                    , (({ target }) => {
                                        return target;
                                    }),
                                    ),
                                )
                            , "rest")
                            .and(r => r
                                .zeroOrMore(r => r
                                    .ref(() => $NEWLINE),
                                ),
                            )
                            .and(r => r
                                .ref(() => $DEDENT),
                            ),
                        )
                    , (({ first, rest }) => {
                        return [first].concat(rest);
                    }),
                    ),
                )
            , "children"),
        )
    , (({ fragments, children }) => {
        const last_fragment = fragments[fragments.length - 1];
        let article_range;
        let title_fragments;
        if (last_fragment instanceof __Parentheses && last_fragment.attr.type === "round") {
            title_fragments = fragments.slice(0, fragments.length - 1);
            article_range = last_fragment;
        } else {
            title_fragments = fragments.slice(0, fragments.length);
            article_range = null;
        }
        if (!title_fragments[0].text) console.error(title_fragments);

        let toc_item;

        if (title_fragments[0].text.match(/前文/)) {
            toc_item = new EL("TOCPreambleLabel", {}, title_fragments);
        } else {
            const type_char = title_fragments[0].text.match(/[編章節款目章則]/)?.[0];
            toc_item = new EL("TOC" + articleGroupType[type_char as keyof typeof articleGroupType]);

            if (title_fragments[0].text.match(/[編章節款目章]/)) {
                toc_item.attr.Delete = "false";
                const num = parseNamedNum(title_fragments[0].text);
                if (num) {
                    toc_item.attr.Num = num;
                }
            }

            toc_item.append(new EL(
                articleGroupTitleTag[type_char as keyof typeof articleGroupTitleTag],
                {},
                title_fragments,
            ));

            if (article_range !== null) {
                toc_item.append(new EL(
                    "ArticleRange",
                    {},
                    [article_range],
                ));
            }

            toc_item.extend(children || []);
        }

        return toc_item;
    }),
    )
    ;


export const rules = {
    toc_label: $toc_label,
    toc: $toc,
    toc_item: $toc_item,
};
