/* eslint-disable no-irregular-whitespace */
import { __Text, EL } from "@coresrc/util";
import { factory } from "../common";
import { $ROUND_PARENTHESES_INLINE } from "../inline";
import { $_, $NEWLINE, $CHAR, $INDENT, $DEDENT } from "../lexical";
import { $format_struct } from "./formatStruct";


export const $appdx_format_title = factory
    .withName("appdx_format_title")
    .action(r => r
        .sequence(c => c
            .and(r => r
                .action(r => r
                    .sequence(c => c
                        .and(r => r
                            .asSlice(r => r
                                .sequence(c => c
                                    .and(r => r
                                        .zeroOrMore(r => r
                                            .sequence(c => c
                                                .and(r => r
                                                    .nextIsNot(r => r
                                                        .choice(c => c
                                                            .or(r => r
                                                                .seqEqual("様式"),
                                                            )
                                                            .or(r => r
                                                                .seqEqual("書式"),
                                                            ),
                                                        ),
                                                    ),
                                                )
                                                .and(r => r
                                                    .nextIsNot(r => r
                                                        .regExp(/^[(（]/),
                                                    ),
                                                )
                                                .and(r => r
                                                    .ref(() => $CHAR),
                                                ),
                                            ),
                                        ),
                                    )
                                    .and(r => r
                                        .choice(c => c
                                            .or(r => r
                                                .seqEqual("様式"),
                                            )
                                            .or(r => r
                                                .seqEqual("書式"),
                                            ),
                                        ),
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
                        , "format_struct_title"),
                    )
                , (({ text, title, related_article_num, format_struct_title }) => {
                    return {
                        text: text(),
                        title: title,
                        related_article_num: related_article_num,
                        format_struct_title: format_struct_title,
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

export const $appdx_format = factory
    .withName("appdx_format")
    .action(r => r
        .sequence(c => c
            .and(r => r
                .zeroOrOne(r => r
                    .sequence(c => c
                        .and(r => r
                            .seqEqual(":appdx-format:"),
                        )
                        .and(r => r
                            .oneOrMore(r => r
                                .ref(() => $NEWLINE),
                            ),
                        ),
                    ),
                ),
            )
            .and(r => r
                .zeroOrOne(r => r
                    .action(r => r
                        .sequence(c => c
                            .and(r => r
                                .ref(() => $appdx_format_title)
                            , "target")
                            .and(r => r
                                .oneOrMore(r => r
                                    .ref(() => $NEWLINE),
                                ),
                            ),
                        )
                    , (({ target }) => {
                        return target;
                    }),
                    ),
                )
            , "title_struct")
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
                                        .ref(() => $format_struct)
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
                                                        .ref(() => $format_struct)
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
        const appdx_format = new EL("AppdxFormat");
        if (title_struct) {
            appdx_format.append(new EL("AppdxFormatTitle", {}, [new __Text(title_struct.title)]));
            if (title_struct.related_article_num) {
                appdx_format.append(new EL("RelatedArticleNum", {}, [title_struct.related_article_num]));
            }
        }
        appdx_format.extend(children || []);

        return appdx_format;
    }),
    )
    ;


export const rules = {
    appdx_format_title: $appdx_format_title,
    appdx_format: $appdx_format,
};
