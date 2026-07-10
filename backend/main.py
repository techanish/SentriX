from flask import Flask
from flask_cors import CORS
from api.routes import api_bp

from core.db import get_db

app = Flask(__name__)
CORS(app)

# Initialize Database
get_db()

app.register_blueprint(api_bp, url_prefix='/api')
app.register_blueprint(api_bp, url_prefix='/api/backend/api')

if __name__ == "__main__":
    app.run(port=8000, debug=True)
