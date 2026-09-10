const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const callGroq = async (prompt) => {
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
   model: 'openai/gpt-oss-20b',
    max_tokens: 1024,
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content || 'No response generated.';
};

// @POST /api/ai/chat
const chat = async (req, res) => {
  try {
    const { message, role, history } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const systemContext = role === 'hospital'
      ? `You are MedMatrix AI, a smart assistant for hospital administrators. 
         Help with patient management, resource allocation, medical protocols, 
         emergency procedures, and healthcare operations.
         Be concise, professional, and medically accurate.`
      : `You are MedMatrix AI, a friendly health assistant for patients.
         Help with general health queries, symptoms, medication information,
         appointment guidance, and wellness tips.
         Always recommend consulting a real doctor for serious concerns.`;

    let conversationPrompt = systemContext + '\n\n';

    if (history && history.length > 0) {
      history.slice(-6).forEach(msg => {
        conversationPrompt += (msg.role === 'user' ? 'User: ' : 'Assistant: ') + msg.content + '\n';
      });
    }

    conversationPrompt += 'User: ' + message + '\nAssistant:';

    const reply = await callGroq(conversationPrompt);
    res.json({ reply });
  } catch (err) {
    console.error('AI CHAT ERROR:', err.message);
    res.status(500).json({ message: 'AI service error', error: err.message });
  }
};

// @POST /api/ai/translate
const translateReport = async (req, res) => {
  try {
    const { text, direction } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });

    const isEnToHi = direction === 'en-hi';
    const prompt = isEnToHi
      ? `Translate this medical text from English to Hindi. Provide ONLY the Hindi translation.\n\nText:\n${text}`
      : `Translate this medical text from Hindi to English. Provide ONLY the English translation.\n\nText:\n${text}`;

    const translated = await callGroq(prompt);
    res.json({ translated, direction });
  } catch (err) {
    console.error('TRANSLATE ERROR:', err.message);
    res.status(500).json({ message: 'Translation error', error: err.message });
  }
};

// @POST /api/ai/summarize
const summarizeReport = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });

    const prompt = `Summarize this medical report in simple language for a patient.

Structure your response as:
**Key Findings:** (bullet points)
**What This Means:** (simple explanation)  
**Recommended Actions:** (what patient should do)

Medical Report:
${text}`;

    const summary = await callGroq(prompt);
    res.json({ summary });
  } catch (err) {
    console.error('SUMMARIZE ERROR:', err.message);
    res.status(500).json({ message: 'Summarization error', error: err.message });
  }
};
// @POST /api/ai/analyze-consultation
const analyzeConsultation = async (req, res) => {
    try {
        const { problem, symptoms, reportText } = req.body;

        if (!problem || !symptoms) {
            return res.status(400).json({
                message: 'Problem and symptoms are required'
            });
        }

        const prompt = `
You are MedMatrix AI, an AI-assisted healthcare information system.

Analyze the patient's information and provide a PRELIMINARY health assessment.

IMPORTANT:
- Do NOT claim that the patient definitely has a disease.
- Provide possible/probable conditions only.
- Do NOT prescribe medication as a definitive prescription.
- Medication information must be general educational guidance.
- Recommend seeing a qualified doctor for diagnosis and treatment.
- If symptoms suggest an emergency, clearly mention it.

Return ONLY valid JSON in this exact structure:

{
  "possibleConditions": [
    {
      "name": "Possible condition",
      "reason": "Short explanation of why it may be relevant"
    }
  ],
  "recommendedTests": [
    "Test name"
  ],
  "medicationGuidance": [
    "General medication or self-care guidance"
  ],
  "redFlags": [
    "Warning signs that require urgent medical attention"
  ],
  "summary": "Short overall explanation"
}

Patient's Problem:
${problem}

Patient's Symptoms:
${symptoms}

Previous Consultation Report:
${reportText || 'No previous report uploaded.'}
`;

        const aiResponse = await callGroq(prompt);

        let result;

        try {
            const cleanedResponse = aiResponse
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();

            result = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('AI JSON PARSE ERROR:', parseError);

            return res.status(500).json({
                message: 'AI returned an invalid response',
                rawResponse: aiResponse
            });
        }

        res.json(result);

    } catch (err) {
        console.error('CONSULTATION AI ERROR:', err.message);

        res.status(500).json({
            message: 'Consultation analysis failed',
            error: err.message
        });
    }
};

module.exports = {
    chat,
    translateReport,
    summarizeReport,
    analyzeConsultation
};