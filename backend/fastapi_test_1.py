from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
import os
from typing import Optional

app = FastAPI(title="Food Label Analyzer API")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Add your React app URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response model
class AnalysisResponse(BaseModel):
    success: bool
    analysis: Optional[str] = None
    error: Optional[str] = None

# Initialize Gemini client
def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    return genai.Client(api_key=api_key)

@app.get("/")
async def root():
    return {"message": "Food Label Analyzer API", "status": "running"}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_food_label(file: UploadFile = File(...)):
    """
    Analyze a food label image.
    
    - **file**: Image file (JPEG, PNG, etc.)
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG, etc.)"
            )
        
        # Read image data
        image_data = await file.read()
        
        if len(image_data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty file uploaded"
            )
        
        # Initialize Gemini client
        client = get_gemini_client()
        
        # Prompt for analysis
        prompt = """Given us the image of a food label. Find and read the ingredients and allergies (if present, optional) from the photo of a food label and analyse the ingredients for their health risks as:

What is good:
What is bad:
Potential Health concerns:
Alternatives:"""
        
        # Send to Gemini for analysis
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {"inline_data": {"mime_type": file.content_type, "data": image_data}},
                        {"text": prompt}
                    ]
                }
            ]
        )
        
        return AnalysisResponse(
            success=True,
            analysis=response.text
        )
        
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        return AnalysisResponse(
            success=False,
            error=f"Error analyzing image: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        client = get_gemini_client()
        return {"status": "healthy", "gemini_configured": True}
    except:
        return {"status": "healthy", "gemini_configured": False}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)