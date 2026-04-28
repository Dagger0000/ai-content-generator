from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pytrends.request import TrendReq
import uvicorn
import logging
from functools import lru_cache
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Trends Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

NICHE_KEYWORDS = {
    "technology": ["AI tools", "machine learning", "automation", "cloud computing", "cybersecurity"],
    "fashion": ["sustainable fashion", "streetwear", "luxury brands", "fast fashion", "vintage clothing"],
    "food": ["plant-based food", "meal prep", "food delivery", "healthy eating", "restaurant trends"],
    "finance": ["cryptocurrency", "stock market", "personal finance", "fintech", "investing"],
    "health": ["mental health", "fitness trends", "wellness", "telehealth", "nutrition"],
    "education": ["online learning", "edtech", "upskilling", "certifications", "e-learning"],
    "travel": ["sustainable travel", "remote work travel", "budget travel", "luxury travel", "travel hacks"],
    "marketing": ["content marketing", "social media marketing", "SEO", "email marketing", "influencer marketing"],
    "ecommerce": ["dropshipping", "D2C brands", "marketplace trends", "customer experience", "social commerce"],
    "general": ["trending topics", "viral content", "social media trends", "digital marketing", "AI content"]
}

def get_pytrends():
    return TrendReq(hl='en-US', tz=360, timeout=(10, 25), retries=2, backoff_factor=0.1)

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": time.time()}

@app.get("/trends")
def get_trends(
    niche: str = Query(default="technology", description="Industry niche"),
    geo: str = Query(default="US", description="Geographic location code")
):
    try:
        pytrends = get_pytrends()
        keywords = NICHE_KEYWORDS.get(niche.lower(), NICHE_KEYWORDS["general"])

        # Build payload
        pytrends.build_payload(keywords[:5], cat=0, timeframe='now 7-d', geo=geo)

        # Get interest over time
        interest_df = pytrends.interest_over_time()
        trending_keywords = []
        if not interest_df.empty:
            avg_interest = interest_df.drop(columns=['isPartial'], errors='ignore').mean()
            top_keywords = avg_interest.sort_values(ascending=False)
            trending_keywords = [
                {"keyword": k, "score": round(float(v), 1)}
                for k, v in top_keywords.items()
            ]

        # Get related queries (rising)
        rising_queries = []
        try:
            related = pytrends.related_queries()
            for kw in keywords[:3]:
                if kw in related and related[kw]['rising'] is not None:
                    rising_df = related[kw]['rising']
                    if not rising_df.empty:
                        for _, row in rising_df.head(3).iterrows():
                            rising_queries.append({
                                "query": row.get('query', ''),
                                "value": row.get('value', 0)
                            })
        except Exception as e:
            logger.warning(f"Rising queries failed: {e}")

        # Get geo-based trends
        geo_data = []
        try:
            geo_df = pytrends.interest_by_region(resolution='COUNTRY', inc_low_vol=False, inc_geo_code=False)
            if not geo_df.empty:
                geo_df = geo_df.sum(axis=1).sort_values(ascending=False).head(10)
                geo_data = [{"region": r, "interest": int(v)} for r, v in geo_df.items()]
        except Exception as e:
            logger.warning(f"Geo data failed: {e}")

        return {
            "niche": niche,
            "geo": geo,
            "trending_keywords": [t["keyword"] for t in trending_keywords[:10]],
            "trending_scores": trending_keywords[:10],
            "rising_queries": [r["query"] for r in rising_queries[:10]],
            "rising_data": rising_queries[:10],
            "geo_data": geo_data,
            "mock": False
        }

    except Exception as e:
        logger.error(f"Trends error: {e}")
        # Return mock data on failure
        mock_keywords = NICHE_KEYWORDS.get(niche.lower(), NICHE_KEYWORDS["general"])
        return {
            "niche": niche,
            "geo": geo,
            "trending_keywords": mock_keywords,
            "trending_scores": [{"keyword": k, "score": 80 - i*5} for i, k in enumerate(mock_keywords)],
            "rising_queries": [f"{niche} trends 2025", f"best {niche} tools", f"{niche} automation"],
            "rising_data": [],
            "geo_data": [],
            "mock": True,
            "error": str(e)
        }

@app.get("/dashboard")
def get_dashboard(niche: str = Query(default="technology")):
    try:
        pytrends = get_pytrends()
        keywords = NICHE_KEYWORDS.get(niche.lower(), NICHE_KEYWORDS["general"])
        pytrends.build_payload(keywords[:5], timeframe='today 3-m')
        interest = pytrends.interest_over_time()

        chart_data = []
        if not interest.empty:
            interest = interest.drop(columns=['isPartial'], errors='ignore')
            for col in interest.columns:
                chart_data.append({
                    "keyword": col,
                    "data": [{"date": str(idx.date()), "value": int(val)} 
                             for idx, val in interest[col].items()]
                })

        return {
            "niche": niche,
            "chart_data": chart_data,
            "keywords": keywords[:5],
            "mock": False
        }
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        return {"niche": niche, "chart_data": [], "mock": True, "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
