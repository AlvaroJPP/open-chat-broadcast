import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, "..");

const DIRECTORIES = {
    models: path.join(ROOT_DIR, "models"),
    controllers: path.join(ROOT_DIR, "controllers"),
    routers: path.join(ROOT_DIR, "routers")
};

function createDirectories(): void {
    for (const directory of Object.values(DIRECTORIES)) {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, {
                recursive: true
            });

            console.log(
                `[DIR] Pasta criada: ${path.relative(ROOT_DIR, directory)}`
            );
        }
    }
}

function createController(name: string): void {
    const filePath = path.join(
        DIRECTORIES.controllers,
        `${name}_controller.ts`
    );

    if (fs.existsSync(filePath)) {
        return;
    }

    const content = `import ${name}Model from "../models/${name}_model.ts";

const ${name}Controller = {
    model: ${name}Model
};

export default ${name}Controller;
`;

    fs.writeFileSync(
        filePath,
        content,
        "utf8"
    );

    console.log(
        `[DIR] Controller criado: controllers/${name}_controller.ts`
    );
}

function createRouter(name: string): void {
    const filePath = path.join(
        DIRECTORIES.routers,
        `${name}_router.ts`
    );

    if (fs.existsSync(filePath)) {
        return;
    }

    const content = `import ${name}Controller from "../controllers/${name}_controller.ts";

const ${name}Router = {
    controller: ${name}Controller
};

export default ${name}Router;
`;

    fs.writeFileSync(
        filePath,
        content,
        "utf8"
    );

    console.log(
        `[DIR] Router criado: routers/${name}_router.ts`
    );
}

function processModel(filename: string): void {
    if (!filename.endsWith("_model.ts")) {
        return;
    }

    const name = filename.replace("_model.ts", "");

    if (!name) {
        return;
    }

    console.log(
        `[DIR] Model detectado: ${filename}`
    );

    createController(name);
    createRouter(name);
}

function processExistingModels(): void {
    const files = fs.readdirSync(
        DIRECTORIES.models
    );

    for (const file of files) {
        processModel(file);
    }
}

function watchModels(): void {
    fs.watch(
        DIRECTORIES.models,
        (eventType, filename) => {
            if (!filename) {
                return;
            }

            const filenameString = filename.toString();

            if (eventType === "rename") {
                processModel(filenameString);
            }
        }
    );

    console.log(
        "[DIR] Monitorando models..."
    );
}

function start(): void {
    createDirectories();

    processExistingModels();

    watchModels();

    console.log(
        "[DIR] Sistema de diretórios iniciado."
    );
}

export default {
    start
};