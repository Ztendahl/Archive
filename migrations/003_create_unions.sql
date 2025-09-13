CREATE TABLE unions (
  id TEXT PRIMARY KEY,
  person1_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  person2_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  start_date TEXT,
  end_date TEXT,
  notes TEXT
);
CREATE INDEX idx_unions_person1 ON unions(person1_id);
CREATE INDEX idx_unions_person2 ON unions(person2_id);
