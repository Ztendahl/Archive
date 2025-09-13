CREATE TABLE parent_child (
  parent_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('bio','adoptive','step','guardian','foster')),
  start_date TEXT,
  end_date TEXT,
  certainty REAL,
  PRIMARY KEY(parent_id, child_id)
);
CREATE INDEX idx_parent_child_child ON parent_child(child_id);
