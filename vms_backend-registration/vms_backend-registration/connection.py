import psycopg2
import psycopg2.extras

DB_NAME = "vms"
DB_USER = "postgres"
DB_PASS = "root"
DB_HOST = "localhost"
DB_PORT = 5432


def connect_to_db():
    return psycopg2.connect(
        dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT
    )


def execute_query(query, params=None, fetchone=False):
    conn = connect_to_db()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute(query, params)
    conn.commit()

    if fetchone:
        result = cursor.fetchone()
    else:
        result = cursor.fetchall()

    cursor.close()
    conn.close()
    return result
