# CodeLens

<p align="center">
  <img src="image/codelens-banner.png"
       alt="CodeLens - Code Analyzer"
       width="100%">
</p>


### Lightweight JavaScript & Python Code Analyzer — Chrome Extension

CodeLens is a lightweight Chrome extension that analyzes **JavaScript and Python code** directly in the browser. It provides useful code metrics, complexity estimates, detected patterns, explanations, and possible issues without requiring external dependencies.

## 🚀 Features

* 🔍 Analyze JavaScript and Python code
* 📊 Estimate Time & Space Complexity
* 🔄 Detect `for`, `while`, and nested loops
* 🧩 Detect functions, conditionals, recursion, and function calls
* 🧠 Identify patterns such as:

  * Linear Search
  * Binary Search
  * Sorting
  * Array Processing
  * Recursion
  * Hash/Set Structures
* ⚠️ Detect possible structural issues
* 💡 Get explanations for analysis results
* ✨ Get simplification suggestions
* 💾 Save analysis results as **Code Capsules**
* 🔎 Search saved capsules
* 🌐 Filter capsules by JavaScript or Python
* 📝 Exam Mode for self-practice
* 📋 Copy analyzed code
* 📄 Generate printable PDF reports
* 📥 Import capsule data from JSON
* 📤 Export capsule data to JSON
* 🗑️ Delete individual capsules or clear all saved data
* 💻 Works locally using browser storage

## 🛠️ Tech Stack

* **JavaScript**
* **HTML5**
* **CSS3**
* **Chrome Extension Manifest V3**
* **Chrome Side Panel API**
* **LocalStorage**
* **Regular Expressions**

## 📁 Project Structure

```text
javascript/
│
├── analyzer.js
├── capsules.js
├── capsules-view.js
├── capsules.html
├── manifest.json
├── popup.html
├── popup.js
├── sidepanel.html
├── sidepanel.js
└── style.css
```

## 🔍 How It Works

1. Open the CodeLens Chrome extension.
2. Select **JavaScript** or **Python**.
3. Paste your code into the analyzer.
4. Click **Analyze Code**.
5. CodeLens analyzes the selected code and displays:

   * Functions
   * If statements
   * For loops
   * While loops
   * Nested loops
   * Recursion
   * Time complexity
   * Space complexity
   * Detected patterns
6. Use **Why?**, **Simplify**, or **Possible Issues** for additional analysis.
7. Save useful results as **Code Capsules**.

## 📚 Saved Capsules

CodeLens provides a dedicated **Saved Capsules** page where analysis results can be stored locally.

Saved capsules include:

* Source code
* Programming language
* Time complexity
* Space complexity
* Functions
* Loop information
* Recursion status
* Detected patterns
* Explanation
* Source information
* Saved date

You can search, filter, copy, delete, export, import, or generate a PDF from saved capsules.

## 📝 Exam Mode

Exam Mode allows users to practice analyzing code without immediately seeing the answers.

When enabled, complexity and explanation details are hidden until the **Reveal Answer** button is selected.

## 💾 Data Storage

CodeLens stores saved capsules locally using the browser's **LocalStorage**.

It also supports:

* JSON backup export
* JSON backup import
* Merging imported capsules
* Backward compatibility with previously stored capsule data

## 🔒 Privacy

CodeLens is designed for local code analysis. Saved capsule data is stored in the browser's local storage rather than requiring a backend database.

## ⚙️ Installation

### Install Manually in Chrome

1. Download or clone this repository.
2. Open Chrome and navigate to:

```text
chrome://extensions/
```

3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the project folder containing `manifest.json`.
6. Open CodeLens from the Chrome extensions menu.

## 🎯 Use Cases

CodeLens can be useful for:

* Students learning Data Structures and Algorithms
* Understanding basic code complexity
* Practicing algorithm analysis
* Reviewing JavaScript and Python code
* Preparing for programming examinations
* Saving and revising code-analysis results
* Learning common programming patterns

## 📌 Limitations

CodeLens uses lightweight static analysis and pattern matching. Complexity results are **estimates** based on detected structures and patterns, rather than a full compiler or formal complexity analyzer.

## 📄 License

This project is available for educational and learning purposes.

---

### CodeLens

**Analyze. Understand. Improve.**

A lightweight browser-based code analysis tool for JavaScript and Python.
