// backend/src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// --- Middlewares base ---
app.disable("x-powered-by"); // higiene: no exponer Express
app.use(cors()); // en prod: restringe orígenes
app.use(express.json());

// --- Healthchecks (útil para pruebas y uptime) ---
app.get("/", (_req, res) => res.send("Task Manager API"));
app.get("/api/v1/health", (_req, res) => res.json({ status: "ok" }));

// --- Rutas v1 ---
import routes from "./routes.js";
app.use("/api/v1", routes);

// --- Manejo centralizado de errores (siempre al final de rutas) ---
import errorMiddleware from "./middlewares/error.js";
app.use(errorMiddleware);

// --- Config ---
const PORT = process.env.PORT || 4000;
const USE_DB = process.env.USE_DB === "1";

// Guardamos una referencia a mongoose para cierre limpio
let mongooseInstance = null;
let server = null;

async function start() {
    if (USE_DB) {
        // Carga perezosa de mongoose (solo si se usa DB)
        const { default: mongoose } = await
        import ("mongoose");
        const uri = process.env.MONGO_URI || "mongodb://localhost:27017/taskmanager";
        await mongoose.connect(uri);
        mongooseInstance = mongoose;
        console.log("✅ MongoDB conectado");

        // Jobs (cron) después de conectar a DB
        const { initDueNotifier } = await
        import ("./jobs/dueNotifier.js");
        initDueNotifier();
    } else {
        console.log("ℹ️  Iniciando sin DB (stubs). Pon USE_DB=1 para conectar Mongo.");
    }

    server = app.listen(PORT, () => {
        console.log(`✅ API lista en http://localhost:${PORT}`);
    });
}

// Apagado ordenado (Ctrl+C / kill)
async function gracefulShutdown(signal) {
    try {
        console.log(`\n${signal} recibido. Cerrando...`);
        if (server) {
            await new Promise((resolve) => server.close(resolve));
            console.log("🔌 HTTP cerrado");
        }
        if (USE_DB && mongooseInstance && mongooseInstance.connection && mongooseInstance.connection.readyState === 1) {
            await mongooseInstance.connection.close();
            console.log("🗄️  MongoDB desconectado");
        }
    } catch (e) {
        console.error("❌ Error al cerrar:", (e && e.message) ? e.message : e);
    } finally {
        process.exit(0);
    }
}
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

start().catch((err) => {
    console.error("❌ Error al iniciar:", (err && err.message) ? err.message : err);
    process.exit(1);
});