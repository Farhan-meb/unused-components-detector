#!/usr/bin/env node

import { Spinner } from "cli-spinner";
import { Command } from "commander";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { ComponentDetector } from "./detector";

const program = new Command();

interface UCDConfig {
    srcPath?: string;
    ignore?: string[];
    extensions?: string[];
}

program
    .name("unused-components-detector")
    .description("Detect unused React components in your project")
    .version("1.0.0")
    .option(
        "-i, --ignore <paths...>",
        "Paths to ignore (overrides config file)"
    )
    .option(
        "-e, --extensions <extensions...>",
        "File extensions to scan (overrides config file)"
    )
    .action(async (options) => {
        try {
            // Load config
            let config: UCDConfig = {};
            const configPath = resolve(process.cwd(), "ucd-config.json");

            if (existsSync(configPath)) {
                try {
                    config = JSON.parse(readFileSync(configPath, "utf8"));
                } catch (error) {
                    console.error("Error parsing ucd-config.json:", error);
                    process.exit(1);
                }
            }

            // Determine source directory
            let srcPath = config.srcPath;
            if (!srcPath) {
                const possibleSrcDirs = ["src", "source"];
                srcPath = possibleSrcDirs.find((dir) =>
                    existsSync(resolve(process.cwd(), dir))
                );
            }

            if (!srcPath || !existsSync(resolve(process.cwd(), srcPath))) {
                console.error(
                    `Error: Directory "${srcPath}" does not exist or wasn't found.`
                );
                process.exit(1);
            }

            // Replace ora code with this
            const spinner = new Spinner("Scanning for unused components... %s");
            spinner.setSpinnerString("|/-\\");
            spinner.start();

            const detector = new ComponentDetector({
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
        } catch (error) {
            console.error("Error:", error);
            process.exit(1);
        }
    });

program.parse();
