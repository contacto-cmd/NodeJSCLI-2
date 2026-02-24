const parser = require("./parser");
const decision = require("./decision");

module.exports = async function(command) {
    console.log(`📥 INGEST: ${command}`);
    const parsed = parser(command);
    const result = await decision(parsed);
    return result;
};
