"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentDetector = void 0;
const parser = __importStar(require("@babel/parser"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const fs = __importStar(require("fs"));
const glob = __importStar(require("glob"));
class ComponentDetector {
    constructor(options) {
        this.components = new Map();
        this.errors = [];
        this.options = {
            extensions: [".jsx", ".tsx", ".js", ".ts"],
            ignore: ["node_modules", "dist", "build"],
            ...options,
        };
    }
    async detect() {
        const files = this.getFiles();
        if (files.length === 0) {
            console.warn("No files found to scan! Check your configuration.");
            return [];
        }
        // First pass: Find all component declarations
        for (const file of files) {
            try {
                this.findComponents(file);
            }
            catch (error) {
                this.errors.push({ file, error });
            }
        }
        // Second pass: Find component usage
        for (const file of files) {
            try {
                this.findComponentUsage(file);
            }
            catch (error) {
                // console.error(`Error checking usage in file ${file}:`, error);
            }
        }
        const result = Array.from(this.components.values());
        return result;
    }
    getFiles() {
        var _a, _b;
        if (!this.options.srcPath) {
            throw new Error("srcPath is required");
        }
        // Debug: Print the pattern being used
        const pattern = `${this.options.srcPath}/**/*{${(_a = this.options.extensions) === null || _a === void 0 ? void 0 : _a.join(",")}}`;
        // Debug: Print ignore patterns
        const ignorePatterns = ((_b = this.options.ignore) === null || _b === void 0 ? void 0 : _b.map((i) => `${this.options.srcPath}/${i}`)) ||
            [];
        const files = glob.sync(pattern, {
            ignore: ignorePatterns,
            nodir: true,
        });
        return files;
    }
    findComponents(filePath) {
        const content = fs.readFileSync(filePath, "utf-8");
        const ast = parser.parse(content, {
            sourceType: "module",
            plugins: ["jsx", "typescript"],
        });
        (0, traverse_1.default)(ast, {
            // Handle export default declarations
            ExportDefaultDeclaration: (path) => {
                var _a, _b;
                const declaration = path.node.declaration;
                if (declaration.type === "Identifier" ||
                    declaration.type === "FunctionDeclaration" ||
                    declaration.type === "ArrowFunctionExpression") {
                    const name = declaration.type === "Identifier"
                        ? declaration.name
                        : declaration.type === "FunctionDeclaration"
                            ? (_a = declaration.id) === null || _a === void 0 ? void 0 : _a.name
                            : (_b = path.parent.id) === null || _b === void 0 ? void 0 : _b.name;
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
            ExportNamedDeclaration: (path) => {
                var _a, _b;
                const declaration = path.node.declaration;
                if (declaration) {
                    let name;
                    if (declaration.type === "FunctionDeclaration") {
                        name = declaration.id.name;
                    }
                    else if (declaration.type === "VariableDeclaration") {
                        const declarator = declaration.declarations[0];
                        if (((_a = declarator.init) === null || _a === void 0 ? void 0 : _a.type) ===
                            "ArrowFunctionExpression" ||
                            ((_b = declarator.init) === null || _b === void 0 ? void 0 : _b.type) === "FunctionExpression") {
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
            FunctionDeclaration: (path) => {
                if (path.parent.type !== "ExportNamedDeclaration" &&
                    path.parent.type !== "ExportDefaultDeclaration") {
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
            VariableDeclarator: (path) => {
                if (path.parent.parent.type !== "ExportNamedDeclaration" &&
                    path.parent.parent.type !== "ExportDefaultDeclaration") {
                    const init = path.node.init;
                    if (init &&
                        (init.type === "ArrowFunctionExpression" ||
                            init.type === "FunctionExpression")) {
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
    isComponentName(name) {
        return /^[A-Z]/.test(name); // Component names should start with capital letter
    }
    findComponentUsage(filePath) {
        const content = fs.readFileSync(filePath, "utf-8");
        const ast = parser.parse(content, {
            sourceType: "module",
            plugins: ["jsx", "typescript"],
        });
        (0, traverse_1.default)(ast, {
            JSXIdentifier: (path) => {
                const name = path.node.name;
                if (this.components.has(name)) {
                    const component = this.components.get(name);
                    component.isUsed = true;
                }
            },
        });
    }
}
exports.ComponentDetector = ComponentDetector;
