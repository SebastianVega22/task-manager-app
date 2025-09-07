import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas v1
import routes from "./routes.js";
app.use("/api/v1", routes);

// Manejo de errores (siempre al final)
import errorMiddleware from "./middlewares/error.js";
app.use(errorMiddleware);

const PORT = process.env.PORT || 4000;
const USE_DB = process.env.USE_DB === "1";

async function start() {
  if (USE_DB) {
    const { default: mongoose } = await import("mongoose");
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/taskmanager";
    await mongoose.connect(uri);
    console.log(" MongoDB conectado");
  } else {
    console.log("ℹ  Iniciando sin DB (stubs). Pon USE_DB=1 para conectar Mongo.");
  }

  app.listen(PORT, () => console.log(` API lista en http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error(" Error al iniciar:", err);
  process.exit(1);
});
