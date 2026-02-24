module.exports = function(command) {
    console.log(`🔍 PARSER: Interpreting "${command}"`);
    
    const cmd = command.toLowerCase();
    let intent = "amy";
    let env = "production";

    if (cmd.includes("deploy")) {
        intent = "deploy";
        if (cmd.includes("staging")) env = "staging";
    } else if (cmd.includes("audit") || cmd.includes("revisar")) {
        intent = "audit";
    }

    return {
        raw: command,
        intent,
        env,
        timestamp: new Date().toISOString()
    };
};
