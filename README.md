# dvdrental-chatbot-AI
# DVD Rental Store Analytics Dashboard (AI-Powered)
An advanced AI-powered analytics dashboard for the DVD Rental database, built with Flask and PostgreSQL. This project integrates Generative AI (Groq API) for intelligent data discussion, Machine Learning (Random Forest) for rental duration prediction, and Deep Learning (Transformer Models) for store revenue forecasting to provide actionable business insights.

## 🚀 Key Features
* **AI Chatbot**: Integrated with **Groq API** to provide intelligent insights and data discussion.
* **Rental Duration Prediction**: Uses a **Random Forest Regressor** to estimate how many days a film will be rented based on its category and rate.
* **Revenue Forecasting**: Implements a **Transformer Encoder (PyTorch)** for time-series forecasting of store revenue.
* **Interactive Dashboard**: A modern UI built with Flask and Plotly for real-time data visualization.

---

## 🛠️ Prerequisites
Before running the project, ensure you have the following installed:
* **Python 3.9+**
* **PostgreSQL** (with the `dvdrental` sample database loaded)
* **Groq API Key** (for the chatbot functionality)

---

## 📦 Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone [https://github.com/dnaaaa19/dvdrental-chatbot-AI.git](https://github.com/dnaaaa19/dvdrental-chatbot-AI.git)
   cd dvdrental-chatbot-AI
2. **Create & Activate Virtual Environment**
   ```bash
   python -m venv venv
   # Activation for Windows:
   .\venv\Scripts\activate
3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
4. **Database Configuration**
   Open app.py, database.py, and train_model.py. Update the DB_CONFIG or connection string with your local PostgreSQL credentials:
   ```bash
   DB_CONFIG = {
    "host": "localhost",
    "user": "postgres",
    "password": "YOUR_DATABASE_PASSWORD",
    "dbname": "dvdrental"}
5. **Set Environment Variables**
   Set your Groq API key in your terminal or a .env file:
   ```bash
   # Windows PowerShell
   $env:GROQ_API_KEY="your_api_key_here"

---

## 🚦 How to Run
1. **Train the ML Model**
   Run the training script first to generate the label_encoder.pkl and save the Random Forest model:
   ```Bash
   python train_model.py
2. **Start the Flask Server**
   ```Bash
    python app.py
3. **Access the Dashboard**
   Open your browser and go to: http://127.0.0.1:5000

---

## 📂 Project Structure
    app.py: Main Flask backend and Chatbot logic.
    train_model.py: Script to train the Rental Duration prediction model.
    transformer_forecast.py: Deep learning module for revenue time-series forecasting.
    templates/: HTML files for the dashboard (Overview, Revenue, Film Pricing, etc.).
    static/: CSS and JS files for styling and interactivity.
