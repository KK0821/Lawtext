/* eslint-disable no-irregular-whitespace */
import { __Text, EL, setItemNum } from "@coresrc/util";
import { factory } from "../common";
import { $ROUND_PARENTHESES_INLINE } from "../inline";
import { $INDENT, $DEDENT, $_, $NEWLINE } from "../lexical";
import { $paragraph_item } from "./paragraphItem";
import { $remarks } from "./remarks";
import { $table_struct } from "./tableStruct";


export const $appdx_table_title = factory
    .withName("appdx_table_title")
    .action(r => r
        .sequence(c => c
            .and(r => r
                .action(r => r
                    .sequence(c => c
                        .and(r => r
                            .action(r => r
                                .sequence(c => c
                                    .and(r => r
                                        .zeroOrMore(r => r
                                            .action(r => r
                                                .sequence(c => c
                                                    .and(r => r
                                                        .seqEqual("["),
                                                    )
                                                    .and(r => r
                                                        .asSlice(r => r
                                                            .oneOrMore(r => r
                                                                .regExp(/^[^ 　\t\r\n\]=]/),
                                                            ),
                                                        )
                                                    , "name")
                                                    .and(r => r
                                                        .seqEqual("=\""),
                                                    )
                                                    .and(r => r
                                                        .asSlice(r => r
                                                            .oneOrMore(r => r
                                                                .regExp(/^[^ 　\t\r\n\]"]/),
                                                            ),
                                                        )
                                                    , "value")
                                                    .and(r => r
                                                        .seqEqual("\"]"),
                                                    ),
                                                )
                                            , (({ name, value }) => {
                                                return [name, value];
                                            }),
                                            ),
                                        )
                                    , "target"),
                                )
                            , (({ target }) => {
                                const ret = {} as Record<string, string>;
                                for (const [name, value] of target) {
                                    ret[name] = value;
                                }
                                return ret;
                            }),
                            )
                        , "attr")
                        .and(r => r
                            .choice(c => c
                                .or(r => r
                                    .action(r => r
                                        .sequence(c => c
                                            .and(r => r
                                                .asSlice(r => r
                                                    .sequence(c => c
                                                        .and(r => r
                                                            .seqEqual("別表"),
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
                                                .asSlice(r => r
                                                    .zeroOrMore(r => r
                                                        .regExp(/^[^\r\n(（]/),
                                                    ),
                                                )
                                            , "table_struct_title")
                                            .and(r => r
                                                .nextIs(r => r
                                                    .ref(() => $NEWLINE),
                                                ),
                                            ),
                                        )
                                    , (({ text, title, related_article_num, table_struct_title }) => {
                                        return {
                                            text: text(),
                                            title: title,
                                            related_article_num: related_article_num,
                                            table_struct_title: table_struct_title,
                                        };
                                    }),
                                    ),
                                )
                                .or(r => r
                                    .action(r => r
                                        .sequence(c => c
                                            .and(r => r
                                                .asSlice(r => r
                                                    .sequence(c => c
                                                        .and(r => r
                                                            .seqEqual("別表"),
                                                        )
                                                        .and(r => r
                                                            .zeroOrMore(r => r
                                                                .regExp(/^[^\r\n(（]/),
                                                            ),
                                                        )
                                                        .and(r => r
                                                            .ref(() => $ROUND_PARENTHESES_INLINE),
                                                        ),
                                                    ),
                                                )
                                            , "title")
                                            .and(r => r
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
                                                )
                                            , "related_article_num")
                                            .and(r => r
                                                .nextIs(r => r
                                                    .ref(() => $NEWLINE),
                                                ),
                                            ),
                                        )
                                    , (({ text, title, related_article_num }) => {
                                        return {
                                            text: text(),
                                            title: title,
                                            related_article_num: related_article_num,
                                            table_struct_title: "",
                                        };
                                    }),
                                    ),
                                ),
                            )
                        , "target"),
                    )
                , (({ attr, target }) => {
                    return {
                        attr: attr,
                        ...target,
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

export const $appdx_table = factory
    .withName("appdx_table")
    .action(r => r
        .sequence(c => c
            .and(r => r
                .ref(() => $appdx_table_title)
            , "title_struct")
            .and(r => r
                .oneOrMore(r => r
                    .ref(() => $NEWLINE),
                ),
            )
            .and(r => r
                .zeroOrOne(r => r
                    .action(r => r
                        .sequence(c => c
                            .and(r => r
                                .ref(() => $INDENT),
                            )
                            .and(r => r
                                .oneOrMore(r => r
                                    .ref(() => $appdx_table_children),
                                )
                            , "target")
                            .and(r => r
                                .zeroOrMore(r => r
                                    .ref(() => $remarks),
                                )
                            , "remarkses")
                            .and(r => r
                                .zeroOrMore(r => r
                                    .ref(() => $NEWLINE),
                                ),
                            )
                            .and(r => r
                                .ref(() => $DEDENT),
                            ),
                        )
                    , (({ target, remarkses }) => {
                        return target.concat(remarkses);
                    }),
                    ),
                )
            , "children"),
        )
    , (({ location, title_struct, children }) => {
        const appdx_table = new EL("AppdxTable");
        if (title_struct.table_struct_title !== "") {
            console.error(`### line ${location().start.line}: Maybe irregular AppdxTableTitle!`);
            appdx_table.append(new EL("AppdxTableTitle", title_struct.attr, [new __Text( title_struct.text)]));
        } else {
            appdx_table.append(new EL("AppdxTableTitle", title_struct.attr, [new __Text(title_struct.title)]));
            if (title_struct.related_article_num) {
                appdx_table.append(new EL("RelatedArticleNum", {}, [title_struct.related_article_num]));
            }
        }

        if (children) {
            setItemNum(children);
        }
        appdx_table.extend(children || []);

        return appdx_table;
    }),
    )
    ;

export const $appdx_table_children = factory
    .withName("appdx_table_children")
    .choice(c => c
        .or(r => r
            .ref(() => $table_struct),
        )
        .or(r => r
            .ref(() => $paragraph_item),
        ),
    )
    ;

export const rules = {
    appdx_table_title: $appdx_table_title,
    appdx_table: $appdx_table,
    appdx_table_children: $appdx_table_children,
};
