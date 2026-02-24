const deploy = require("../modules/deploy");
const audit = require("../modules/audit");
const amy = require("../modules/amy");

module.exports = async function(parsed) {
    console.log(`⚙️ EXECUTION: Routing to ${parsed.intent} module`);
    
    switch(parsed.intent) {
        case "deploy":
            return await deploy(parsed);
        case "audit":
            return await audit(parsed);
        default:
            return await amy(parsed);
    }
};
