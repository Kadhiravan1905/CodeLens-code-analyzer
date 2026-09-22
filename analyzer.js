// CodeLens - Local Code Analyzer (JavaScript & Python)
// Zero-dependency, lightweight static analysis for JavaScript and Python.

// Updated analyzeCode function supporting both JavaScript and Python
function analyzeCode(code, language = "javascript") {
    const source = String(code || "");
    const clean = language === "python" ? stripPythonCommentsAndStrings(source) : stripCommentsAndStrings(source);

    let functions = 0;
    let forLoops = 0;
    let whileLoops = countMatches(clean, /\bwhile\s+/g);
    let ifStatements = countMatches(clean, /\bif\s+/g);

    if (language === "python") {
        // Python functions use 'def name('
        functions = countMatches(clean, /\bdef\s+[$A-Z_a-z][$\w]*\s*\(/g);
        // Python loops typically use 'for ... in ...'
        forLoops = countMatches(clean, /\bfor\s+[^:]+\bin\b/g);
    } else {
        // JavaScript function patterns
        functions = countMatches(clean, /\bfunction\s+[$A-Z_a-z][$\w]*\s*\(/g)
            + countMatches(clean, /\b(?:const|let|var)\s+[$A-Z_a-z][$\w]*\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g)
            + countMatches(clean, /\b[$A-Z_a-z][$\w]*\s*=\s*(?:async\s*)?[$A-Z_a-z][$\w]*\s*=>/g);
        forLoops = countMatches(clean, /\bfor\s*\(/g);
    }

    const tryBlocks = countMatches(clean, /\btry\s*:/g) + countMatches(clean, /\btry\s*\{/g);
    const catchBlocks = countMatches(clean, /\bexcept\b/g) + countMatches(clean, /\bcatch\s*\(/g);
    const arrayAccesses = countMatches(clean, /\b[$A-Z_a-z][$\w]*\s*\[[^\]]+\]/g);
    const functionCalls = countFunctionCalls(clean, language);
    const todoFixme = (source.match(/\b(?:TODO|FIXME)\b/gi) || []).length;

    const loopInfo = analyzeLoops(clean, language);
    const recursion = detectRecursion(clean, language);
    const patterns = detectPatterns(clean, loopInfo, recursion, language);
    const issues = detectIssues(clean, loopInfo, recursion, language);

    const totalLoops = forLoops + whileLoops;
    const timeComplexity = estimateTimeComplexity(loopInfo.maxDepth, clean, patterns);
    const spaceComplexity = recursion ? "O(n)" : "O(1)";

    const explanation = buildExplanation({
        totalLoops,
        nestedLoops: loopInfo.nestedLoops,
        maxLoopDepth: loopInfo.maxDepth,
        recursion,
        patterns,
        ifStatements
    });

    const why = buildWhy({
        timeComplexity,
        nestedLoops: loopInfo.nestedLoops,
        recursion,
        patterns
    });

    const simplify = buildSimplify({
        timeComplexity,
        patterns,
        totalLoops,
        recursion
    });

    return {
        language: language === "python" ? "Python" : "JavaScript",
        functions,
        ifStatements,
        forLoops,
        whileLoops,
        nestedLoops: loopInfo.nestedLoops,
        maxLoopDepth: loopInfo.maxDepth,
        recursion,
        switchStatements: language === "python" ? 0 : countMatches(clean, /\bswitch\s*\(/g),
        tryBlocks,
        catchBlocks,
        arrayAccesses,
        functionCalls,
        timeComplexity,
        spaceComplexity,
        patterns,
        issues,
        todoFixme,
        explanation,
        why,
        simplify
    };
}

function countMatches(text, regex) {
    return (text.match(regex) || []).length;
}

function stripCommentsAndStrings(code) {
    return code
        .replace(/\/\/[^\n\r]*/g, " ")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/'(?:\\.|[^'\\])*'/g, "''")
        .replace(/"(?:\\.|[^"\\])*"/g, '""')
        .replace(/`(?:\\.|[^`\\])*`/g, "``");
}

// Helper to strip Python comments (#) and strings
function stripPythonCommentsAndStrings(code) {
    return code
        .replace(/#[^\n\r]*/g, " ")
        .replace(/'''[\s\S]*?'''/g, " ")
        .replace(/"""[\s\S]*?"""/g, " ")
        .replace(/'(?:\\.|[^'\\])*'/g, "''")
        .replace(/"(?:\\.|[^"\\])*"/g, '""');
}

function findMatching(text, start, openChar, closeChar) {
    let depth = 0;
    for (let i = start; i < text.length; i++) {
        if (text[i] === openChar) depth++;
        if (text[i] === closeChar) {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

function analyzeLoops(clean, language = "javascript") {
    if (language === "python") {
        return analyzePythonLoops(clean);
    }
    return analyzeJSLoops(clean);
}

function analyzeJSLoops(clean) {
    const loops = [];
    const loopRegex = /\b(?:for|while)\s*\(/g;
    let match;

    while ((match = loopRegex.exec(clean)) !== null) {
        const openParen = clean.indexOf("(", match.index);
        const closeParen = findMatching(clean, openParen, "(", ")");
        if (closeParen === -1) continue;

        let bodyStart = closeParen + 1;
        while (/\s/.test(clean[bodyStart] || "")) bodyStart++;

        let bodyEnd = bodyStart;
        if (clean[bodyStart] === "{") {
            bodyEnd = findMatching(clean, bodyStart, "{", "}");
            if (bodyEnd === -1) bodyEnd = clean.length;
        } else {
            // A loop without braces is treated as a single-statement loop.
            bodyEnd = findStatementEnd(clean, bodyStart);
        }

        loops.push({ start: match.index, bodyStart, bodyEnd });
    }

    let maxDepth = 0;
    let nestedLoops = 0;

    for (const loop of loops) {
        let depth = 0;
        for (const outer of loops) {
            if (outer === loop) continue;
            if (loop.start >= outer.bodyStart && loop.start <= outer.bodyEnd) {
                depth++;
            }
        }
        maxDepth = Math.max(maxDepth, depth + 1);
        if (depth > 0) nestedLoops++;
    }

    return { loops, maxDepth, nestedLoops };
}

function analyzePythonLoops(clean) {
    const lines = clean.split(/\r?\n/);
    const loops = [];
    const activeStack = [];
    let maxDepth = 0;
    let nestedLoops = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const indentMatch = line.match(/^([ \t]*)/);
        const leadingStr = indentMatch ? indentMatch[1] : "";
        const indent = leadingStr.replace(/\t/g, "    ").length;

        while (activeStack.length > 0 && activeStack[activeStack.length - 1].indent >= indent) {
            activeStack.pop();
        }

        const isLoop = /^\s*(?:for\s+.*?\bin\b|while\b)/.test(line);
        if (isLoop) {
            const currentDepth = activeStack.length + 1;
            if (activeStack.length > 0) {
                nestedLoops++;
            }
            maxDepth = Math.max(maxDepth, currentDepth);
            const loopObj = { indent, lineIndex: i, depth: currentDepth };
            loops.push(loopObj);
            activeStack.push(loopObj);
        }
    }

    return { loops, maxDepth, nestedLoops };
}

function findStatementEnd(text, start) {
    for (let i = start; i < text.length; i++) {
        if (text[i] === ";" || text[i] === "\n") return i;
    }
    return text.length;
}

function detectRecursion(clean, language = "javascript") {
    if (language === "python") {
        return detectPythonRecursion(clean);
    }
    return detectJSRecursion(clean);
}

function detectJSRecursion(clean) {
    const functionRegex = /\bfunction\s+([$A-Z_a-z][$\w]*)\s*\(/g;
    let match;

    while ((match = functionRegex.exec(clean)) !== null) {
        const name = match[1];
        const openBrace = clean.indexOf("{", match.index);
        if (openBrace === -1) continue;

        const closeBrace = findMatching(clean, openBrace, "{", "}");
        if (closeBrace === -1) continue;

        const body = clean.slice(openBrace + 1, closeBrace);
        const callRegex = new RegExp(`\\b${escapeRegex(name)}\\s*\\(`);
        if (callRegex.test(body)) return true;
    }

    return false;
}

function detectPythonRecursion(clean) {
    const lines = clean.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const defMatch = line.match(/^([ \t]*)(?:async\s+)?def\s+([$A-Z_a-z][$\w]*)\s*\(/);
        if (defMatch) {
            const baseIndent = defMatch[1].replace(/\t/g, "    ").length;
            const funcName = defMatch[2];
            const bodyLines = [];

            for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j];
                if (!nextLine.trim()) continue;
                const nextIndentMatch = nextLine.match(/^([ \t]*)/);
                const nextIndent = nextIndentMatch ? nextIndentMatch[1].replace(/\t/g, "    ").length : 0;
                if (nextIndent <= baseIndent) {
                    break;
                }
                bodyLines.push(nextLine);
            }

            const bodyText = bodyLines.join("\n");
            const callRegex = new RegExp(`\\b${escapeRegex(funcName)}\\s*\\(`);
            if (callRegex.test(bodyText)) {
                return true;
            }
        }
    }
    return false;
}

function detectPatterns(clean, loopInfo, recursion, language = "javascript") {
    const patterns = [];
    const lower = clean.toLowerCase();

    if (loopInfo.nestedLoops > 0) patterns.push("Nested Loop");
    else if (loopInfo.loops.length > 0) patterns.push("Loop");

    if (language === "python") {
        // Detect list/dict comprehensions (e.g., [x for x in ...])
        if (/\[\s*[^\]]+\s+for\s+[^\]]+\bin\s+[^\]]+\]/.test(clean)) {
            patterns.push("List Comprehension");
        }
        if (/\{\s*[^}]+\s+for\s+[^}]+\bin\s+[^}]+\}/.test(clean)) {
            patterns.push("Dict/Set Comprehension");
        }

        if (/\.sort\s*\(/.test(clean) || /\bsorted\s*\(/.test(clean)) patterns.push("Sorting");
        if (/\b(?:map|filter)\s*\(/.test(clean)) patterns.push("Array Processing");

        if (
            /\b(?:left|low)\b/.test(lower) &&
            /\b(?:right|high)\b/.test(lower) &&
            /\bmid\b/.test(lower) &&
            (/\/\/\s*2/.test(clean) || /math\.floor/i.test(clean) || /int\s*\(/.test(clean))
        ) {
            patterns.push("Possible Binary Search");
        } else if (loopInfo.loops.length > 0 && /\[[^\]]+\]/.test(clean) && /\breturn\b/.test(clean)) {
            patterns.push("Possible Linear Search");
        }

        if (recursion) patterns.push("Recursion");
        if (/\b(?:dict|set)\s*\(/.test(clean) || /\{[\s\S]*?\}/.test(clean)) patterns.push("Hash/Set Structure");
        if (/\[\s*\]/.test(clean) || /\blist\s*\(/.test(clean)) patterns.push("Array");
    } else {
        if (/\.sort\s*\(/.test(clean)) patterns.push("Sorting");
        if (/\b(?:map|filter|reduce|forEach)\s*\(/.test(clean)) patterns.push("Array Processing");

        if (
            /\b(?:left|low)\b/.test(lower) &&
            /\b(?:right|high)\b/.test(lower) &&
            /\bmid\b/.test(lower) &&
            /Math\.floor\s*\(/.test(clean)
        ) {
            patterns.push("Possible Binary Search");
        } else if (loopInfo.loops.length > 0 && /\[[^\]]+\]/.test(clean) && /\breturn\b/.test(clean)) {
            patterns.push("Possible Linear Search");
        }

        if (recursion) patterns.push("Recursion");
        if (/\b(?:new\s+)?(?:Map|Set)\s*\(/.test(clean)) patterns.push("Hash/Set Structure");
        if (/\[\s*\]/.test(clean)) patterns.push("Array");
        if (/\{[\s\S]*?\}/.test(clean) && /:\s*[^:]/.test(clean)) patterns.push("Object");
    }

    return [...new Set(patterns)];
}

function detectIssues(clean, loopInfo, recursion, language = "javascript") {
    const issues = [];

    if (loopInfo.maxDepth >= 3) {
        issues.push("Three or more nested loop levels may become expensive for large inputs.");
    }

    if (recursion) {
        issues.push("Recursive execution may increase call-stack usage for large inputs.");
    }

    if (language === "python") {
        if (/\b(?:eval|exec)\s*\(/.test(clean)) {
            issues.push("Dynamic code execution detected; review it carefully for security and maintainability.");
        }
    } else {
        if (/\b(?:eval|Function)\s*\(/.test(clean)) {
            issues.push("Dynamic code execution detected; review it carefully for security and maintainability.");
        }
    }

    if (/\bTODO\b|\bFIXME\b/i.test(clean)) {
        issues.push("TODO/FIXME comment detected.");
    }

    return issues;
}

function estimateTimeComplexity(maxDepth, clean, patterns) {
    if (patterns.includes("Possible Binary Search")) return "O(log n)";
    if (patterns.includes("Recursion")) return "O(n)";
    if (maxDepth === 0) return "O(1)";
    if (maxDepth === 1) return "O(n)";
    if (maxDepth === 2) return "O(n²)";
    return `O(n^${maxDepth})`;
}

function buildExplanation(data) {
    if (data.nestedLoops > 0) {
        return `Nested iteration detected. The inner loop executes within the outer loop, giving an estimated ${data.maxLoopDepth}-level loop complexity.`;
    }

    if (data.patterns.includes("Possible Binary Search")) {
        return "The code appears to repeatedly divide a sorted search range, which is characteristic of binary search.";
    }

    if (data.patterns.includes("Possible Linear Search")) {
        return "The code appears to scan elements one by one until a matching condition is found, which is characteristic of linear search.";
    }

    if (data.recursion) {
        return "A recursive function is detected. The function calls itself, so execution depth can grow with the input.";
    }

    if (data.totalLoops === 1) {
        return "A single loop scans or processes the input once, giving approximately linear time complexity.";
    }

    if (data.totalLoops > 1) {
        return "Multiple sequential loops are present. Because they are not nested, their costs add rather than multiply, so the estimate remains approximately linear.";
    }

    if (data.ifStatements > 0) {
        return "The code mainly uses conditional logic to make decisions. Without repeated iteration, the control flow is approximately constant-time.";
    }

    return "No major repeated control structure was detected. The selected code is approximately constant-time based on the lightweight analysis.";
}

function buildWhy(data) {
    if (data.patterns.includes("Possible Binary Search")) {
        return "Binary search reduces the remaining search space by about half on each iteration, which leads to logarithmic time complexity.";
    }

    if (data.nestedLoops > 0) {
        return "The inner loop runs for each iteration of the outer loop. If both depend on n, their costs multiply, producing approximately O(n²) for two levels.";
    }

    if (data.patterns.includes("Possible Linear Search")) {
        return "A linear search may inspect elements from the beginning until the target is found. In the worst case, it checks about n elements.";
    }

    if (data.recursion) {
        return "Each recursive call creates another call-stack frame. The exact complexity depends on the recursive recurrence, so this tool reports the common stack-space warning separately.";
    }

    return `The estimated ${data.timeComplexity} complexity comes from the repeated structures detected in the selected code.`;
}

function buildSimplify(data) {
    if (data.patterns.includes("Possible Linear Search")) {
        return "If the data is sorted and random access is available, consider whether binary search can replace a full linear scan.";
    }

    if (data.nestedLoops > 0) {
        return "Check whether the inner loop can be replaced with a lookup structure such as Map or Set, depending on the problem.";
    }

    if (data.recursion) {
        return "For deep recursion, consider an iterative approach if it provides clearer control over stack usage.";
    }

    if (data.totalLoops > 1) {
        return "Keep sequential loops if they are clear; only combine them when doing so improves readability without changing behavior.";
    }

    return "The selected code is already relatively simple based on this lightweight analysis.";
}

function countFunctionCalls(clean, language = "javascript") {
    const matches = clean.match(/\b[$A-Z_a-z][$\w]*\s*\(/g) || [];
    const jsKeywords = new Set(["if", "for", "while", "switch", "catch", "function", "return"]);
    const pyKeywords = new Set(["if", "elif", "for", "while", "def", "class", "try", "except", "finally", "return", "with", "match", "case", "lambda", "assert", "raise", "yield"]);
    const keywords = language === "python" ? pyKeywords : jsKeywords;
    return matches.filter(item => {
        const name = item.replace(/\s*\($/, "").trim();
        return !keywords.has(name);
    }).length;
}

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
