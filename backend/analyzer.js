/**
 * Simple static code analyzer for demonstration purposes.
 * It checks for a missing colon (:) after a Python 'def' statement.
 *
 * @param {string} code - The code snippet submitted by the user.
 * @param {string} language - The programming language (e.g., 'python', 'c', 'java').
 * @returns {object} An analysis result object.
 */
function analyzeCode(code, language) {
    const lowerLang = language.toLowerCase();

    // AI-style helper for more user-friendly suggestions
    const extractSuggestion = (msg, defaultSuggestion) => {
        if (!msg) return defaultSuggestion;
        const text = msg.toLowerCase();

        if (text.includes('indentationerror')) return 'Check indentation (spaces/tabs) and alignment in your Python code.';
        if (text.includes('nameerror')) return 'Variable/function used before definition; check spelling and declaration.';
        if (text.includes('syntaxerror')) return 'Review syntax near the reported line; missing punctuation or incorrect structure.';
        if (text.includes('expected declaration specifiers') || text.includes('error: expected')) return 'C/C++ syntax requires correct declarations, semicolons, and matching braces.';
        if (text.includes('undefined reference')) return 'Linker error: check symbol names and that you included required libraries.';
        if (text.includes('class') && text.includes('public') && text.includes('static void main')) return 'Java class and main method syntax needs a proper class wrapper and method signature.';

        return defaultSuggestion;
    };

    // Helper: run a command and capture stderr output
    const { exec } = require('child_process');
    const fs = require('fs');
    const os = require('os');
    const path = require('path');

    const runCmd = (cmd) => new Promise((resolve, reject) => {
        exec(cmd, { timeout: 10000 }, (error, stdout, stderr) => {
            // If the underlying command is missing, exec will set error.code === 'ENOENT'
            if (error && error.code === 'ENOENT') {
                return reject({ code: 'ENOENT', error, stdout, stderr });
            }
            resolve({ error, stdout, stderr });
        });
    });

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-debug-'));

        if (lowerLang === 'python') {
            const filePath = path.join(tmpDir, 'submission.py');
            fs.writeFileSync(filePath, code, 'utf8');
            // Use python -m py_compile to check syntax
            return runCmd(`python -m py_compile "${filePath}"`)
                .then(({ error, stderr }) => {
                    if (error) {
                        // Parse stderr for line number and message
                        const msg = (stderr && stderr.toString()) || (error && error.message) || 'Unknown Python syntax error';
                        const lineMatch = msg.match(/File .*?, line (\d+)/);
                        const ln = lineMatch ? parseInt(lineMatch[1], 10) : null;
                        return {
                            errors: [msg.trim()],
                            explanation: 'Syntax error detected in Python code.',
                            suggestions: 'Fix the syntax error reported above.',
                            lineNumbers: ln ? [ln] : []
                        };
                    }
                    // Syntax OK, now run the code to get output
                    return runCmd(`python "${filePath}"`)
                        .then(({ error: runError, stdout, stderr: runStderr }) => {
                            if (runError && runError.code !== 0) {
                                // Runtime error
                                const errMsg = runStderr.toString() || runError.message;
                                const lineMatch = errMsg.match(/line (\d+)/);
                                const ln = lineMatch ? parseInt(lineMatch[1], 10) : null;
                                return {
                                    errors: [errMsg.trim()],
                                    explanation: 'Runtime error occurred while executing Python code.',
                                    suggestions: 'Fix the runtime error and re-run.',
                                    lineNumbers: ln ? [ln] : [],
                                    stdout: stdout.toString(),
                                    stderr: runStderr.toString()
                                };
                            }
                            // Success
                            return {
                                errors: [],
                                explanation: 'Python code executed successfully.',
                                suggestions: 'Code runs without errors. Great job!',
                                lineNumbers: [],
                                stdout: stdout.toString(),
                                stderr: runStderr.toString()
                            };
                        })
                        .catch((runErr) => {
                            console.error('Python run failed:', runErr);
                            return {
                                errors: ['Failed to execute Python code.'],
                                explanation: 'An error occurred during execution.',
                                suggestions: 'Check code logic or server setup.',
                                lineNumbers: [],
                                stdout: '',
                                stderr: runErr.message || ''
                            };
                        });
                })
                .catch((err) => {
                    if (err && err.code === 'ENOENT') {
                        return {
                            errors: ['Python runtime not found on server.'],
                            explanation: 'Could not run Python to check syntax.',
                            suggestions: 'Install Python on the server or choose another language.',
                            lineNumbers: []
                        };
                    }
                    console.error('Python check failed:', err);
                    return {
                        errors: ['Failed to run python for syntax check.'],
                        explanation: 'An unexpected error occurred while running Python.',
                        suggestions: 'Check server logs for more details.',
                        lineNumbers: []
                    };
                })
                .finally(() => {
                    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
                });
        }

        if (lowerLang === 'c' || lowerLang === 'c++') {
            const ext = lowerLang === 'c' ? '.c' : '.cpp';
            const filePath = path.join(tmpDir, `submission${ext}`);
            fs.writeFileSync(filePath, code, 'utf8');
            const compiler = lowerLang === 'c' ? 'gcc' : 'g++';
            const execPath = path.join(tmpDir, 'submission_exec');

            // 1) compile
            return runCmd(`${compiler} "${filePath}" -o "${execPath}"`).then(({ error, stdout, stderr }) => {
                if (error) {
                    const msg = stderr.toString() || error.message;
                    const m = msg.match(/:(\d+):/);
                    const ln = m ? parseInt(m[1], 10) : null;
                    return {
                        errors: [msg.trim()],
                        explanation: `${language} compilation failed with errors.`,
                        suggestions: extractSuggestion(msg, 'Fix compile errors and re-run.'),
                        lineNumbers: ln ? [ln] : [],
                        stdout: stdout.toString(),
                        stderr: stderr.toString()
                    };
                }

                // 2) execute binary
                return runCmd(`"${execPath}"`).then(({ error: runErr, stdout: runOut, stderr: runErrOut }) => {
                    if (runErr) {
                        return {
                            errors: [runErrOut.toString() || runErr.message],
                            explanation: `${language} executable produced runtime error.`,
                            suggestions: 'Fix runtime issue or infinite loop and re-run.',
                            lineNumbers: [],
                            stdout: runOut.toString(),
                            stderr: runErrOut.toString()
                        };
                    }
                    return {
                        errors: [],
                        explanation: `${language} compiled and ran successfully.`,
                        suggestions: 'Good job! Check output in stdout.',
                        lineNumbers: [],
                        stdout: runOut.toString(),
                        stderr: runErrOut.toString()
                    };
                });
            }).catch((err) => {
                if (err && err.code === 'ENOENT') {
                    return {
                        errors: ['Compiler not found or failed to run.'],
                        explanation: `Could not run ${compiler}. Make sure ${compiler} is installed on the server.`,
                        suggestions: `Install ${compiler} or select another language.`,
                        lineNumbers: []
                    };
                }
                console.error('Compiler check failed:', err);
                return {
                    errors: ['Compiler failed to run.'],
                    explanation: `Error while trying to run ${compiler}.`,
                    suggestions: 'Check server configuration and installed compilers.',
                    lineNumbers: []
                };
            }).finally(() => {
                try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
            });
        }

        if (lowerLang === 'java') {
            // javac requires public class name to match filename for public classes.
            // Use class name from code if it exists, else fallback to Submission.java.
            const classMatch = code.match(/public\s+class\s+([A-Za-z_$][A-Za-z0-9_$]*)/m);
            const mainMatch = code.match(/(?:public\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)[\s\S]*?public\s+static\s+void\s+main\s*\(/m);
            const sourceFileName = classMatch ? `${classMatch[1]}.java` : 'Submission.java';
            const runClassName = mainMatch ? mainMatch[1] : (classMatch ? classMatch[1] : 'Submission');
            const filePath = path.join(tmpDir, sourceFileName);
            fs.writeFileSync(filePath, code, 'utf8');
            return runCmd(`javac "${filePath}"`).then(({ error, stdout, stderr }) => {
                if (error) {
                    const msg = stderr.toString();
                    const m = msg.match(/:(\d+):/);
                    const ln = m ? parseInt(m[1], 10) : null;
                    let suggestions = extractSuggestion(msg, 'Fix the reported compilation errors and re-run.');
                    if (msg.includes('should be declared in a file named')) {
                        suggestions = 'Rename the public class to match the source filename or adjust the filename to match public class name.';
                    }
                    return {
                        errors: [msg.trim()],
                        explanation: 'Java compiler reported errors.',
                        suggestions,
                        lineNumbers: ln ? [ln] : [],
                        stdout: stdout.toString(),
                        stderr: stderr.toString()
                    };
                }

                return runCmd(`java -cp "${tmpDir}" ${runClassName}`).then(({ error: runErr, stdout: runOut, stderr: runErrOut }) => {
                    if (runErr) {
                        const msg = runErrOut.toString() || runErr.message;
                        const lineMatch = msg.match(/:(\d+):/);
                        const ln = lineMatch ? parseInt(lineMatch[1], 10) : null;
                        return {
                            errors: [msg.trim()],
                            explanation: 'Java runtime error occurred while executing the class.',
                            suggestions: 'Fix the runtime error and re-run.',
                            lineNumbers: ln ? [ln] : [],
                            stdout: runOut.toString(),
                            stderr: runErrOut.toString()
                        };
                    }
                    return {
                        errors: [],
                        explanation: 'Java code compiled and ran successfully.',
                        suggestions: 'Check stdout for program output.',
                        lineNumbers: [],
                        stdout: runOut.toString(),
                        stderr: runErrOut.toString()
                    };
                });
            }).catch((err) => {
                if (err && err.code === 'ENOENT') {
                    return {
                        errors: ['javac not found or failed to run.'],
                        explanation: 'Could not run javac. Ensure JDK is installed on the server.',
                        suggestions: 'Install JDK or choose another language.',
                        lineNumbers: []
                    };
                }
                console.error('Javac check failed:', err);
                return {
                    errors: ['javac failed to run.'],
                    explanation: 'Error while attempting to run javac.',
                    suggestions: 'Check server configuration and installed JDK.',
                    lineNumbers: []
                };
            }).finally(() => {
                try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
            });
        }

        // Default fallback
        return Promise.resolve({
            errors: [],
            explanation: `Analysis for ${language} is not implemented yet.`,
            suggestions: 'We currently support Python, C, C++ and Java syntax checks.',
            lineNumbers: []
        });
}

module.exports = {
    analyzeCode
};