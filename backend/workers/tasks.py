import os
import logging
from agents.specialized import get_agent_by_name

logger = logging.getLogger(__name__)

def run_agent_task_sync(agent_name: str, repo_path: str):
    """
    Executes a specific security agent against a cloned repository.
    """
    logger.info(f"Starting {agent_name} on {repo_path}")
    
    agent = get_agent_by_name(agent_name)
    if not agent:
        error_msg = f"Agent {agent_name} not found"
        logger.error(error_msg)
        return {"status": "error", "message": error_msg}
        
    try:
        findings = agent.analyze(repo_path)
        logger.info(f"{agent_name} finished successfully.")
        return {"status": "success", "agent": agent_name, "findings": findings}
    except Exception as e:
        logger.error(f"Error running {agent_name}: {e}")
        return {"status": "error", "agent": agent_name, "message": str(e)}
