const execution = require("./execution");

module.exports = async function(parsed) {
    console.log(`⚖️ DECISION: Intent detected -> ${parsed.intent}`);
    // Aquí se podría implementar lógica de prioridad o scoring
    return await execution(parsed);
};
