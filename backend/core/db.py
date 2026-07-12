import os
import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

logger = logging.getLogger(__name__)

# Fallback string provided by the user for development.
# In production on Vercel, this should be set in the environment.
DEFAULT_URI = "mongodb://localhost:27017"

class Database:
    def __init__(self):
        self.client = None
        self.db = None
        self.scans = None
        self.chat_logs = None
        self.users = None
        self.reports = None

    def connect(self):
        uri = os.environ.get("MONGODB_URI", DEFAULT_URI)
        try:
            self.client = MongoClient(uri, serverSelectionTimeoutMS=5000)
            # Verify connection
            self.client.admin.command('ping')
            
            self.db = self.client.get_database("sentrix_db")
            self.scans = self.db.get_collection("scans")
            self.chat_logs = self.db.get_collection("chat_logs")
            self.users = self.db.get_collection("users")
            self.reports = self.db.get_collection("reports")
            
            # Create indexes for fast lookup based on email
            self.users.create_index("email", unique=True)
            self.reports.create_index("user_email")
            
            logger.info("Successfully connected to MongoDB.")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            self.client = None

db_instance = Database()

def get_db():
    if not db_instance.client:
        db_instance.connect()
    return db_instance

#  Optimized execution pass 2 for refactor_oauth_provider_scopes

#  Optimized execution pass 7 for optimize_history_endpoint_query_performance

#  Optimized execution pass 12 for update_mongodb_unique_indexing_strategies
