const express = require('express');
const Groq = require('groq-sdk');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');
const axios = require('axios');

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TONE_INSTRUCTIONS = {
  professional: 'Write in a formal, authoritative, and professional tone. Use industry-standard terminology.',
  casual: 'Write in a relaxed, conversational, and approachable tone. Use everyday language.',
  persuasive: 'Write in a compelling, motivating tone with strong calls-to-action. Use persuasive techniques.',
  friendly: 'Write in a warm, personable, and enthusiastic tone. Build rapport with the reader.',
  luxury: 'Write in an elegant, sophisticated, and exclusive tone. Evoke prestige and premium quality.',
  humorous: 'Write with wit, humor, and a light-hearted tone. Use clever wordplay where appropriate.'
};

const CONTENT_PROMPTS = {
  blog: (topic, tone, industry, keywords, trends) => `
You are an expert content writer specializing in ${industry}.
Write a comprehensive, SEO-optimized blog post about: "${topic}"
Tone: ${TONE_INSTRUCTIONS[tone]}
Industry: ${industry}
Target Keywords (incorporate naturally): ${keywords}
${trends ? `Trending topics to weave in: ${trends}` : ''}

Structure:
- Catchy headline (H1)
- Engaging intro (hook the reader)
- 3-5 main sections with subheadings (H2)
- Key takeaways or conclusion
- SEO meta description at the end (clearly labeled)

Make it informative, engaging, and around 600-800 words.`,

  'ad-copy': (topic, tone, industry, keywords, trends) => `
You are an expert copywriter for ${industry}.
Create compelling ad copy for: "${topic}"
Tone: ${TONE_INSTRUCTIONS[tone]}
Keywords: ${keywords}
${trends ? `Incorporate trending angle: ${trends}` : ''}

Provide:
1. Headline (max 30 chars)
2. Primary text (max 125 chars)  
3. Description (max 30 chars)
4. 3 Variation alternatives
5. Call-to-action options (3 variants)`,

  caption: (topic, tone, industry, keywords, trends) => `
You are a social media expert for ${industry}.
Create engaging social media captions for: "${topic}"
Tone: ${TONE_INSTRUCTIONS[tone]}
Keywords/hashtags: ${keywords}
${trends ? `Trending context: ${trends}` : ''}

Provide:
1. Instagram caption (with emojis, 150-200 chars) + hashtags
2. Twitter/X post (max 280 chars)
3. LinkedIn caption (professional, 200-300 chars)
4. TikTok hook (first line that stops the scroll)`,

  email: (topic, tone, industry, keywords, trends) => `
You are an email marketing expert for ${industry}.
Write a high-converting marketing email about: "${topic}"
Tone: ${TONE_INSTRUCTIONS[tone]}
Keywords: ${keywords}
${trends ? `Relevant trends to mention: ${trends}` : ''}

Include:
- Subject line (A/B test: provide 2 options)
- Preview text
- Greeting
- Body (personalized, value-focused)
- Clear CTA
- Sign-off
- P.S. line (optional but effective)`
};

async function getTrendsContext(niche) {
  try {
    const trendsUrl = process.env.TRENDS_SERVICE_URL || 'http://localhost:8000';
    const response = await axios.get(`${trendsUrl}/trends?niche=${encodeURIComponent(niche)}`, { timeout: 8000 });
    const data = response.data;
    const trendKeywords = data.trending_keywords?.slice(0, 5).join(', ') || '';
    const rising = data.rising_queries?.slice(0, 3).join(', ') || '';
    return trendKeywords || rising
      ? `Trending now in ${niche}: ${trendKeywords}. Rising queries: ${rising}`
      : null;
  } catch {
    logger.warn('Trends service unavailable, proceeding without trends');
    return null;
  }
}

// POST /api/content/generate
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { contentType, prompt, tone = 'professional', industry = 'General', keywords = '' } = req.body;
    if (!contentType || !prompt)
      return res.status(400).json({ error: 'contentType and prompt are required' });

    const trendsContext = await getTrendsContext(industry);
    const promptFn = CONTENT_PROMPTS[contentType];
    if (!promptFn) return res.status(400).json({ error: 'Invalid content type' });

    const systemPrompt = promptFn(prompt, tone, industry, keywords, trendsContext);

    logger.info('Generating content', { contentType, tone, industry, userId: req.user.id });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an expert marketing content creator. Always produce high-quality, ready-to-publish content.' },
        { role: 'user', content: systemPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2048
    });

    const content = completion.choices[0]?.message?.content || '';
    const seoScore = calculateSEOScore(content, keywords);

    res.json({
      content,
      seoScore,
      trendsUsed: !!trendsContext,
      trendsContext,
      model: 'llama-3.3-70b-versatile',
      tokens: completion.usage
    });
  } catch (err) {
    logger.error('Content generation error', { error: err.message });
    res.status(500).json({ error: 'Content generation failed: ' + err.message });
  }
});

// POST /api/content/rewrite
router.post('/rewrite', authMiddleware, async (req, res) => {
  try {
    const { content, action = 'rewrite', tone = 'professional' } = req.body;
    const actions = {
      rewrite: `Rewrite this content with improved clarity and flow, keeping the same tone (${tone}):`,
      expand: `Expand this content with more detail, examples, and depth. Keep tone ${tone}:`,
      shorten: `Shorten this content to half its length while keeping key points. Tone: ${tone}:`,
      seo: `Optimize this content for SEO: improve keywords, add meta description, optimize headers:`
    };

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'user', content: `${actions[action] || actions.rewrite}\n\n${content}` }
      ],
      temperature: 0.7,
      max_tokens: 2048
    });

    res.json({ content: completion.choices[0]?.message?.content || '' });
  } catch (err) {
    logger.error('Rewrite error', { error: err.message });
    res.status(500).json({ error: 'Rewrite failed: ' + err.message });
  }
});

// POST /api/content/variations
router.post('/variations', authMiddleware, async (req, res) => {
  try {
    const { prompt, contentType, tone, industry, count = 3 } = req.body;
    const variations = [];

    for (let i = 0; i < Math.min(count, 4); i++) {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: `Create variation ${i + 1} of ${contentType} content about "${prompt}" for ${industry} industry. Tone: ${tone}. Make this variation distinctly different from others.` }
        ],
        temperature: 0.9 + (i * 0.05),
        max_tokens: 1024
      });
      variations.push(completion.choices[0]?.message?.content || '');
    }

    res.json({ variations });
  } catch (err) {
    logger.error('Variations error', { error: err.message });
    res.status(500).json({ error: 'Variations generation failed' });
  }
});

function calculateSEOScore(content, keywords) {
  if (!keywords || !content) return 50;
  const kwList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  const contentLower = content.toLowerCase();
  let score = 40;
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 300) score += 10;
  if (wordCount > 600) score += 10;
  if (content.includes('##') || content.includes('#')) score += 10;
  const kwDensity = kwList.filter(kw => contentLower.includes(kw)).length / Math.max(kwList.length, 1);
  score += Math.round(kwDensity * 20);
  if (content.toLowerCase().includes('meta description')) score += 5;
  if (content.includes('?')) score += 5;
  return Math.min(score, 100);
}

module.exports = router;
