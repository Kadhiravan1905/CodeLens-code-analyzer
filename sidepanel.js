let lastCode = "";
let lastResult = null;

const codeInput = document.getElementById("codeInput");
const languageSelect = document.getElementById("languageSelect");
const resultBox = document.getElementById("result");
const extraResult = document.getElementById("extraResult");

// NEW: Main Panel Navigation Buttons
const mainRefreshBtn = document.getElementById("mainRefreshBtn");
if (mainRefreshBtn) {
    mainRefreshBtn.addEventListener("click", () => {
        // Reloads the page, clearing all inputs and results instantly
        window.location.reload(); 
    });
}

document.getElementById("viewCapsulesBtn").addEventListener("click", function () {
    window.location.href = "capsules.html";
});

function displayResult(result) {
    document.getElementById("language").textContent = result.language;
    document.getElementById("functions").textContent = result.functions;
    document.getElementById("ifStatements").textContent = result.ifStatements;
    document.getElementById("forLoops").textContent = result.forLoops;
    document.getElementById("whileLoops").textContent = result.whileLoops;
    document.getElementById("nestedLoops").textContent = result.nestedLoops;
    document.getElementById("recursion").textContent = result.recursion ? "Yes" : "No";
    document.getElementById("timeComplexity").textContent = result.timeComplexity;
    document.getElementById("spaceComplexity").textContent = result.spaceComplexity;
    document.getElementById("patterns").textContent =
        result.patterns.length ? result.patterns.join(" • ") : "None detected";
    document.getElementById("explanation").textContent = result.explanation;

    resultBox.classList.remove("hidden");
    extraResult.classList.add("hidden");
    extraResult.textContent = "";
}

document.getElementById("analyzeBtn").addEventListener("click", function () {
    const code = codeInput.value.trim();
    const language = languageSelect.value; // Read the chosen language

    if (!code) {
        resultBox.classList.add("hidden");
        alert("Please enter code to analyze.");
        return;
    }

    lastCode = code;
    // Pass the language into your updated analyzer
    lastResult = analyzeCode(code, language); 
    displayResult(lastResult);
});

document.getElementById("whyBtn").addEventListener("click", function () {
    if (!lastResult) return;
    showExtra("Why is this result?", lastResult.why);
});

document.getElementById("simplifyBtn").addEventListener("click", function () {
    if (!lastResult) return;
    showExtra("Simplification Tip", lastResult.simplify);
});

document.getElementById("issuesBtn").addEventListener("click", function () {
    if (!lastResult) return;

    const issues = lastResult.issues.length
        ? lastResult.issues.map(issue => "• " + issue).join("\n")
        : "No obvious structural issues detected by the lightweight analyzer.";

    showExtra("Possible Issues", issues);
});

function showExtra(title, text) {
    extraResult.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;
    extraResult.classList.remove("hidden");
}

document.getElementById("saveBtn").addEventListener("click", function () {
    const code = codeInput.value.trim();
    const language = languageSelect.value; // Read the chosen language

    if (!code) {
        alert("Please enter code first.");
        return;
    }

    // Ensure we use the correct language if saving without analyzing first
    const result = lastResult || analyzeCode(code, language);
    lastResult = result;
    lastCode = code;

    saveCapsule(
        code,
        result, // We now pass the ENTIRE result object here!
        window.location.href
    );

    alert("Capsule saved successfully!");
});

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
