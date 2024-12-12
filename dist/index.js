#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_spinner_1 = require("cli-spinner");
const commander_1 = require("commander");
const fs_1 = require("fs");
const path_1 = require("path");
const detector_1 = require("./detector");
const program = new commander_1.Command();
program
    .name("unused-components-detector")
    .description("Detect unused React components in your project")
    .version("1.0.0")
    .option("-i, --ignore <paths...>", "Paths to ignore (overrides config file)")
    .option("-e, --extensions <extensions...>", "File extensions to scan (overrides config file)")
    .action(async (options) => {
    try {
        // Load config
        let config = {};
        const configPath = (0, path_1.resolve)(process.cwd(), "ucd-config.json");
        if ((0, fs_1.existsSync)(configPath)) {
            try {
                config = JSON.parse((0, fs_1.readFileSync)(configPath, "utf8"));
            }
            catch (error) {
                console.error("Error parsing ucd-config.json:", error);
                process.exit(1);
            }
        }
        // Determine source directory
        let srcPath = config.srcPath;
        if (!srcPath) {
            const possibleSrcDirs = ["src", "source"];
            srcPath = possibleSrcDirs.find((dir) => (0, fs_1.existsSync)((0, path_1.resolve)(process.cwd(), dir)));
        }
        if (!srcPath || !(0, fs_1.existsSync)((0, path_1.resolve)(process.cwd(), srcPath))) {
            console.error(`Error: Directory "${srcPath}" does not exist or wasn't found.`);
            process.exit(1);
        }
        // Replace ora code with this
        const spinner = new cli_spinner_1.Spinner("Scanning for unused components... %s");
        spinner.setSpinnerString("|/-\\");
        spinner.start();
        const detector = new detector_1.ComponentDetector({
            srcPath,
            ignore: options.ignore || config.ignore,
            extensions: options.extensions || config.extensions,
        });
        const components = await detector.detect();
        const unusedComponents = components.filter((c) => !c.isUsed);
        spinner.stop(true); // true clears the spinner
        if (unusedComponents.length === 0) {
            console.log("No unused components found! 🎉");
            return;
        }
        console.log("\nUnused components found:");
        unusedComponents.forEach((component) => {
            console.log(`- ${component.name} (${component.filePath})`);
        });
    }
    catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
});
program.parse();
