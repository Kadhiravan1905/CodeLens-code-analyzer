const capsuleList = document.getElementById("capsuleList");
const emptyState = document.getElementById("emptyState");
const capsuleCount = document.getElementById("capsuleCount");
const searchInput = document.getElementById("searchInput");

let allCapsules = [];

function escapeHtml(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// NEW: Lightweight Syntax Highlighter
function highlightCode(code, language) {
    // Escape first to prevent HTML injection
    let highlighted = escapeHtml(code);
    
    // Define patterns based on the language
    const keywords = /\b(def|function|for|in|while|if|else|elif|return|class|import|const|let|var|async|await|try|except|catch)\b/g;
    const strings = /(&quot;.*?&quot;|&#039;.*?&#039;|`.*?`)/g;
    
    // Python uses # for comments, JS uses // or /* */
    const comments = language === "Python" ? /(#.*)/g : /(\/\/.*|\/\*[\s\S]*?\*\/)/g;

    // Apply colors (Comments first, then strings, then keywords)
    highlighted = highlighted.replace(comments, '<span class="hl-comment">$1</span>');
    highlighted = highlighted.replace(strings, '<span class="hl-string">$1</span>');
    highlighted = highlighted.replace(keywords, '<span class="hl-keyword">$1</span>');

    return highlighted;
}

// NEW: Fisher-Yates Shuffle Algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function loadCapsules() {
    allCapsules = getCapsules().sort((a, b) => Number(b.id) - Number(a.id));
    renderCapsules(searchInput.value.trim());
}

function renderCapsules(query = "") {
    const normalizedQuery = query.toLowerCase();
    
    // NEW: Get the currently selected language filter
    const selectedLanguage = document.getElementById("languageFilter")?.value || "all";

    let filtered = allCapsules.filter(capsule => {
        // 1. Check if it matches the language filter
        const capsuleLang = (capsule.language || "JavaScript").toLowerCase();
        const matchesLanguage = selectedLanguage === "all" || capsuleLang === selectedLanguage;

        // 2. Check if it matches the search text
        const searchable = [
            capsule.code,
            capsule.explanation,
            capsule.complexity,
            capsule.website,
            capsule.date,
            capsule.language
        ].join(" ").toLowerCase();
        const matchesSearch = searchable.includes(normalizedQuery);

        // Keep the capsule ONLY if it passes both checks
        return matchesLanguage && matchesSearch;
    });

    const isExamMode = document.getElementById("examModeCheckbox")?.checked;

    if (isExamMode) {
        filtered = shuffleArray(filtered);
    }

    capsuleCount.textContent = `${filtered.length} capsule${filtered.length === 1 ? "" : "s"}`;
    capsuleList.innerHTML = "";

    if (!filtered.length) {
        emptyState.classList.remove("hidden");
        if (allCapsules.length && query) {
            emptyState.querySelector("h2").textContent = "No Matching Capsules";
            emptyState.querySelector("p").textContent = "Try a different search term.";
            document.getElementById("openAnalyzerBtn").classList.add("hidden");
        } else {
            emptyState.querySelector("h2").textContent = "No Saved Capsules";
            emptyState.querySelector("p").innerHTML = 'Analyze some code and click <strong>Save Capsule</strong> to store it here.';
            document.getElementById("openAnalyzerBtn").classList.remove("hidden");
        }
        return;
    }

    emptyState.classList.add("hidden");

    filtered.forEach(capsule => {
        const card = document.createElement("article");
        card.className = "capsule-card";

        const examCheckbox = document.getElementById("examModeCheckbox");
        const isExamMode = examCheckbox ? examCheckbox.checked : false;
        const displayStyle = isExamMode ? "display: none;" : "display: block;";
        const revealBtnHtml = isExamMode ? `<button class="reveal-btn secondary" style="width: 100%; margin-top: 15px;">Reveal Answer</button>` : "";

        card.innerHTML = `
            <div class="capsule-card-header">
                <div>
                    <span class="capsule-number">Capsule #${escapeHtml(capsule.id)}</span>
                    <h2 class="capsule-complexity" style="${displayStyle}">${escapeHtml(capsule.complexity || "Analysis")}</h2>
                    ${isExamMode ? `<h2 class="hidden-placeholder" style="color: #64b5f6; margin: 5px 0 0;">???</h2>` : ""}
                </div>
                <div style="display: flex; gap: 8px;">
                    <!-- NEW: Download PDF Button -->
                    <button class="pdf-btn secondary" data-id="${escapeHtml(capsule.id)}" style="margin-top: 0; padding: 6px 12px; font-size: 12px; border-color: #64b5f6; color: #64b5f6;">📄 PDF</button>
                    
                    <button class="delete-btn" data-id="${escapeHtml(capsule.id)}" title="Delete this capsule">Delete</button>
                </div>
            </div>

            <div class="capsule-meta">
                <span><strong>Language:</strong> ${escapeHtml(capsule.language || "JavaScript")}</span> 
                <span><strong>Saved:</strong> ${escapeHtml(capsule.date)}</span>
                <span><strong>Source:</strong> ${escapeHtml(capsule.website || "Local")}</span>
            </div>

            <!-- NEW: Full Detailed Metrics Section -->
            <div class="capsule-section answer-section" style="${displayStyle} background: #0A0E29; padding: 15px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 15px;">
                <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; color: #8892b0;">Analysis Metrics</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; font-size: 13px;">
                    <div><strong>Space:</strong> ${escapeHtml(capsule.spaceComplexity || "-")}</div>
                    <div><strong>Functions:</strong> ${capsule.functions || 0}</div>
                    <div><strong>If Statements:</strong> ${capsule.ifStatements || 0}</div>
                    <div><strong>For Loops:</strong> ${capsule.forLoops || 0}</div>
                    <div><strong>While Loops:</strong> ${capsule.whileLoops || 0}</div>
                    <div><strong>Nested Loops:</strong> ${capsule.nestedLoops || 0}</div>
                    <div><strong>Recursion:</strong> ${capsule.recursion ? "Yes" : "No"}</div>
                    
                    <div style="grid-column: 1 / -1; margin-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 8px;">
                        <strong>Detected Patterns:</strong> 
                        <span style="color: #64b5f6;">${capsule.patterns && capsule.patterns.length ? escapeHtml(capsule.patterns.join(" • ")) : "None detected"}</span>
                    </div>
                </div>
            </div>

            <!-- Existing Code Section -->
            <div class="capsule-section">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
                    <h3 style="margin: 0;">Code</h3>
                    <button class="copy-btn secondary" style="margin: 0; padding: 4px 10px; font-size: 12px;">Copy Code</button>
                </div>
                <!-- Using your custom highlighter -->
                <pre>${highlightCode(capsule.code, capsule.language)}</pre>
            </div>

            <!-- Inject Reveal Button if Exam Mode is ON -->
            ${revealBtnHtml}

            <!-- Wrap Explanation in an answer-section -->
            <div class="capsule-section answer-section" style="${displayStyle}">
                <h3>Explanation</h3>
                <p>${escapeHtml(capsule.explanation || "No explanation saved.")}</p>
            </div>
        `;

        capsuleList.appendChild(card);
    });

    // NEW: Reveal Answer Logic
    const examCheckbox = document.getElementById("examModeCheckbox");
    if (examCheckbox && examCheckbox.checked) {
        document.querySelectorAll(".reveal-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const card = e.target.closest('.capsule-card');
                
                // Unhide the complexity and explanation
                card.querySelector('.capsule-complexity').style.display = 'block';
                card.querySelectorAll('.answer-section').forEach(el => el.style.display = 'block');
                
                // Hide the "???" placeholder and the reveal button itself
                card.querySelector('.hidden-placeholder').style.display = 'none';
                e.target.style.display = 'none'; 
            });
        });
    }

    // NEW: Copy to Clipboard Functionality
    document.querySelectorAll(".copy-btn").forEach(button => {
        button.addEventListener("click", async (e) => {
            // Find the <pre> tag right below this specific button
            const preElement = e.target.closest('.capsule-section').querySelector('pre');
            
            try {
                // Copy the raw text from the <pre> tag
                await navigator.clipboard.writeText(preElement.textContent);
                
                // Visual feedback
                const originalText = e.target.textContent;
                e.target.textContent = "Copied!";
                e.target.style.backgroundColor = "rgba(40, 100, 240, 0.2)"; // Slight blue tint
                
                // Reset the button after 2 seconds
                setTimeout(() => {
                    e.target.textContent = originalText;
                    e.target.style.backgroundColor = "transparent";
                }, 2000);
            } catch (err) {
                console.error("Failed to copy code: ", err);
                alert("Clipboard copy failed.");
            }
        });
    });

    // NEW: Generate and Download PDF
    document.querySelectorAll(".pdf-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            // Find the specific capsule by ID
            const id = Number(e.target.dataset.id);
            const capsule = allCapsules.find(c => c.id === id);
            
            if (!capsule) return;

            // Create a temporary, hidden print window
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            
            // Write a clean, light-themed HTML document specifically for printing
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>CodeLens_Capsule_${capsule.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
                        h1 { color: #05071C; border-bottom: 2px solid #2864F0; padding-bottom: 10px; margin-bottom: 20px; }
                        h3 { color: #1c4bc4; margin-top: 25px; margin-bottom: 10px; }
                        .meta { background: #f5f7fb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; margin-bottom: 20px; font-size: 14px; }
                        .meta strong { display: inline-block; width: 140px; color: #333; }
                        .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 15px; }
                        pre { background: #f8f9fa; padding: 20px; border-radius: 6px; font-family: Consolas, monospace; white-space: pre-wrap; font-size: 13px; border-left: 4px solid #2864F0; overflow-x: hidden; }
                        p { font-size: 14px; color: #444; }
                    </style>
                </head>
                <body>
                    <h1>CodeLens Code Analysis</h1>
                    
                    <div class="meta">
                        <div><strong>Language:</strong> ${escapeHtml(capsule.language || "JavaScript")}</div>
                        <div><strong>Time Complexity:</strong> ${escapeHtml(capsule.timeComplexity || capsule.complexity || "-")}</div>
                        <div><strong>Space Complexity:</strong> ${escapeHtml(capsule.spaceComplexity || "-")}</div>
                        <div><strong>Date Saved:</strong> ${escapeHtml(capsule.date)}</div>
                        
                        <hr style="border: 0; border-top: 1px solid #ddd; margin: 15px 0;">
                        
                        <div class="grid-container">
                            <div><strong>Functions:</strong> ${capsule.functions || 0}</div>
                            <div><strong>If Statements:</strong> ${capsule.ifStatements || 0}</div>
                            <div><strong>For Loops:</strong> ${capsule.forLoops || 0}</div>
                            <div><strong>While Loops:</strong> ${capsule.whileLoops || 0}</div>
                            <div><strong>Nested Loops:</strong> ${capsule.nestedLoops || 0}</div>
                            <div><strong>Recursion:</strong> ${capsule.recursion ? "Yes" : "No"}</div>
                        </div>
                        
                        <div style="margin-top: 15px;">
                            <strong>Detected Patterns:</strong> 
                            <span style="color: #2864F0; font-weight: bold;">
                                ${capsule.patterns && capsule.patterns.length ? escapeHtml(capsule.patterns.join(" • ")) : "None detected"}
                            </span>
                        </div>
                    </div>
                    
                    <h3>Code Snippet</h3>
                    <pre>${escapeHtml(capsule.code)}</pre>
                    
                    <h3>Explanation</h3>
                    <p>${escapeHtml(capsule.explanation || "No explanation saved.")}</p>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            printWindow.focus();
            
            // Give the browser a split second to render the styles, then trigger the save dialog
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        });
    });

    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);
            const confirmed = confirm("Delete this capsule?");
            if (!confirmed) return;

            deleteCapsule(id);
            loadCapsules();
        });
    });
}

