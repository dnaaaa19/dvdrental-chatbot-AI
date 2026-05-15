from flask import Flask, jsonify, send_from_directory, request
import psycopg2
import psycopg2.extras
import pandas as pd
import numpy as np
import joblib
import os
from groq import Groq
from bs4 import BeautifulSoup
from transformer_forecast import run_transformer_forecast

# ── Groq API ──────────────────────────────────────────────────────────────────
client = Groq(api_key=os.environ.get("GROQ_API_KEY", "YOUR GROQ API KEY"))

app = Flask(__name__, static_folder=".")

# ── DB CONFIG ─────────────────────────────────────────────────────────────────
DB_CONFIG = {
    "host":     "localhost",
    "port":     5432,
    "dbname":   "dvdrental",
    "user":     "postgres",
    "password": "YOUR PASSWORD",
}

def get_conn():
    return psycopg2.connect(**DB_CONFIG)

def query(sql, params=None):
    conn = get_conn()
    try:
        df = pd.read_sql(sql, conn, params=params)
        return df
    finally:
        conn.close()

def df_to_json(df):
    return df.where(pd.notnull(df), None).to_dict(orient="records")

# =============================================================================
#  CHATBOT LOGIC
# =============================================================================

import re as _re
import json as _json

# ── PERSISTENT STATE FILE (survives server restart) ──────────────────────────
PERM_STATE_FILE = 'perm_state.json'

def _load_perm_state():
    if os.path.exists(PERM_STATE_FILE):
        try:
            with open(PERM_STATE_FILE, 'r') as f:
                return _json.load(f)
        except Exception:
            pass
    return {'chart_types': {}, 'layouts': {}}

def _save_perm_state(state):
    with open(PERM_STATE_FILE, 'w') as f:
        _json.dump(state, f, indent=2)

CHART_ALIASES = {
    'monthly': 'chart-monthly', 'revenue snapshot': 'chart-monthly',
    'monthly revenue': 'chart-monthly', 'revenue bulanan': 'chart-monthly',
    'bulanan': 'chart-monthly',
    'growth': 'chart-growth', 'pertumbuhan': 'chart-growth', 'mom': 'chart-growth',
    'weekday': 'chart-weekday', 'hari': 'chart-weekday', 'per hari': 'chart-weekday',
    'donut': 'chart-donut', 'revenue share': 'chart-donut', 'share': 'chart-donut',
    'transactions': 'chart-transactions', 'transaksi': 'chart-transactions',
    'hist': 'chart-hist', 'historis': 'chart-hist', 'historical': 'chart-hist',
    'forecast': 'chart-forecast', 'prediksi': 'chart-forecast', 'proyeksi': 'chart-forecast',
    'staff': 'chart-staff', 'karyawan': 'chart-staff',
    'leakbar': 'chart-leakbar', 'late fee': 'chart-leakbar', 'leak': 'chart-leakbar', 'bocor': 'chart-leakbar',
    'storeleak': 'chart-storeleak', 'store leak': 'chart-storeleak',
    'catleak': 'chart-catleak', 'kategori leak': 'chart-catleak',
    'duration': 'chart-duration', 'durasi': 'chart-duration', 'distribusi durasi': 'chart-duration',
    'catdonut': 'chart-catdonut', 'kategori donut': 'chart-catdonut', 'kategori': 'chart-catdonut',
    'topfilms': 'chart-topfilms', 'top film': 'chart-topfilms', 'film teratas': 'chart-topfilms',
    'scatter': 'chart-scatter', 'quadbar': 'chart-quadbar', 'kuadran': 'chart-quadbar',
}

CHART_TYPES = {
    'bar': 'bar', 'bar chart': 'bar', 'batang': 'bar', 'kolom': 'bar', 'bar horizontal' : 'bar horizontal', 'bar vertikal' : 'bar vertikal',
    'line': 'scatter', 'line chart': 'scatter', 'garis': 'scatter', 'lines': 'scatter',
    'scatter': 'scatter', 'scatter plot': 'scatter', 'titik': 'scatter',
    'pie': 'pie', 'donut': 'pie', 'donat': 'pie', 'lingkaran': 'pie',
    'histogram': 'histogram', 'area': 'scatter',
}

COLOR_PRESETS = {
    'red':  {'--blue': '#e05060', '--teal': '#c03848', '--rose': '#802030'},
    'green':  {'--blue': '#3a9e6f', '--teal': '#2d8060', '--green': '#22703a'},
    'teal':   {'--blue': '#3a9e8f', '--teal': '#2d8070', '--green': '#1a7060'},
    'orange': {'--blue': '#d0762a', '--teal': '#b86020', '--amber': '#e08020'},
    'purple':   {'--blue': '#8060c0', '--teal': '#604898', '--rose': '#703858'},
    'blue':   {'--blue': '#5b7ec5', '--teal': '#3a7098', '--slate': '#4a6080'},
    'pink':   {'--blue': '#c05890', '--teal': '#a03870', '--rose': '#802050'},
    'yellow': {'--blue': '#c8a030', '--teal': '#a08020', '--amber': '#e0b840'},
}

def sanitize_for_ai(data_str: str) -> str:
    patterns = [
        (r'gsk_[A-Za-z0-9]{20,}', '[API_KEY_HIDDEN]'),
        (r'password["\s]*[:=]["\s]*\S+', 'password: [HIDDEN]'),
        (r'host["\s]*[:=]["\s]*localhost', 'host: [DB_HOST]'),
        (r'postgresql://[^\s]+', '[DB_URL_HIDDEN]'),
    ]
    for pat, repl in patterns:
        data_str = _re.sub(pat, repl, data_str, flags=_re.IGNORECASE)
    return data_str

def detect_language(text: str) -> str:
    indo_words = ['apa', 'ini', 'ada', 'dan', 'yang', 'di', 'ke', 'dari', 'saya',
                  'kamu', 'bisa', 'tolong', 'bagaimana', 'berapa', 'ubah', 'ganti',
                  'tampilkan', 'jelaskan', 'lihat', 'coba', 'gimana', 'kayak', 'bantu']
    text_lower = text.lower()
    count = sum(1 for w in indo_words if f' {w} ' in f' {text_lower} ')
    return 'id' if count >= 2 else 'en'

def detect_trend(monthly_data) -> dict:
    if len(monthly_data) < 2:
        return {'trend': 'neutral', 'pct': 0}
    vals = [float(r['rev']) for _, r in monthly_data.iterrows()]
    last     = vals[0]
    prev_avg = sum(vals[1:]) / len(vals[1:]) if len(vals) > 1 else last
    pct      = ((last - prev_avg) / prev_avg * 100) if prev_avg else 0
    trend    = 'up' if pct > 2 else ('down' if pct < -2 else 'stable')
    return {'trend': trend, 'pct': round(pct, 1)}

