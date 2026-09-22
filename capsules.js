// CodeLens Capsule Storage

const STORAGE_KEY = "codelens_capsules";
const LEGACY_STORAGE_KEY = "devlens_capsules";

// Updated to save ALL analysis metrics
function saveCapsule(code, result, website) {
    let capsule;

    if (typeof result === "object" && result !== null) {
        capsule = {
            id: Date.now(),
            code: code,
            language: result.language,
            complexity: result.timeComplexity, // Kept for backwards compatibility 
            
            // Saving all detailed metrics
            timeComplexity: result.timeComplexity,
            spaceComplexity: result.spaceComplexity,
            functions: result.functions,
            ifStatements: result.ifStatements,
            forLoops: result.forLoops,
            whileLoops: result.whileLoops,
            nestedLoops: result.nestedLoops,
            recursion: result.recursion,
            patterns: result.patterns,
            explanation: result.explanation,
            
            website: website,
            date: new Date().toLocaleString()
        };
    } else {
        // Fallback for legacy positional signatures
        const language = arguments[1];
        const explanation = arguments[2];
        const complexity = arguments[3];
        const site = arguments[4] || website;

        capsule = {
            id: Date.now(),
            code: code,
            language: language || "JavaScript",
            complexity: complexity,
            timeComplexity: complexity,
            explanation: explanation,
            website: site,
            date: new Date().toLocaleString()
        };
    }

    const capsules = getCapsules();
    capsules.push(capsule);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capsules));
    console.log("Capsule with full details saved successfully!");
}

function getCapsules() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        return JSON.parse(data) || [];
    }
    // Backward compatibility migration from devlens_capsules
    const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyData) {
        const legacyCapsules = JSON.parse(legacyData) || [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyCapsules));
        return legacyCapsules;
    }
    return [];
}

function deleteCapsule(id) {
    let capsules = getCapsules();

    capsules = capsules.filter(
        capsule => capsule.id !== id
    );

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(capsules)
    );

    console.log("Capsule deleted!");
}