searchInput.addEventListener("input", () => {
    renderCapsules(searchInput.value.trim());
});

// Listen for toggling Exam Mode on or off
const examModeCheckbox = document.getElementById("examModeCheckbox");
if (examModeCheckbox) {
    examModeCheckbox.addEventListener("change", () => {
        renderCapsules(searchInput.value.trim());
    });
}

// NEW: Listen for language filter changes
const languageFilter = document.getElementById("languageFilter");
if (languageFilter) {
    languageFilter.addEventListener("change", () => {
        renderCapsules(searchInput.value.trim());
    });
}

document.getElementById("refreshBtn").addEventListener("click", loadCapsules);

document.getElementById("clearAllBtn").addEventListener("click", () => {
    if (!allCapsules.length) return;

    const confirmed = confirm("Delete all saved capsules? This cannot be undone.");
    if (!confirmed) return;

    localStorage.removeItem("codelens_capsules");
    localStorage.removeItem("devlens_capsules");
    loadCapsules();
});

// NEW: Import Data from JSON
// 1. Trigger the hidden file input when the button is clicked
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");

if (importBtn && importFile) {
    importBtn.addEventListener("click", () => {
        importFile.click();
    });

    // 2. Handle the file once the user selects it
    importFile.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        // 3. What to do when the file is read
        reader.onload = (e) => {
            try {
                const importedCapsules = JSON.parse(e.target.result);
                
                // Basic validation to ensure it's an array
                if (!Array.isArray(importedCapsules)) {
                    throw new Error("Invalid format: Expected an array.");
                }

                // Ask if you want to merge or replace
                const merge = confirm("Click 'OK' to merge this backup with your current capsules, or 'Cancel' to overwrite everything.");
                
                let currentCapsules = getCapsules();
                
                if (merge) {
                    // Combine arrays and filter out any duplicate IDs just in case
                    currentCapsules = currentCapsules.concat(importedCapsules);
                    const uniqueIds = new Set();
                    currentCapsules = currentCapsules.filter(cap => {
                        if (uniqueIds.has(cap.id)) return false;
                        uniqueIds.add(cap.id);
                        return true;
                    });
                } else {
                    currentCapsules = importedCapsules;
                }

                // Save the newly combined list back to localStorage
                localStorage.setItem("codelens_capsules", JSON.stringify(currentCapsules));
                
                // Reload the UI so the new cards appear instantly
                loadCapsules();
                alert("Capsules imported successfully!");

            } catch (error) {
                console.error("Import failed:", error);
                alert("Error importing file. Please make sure it is a valid CodeLens JSON backup.");
            }
            
            // Reset the file input so you can select the same file again if needed
            event.target.value = ""; 
        };
        
        // Read the file as text
        reader.readAsText(file);
    });
}