def detect_ui_command(prompt: str) -> dict | None:
    p = prompt.lower()
    if any(k in p for k in ['reset semua', 'reset all', 'kembalikan semua', 'default semua']):
        if 'chart' in p or 'grafik' in p:
            return {"action": "reset_all_charts"}
        return {"action": "reset_colors"}
    if any(k in p for k in ['dark mode', 'mode gelap', 'gelap', 'malam', 'hitam']):
        return {"action": "toggle_dark_mode", "target": "dark"}
    if any(k in p for k in ['light mode', 'mode terang', 'terang', 'siang', 'putih', 'cerah']):
        return {"action": "toggle_dark_mode", "target": "light"}
    is_color = any(k in p for k in ['warna', 'color', 'tema', 'theme', 'ganti tampilan', 'ubah tampilan'])
    is_reset = is_color and any(k in p for k in ['kembalikan', 'reset', 'default', 'semula', 'awal'])
    if is_reset:
        return {"action": "reset_colors"}
    if is_color and not is_reset:
        for preset_name, vars_dict in COLOR_PRESETS.items():
            if preset_name in p:
                changes = [{"var": k, "value": v} for k, v in vars_dict.items()]
                return {"action": "change_color", "changes": changes}
        m = _re.search(r'(--[a-z]+)\s+(?:ke|menjadi|to|=)\s+(#[0-9a-fA-F]{3,8})', p)
        if m:
            return {"action": "change_color", "var": m.group(1), "value": m.group(2)}
    if any(k in p for k in ['sidebar', 'panel', 'menu samping', 'menu kiri']):
        is_hide = any(k in p for k in ['sembunyikan', 'hide', 'hilangkan', 'tutup'])
        return {"action": "toggle_sidebar", "mode": "hide" if is_hide else "show"}
    time_match = _re.search(r'(\d+)\s*(bulan|month|minggu|week|hari|day)', p)
    if time_match and any(k in p for k in ['ubah rentang', 'rentang waktu', 'tampilkan', 'lihat', 'filter', 'periode', 'terakhir']):
        amount = int(time_match.group(1))
        unit   = time_match.group(2)
        months = amount if unit in ('bulan', 'month') else (amount // 4 if unit in ('minggu', 'week') else amount // 30)
        months = max(1, min(months, 24))
        for alias, cid in CHART_ALIASES.items():
            if alias in p:
                return {"action": "change_time_range", "target": cid, "months": months}
        return {"action": "change_time_range", "target": "chart-monthly", "months": months}
    if any(k in p for k in ['kembalikan', 'reset', 'default']) and any(k in p for k in ['chart', 'grafik']):
        for alias, cid in CHART_ALIASES.items():
            if alias in p:
                return {"action": "reset_chart", "target": cid}
    is_change = any(k in p for k in ['ubah', 'ganti', 'jadikan', 'jadi', 'change', 'convert', 'rubah'])
    if is_change and not is_color:
        chart_id   = None
        chart_type = None
        for alias, cid in CHART_ALIASES.items():
            if alias in p:
                chart_id = cid
                break
        for alias, ct in CHART_TYPES.items():
            if alias in p:
                chart_type = ct
                break
        if chart_id and chart_type:
            return {"action": "change_chart_type", "target": chart_id, "type": chart_type}

    # ── Persistent chart type change detection
    is_perm_chart = any(k in p for k in ['permanen', 'permanently', 'simpan permanen', 'save permanently',
                                          'tetap setelah refresh', 'keep after refresh', 'simpan perubahan'])
    if is_perm_chart and is_change and not is_color:
        chart_id2 = None
        chart_type2 = None
        for alias, cid in CHART_ALIASES.items():
            if alias in p:
                chart_id2 = cid
                break
        for alias, ct in CHART_TYPES.items():
            if alias in p:
                chart_type2 = ct
                break
        if chart_id2 and chart_type2:
            return {"action": "permanent_chart_type", "target": chart_id2, "type": chart_type2}

    # ── Layout swap/reorder detection
    swap_words = ['tukar', 'swap', 'ganti posisi', 'pindahkan', 'pindah posisi', 'atur ulang',
                  'reorder', 'reorder layout', 'tukar posisi', 'balik posisi', 'geser',
                  'mode atur ulang', 'drag', 'seret']
    is_swap = any(k in p for k in swap_words)
    if is_swap:
        chart_ids_found = []
        for alias, cid in CHART_ALIASES.items():
            if alias in p and cid not in chart_ids_found:
                chart_ids_found.append(cid)
        if len(chart_ids_found) >= 2:
            return {"action": "swap_charts", "chart_a": chart_ids_found[0], "chart_b": chart_ids_found[1]}
        # Generic reorder if no specific charts
        return {"action": "toggle_layout_mode"}

    # ── Page navigation detection
    PAGE_KEYWORDS = {
        'overview':         ['overview', 'beranda', 'home', 'halaman utama', 'dashboard utama'],
        'revenue_stores':   ['revenue', 'pendapatan', 'toko', 'store', 'revenue store', 'revenue & store', 'penjualan'],
        'film_pricing':     ['film', 'movie', 'pricing', 'harga', 'film pricing', 'film & pricing', 'kategori film'],
        'leaks_action':     ['leak', 'bocor', 'late fee', 'keterlambatan', 'leaks', 'aksi', 'action'],
    }
    navigate_words = ['pergi ke', 'buka', 'tampilkan halaman', 'pindah ke', 'lihat halaman',
                      'go to', 'open', 'navigate to', 'show page', 'switch to page', 'take me to']
    is_navigate = any(k in p for k in navigate_words)
    if is_navigate:
        for page_id, keywords in PAGE_KEYWORDS.items():
            if any(k in p for k in keywords):
                return {"action": "navigate_page", "target": page_id}
    return None


@app.route('/api/chat', methods=['POST'])
def api_chat():
    try:
        data         = request.get_json()
        user_prompt  = data.get('prompt', '')
        ui_context   = data.get('ui_context', {})
        chat_history = data.get('history', [])
        current_page = ui_context.get('page', '/')
        ui_theme     = ui_context.get('theme', 'dark')
        avail_charts = ui_context.get('availableCharts', [])

        lang      = detect_language(user_prompt)
        lang_note = "Balas dalam Bahasa Indonesia. Kalau user pakai bahasa Inggris, ikuti." if lang == 'id' \
                    else "Reply in English. Switch to Bahasa Indonesia if user does."

        df_stats  = query("SELECT SUM(amount) as rev, COUNT(payment_id) as tx, (SELECT COUNT(*) FROM customer) as cust FROM payment")
        total_rev  = float(df_stats.iloc[0]['rev'])
        total_tx   = int(df_stats.iloc[0]['tx'])
        total_cust = int(df_stats.iloc[0]['cust'])
        avg_tx     = total_rev / total_tx if total_tx else 0

        df_monthly = query("""
            SELECT TO_CHAR(DATE_TRUNC('month', payment_date), 'Mon YYYY') AS bln,
                   SUM(amount) AS rev
            FROM payment GROUP BY 1, DATE_TRUNC('month', payment_date)
            ORDER BY DATE_TRUNC('month', payment_date) DESC LIMIT 6
        """)
        monthly_rows = " | ".join(f"{r['bln']}: ${float(r['rev']):,.0f}" for _, r in df_monthly.iterrows())
        trend_data   = detect_trend(df_monthly)
        trend_label  = {
            'up':     f"📈 UP {trend_data['pct']}% vs. the previous month's average",
            'down':   f"📉 DOWN {abs(trend_data['pct'])}% s. the previous month's average",
            'stable': "➡️ STABLE",
        }.get(trend_data['trend'], '')

        df_store = query("""
            SELECT s.store_id, SUM(p.amount) as rev, COUNT(p.payment_id) as tx
            FROM payment p
            JOIN rental r    ON p.rental_id    = r.rental_id
            JOIN inventory i ON r.inventory_id = i.inventory_id
            JOIN store s     ON i.store_id     = s.store_id
            GROUP BY s.store_id ORDER BY s.store_id
        """)
        store_rows = " | ".join(
            f"Store {int(r['store_id'])}: ${float(r['rev']):,.0f} ({int(r['tx'])} tx)"
            for _, r in df_store.iterrows()
        )

        df_top = query("""
            SELECT f.title, SUM(p.amount) as rev
            FROM rental r
            JOIN inventory i ON r.inventory_id = i.inventory_id
            JOIN film f       ON i.film_id      = f.film_id
            JOIN payment p    ON r.rental_id    = p.rental_id
            GROUP BY f.title ORDER BY rev DESC LIMIT 5
        """)
        top_films = " | ".join(f"{r['title']} (${float(r['rev']):,.0f})" for _, r in df_top.iterrows())

        df_leaks = query("""
            SELECT
              SUM(CASE WHEN r.return_date > r.rental_date + f.rental_duration * INTERVAL '1 day'
                THEN (EXTRACT(EPOCH FROM (r.return_date - (r.rental_date + f.rental_duration * INTERVAL '1 day')))/86400) * f.rental_rate
                ELSE 0 END) AS total_late_fees,
              COUNT(CASE WHEN r.return_date > r.rental_date + f.rental_duration * INTERVAL '1 day' THEN 1 END) AS late_count
            FROM rental r
            JOIN inventory i ON r.inventory_id = i.inventory_id
            JOIN film f       ON i.film_id      = f.film_id
            WHERE r.return_date IS NOT NULL
        """)
        total_late_fees  = float(df_leaks.iloc[0]['total_late_fees'] or 0)
        total_late_count = int(df_leaks.iloc[0]['late_count'] or 0)

        page_charts = {
            '/': '• chart-monthly, chart-growth, chart-weekday, chart-donut, chart-transactions',
            '/revenue_stores.html': '• chart-hist, chart-forecast, chart-staff',
            '/leaks_action.html': '• chart-leakbar, chart-storeleak, chart-catleak',
            '/film_pricing.html': '• chart-duration, chart-catdonut, chart-topfilms, chart-scatter, chart-quadbar',
        }
        active_charts = page_charts.get(current_page, page_charts['/'])
        dom_charts_info = ', '.join(avail_charts) if avail_charts else 'tidak terdeteksi'

        perm_ex = (
            '{"action":"permanent_edit","type":"replace_text","old_text":"Revenue Pulse","new_text":"My Dashboard","scope":"all"}'
            ' | {"action":"permanent_edit","type":"css_var","var":"--blue","value":"#e05060"}'
            ' | {"action":"permanent_edit","type":"inject_css","css":".card{border-radius:20px!important}"}'
            ' | {"action":"permanent_chart_type","target":"chart-monthly","type":"bar"}'
            ' | {"action":"permanent_swap","chart_a":"chart-monthly","chart_b":"chart-growth"}'
        )
        system_prompt = f"""You are DVD-AI, the data assistant for the DVD Store Dashboard.
{lang_note}

REAL-TIME DATA:
Total Revenue: ${total_rev:,.2f} | Transactions: {total_tx:,} | Customers: {total_cust:,} | Avg TX: ${avg_tx:.2f}
Revenue per Store: {store_rows}
6 Month Revenue: {monthly_rows}
Trends: {trend_label}
Top 5 Movies: {top_films}
Potential Late Fees: ${total_late_fees:,.2f} from {total_late_count:,} transactions
=== TRANSFORMER TIME-SERIES FORECAST ===
Endpoint: GET /api/transformer/forecast?horizon=N&stores=1,2
Info    : GET /api/transformer/info

Arsitektur:
  - Vanilla Transformer Encoder (PyTorch) — 2 layer, 4 attention head, d_model=64
  - Positional Encoding sinusoidal, training 300 epoch, optimizer Adam, loss HuberLoss
  - Normalisasi Min-Max, inferensi via MC Dropout (50 pass) → mean + CI (lower/upper)
  - Fallback: ExponentialSmoothing → MovingAverage+Trend (jika PyTorch tidak ada)

Perbedaan vs forecast lama (moving average di revenue_stores.html):
  - Model lama: rata-rata 3 periode, tidak belajar dari pola data
  - Transformer: belajar dependensi jangka panjang via attention mechanism
  - Transformer menghasilkan confidence interval, model lama tidak

Halaman visualisasi: /transformer_forecast_widget.html

Page: {current_page} | Theme: {ui_theme} | Charts: {dom_charts_info}

=== UI ACTIONS (append after reply text: ||| {{JSON}}) ===

TEMPORARY (session only, lost on refresh):
- change_chart_type: {{"action":"change_chart_type","target":"CHART_ID","type":"bar|scatter|pie"}}
- reset_chart | reset_all_charts | change_color | reset_colors
- toggle_dark_mode | toggle_sidebar | change_time_range | navigate_page
- swap_charts: {{"action":"swap_charts","chart_a":"CHART_ID_A","chart_b":"CHART_ID_B"}}
- toggle_layout_mode: {{"action":"toggle_layout_mode"}} (enables drag-and-drop reorder mode)

PERMANENT (survives refresh — edits source files on disk):
Trigger words: "permanen","permanently","simpan permanen","save permanently","tetap setelah refresh","keep after refresh"
Use permanent_edit action with these types:
1. replace_text   — change visible text in HTML files
   {{"action":"permanent_edit","type":"replace_text","old_text":"OLD","new_text":"NEW","scope":"all|current"}}
   scope all=all 4 HTML pages, current=only this page ({current_page})
2. css_var        — change one CSS variable in shared.css (affects all pages)
   {{"action":"permanent_edit","type":"css_var","var":"--blue","value":"#hex"}}
3. css_vars_multi — change multiple CSS variables at once
   {{"action":"permanent_edit","type":"css_vars_multi","changes":[{{"var":"--blue","value":"#hex"}},{{"var":"--teal","value":"#hex"}}]}}
4. element_color  — set text color on element matching given text
   {{"action":"permanent_edit","type":"element_color","selector":"VISIBLE_TEXT","color":"#hex","scope":"all|current"}}
5. inject_css     — append CSS rule block to shared.css
   {{"action":"permanent_edit","type":"inject_css","css":"selector{{property:value}}"}}
6. page_title     — change the HTML <title> tag
   {{"action":"permanent_edit","type":"page_title","file":"overview.html","value":"New Title"}}

PERMANENT CHART TYPE (stored in perm_state.json, applied on page load):
Trigger: user says "permanen" AND wants chart type change
{{"action":"permanent_chart_type","target":"CHART_ID","type":"bar|scatter|pie"}}

PERMANENT LAYOUT SWAP (swaps 2 chart sections in HTML source file):
Trigger: user says "tukar"/"swap"/"pindahkan" + 2 chart names + "permanen"
{{"action":"permanent_swap","chart_a":"CHART_ID_A","chart_b":"CHART_ID_B"}}

Examples: {perm_ex}

RULES:
- Use ||| only when user requests a UI change or navigation
- For permanent changes, tell user what will be changed permanently before appending command
- Available charts on this page: {active_charts}
- DO NOT disclose passwords, API keys, or DB config
"""

        messages = [{"role": "system", "content": system_prompt}]
        for msg in chat_history[-16:]:
            messages.append({"role": msg.get("role", "user"), "content": sanitize_for_ai(str(msg.get("content", "")))})
        messages.append({"role": "user", "content": sanitize_for_ai(user_prompt)})

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.55,
            max_tokens=750,
        )

        ai_text = completion.choices[0].message.content

        if '|||' not in ai_text:
            cmd = detect_ui_command(user_prompt)
            if cmd:
                ai_text = ai_text.rstrip() + f" ||| {_json.dumps(cmd, ensure_ascii=False)}"

        ai_text = sanitize_for_ai(ai_text)
        return jsonify({"response": ai_text})

    except Exception as e:
        print(f"[api_chat ERROR] {e}")
        return jsonify({"response": "Sorry, there's a temporary outage. Please try again! 🙏"})
    
