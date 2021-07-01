/* eslint-disable no-irregular-whitespace */
import { __Text, EL } from "@coresrc/util";
import { factory } from "../common";
import { $ROUND_PARENTHESES_INLINE } from "../inline";
import { $_, $NEWLINE, $INDENT, $DEDENT } from "../lexical";
import { $fig_struct } from "./figStruct";
import { $table_struct } from "./tableStruct";


export const $appdx_fig_title = factory
    .withName("appdx_fig_title")
    .action(r => r
        .sequence(c => c
            .and(r => r
                .action(r => r
                    .sequence(c => c
                        .and(r => r
                            .asSlice(r => r
                                .sequence(c => c
                                    .and(r => r
                                        .seqEqual("別図"),
                                    )
                                    .and(r => r
                                        .zeroOrMore(r => r
                                            .regExp(/^[^\r\n(（]/),
                                        ),
                                    ),
                                ),
                            )
                        , "title")
                        .and(r => r
                            .zeroOrOne(r => r
                                .action(r => r
                                    .sequence(c => c
                                        .and(r => r
                                            .ref(() => $_),
                                        )
                                        .and(r => r
                                            .ref(() => $ROUND_PARENTHESES_INLINE)
                                        , "target"),
                                    )
                                , (({ target }) => {
                                    return target;
                                }),
                                ),
                            )
                        , "related_article_num")
                        .and(r => r
                            .zeroOrMore(r => r
                                .regExp(/^[^\r\n(（]/),
                            )
                        , "fig_struct_title"),
                    )
                , (({ text, title, related_article_num, fig_struct_title }) => {
                    return {
                        text: text(),
                        title: title,
                        related_article_num: related_article_num,
                        fig_struct_title: fig_struct_title,
                    };
                }),
                )
            , "title_struct"),
        )
    , (({ title_struct }) => {
        return title_struct;
    }),
    )
    ;

export const $appdx_fig = factory
    .withName("appdx_fig")
    .action(r => r
        .sequence(c => c
            .and(r => r
                .ref(() => $appdx_fig_title)
            , "title_struct")
            .and(r => r
                .oneOrMore(r => r
                    .ref(() => $NEWLINE),
                ),
            )
            .and(r => r
                .choice(c => c
                    .or(r => r
                        .action(r => r
                            .sequence(c => c
                                .and(r => r
                                    .action(r => r
                                        .sequence(c => c
                                            .and(r => r
                                                .ref(() => $INDENT),
                                            )
                                            .and(r => r
                                                .action(r => r
                                                    .sequence(c => c
                                                        .and(r => r
                                                            .ref(() => $appdx_fig_children)
                                                        , "first")
                                                        .and(r => r
                                                            .zeroOrMore(r => r
                                                                .action(r => r
                                                                    .sequence(c => c
                                                                        .and(r => r
                                                                            .oneOrMore(r => r
                                                                                .ref(() => $NEWLINE),
                                                                            ),
                                                                        )
                                                                        .and(r => r
                                                                            .ref(() => $appdx_fig_children)
                                                                        , "_target"),
                                                                    )
                                                                , (({ _target }) => {
                                                                    return _target;
                                                                }),
                                                                ),
                                                            )
                                                        , "rest"),
                                                    )
                                                , (({ first, rest }) => {
                                                    return [first].concat(rest);
                                                }),
                                                )
                                            , "target")
                                            .and(r => r
                                                .zeroOrMore(r => r
                                                    .ref(() => $NEWLINE),
                                                ),
                                            )
                                            .and(r => r
                                                .ref(() => $DEDENT),
                                            ),
                                        )
                                    , (({ target }) => {
                                        return target;
                                    }),
                                    )
                                , "children"),
                            )
                        , (({ title_struct, children }) => {
                            const appdx_fig = new EL("AppdxFig");
                            appdx_fig.append(new EL("AppdxFigTitle", {}, [new __Text(title_struct.title)]));
                            if (title_struct.related_article_num) {
                                appdx_fig.append(new EL("RelatedArticleNum", {}, [title_struct.related_article_num]));
                            }
                            appdx_fig.extend(children || []);

                            return appdx_fig;
                        }),
                        ),
                    )
                    .or(r => r
                        .assert(({ location }) => {
                            throw new Error(`Line ${location().start.line}: Detected AppdxFig but found error inside it.`);
                        }),
                    ),
                )
            , "success"),
        )
    , (({ success }) => {
        return success as EL;
    }),
    )
    ;

export const $appdx_fig_children = factory
    .withName("appdx_fig_children")
    .choice(c => c
        .or(r => r
            .ref(() => $fig_struct),
        )
        .or(r => r
            .ref(() => $table_struct),
        ),
    )
    ;

export const rules = {
    appdx_fig_title: $appdx_fig_title,
    appdx_fig: $appdx_fig,
    appdx_fig_children: $appdx_fig_children,
};
