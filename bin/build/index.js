const { buildParser } = require("./parser");
const { buildTemplates } = require("./templates");
const { buildLawNumTable } = require("./lawNumTable");
const { defaultBasePath } = require("./defaultBasePath");

exports.buildParser = buildParser;
exports.buildTemplates = buildTemplates;
exports.buildLawNumTable = buildLawNumTable;
exports.defaultBasePath = defaultBasePath;

/**
 * @param {string} basePath
 */
const build = async (basePath = defaultBasePath) => {
    console.log("Compiling parser...");
    await buildParser(basePath);

    console.log("Compiling templates...");
    await buildTemplates(basePath);

    console.log("Compiling lawnum_table...");
    await buildLawNumTable(basePath);
};
exports.build = build;

if (typeof require !== "undefined" && require.main === module) {
    build().catch(console.error);
}

