export async function list(req, res) {
  const { projectId } = req.params;
  return res.json({
    data: [
      { _id: "t1", projectId, title: "Configurar entorno", status: "todo" },
      { _id: "t2", projectId, title: "Diseñar modelos", status: "in_progress" }
    ]
  });
}
export async function create(req, res) {
  const { projectId } = req.params;
  const { title } = req.body || {};
  if (!title) return res.status(400).json({ message: "title es obligatorio" });
  const created = { _id: "t" + Date.now(), projectId, title, status: "todo" };
  return res.status(201).json({ data: created });
}
export async function update(req, res) {
  const { id } = req.params;
  const { title, status } = req.body || {};
  return res.json({ data: { _id: id, title: title || "Updated", status: status || "todo" } });
}
export async function remove(req, res) {
  return res.status(204).send();
}
