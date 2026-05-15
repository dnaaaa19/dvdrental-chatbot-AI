import joblib
import psycopg2
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

conn = psycopg2.connect(
    dbname="dvdrental",
    user="postgres",
    password="YOUR PASSWORD",
    host="localhost",
    port="5432"
)

query = """
    SELECT f.rental_rate, c.name AS category, i.store_id,
           EXTRACT(EPOCH FROM (r.return_date - r.rental_date))/86400 AS duration_days
    FROM rental r
    JOIN inventory i ON r.inventory_id = i.inventory_id
    JOIN film f ON i.film_id = f.film_id
    JOIN film_category fc ON f.film_id = fc.film_id
    JOIN category c ON fc.category_id = c.category_id
    WHERE r.return_date IS NOT NULL
"""
df_dur = pd.read_sql_query(query, conn)
conn.close()

le = LabelEncoder()
df_model = df_dur.copy()
df_model['cat_encoded'] = le.fit_transform(df_model['category'])

X = df_model[['rental_rate', 'cat_encoded', 'store_id']]
y = df_model['duration_days']

rf_model = RandomForestRegressor(n_estimators=150, max_depth=8, random_state=42).fit(X, y)

joblib.dump(rf_model, 'model.pkl')
joblib.dump(le, 'label_encoder.pkl')
print("Model berhasil disimpan ke model.pkl!")