SELECT d.name AS disease, t.type, t.recommendation
FROM treatments t
JOIN diseases d ON d.id = t.disease_id
ORDER BY d.name, t.type;
SELECT name, cause FROM diseases ORDER BY name;
