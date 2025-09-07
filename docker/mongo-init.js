// Se ejecuta automáticamente al levantar el contenedor la primera vez
db = db.getSiblingDB('taskmanager');
db.createUser({
    user: 'taskapp',
    pwd: 'taskpass',
    roles: [{ role: 'readWrite', db: 'taskmanager' }]
});
// opcionales:
db.createCollection('users');
db.createCollection('projects');
db.createCollection('tasks');