// NEW: Export Data to JSON
const exportBtn = document.getElementById("exportBtn");
if (exportBtn) {
    exportBtn.addEventListener("click", () => {
        // 1. Grab all saved capsules using your existing function
        const capsules = getCapsules();

        // 2. Check if there is actually anything to export
        if (!capsules || capsules.length === 0) {
            alert("Your capsule list is empty. Nothing to export!");
            return;
        }

        // 3. Convert the data to a nicely formatted JSON string
        const dataStr = JSON.stringify(capsules, null, 2);

        // 4. Create a Blob (Binary Large Object) representing the data
        const blob = new Blob([dataStr], { type: "application/json" });

        // 5. Generate a temporary URL for the Blob
        const url = URL.createObjectURL(blob);

        // 6. Create a temporary anchor (<a>) element to trigger the download
        const a = document.createElement("a");
        a.href = url;
        
        // Add today's date to the filename so you can keep track of backups
        const date = new Date().toISOString().split('T')[0];
        a.download = `codelens_backup_${date}.json`;

        // 7. Append, click, and clean up
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// NEW: Event listener for the Back button
document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "sidepanel.html";
});

document.getElementById("openAnalyzerBtn").addEventListener("click", () => {
    window.location.href = "sidepanel.html";
});

loadCapsules();
