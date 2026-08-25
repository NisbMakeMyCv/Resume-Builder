import psycopg2

conn = psycopg2.connect(
    host="127.0.0.1",
    port=5432,
    dbname="makemycv_db",
    user="makemycv_user",
    password="supersecretpassword"
)
conn.autocommit = True
cur = conn.cursor()

# Check if column already exists
cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name='resume_documents' AND column_name='file_blob'
""")
if cur.fetchone():
    print("file_blob column already exists - no action needed.")
else:
    cur.execute("ALTER TABLE resume_documents ADD COLUMN file_blob BYTEA")
    print("Added file_blob column successfully.")

cur.close()
conn.close()
