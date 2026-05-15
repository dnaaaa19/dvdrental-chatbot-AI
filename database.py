import pandas as pd
import psycopg2

DB_CONFIG = {
    "host":     "localhost",
    "port":     5432,
    "dbname":   "dvdrental",
    "user":     "postgres",
    "password": "YOUR PASSWORD",
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

def run_query(sql: str) -> pd.DataFrame:
    conn = get_connection()
    try:
        df = pd.read_sql(sql, conn)
        conn.close()
        return df
    except Exception as e:
        if conn:
            conn.close()
        raise e
