import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as fs from "fs";
import * as glob from "glob";
import { ComponentInfo, DetectorOptions } from "./types";

export class ComponentDetector {
    private components: Map<string, ComponentInfo> = new Map();
    private options: DetectorOptions;
    private errors: { file: string; error: any }[] = [];

    constructor(options: DetectorOptions) {
        this.options = {
            extensions: [".jsx", ".tsx", ".js", ".ts"],
            ignore: ["node_modules", "dist", "build"],
            ...options,
        };
    }

    public async detect(): Promise<ComponentInfo[]> {
        const files = this.getFiles();

        if (files.length === 0) {
            console.warn("No files found to scan! Check your configuration.");
            return [];
        }

        // First pass: Find all component declarations

        for (const file of files) {
            try {
                this.findComponents(file);
            } catch (error) {
                this.errors.push({ file, error });
            }
        }

        // Second pass: Find component usage
        for (const file of files) {
            try {
                this.findComponentUsage(file);
            } catch (error) {
                // console.error(`Error checking usage in file ${file}:`, error);
            }
        }

        const result = Array.from(this.components.values());

        return result;
    }
    private getFiles(): string[] {
        if (!this.options.srcPath) {
            throw new Error("srcPath is required");
        }

        // Debug: Print the pattern being used
        const pattern = `${
            this.options.srcPath
        }/**/*{${this.options.extensions?.join(",")}}`;

        // Debug: Print ignore patterns
        const ignorePatterns =
            this.options.ignore?.map((i) => `${this.options.srcPath}/${i}`) ||
            [];

        const files = glob.sync(pattern, {
            ignore: ignorePatterns,
            nodir: true,
        });

        return files;
    }

    private findComponents(filePath: string): void {
        const content = fs.readFileSync(filePath, "utf-8");
        const ast = parser.parse(content, {
            sourceType: "module",
            plugins: ["jsx", "typescript"],
        });

        traverse(ast, {
            // Handle export default declarations
            ExportDefaultDeclaration: (path: any) => {
                const declaration = path.node.declaration;
                if (
                    declaration.type === "Identifier" ||
                    declaration.type === "FunctionDeclaration" ||
                    declaration.type === "ArrowFunctionExpression"
                ) {
                    const name =
                        declaration.type === "Identifier"
                            ? declaration.name
                            : declaration.type === "FunctionDeclaration"
                            ? declaration.id?.name
                            : path.parent.id?.name;
                    if (name) {
                        this.components.set(name, {
                            name,
                            filePath,
                            isUsed: false,
                        });
                    }
                }
            },
            // Handle named exports
            ExportNamedDeclaration: (path: any) => {
                const declaration = path.node.declaration;
                if (declaration) {
                    let name;
                    if (declaration.type === "FunctionDeclaration") {
                        name = declaration.id.name;
                    } else if (declaration.type === "VariableDeclaration") {
                        const declarator = declaration.declarations[0];
                        if (
                            declarator.init?.type ===
                                "ArrowFunctionExpression" ||
                            declarator.init?.type === "FunctionExpression"
                        ) {
                            name = declarator.id.name;
                        }
                    }
                    if (name) {
                        this.components.set(name, {
                            name,
                            filePath,
                            isUsed: false,
                        });
                    }
                }
            },
            // Handle function declarations and const declarations
            FunctionDeclaration: (path: any) => {
                if (
                    path.parent.type !== "ExportNamedDeclaration" &&
                    path.parent.type !== "ExportDefaultDeclaration"
                ) {
                    const name = path.node.id.name;
                    if (name && this.isComponentName(name)) {
                        this.components.set(name, {
                            name,
                            filePath,
                            isUsed: false,
                        });
                    }
                }
            },
            VariableDeclarator: (path: any) => {
                if (
                    path.parent.parent.type !== "ExportNamedDeclaration" &&
                    path.parent.parent.type !== "ExportDefaultDeclaration"
                ) {
                    const init = path.node.init;
                    if (
                        init &&
                        (init.type === "ArrowFunctionExpression" ||
                            init.type === "FunctionExpression")
                    ) {
                        const name = path.node.id.name;
                        if (name && this.isComponentName(name)) {
                            this.components.set(name, {
                                name,
                                filePath,
                                isUsed: false,
                            });
                        }
                    }
                }
            },
        });
    }

    // Helper method to check if a name follows component naming convention
    private isComponentName(name: string): boolean {
        return /^[A-Z]/.test(name); // Component names should start with capital letter
    }

    private findComponentUsage(filePath: string): void {
        const content = fs.readFileSync(filePath, "utf-8");
        const ast = parser.parse(content, {
            sourceType: "module",
            plugins: ["jsx", "typescript"],
        });

        traverse(ast, {
            JSXIdentifier: (path: any) => {
                const name = path.node.name;
                if (this.components.has(name)) {
                    const component = this.components.get(name)!;
                    component.isUsed = true;
                }
            },
        });
    }
}
