import json
import os

code = """
import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import os

st.set_page_config(page_title="Investment Dashboard", layout="wide", initial_sidebar_state="collapsed")

st.markdown('''
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap');
html, body, [class*="css"] {
    font-family: 'Outfit', sans-serif !important;
    background-color: #0b0f19 !important;
    color: #e2e8f0 !important;
}
.stApp {
    background-color: #0b0f19 !important;
    background-image: radial-gradient(circle at 50% 0%, #1e293b 0%, transparent 50%);
}
/* Custom Metric Cards */
.metric-container {
    background: linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%);
    border: 1px solid rgba(148, 163, 184, 0.15);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 30px 20px;
    text-align: center;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05);
    backdrop-filter: blur(12px);
    transition: all 0.3s ease;
}
.metric-container:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 189, 248, 0.1);
    border-color: rgba(56, 189, 248, 0.3);
}
.metric-title {
    font-size: 1.1rem;
    color: #94a3b8;
    margin-bottom: 12px;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.metric-value {
    font-size: 3rem;
    font-weight: 600;
    background: linear-gradient(to right, #ffffff, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.val-positive { 
    background: linear-gradient(to right, #4ade80, #22c55e) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
}
.val-negative { 
    background: linear-gradient(to right, #f87171, #ef4444) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
}
h1 {
    font-weight: 600;
    background: linear-gradient(to right, #f8fafc, #94a3b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
</style>
''', unsafe_allow_html=True)

KB_TABLE = os.path.join("/data/in/tables", "PORTFOLIO.csv")

@st.cache_data
def load_data():
    if os.path.exists(KB_TABLE):
        try:
            return pd.read_csv(KB_TABLE)
        except Exception:
            pass
    st.error("Data nenalezena.")
    st.stop()

df = load_data()
DF = df.rename(columns=str.upper)
DF["DATUM_SNAPSHOTU"] = pd.to_datetime(DF["DATUM_SNAPSHOTU"], errors="coerce")
DF = DF.dropna(subset=["DATUM_SNAPSHOTU"])
DF["YEAR_MONTH"] = DF["DATUM_SNAPSHOTU"].dt.to_period("M").dt.to_timestamp()

latest_date = DF["YEAR_MONTH"].max()
latest_vals = DF[DF["YEAR_MONTH"] == latest_date]

total_now = latest_vals["HODNOTA"].sum()
m2m = latest_vals.get("PRIRUSTEK_OPROTI_OBDOBI_PRED_MESICEM", pd.Series([0])).sum()
yoy = latest_vals.get("PRIRUSTEK_OPROTI_OBDOBI_PRED_ROKEM", pd.Series([0])).sum()

def format_czk(val):
    return f"{val:,.0f} Kč".replace(",", " ")

st.markdown("<h1 style='text-align: center; margin-bottom: 50px; font-size: 3.5rem;'>✨ Investiční Portfolio</h1>", unsafe_allow_html=True)

col1, col2, col3 = st.columns(3)

def render_metric(col, title, value, is_currency=True, compare=False):
    val_class = "val-positive" if value >= 0 else "val-negative"
    if not compare: val_class = ""
    prefix = "+" if value > 0 and compare else ""
    formatted_val = format_czk(value) if is_currency else value
    
    col.markdown(f'''
    <div class="metric-container">
        <div class="metric-title">{title}</div>
        <div class="metric-value {val_class}">{prefix}{formatted_val}</div>
    </div>
    ''', unsafe_allow_html=True)

render_metric(col1, "Celková Hodnota", total_now, compare=False)
render_metric(col2, "Zisk M/M", m2m, compare=True)
render_metric(col3, "Zisk Y/Y", yoy, compare=True)

st.markdown("<br><br>", unsafe_allow_html=True)

ts = DF.groupby("YEAR_MONTH", as_index=False)["HODNOTA"].sum()
fig = go.Figure()
fig.add_trace(go.Scatter(
    x=ts["YEAR_MONTH"], y=ts["HODNOTA"],
    mode='lines+markers',
    name='Celková Hodnota',
    line=dict(color='#38bdf8', width=4),
    marker=dict(size=10, color='#0284c7', symbol='circle', line=dict(color='#bae6fd', width=2)),
    fill='tozeroy',
    fillcolor='rgba(56, 189, 248, 0.15)',
    hovertemplate='<b>%{x|%B %Y}</b><br>Hodnota: %{y:,.0f} Kč<extra></extra>'
))
fig.update_layout(
    title=dict(text='Vývoj hodnoty v čase', font=dict(size=24, color="#f8fafc")),
    template='plotly_dark',
    plot_bgcolor='rgba(0,0,0,0)',
    paper_bgcolor='rgba(0,0,0,0)',
    xaxis=dict(showgrid=False, title=""),
    yaxis=dict(showgrid=True, gridcolor='rgba(255,255,255,0.05)', title=""),
    hovermode="x unified",
    margin=dict(l=0, r=0, t=60, b=0)
)
st.plotly_chart(fig, use_container_width=True)

st.markdown("<br><br><h2 style='color:#f8fafc; font-weight: 300;'>📋 Detail jednotlivých investic (Zisk M/M)</h2>", unsafe_allow_html=True)

if "PRIRUSTEK_OPROTI_OBDOBI_PRED_MESICEM" in DF.columns:
    pivot_df = DF.pivot_table(
        index="TYP_INVESTICE", 
        columns="YEAR_MONTH", 
        values="PRIRUSTEK_OPROTI_OBDOBI_PRED_MESICEM", 
        aggfunc="sum"
    ).fillna(0)
    
    pivot_df.columns = [col.strftime('%Y-%m') for col in pivot_df.columns]
    pivot_df = pivot_df[sorted(pivot_df.columns, reverse=True)]
    
    def color_profit(val):
        color = '#4ade80' if val > 0 else '#f87171' if val < 0 else '#64748b'
        return f'color: {color}; font-weight: bold;'
    
    styled_df = pivot_df.style.map(color_profit).format("{:,.0f} Kč")
    st.dataframe(styled_df, use_container_width=True, height=400)
else:
    st.info("Sloupec PRIRUSTEK_OPROTI_OBDOBI_PRED_MESICEM nebyl nalezen pro detailní rozpad.")
"""

path = r"main\app\keboola.data-apps\my-data-app\config.json"
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

data["parameters"]["script"] = code.splitlines()

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("Done")
