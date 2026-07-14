import logging
import os
import json
from typing import List, Dict, Any
from google import genai
from google.genai import types
from core.repo import RepositoryManager


logger = logging.getLogger(__name__)

class PlannerAgent:
    """
    The Planner Agent acts as the central orchestrator.
    It takes the Repository Agent's output (tech stack, architecture)
    and dynamically decides which specialized agents to invoke using Gemini.
    """
    
    def __init__(self, repo_url: str):
        self.name = "PlannerAgent"
        self.repo_url = repo_url
        
        # Initialize Gemini Client
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY not found. Operating in stub mode.")
            self.client = None
        else:
            self.client = genai.Client(api_key=api_key)

    def plan_and_execute(self) -> str:
        """
        Main entry point for starting an analysis.
        """
        # 1. Clone the repository
        repo_manager = RepositoryManager()
        try:
            repo_path = repo_manager.clone_repo(self.repo_url)
        except Exception as e:
            logger.error(f"Failed to clone repository: {e}")
            return "clone-error"

        # 2. Gather basic context (Stub for Repository Agent)
        repo_context = {
            "url": self.repo_url,
            "tech_stack": ["python", "docker", "fastapi"]
        }
        
        # 3. Ask Gemini for an analysis strategy
        strategy = self.create_analysis_strategy(repo_context)
        
        # 4. Dispatch tasks to Celery
        self.execute_plan(strategy, repo_path)
        
        return "analysis-started"

    def create_analysis_strategy(self, repo_context: Dict[str, Any]) -> List[str]:
        """
        Dynamically determine the sequence of security tools and agents to run using Gemini.
        """
        if not self.client:
            return ["SecretAgent", "CodeReviewAgent", "DependencyAgent"]
            
        prompt = f"""
        You are the Head of Security (Planner Agent) for an autonomous AI security team.
        Analyze the following repository context and determine the required specialized security agents to run.
        
        Repository URL: {repo_context['url']}
        Detected Tech Stack: {repo_context['tech_stack']}
        
        Available Agents: SecretAgent, CodeReviewAgent, DependencyAgent, DockerAgent, CloudAgent, IACAgent.
        
        Return ONLY a valid JSON list of the agent names you want to invoke. Example: ["SecretAgent", "CodeReviewAgent"]
        """
        
        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-pro',
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    response_mime_type="application/json"
                )
            )
            strategy = json.loads(response.text)
            logger.info(f"AI Generated Analysis Strategy: {strategy}")
            return strategy
        except Exception as e:
            logger.error(f"Error querying Gemini: {e}")
            return ["SecretAgent", "CodeReviewAgent"]

    def execute_plan(self, strategy: List[str], repo_path: str):
        """
        Orchestrate the execution of the selected agents.
        """
        import threading
        from workers.tasks import run_agent_task_sync

        logger.info(f"Executing plan for {self.repo_url} with agents: {strategy}")
        
        # Fire off a background thread for the analysis so it doesn't block the API
        def background_execution():
            for agent_name in strategy:
                run_agent_task_sync(agent_name, repo_path)
                
        thread = threading.Thread(target=background_execution)
        thread.start()
