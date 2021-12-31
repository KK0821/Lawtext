// import formatXML from "xml-formatter";
import { DOMParser } from "@xmldom/xmldom";
import * as law_diff from "lawtext/dist/src/diff/law_diff";
import * as parser from "lawtext/dist/src/parser";
import * as analyzer from "lawtext/dist/src/analyzer";
import { render as renderLawtext } from "lawtext/dist/src/renderer/lawtext";
import { Loader } from "lawtext/dist/src/data/loaders/common";
import { EL, xmlToJson } from "lawtext/dist/src/node/el";
import { BaseLawInfo } from "lawtext/dist/src/data/lawinfo";
import { Era, LawCoverage, LawType } from "../lawCoverage";
import { Law } from "lawtext/dist/src/law/std";

const domParser = new DOMParser();
type DeNull<T> = T extends null ? never : T;

class Lap {
    date: Date;
    constructor() {
        this.date = new Date();
    }
    lapms() {
        const now = new Date();
        const ms = now.getTime() - this.date.getTime();
        this.date = now;
        return ms;
    }
}


export const getOriginalLaw = async (lawInfo: BaseLawInfo, loader: Loader): Promise<{
    origEL: EL | null,
    origXML: string | null,
    lawNumStruct: {
        Era: Era | null,
        Year: number | null,
        LawType: LawType | null,
        Num: number | null,
    } | null,
    originalLaw: DeNull<LawCoverage["originalLaw"]>,
}> => {
    try {
        const requiredms = new Map<string, number>();
        const lap = new Lap();

        const origXML = await loader.loadLawXMLByInfo(lawInfo);
        requiredms.set("loadXML", lap.lapms());

        const origEL = xmlToJson(origXML) as Law;
        requiredms.set("xmlToJson", lap.lapms());

        const Year = Number(origEL.attr.Year);
        const Num = Number(origEL.attr.Num);

        return {
            origEL,
            origXML,
            lawNumStruct: {
                Era: origEL.attr.Era as Era,
                Year: Number.isNaN(Year) ? null : Year,
                Num: Number.isNaN(Num) ? null : Num,
                LawType: origEL.attr.LawType as LawType,
            },
            originalLaw: {
                ok: {
                    requiredms,
                },
                info: {},
            },
        };
    } catch (e) {
        return {
            origEL: null,
            origXML: null,
            lawNumStruct: null,
            originalLaw: {
                ok: null,
                info: { error: (e as Error).stack },
            },
        };
    }
};


export const getRenderedLawtext = async (origEL: EL): Promise<{
    lawtext: string | null,
    renderedLawtext: DeNull<LawCoverage["renderedLawtext"]>,
}> => {
    try {
        const requiredms = new Map<string, number>();
        const lap = new Lap();

        const lawtext = renderLawtext(origEL);
        requiredms.set("renderLawtext", lap.lapms());

        return {
            lawtext,
            renderedLawtext: {
                ok: {
                    requiredms,
                },
                info: {},
            },
        };
    } catch (e) {
        return {
            lawtext: null,
            renderedLawtext: {
                ok: null,
                info: { error: (e as Error).stack },
            },
        };
    }
};


export const getParsedLaw = async (lawtext: string): Promise<{
    parsedEL: EL | null,
    parsedXML: string | null,
    parsedLaw: DeNull<LawCoverage["parsedLaw"]>,
}> => {
    try {
        const requiredms = new Map<string, number>();
        const lap = new Lap();

        const parsedEL = parser.parse(lawtext);
        requiredms.set("parseLawtext", lap.lapms());

        analyzer.analyze(parsedEL);
        requiredms.set("analyze", lap.lapms());

        const parsedXML = parsedEL.outerXML(false);
        requiredms.set("parsedELToXML", lap.lapms());

        return {
            parsedEL,
            parsedXML,
            parsedLaw: {
                ok: {
                    requiredms,
                },
                info: {},
            },
        };
    } catch (e) {
        return {
            parsedEL: null,
            parsedXML: null,
            parsedLaw: {
                ok: null,
                info: { error: (e as Error).stack },
            },
        };
    }
};


export const getLawDiff = async (origXML: string, origEL: EL, parsedXML: string, parsedEL: EL, max_diff_length: number): Promise<{
    lawDiff: DeNull<LawCoverage["lawDiff"]>,
}> => {
    try {
        const requiredms = new Map<string, number>();
        const lap = new Lap();

        const origJson = origEL.json(false);
        requiredms.set("origELToJson", lap.lapms());

        const parsedJson = parsedEL.json(false);
        requiredms.set("parsedELToJson", lap.lapms());

        const d = law_diff.lawDiff(origJson, parsedJson, law_diff.LawDiffMode.NoProblemAsNoDiff);
        requiredms.set("lawDiff", lap.lapms());

        const origDOM = domParser.parseFromString(origXML);
        requiredms.set("parseLawtext", lap.lapms());

        const parsedDOM = domParser.parseFromString(parsedXML);
        requiredms.set("parseLawtext", lap.lapms());

        const diffData = law_diff.makeDiffData(d, origDOM, parsedDOM);
        requiredms.set("parseLawtext", lap.lapms());

        let slicedDiffData = diffData;

        if (diffData.length > max_diff_length) {
            const iSerious = Math.max(diffData.findIndex(diff => diff.mostSeriousStatus === d.mostSeriousStatus), 0);
            const iStart = Math.min(iSerious, diffData.length - max_diff_length);
            slicedDiffData = diffData.slice(iStart, iStart + max_diff_length);
        }

        return {
            lawDiff: {
                ok: {
                    mostSeriousStatus: d.mostSeriousStatus,
                    result: {
                        items: slicedDiffData,
                        totalCount: diffData.length,
                    },
                    requiredms,
                },
                info: {},
            },
        };
    } catch (e) {
        return {
            lawDiff: {
                ok: null,
                info: { error: (e as Error).stack },
            },
        };
    }
};
