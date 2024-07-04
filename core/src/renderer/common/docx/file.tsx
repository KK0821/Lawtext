import React from "react";
import JSZip from "jszip";
import { renderToStaticMarkup } from "..";
import { w } from "./tags";
import styles from "./styles";
import { DOCXOptions, Relationships, Types } from "./component";

export const renderDocxAsync = (bodyEL: JSX.Element, docxOptions?: DOCXOptions): Promise<Uint8Array | Buffer> => {

    const media: {Id: string, Type: string, fileName: string, buf: ArrayBuffer}[] = [];
    const types = new Map<string, string>();

    const figDataManager = docxOptions?.figDataManager;
    if (figDataManager) {
        for (const [, figData] of figDataManager.getFigDataItems()) {
            media.push({
                Id: figData.rId,
                Type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                fileName: figData.fileName,
                buf: figData.blob.buf,
            });
            types.set(figData.fileName.split(".").slice(-1)[0], figData.blob.type);
        }
    }

    types.set("rels", "application/vnd.openxmlformats-package.relationships+xml");
    types.set("xml", "application/xml");

    const document = (
        <w.document
            xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"

        //   xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
        >
            <w.body>
                {bodyEL}
            </w.body>
        </w.document>
    );

    const zip = new JSZip();

    zip.file(
        "[Content_Types].xml",
        /*xml*/`\
<?xml version="1.0" encoding="utf-8" standalone="yes"?>
${renderToStaticMarkup(<Types types={[
        { tag: "Override", PartName: "/word/document.xml", ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml" },
        { tag: "Override", PartName: "/word/styles.xml", ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml" },
        { tag: "Override", PartName: "/word/settings.xml", ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml" },
        { tag: "Override", PartName: "/word/fontTable.xml", ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml" },
        ...([...types.entries()].map(([ext, type]) => ({
            tag: "Default" as const,
            Extension: ext,
            ContentType: type,
        }))),
    ]} />)}
`,
    );

    zip.file(
        "_rels/.rels",
        /*xml*/`\
<?xml version="1.0" encoding="utf-8" standalone="yes"?>
${renderToStaticMarkup(<Relationships relationships={[{ Id: "rId1", Type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument", Target: "word/document.xml" }]} />)}
`,
    );

    zip.file(
        "word/_rels/document.xml.rels",
        /*xml*/`\
<?xml version="1.0" encoding="utf-8" standalone="yes"?>
${renderToStaticMarkup(<Relationships
        relationships={[
            { Id: "rId1", Type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles", Target: "styles.xml" },
            { Id: "rId2", Type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings", Target: "settings.xml" },
            ...(media.map(m => ({
                Id: m.Id,
                Type: m.Type,
                Target: `media/${m.fileName}`,
            }))),
        ]}
    />)}
`,
    );

    for (const m of media) {
        zip.file(`word/media/${m.fileName}`, m.buf);
    }

    zip.file(
        "word/document.xml",
        /*xml*/`\
<?xml version="1.0" encoding="utf-8"?>
${renderToStaticMarkup(document)}
`,
    );

    zip.file(
        "word/styles.xml",
        /*xml*/`\
<?xml version="1.0" encoding="utf-8" standalone="yes"?>
${renderToStaticMarkup(styles)}
`,
    );

    zip.file(
        "word/settings.xml",
        /*xml*/`\
<?xml version="1.0" encoding="utf-8" standalone="yes"?>
${renderToStaticMarkup((
        <w.settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w.compat>
                <w.compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15" />
            </w.compat>
        </w.settings>
    ))}
`,
    );

    return zip.generateAsync({
        type: JSZip.support.nodebuffer ? "nodebuffer" : "uint8array",
        compression: "DEFLATE",
        compressionOptions: {
            level: 9,
        },
    });
};
