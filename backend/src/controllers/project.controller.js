const demo = [
  { _id: "p1", name: "Proyecto Demo 1" },
  { _id: "p2", name: "Proyecto Demo 2" }
];

export async function list(req, res) {
  return res.json({ data: demo });
}
export async function create(req, res) {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: "name es obligatorio" });
  const created = { _id: "p" + Date.now(), name };
  return res.status(201).json({ data: created });
}
export async function detail(req, res) {
  const found = demo.find(p => p._id === req.params.id);
  if (!found) return res.status(404).json({ message: "Proyecto no encontrado" });
  return res.json({ data: found });
}
export async function update(req, res) {
  const { id } = req.params;
  const { name } = req.body || {};
  return res.json({ data: { _id: id, name: name || "Updated" } });
}
export async function remove(req, res) {
  return res.status(204).send();
}