@app.route('/api/edit-ui', methods=['POST'])
def edit_ui():
    data = request.json
    target_file = data.get('file', 'overview.html')
    old_text = data.get('old_text')
    new_text = data.get('new_text')
    target_color = data.get('color') # Opsional untuk ganti warna

    try:
        with open(target_file, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'html.parser')

        # Cari teks dan ganti
        found = False
        for element in soup.find_all(string=True):
            if old_text in element:
                # Ganti teks
                new_content = element.replace(old_text, new_text)
                element.replace_with(new_content)
                
                # Jika ingin ganti warna, akses parent element
                if target_color:
                    element.parent['style'] = f"color: {target_color} !important;"
                found = True

        if found:
            with open(target_file, 'w', encoding='utf-8') as f:
                f.write(soup.prettify())
            return jsonify({"status": "success", "message": f"Berhasil mengubah {target_file}"})
        return jsonify({"status": "error", "message": "Teks tidak ditemukan"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


# =============================================================================
#  CORS — allow all origins
# =============================================================================
@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    return '', 204


# =============================================================================
#  API — OVERVIEW
# =============================================================================
@app.route("/api/overview/monthly")
def overview_monthly():
    stores = request.args.get("stores", "1,2")
    store_list = [int(s) for s in stores.split(",") if s.strip().isdigit()]
    placeholders = ",".join(["%s"] * len(store_list))
    df = query(f"""
        SELECT s.store_id,
               DATE_TRUNC('month', p.payment_date)::date AS month,
               SUM(p.amount) AS rev,
               COUNT(p.payment_id) AS tx
        FROM payment p
        JOIN rental r    ON p.rental_id    = r.rental_id
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN store s     ON i.store_id     = s.store_id
        WHERE s.store_id IN ({placeholders})
        GROUP BY 1, 2 ORDER BY 2, 1
    """, tuple(store_list))
    df["month"] = df["month"].astype(str)
    # Both column names for compatibility
    df["revenue"]      = df["rev"]
    df["transactions"] = df["tx"]
    return jsonify(df_to_json(df))

@app.route("/api/overview/kpis")
def overview_kpis():
    df = query("""
        SELECT s.store_id,
               COUNT(DISTINCT p.customer_id) AS customers,
               COUNT(p.payment_id) AS transactions,
               SUM(p.amount) AS revenue,
               AVG(p.amount) AS avg_tx
        FROM payment p
        JOIN rental r    ON p.rental_id    = r.rental_id
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN store s     ON i.store_id     = s.store_id
        GROUP BY s.store_id ORDER BY s.store_id
    """)
    return jsonify(df_to_json(df))

@app.route("/api/overview/weekday")
def overview_weekday():
    # FIX: expose both 'dow' and 'day_num' so frontend filter works
    df = query("""
        SELECT TRIM(TO_CHAR(payment_date, 'Day')) AS day_name,
               EXTRACT(DOW FROM payment_date)::int AS dow,
               EXTRACT(DOW FROM payment_date)::int AS day_num,
               SUM(amount) AS revenue,
               COUNT(*) AS tx
        FROM payment
        GROUP BY 1, 2 ORDER BY 2
    """)
    return jsonify(df_to_json(df))

# FIX: Missing endpoint — used by both overview.html and revenue_stores.html
@app.route("/api/overview/daterange")
def overview_daterange():
    df = query("""
        SELECT MIN(payment_date)::date AS min,
               MAX(payment_date)::date AS max
        FROM payment
    """)
    row = df.iloc[0]
    return jsonify({"min": str(row["min"]), "max": str(row["max"])})


# =============================================================================
#  API — REVENUE & STORES
# =============================================================================
@app.route("/api/revenue/historical")
def revenue_historical():
    stores = request.args.get("stores", "1,2")
    store_list = [int(s) for s in stores.split(",") if s.strip().isdigit()]
    placeholders = ",".join(["%s"] * len(store_list))
    df = query(f"""
        SELECT s.store_id,
               DATE_TRUNC('month', p.payment_date)::date AS period,
               SUM(p.amount) AS revenue,
               COUNT(p.payment_id) AS transactions
        FROM payment p
        JOIN rental r    ON p.rental_id    = r.rental_id
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN store s     ON i.store_id     = s.store_id
        WHERE s.store_id IN ({placeholders})
        GROUP BY 1, 2 ORDER BY 1, 2
    """, tuple(store_list))
    df["period"] = df["period"].astype(str)
    return jsonify(df_to_json(df))

# FIX: Missing endpoint — revenue_stores.html calls /api/revenue/timeseries
@app.route("/api/revenue/timeseries")
def revenue_timeseries():
    gran   = request.args.get("gran", "monthly")
    stores = request.args.get("stores", "1,2")
    store_list = [int(s) for s in stores.split(",") if s.strip().isdigit()]
    placeholders = ",".join(["%s"] * len(store_list))

    trunc = {"daily": "day", "weekly": "week"}.get(gran, "month")

    df = query(f"""
        SELECT s.store_id,
               DATE_TRUNC('{trunc}', p.payment_date)::date AS period,
               SUM(p.amount)      AS revenue,
               COUNT(p.payment_id) AS transactions
        FROM payment p
        JOIN rental r    ON p.rental_id    = r.rental_id
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN store s     ON i.store_id     = s.store_id
        WHERE s.store_id IN ({placeholders})
        GROUP BY 1, 2 ORDER BY 1, 2
    """, tuple(store_list))
    df["period"] = df["period"].astype(str)
    return jsonify(df_to_json(df))

@app.route("/api/revenue/kpis")
def revenue_kpis():
    df = query("""
        SELECT s.store_id,
               COUNT(DISTINCT p.customer_id) AS customers,
               COUNT(p.payment_id) AS transactions,
               SUM(p.amount) AS revenue,
               AVG(p.amount) AS avg_tx
        FROM payment p
        JOIN rental r    ON p.rental_id    = r.rental_id
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN store s     ON i.store_id     = s.store_id
        GROUP BY s.store_id
    """)
    return jsonify(df_to_json(df))

@app.route("/api/revenue/staff")
def revenue_staff():
    df = query("""
        SELECT st.store_id, st.first_name || ' ' || st.last_name AS name,
               COUNT(p.payment_id) AS transactions, SUM(p.amount) AS revenue
        FROM payment p JOIN staff st ON p.staff_id = st.staff_id
        GROUP BY 1, 2 ORDER BY 4 DESC
    """)
    return jsonify(df_to_json(df))


# =============================================================================
#  API — FILM & PRICING
# =============================================================================
@app.route("/api/film/duration")
def film_duration():
    stores = request.args.get("stores", "1,2")
    store_list = [int(s) for s in stores.split(",") if s.strip().isdigit()]
    placeholders = ",".join(["%s"] * len(store_list))
    df = query(f"""
        SELECT f.title, f.rental_rate, c.name AS category, s.store_id,
               EXTRACT(EPOCH FROM (r.return_date - r.rental_date))/86400 AS duration_days,
               p.amount
        FROM rental r
        JOIN inventory i     ON r.inventory_id = i.inventory_id
        JOIN film f           ON i.film_id       = f.film_id
        JOIN film_category fc ON f.film_id       = fc.film_id
        JOIN category c       ON fc.category_id  = c.category_id
        JOIN store s          ON i.store_id       = s.store_id
        JOIN payment p        ON r.rental_id      = p.rental_id
        WHERE r.return_date IS NOT NULL AND s.store_id IN ({placeholders})
    """, tuple(store_list))
    return jsonify(df_to_json(df))

@app.route("/api/film/category")
def film_category():
    stores = request.args.get("stores", "1,2")
    store_list = [int(s) for s in stores.split(",") if s.strip().isdigit()]
    placeholders = ",".join(["%s"] * len(store_list))
    df = query(f"""
        SELECT c.name AS category, s.store_id,
               COUNT(r.rental_id) AS total_rentals,
               SUM(p.amount)      AS total_revenue,
               AVG(EXTRACT(EPOCH FROM (r.return_date - r.rental_date))/86400) AS avg_duration
        FROM rental r
        JOIN inventory i     ON r.inventory_id = i.inventory_id
        JOIN film f           ON i.film_id       = f.film_id
        JOIN film_category fc ON f.film_id       = fc.film_id
        JOIN category c       ON fc.category_id  = c.category_id
        JOIN store s          ON i.store_id       = s.store_id
        JOIN payment p        ON r.rental_id      = p.rental_id
        WHERE r.return_date IS NOT NULL AND s.store_id IN ({placeholders})
        GROUP BY 1, 2
    """, tuple(store_list))
    return jsonify(df_to_json(df))

@app.route("/api/film/topfilms")
def film_topfilms():
    stores = request.args.get("stores", "1,2")
    store_list = [int(s) for s in stores.split(",") if s.strip().isdigit()]
    placeholders = ",".join(["%s"] * len(store_list))
    df = query(f"""
        SELECT f.title, c.name AS category, s.store_id,
               COUNT(r.rental_id) AS rentals,
               SUM(p.amount)      AS revenue
        FROM rental r
        JOIN inventory i     ON r.inventory_id = i.inventory_id
        JOIN film f           ON i.film_id       = f.film_id
        JOIN film_category fc ON f.film_id       = fc.film_id
        JOIN category c       ON fc.category_id  = c.category_id
        JOIN store s          ON i.store_id       = s.store_id
        JOIN payment p        ON r.rental_id      = p.rental_id
        WHERE s.store_id IN ({placeholders})
        GROUP BY 1, 2, 3
    """, tuple(store_list))
    return jsonify(df_to_json(df))

@app.route("/api/film/categories_list")
def film_categories_list():
    df = query("SELECT DISTINCT name FROM category ORDER BY name")
    return jsonify(df["name"].tolist())

@app.route("/api/film/predict", methods=["POST"])
def film_predict():
    if not (os.path.exists("model.pkl") and os.path.exists("label_encoder.pkl")):
        return jsonify({"error": "Model files not found. Run train_model.py first."}), 404
    data        = request.json
    rental_rate = float(data.get("rental_rate", 2.99))
    category    = data.get("category", "Action")
    store_id    = int(data.get("store_id", 1))
    model       = joblib.load("model.pkl")
    encoder     = joblib.load("label_encoder.pkl")
    try:
        cat_enc = encoder.transform([category])[0]
    except ValueError:
        return jsonify({"error": f"Unknown category: {category}"}), 400
    X    = pd.DataFrame([{"rental_rate": rental_rate, "cat_encoded": cat_enc, "store_id": store_id}])
    pred = float(model.predict(X)[0])
    return jsonify({"predicted_days": round(pred, 2), "category": category,
                    "store_id": store_id, "rental_rate": rental_rate})


# =============================================================================
#  API — LEAKS & ACTION
# =============================================================================
@app.route("/api/leaks/monthly")
def leaks_monthly():
    stores = request.args.get("stores", "1,2")
    store_list = [int(s) for s in stores.split(",") if s.strip().isdigit()]
    placeholders = ",".join(["%s"] * len(store_list))
    df = query(f"""
        SELECT s.store_id,
               DATE_TRUNC('month', r.rental_date)::date AS month,
               COUNT(CASE WHEN r.return_date > r.rental_date + f.rental_duration * INTERVAL '1 day'
                   THEN 1 END) AS late_count,
               COUNT(r.rental_id) AS total_rentals,
               SUM(p.amount) AS actual_revenue,
               SUM(CASE WHEN r.return_date > r.rental_date + f.rental_duration * INTERVAL '1 day'
                   THEN (EXTRACT(EPOCH FROM (
                       r.return_date - (r.rental_date + f.rental_duration * INTERVAL '1 day')
                   ))/86400) * f.rental_rate
                   ELSE 0 END) AS potential_late_fees
        FROM rental r
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f       ON i.film_id      = f.film_id
        JOIN store s      ON i.store_id     = s.store_id
        JOIN payment p    ON r.rental_id    = p.rental_id
        WHERE r.return_date IS NOT NULL AND s.store_id IN ({placeholders})
        GROUP BY 1, 2 ORDER BY 1, 2
    """, tuple(store_list))
    df["month"] = df["month"].astype(str)
    return jsonify(df_to_json(df))

@app.route("/api/leaks/by_category")
def leaks_by_category():
    df = query("""
        SELECT c.name AS category,
               COUNT(CASE WHEN r.return_date > r.rental_date + f.rental_duration * INTERVAL '1 day'
                   THEN 1 END) AS late_count,
               COUNT(r.rental_id) AS total_rentals,
               SUM(CASE WHEN r.return_date > r.rental_date + f.rental_duration * INTERVAL '1 day'
                   THEN (EXTRACT(EPOCH FROM (
                       r.return_date - (r.rental_date + f.rental_duration * INTERVAL '1 day')
                   ))/86400) * f.rental_rate
                   ELSE 0 END) AS late_fees
        FROM rental r
        JOIN inventory i     ON r.inventory_id = i.inventory_id
        JOIN film f           ON i.film_id       = f.film_id
        JOIN film_category fc ON f.film_id       = fc.film_id
        JOIN category c       ON fc.category_id  = c.category_id
        JOIN payment p        ON r.rental_id      = p.rental_id
        WHERE r.return_date IS NOT NULL
        GROUP BY 1 ORDER BY 4 DESC
    """)
    return jsonify(df_to_json(df))


# 1. Samakan route dengan yang dipanggil HTML (/api/leaks/by_category)
@app.route('/api/leaks/by_category')
def leak_by_category():
    df = query("""
        SELECT c.name AS category,
               SUM(p.amount) AS late_fees
        FROM rental r
        JOIN inventory i     ON r.inventory_id = i.inventory_id
        JOIN film f           ON i.film_id       = f.film_id
        JOIN film_category fc ON f.film_id       = fc.film_id
        JOIN category c       ON fc.category_id  = c.category_id
        JOIN payment p        ON r.rental_id      = p.rental_id
        WHERE r.return_date > r.rental_date + (f.rental_duration || ' day')::interval
        GROUP BY 1 ORDER BY 2 DESC
    """)
    return jsonify(df_to_json(df))

# 2. Tambahkan endpoint monthly yang dibutuhkan
@app.route('/api/leaks/monthly')
def leak_monthly():
    stores = request.args.get('stores', '1,2')
    df = query(f"""
        SELECT TO_CHAR(r.rental_date, 'YYYY-MM') as month,
               i.store_id,
               SUM(p.amount) as actual_revenue,
               SUM(CASE WHEN r.return_date > r.rental_date + (f.rental_duration || ' day')::interval 
                        THEN p.amount ELSE 0 END) as potential_late_fees,
               COUNT(CASE WHEN r.return_date > r.rental_date + (f.rental_duration || ' day')::interval 
                          THEN 1 END) as late_count,
               COUNT(r.rental_id) as total_rentals
        FROM rental r
        JOIN inventory i ON r.inventory_id = i.inventory_id
        JOIN film f ON i.film_id = f.film_id
        JOIN payment p ON r.rental_id = p.rental_id
        WHERE i.store_id IN ({stores})
        GROUP BY 1, 2 ORDER BY 1
    """)
    return jsonify(df_to_json(df))

# =============================================================================
#  PERMANENT UI EDITOR  (writes changes directly to source files)
# =============================================================================

ALL_HTML_FILES = ['overview.html', 'film_pricing.html', 'leaks_action.html', 'revenue_stores.html']
CSS_FILE       = 'shared.css'

PAGE_FILE_MAP = {
    '/':                   'overview.html',
    '/overview.html':      'overview.html',
    '/revenue_stores.html':'revenue_stores.html',
    '/film_pricing.html':  'film_pricing.html',
    '/leaks_action.html':  'leaks_action.html',
    'overview.html':       'overview.html',
    'revenue_stores.html': 'revenue_stores.html',
    'film_pricing.html':   'film_pricing.html',
    'leaks_action.html':   'leaks_action.html',
}

import re as _perm_re

def _read_html(filename):
    if not os.path.exists(filename):
        return None, f"File not found: {filename}"
    with open(filename, 'r', encoding='utf-8') as f:
        return f.read(), None

def _write_html(filename, content):
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

def _read_css():
    if not os.path.exists(CSS_FILE):
        return None, f"shared.css not found"
    with open(CSS_FILE, 'r', encoding='utf-8') as f:
        return f.read(), None

def _write_css(content):
    with open(CSS_FILE, 'w', encoding='utf-8') as f:
        f.write(content)

def _perm_replace_text(old_text, new_text, scope, current_page):
    """Replace text in HTML files using BeautifulSoup — preserves structure."""
    if scope == 'current':
        files = [PAGE_FILE_MAP.get(current_page, 'overview.html')]
    else:
        files = ALL_HTML_FILES

    modified = []
    for filename in files:
        content, err = _read_html(filename)
        if err: continue
        soup = BeautifulSoup(content, 'html.parser')
        changed = False
        for node in soup.find_all(string=True):
            # Skip script/style tags
            if node.parent.name in ('script', 'style', '[document]'): continue
            if old_text in node:
                node.replace_with(node.replace(old_text, new_text))
                changed = True
        if changed:
            _write_html(filename, str(soup))
            modified.append(filename)
    return modified

def _perm_element_color(selector_text, color, scope, current_page):
    """Set inline text color on element whose text content matches selector_text."""
    if scope == 'current':
        files = [PAGE_FILE_MAP.get(current_page, 'overview.html')]
    else:
        files = ALL_HTML_FILES

    modified = []
    for filename in files:
        content, err = _read_html(filename)
        if err: continue
        soup = BeautifulSoup(content, 'html.parser')
        changed = False
        for node in soup.find_all(string=True):
            if node.parent.name in ('script', 'style', '[document]'): continue
            if selector_text.lower() in node.lower():
                parent = node.parent
                existing = parent.get('style', '')
                # Remove existing color rule if present
                existing = _perm_re.sub(r'color\s*:[^;]+;?', '', existing).strip()
                parent['style'] = (existing + f'; color: {color} !important;').lstrip('; ')
                changed = True
        if changed:
            _write_html(filename, str(soup))
            modified.append(filename)
    return modified

def _perm_css_var(var_name, value):
    """Change a CSS custom property in shared.css :root block."""
    css, err = _read_css()
    if err: return [], err
    # Match --var-name: old_value; inside :root
    pattern = rf'({_perm_re.escape(var_name)}\s*:\s*)([^;]+)(;)'
    new_css, n = _perm_re.subn(pattern, lambda m: f'{m.group(1)}{value}{m.group(3)}', css, count=1)
    if n == 0:
        return [], f"Variable {var_name} not found in shared.css"
    _write_css(new_css)
    return [CSS_FILE], None

def _perm_css_vars_multi(changes):
    """Change multiple CSS variables in one pass."""
    css, err = _read_css()
    if err: return [], err
    for c in changes:
        var_name = c.get('var', '')
        value    = c.get('value', '')
        pattern  = rf'({_perm_re.escape(var_name)}\s*:\s*)([^;]+)(;)'
        css, _   = _perm_re.subn(pattern, lambda m, v=value: f'{m.group(1)}{v}{m.group(3)}', css, count=1)
    _write_css(css)
    return [CSS_FILE], None

def _perm_inject_css(css_block):
    """Append a CSS rule block to shared.css."""
    css, err = _read_css()
    if err: return [], err
    marker = '/* === DVD-AI PERMANENT INJECTIONS === */'
    if marker not in css:
        css += f'\n\n{marker}\n'
    css += f'\n{css_block}\n'
    _write_css(css)
    return [CSS_FILE], None

def _perm_page_title(filename, value):
    """Change the <title> tag of an HTML file."""
    content, err = _read_html(filename)
    if err: return [], err
    soup = BeautifulSoup(content, 'html.parser')
    title_tag = soup.find('title')
    if title_tag:
        title_tag.string = value
        _write_html(filename, str(soup))
        return [filename], None
    return [], "No <title> tag found"


@app.route('/api/permanent-edit', methods=['POST'])
def permanent_edit():
    data         = request.get_json()
    edit_type    = data.get('type')
    current_page = data.get('current_page', '/')
    scope        = data.get('scope', 'all')
    modified     = []
    error        = None

    try:
        if edit_type == 'replace_text':
            old_text = data.get('old_text', '')
            new_text = data.get('new_text', '')
            if not old_text:
                return jsonify({'status': 'error', 'message': 'old_text is required'}), 400
            modified = _perm_replace_text(old_text, new_text, scope, current_page)

        elif edit_type == 'element_color':
            selector = data.get('selector', '')
            color    = data.get('color', '#ffffff')
            modified = _perm_element_color(selector, color, scope, current_page)

        elif edit_type == 'css_var':
            var_name = data.get('var', '')
            value    = data.get('value', '')
            modified, error = _perm_css_var(var_name, value)

        elif edit_type == 'css_vars_multi':
            changes  = data.get('changes', [])
            modified, error = _perm_css_vars_multi(changes)

        elif edit_type == 'inject_css':
            css_block = data.get('css', '')
            modified, error  = _perm_inject_css(css_block)

        elif edit_type == 'page_title':
            filename = data.get('file', 'overview.html')
            value    = data.get('value', '')
            modified, error = _perm_page_title(filename, value)

        else:
            return jsonify({'status': 'error', 'message': f'Unknown edit type: {edit_type}'}), 400

        if error:
            return jsonify({'status': 'error', 'message': error}), 400

        return jsonify({
            'status':   'success',
            'type':     edit_type,
            'modified': modified,
            'message':  f'Permanent change applied to: {", ".join(modified) if modified else "no files matched"}'
        })

    except Exception as e:
        print(f'[permanent_edit ERROR] {e}')
        return jsonify({'status': 'error', 'message': str(e)}), 500


# =============================================================================
#  NEW: PERSISTENT CHART TYPE — stores chart_type preferences in perm_state.json
# =============================================================================

@app.route('/api/permanent-chart-type', methods=['POST'])
def permanent_chart_type():
    data     = request.get_json()
    chart_id = data.get('target', '')
    typ      = data.get('type', 'bar')

    if not chart_id:
        return jsonify({'status': 'error', 'message': 'target chart_id is required'}), 400

    try:
        state = _load_perm_state()
        state.setdefault('chart_types', {})[chart_id] = typ
        _save_perm_state(state)
        return jsonify({
            'status':   'success',
            'chart_id': chart_id,
            'type':     typ,
            'message':  f'Chart type for {chart_id} permanently set to {typ} (stored in perm_state.json)',
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/get-perm-state', methods=['GET'])
def get_perm_state():
    """Called by each page on load to restore persistent chart types + layout order."""
    return jsonify(_load_perm_state())


# =============================================================================
#  NEW: PERMANENT LAYOUT SWAP — swaps two chart <section> blocks in HTML source
# =============================================================================

def _swap_chart_sections_in_html(html_file, chart_a, chart_b):
    """
    Swap the visual blocks of chart_a and chart_b in an HTML file.

    A "block" = the preceding .sec-head sibling + the container div holding
    the chart.  This handles all four page structures:
      overview.html      → .sec-head + .chart-section
      revenue_stores.html→ .sec-head + next div
      film_pricing.html  → .sec-head + next div (col2-asym, chart-wrap, …)
      leaks_action.html  → .sec-head + next div

    Strategy: find the chart div by id, walk up to a candidate "container"
    (nearest div that is a direct child of .main / main), then find its
    preceding .sec-head.  Wrap both (head + container) in a temp wrapper,
    swap, then unwrap.
    """
    content, err = _read_html(html_file)
    if err:
        return False, err

    soup = BeautifulSoup(content, 'html.parser')

    def find_block_nodes(chart_id):
        """
        Returns (sec_head_node, container_node) or (None, container_node)
        if no adjacent sec-head exists.
        """
        chart_el = soup.find(id=chart_id)
        if not chart_el:
            return None, None

        # Walk up to find the best swappable ancestor:
        # Prefer .chart-section, otherwise the first div ancestor that has
        # a .sec-head as an immediately preceding sibling.
        candidate = None
        for parent in chart_el.parents:
            if parent.name == 'div':
                cls = parent.get('class') or []
                if 'chart-section' in cls:
                    candidate = parent
                    break
                # Check if its previous sibling is a sec-head
                prev = parent.find_previous_sibling()
                if prev and 'sec-head' in (prev.get('class') or []):
                    candidate = parent
                    break
            if parent.name in ('body', '[document]'):
                break

        if not candidate:
            # Fallback: deepest div that directly contains the chart-wrap
            for parent in chart_el.parents:
                if parent.name == 'div':
                    cls = parent.get('class') or []
                    if 'chart-wrap' in cls or 'col2' in cls or 'col2-asym' in cls:
                        candidate = parent
                        break

        if not candidate:
            return None, None

        # Look for immediately preceding sec-head sibling
        prev_sib = candidate.find_previous_sibling()
        if prev_sib and 'sec-head' in (prev_sib.get('class') or []):
            return prev_sib, candidate
        return None, candidate

    head_a, cont_a = find_block_nodes(chart_a)
    head_b, cont_b = find_block_nodes(chart_b)

    if cont_a is None:
        return False, f"Could not find swappable block for {chart_a} in {html_file}"
    if cont_b is None:
        return False, f"Could not find swappable block for {chart_b} in {html_file}"
    if cont_a is cont_b:
        return False, "Both charts are in the same container block"

    # ── Swap using placeholder trick ──────────────────────────────────────────
    # We swap headers and containers independently to handle cross-parent cases.

    ph_a_cont = soup.new_tag('div', **{'data-ph': 'a_cont'})
    ph_b_cont = soup.new_tag('div', **{'data-ph': 'b_cont'})

    cont_a.replace_with(ph_a_cont)
    cont_b.replace_with(ph_b_cont)
    ph_a_cont.replace_with(cont_b)
    ph_b_cont.replace_with(cont_a)

    if head_a and head_b and head_a is not head_b:
        ph_a_head = soup.new_tag('div', **{'data-ph': 'a_head'})
        ph_b_head = soup.new_tag('div', **{'data-ph': 'b_head'})
        head_a.replace_with(ph_a_head)
        head_b.replace_with(ph_b_head)
        ph_a_head.replace_with(head_b)
        ph_b_head.replace_with(head_a)

    _write_html(html_file, str(soup))
    return True, None


@app.route('/api/permanent-swap', methods=['POST'])
def permanent_swap():
    data     = request.get_json()
    chart_a  = data.get('chart_a', '')
    chart_b  = data.get('chart_b', '')
    page     = data.get('current_page', '/')

    if not chart_a or not chart_b:
        return jsonify({'status': 'error', 'message': 'chart_a and chart_b are required'}), 400

    html_file = PAGE_FILE_MAP.get(page, 'overview.html')

    try:
        ok, err = _swap_chart_sections_in_html(html_file, chart_a, chart_b)
        if not ok:
            return jsonify({'status': 'error', 'message': err}), 400

        # Also record in perm_state for informational purposes
        state = _load_perm_state()
        state.setdefault('swaps', []).append({
            'file': html_file, 'chart_a': chart_a, 'chart_b': chart_b
        })
        _save_perm_state(state)

        return jsonify({
            'status':  'success',
            'file':    html_file,
            'chart_a': chart_a,
            'chart_b': chart_b,
            'message': f'Charts {chart_a} ↔ {chart_b} swapped permanently in {html_file}',
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


# Legacy alias — keep old callers working

@app.route('/api/update-ui-global', methods=['POST'])
def update_ui_global():
    data     = request.get_json()
    old_text = data.get('old_text', '')
    new_text = data.get('new_text', old_text)
    color    = data.get('color')

    modified = _perm_replace_text(old_text, new_text, 'all', '/')
    if color and modified:
        _perm_element_color(new_text, color, 'all', '/')
    return jsonify({'status': 'success' if modified else 'not_found', 'files': modified})

# =============================================================================
#  TRANSFORMER FORECAST — NEW ENDPOINTS
# =============================================================================

def _get_monthly_revenue(store_ids=None):
    if store_ids:
        placeholders = ",".join(["%s"] * len(store_ids))
        df = query(f"""
            SELECT s.store_id,
                   DATE_TRUNC('month', p.payment_date)::date AS period,
                   SUM(p.amount) AS revenue
            FROM payment p
            JOIN rental r    ON p.rental_id    = r.rental_id
            JOIN inventory i ON r.inventory_id = i.inventory_id
            JOIN store s     ON i.store_id     = s.store_id
            WHERE s.store_id IN ({placeholders})
            GROUP BY 1, 2 ORDER BY 1, 2
        """, tuple(store_ids))
    else:
        df = query("""
            SELECT DATE_TRUNC('month', p.payment_date)::date AS period,
                   SUM(p.amount) AS revenue
            FROM payment p GROUP BY 1 ORDER BY 1
        """)
    df["period"] = df["period"].astype(str)
    return df


@app.route("/api/transformer/forecast", methods=["GET"])
def transformer_forecast_endpoint():
    horizon    = int(request.args.get("horizon", 3))
    stores_arg = request.args.get("stores", "")
    force      = request.args.get("force", "false").lower() == "true"
    horizon    = max(1, min(horizon, 12))

    store_ids = [int(s) for s in stores_arg.split(",") if s.strip().isdigit()] if stores_arg else None

    try:
        df     = _get_monthly_revenue(store_ids)
        result = {}

        if "store_id" in df.columns:
            for sid, grp in df.groupby("store_id"):
                vals = grp.sort_values("period")["revenue"].tolist()
                hist = grp.sort_values("period")[["period", "revenue"]].to_dict(orient="records")
                fc   = run_transformer_forecast(vals, horizon=horizon, force_retrain=force)
                result[f"store_{int(sid)}"] = {
                    "historical": hist,
                    "forecast"  : fc["forecast"],
                    "method"    : fc["method"],
                    "model_info": fc["model_info"],
                    "error"     : fc.get("error"),
                }

        if "store_id" in df.columns:
            df_comb = df.groupby("period")["revenue"].sum().reset_index().sort_values("period")
        else:
            df_comb = df.sort_values("period")

        comb_vals = df_comb["revenue"].tolist()
        comb_hist = df_comb[["period", "revenue"]].to_dict(orient="records")
        fc_comb   = run_transformer_forecast(comb_vals, horizon=horizon, force_retrain=force)
        result["combined"] = {
            "historical": comb_hist,
            "forecast"  : fc_comb["forecast"],
            "method"    : fc_comb["method"],
            "model_info": fc_comb["model_info"],
            "error"     : fc_comb.get("error"),
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/transformer/info", methods=["GET"])
def transformer_info():
    try:
        import torch
        torch_ver = torch.__version__
        torch_ok  = True
    except ImportError:
        torch_ver = "tidak tersedia"
        torch_ok  = False

    return jsonify({
        "model"           : "Transformer Encoder (Vanilla)",
        "framework"       : f"PyTorch {torch_ver}",
        "torch_available" : torch_ok,
        "architecture"    : {
            "input_projection"   : "Linear(1 → d_model=64)",
            "positional_encoding": "Sinusoidal",
            "encoder_layers"     : 2,
            "attention_heads"    : 4,
            "feedforward_dim"    : 128,
            "dropout"            : 0.1,
            "output_head"        : "Linear(d_model → horizon)",
        },
        "training"        : {
            "optimizer"    : "Adam",
            "loss"         : "HuberLoss",
            "epochs"       : 300,
            "normalization": "Min-Max per series",
        },
        "inference"       : {
            "method": "MC Dropout (50 forward passes)",
            "output": "mean + lower/upper confidence interval",
        },
        "endpoint"        : "/api/transformer/forecast?horizon=3&stores=1,2",
        "cache_ttl_seconds": 300,
    })
# =============================================================================
#  STATIC FILE SERVING
# =============================================================================
@app.route('/')
def index():
    return send_from_directory('.', 'overview.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)


if __name__ == "__main__":
    app.run(debug=True, port=5000, host='0.0.0.0')