/**
 * Aliyun ESA Edge Function
 * Handles API requests for EdgePersona
 */

// EdgeKV is available globally in the ESA runtime, but we structure it cleanly.
// We use the namespace 'edge_persona_kv' which MUST be created in the ESA console.
const KV_NAMESPACE = "edge_persona_kv";

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Simple Router
  if (path === '/api/persona' && request.method === 'GET') {
    return await getPersona(request);
  } else if (path === '/api/persona' && request.method === 'POST') {
    return await savePersona(request);
  } else if (path === '/api/chat' && request.method === 'POST') {
    return await handleChat(request);
  } else if (path === '/api/event' && request.method === 'POST') {
    return await saveEvent(request);
  } else if (path === '/api/reset' && request.method === 'POST') {
     return await resetData(request);
  }

  // If request is not /api/*, it falls through to static assets (handled by ESA Pages routing usually)
  // But inside the function trigger, we return 404 for API calls that don't match.
  return new Response("API Endpoint Not Found", { status: 404 });
}

// --- Handlers ---

async function getPersona(request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return new Response("Missing userId", { status: 400 });

  try {
    const edgeKV = new EdgeKV({ namespace: KV_NAMESPACE });
    const data = await edgeKV.get(`user_${userId}_profile`, { type: "json" });
    
    if (!data) return new Response("Not Found", { status: 404 });
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.toString() }), { status: 500 });
  }
}

async function savePersona(request) {
  try {
    const profile = await request.json();
    const userId = profile.id;
    
    const edgeKV = new EdgeKV({ namespace: KV_NAMESPACE });
    await edgeKV.put(`user_${userId}_profile`, JSON.stringify(profile));
    
    // Initialize empty chat history and events
    await edgeKV.put(`user_${userId}_history`, JSON.stringify([]));
    await edgeKV.put(`user_${userId}_events`, JSON.stringify([]));

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.toString() }), { status: 500 });
  }
}

async function saveEvent(request) {
  try {
    const { userId, event } = await request.json();
    const edgeKV = new EdgeKV({ namespace: KV_NAMESPACE });
    
    // Get existing events
    let events = await edgeKV.get(`user_${userId}_events`, { type: "json" }) || [];
    
    const newEvent = { ...event, id: Date.now().toString() };
    events.unshift(newEvent); // Add to top
    
    await edgeKV.put(`user_${userId}_events`, JSON.stringify(events));
    
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.toString() }), { status: 500 });
  }
}

async function resetData(request) {
   const { userId } = await request.json();
   const edgeKV = new EdgeKV({ namespace: KV_NAMESPACE });
   await edgeKV.delete(`user_${userId}_profile`);
   await edgeKV.delete(`user_${userId}_history`);
   await edgeKV.delete(`user_${userId}_events`);
   return new Response(JSON.stringify({ success: true }));
}

async function handleChat(request) {
  try {
    const { userId, message } = await request.json();
    const edgeKV = new EdgeKV({ namespace: KV_NAMESPACE });

    // 1. Parallel Retrieval of Memory
    const [profile, history, events] = await Promise.all([
      edgeKV.get(`user_${userId}_profile`, { type: "json" }),
      edgeKV.get(`user_${userId}_history`, { type: "json" }) || [],
      edgeKV.get(`user_${userId}_events`, { type: "json" }) || []
    ]);

    if (!profile) return new Response("Persona not initialized", { status: 400 });

    // 2. Build Dynamic Prompt
    const systemPrompt = `
      You are a digital persona named ${profile.name || "Avatar"}.
      You are NOT an AI assistant. You ARE the user's digital mirror.
      
      CORE IDENTITY:
      ${JSON.stringify(profile.coreIdentities)}
      Expertise: ${JSON.stringify(profile.domainExpertise)}
      Values: ${JSON.stringify(profile.values)}
      Communication Style: ${JSON.stringify(profile.communication)}
      Emotional Tone: ${profile.emotional.preferredTone}

      MAJOR LIFE EVENTS (Long-term Memory):
      ${events.slice(0, 5).map(e => `- ${e.date}: ${e.content} (Mood: ${e.mood})`).join('\n')}

      INSTRUCTIONS:
      - Adopt the user's verbal ticks: ${JSON.stringify(profile.communication.verbalTicks)}.
      - Respond exactly how this person would respond. 
      - Do not be polite if the persona is aggressive. Be authentic to the data.
      - Keep responses concise unless asked to elaborate.
    `;

    // 3. Prepare Messages for DeepSeek
    const recentHistory = history.slice(-6); // Last 6 turns
    const messages = [
      { role: "system", content: systemPrompt },
      ...recentHistory,
      { role: "user", content: message }
    ];

    // 4. Call DeepSeek (Aliyun Bailian)
    // NOTE: DEEPSEEK_API_KEY must be set in ESA Console Environment Variables
    // process.env is available in ESA functions if configured in console
    const apiKey = process.env.DEEPSEEK_API_KEY; 

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server misconfiguration: API Key missing" }), { status: 500 });
    }

    const aiResponse = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-v3", // Or deepseek-r1 based on availability in Bailian
        messages: messages,
        temperature: 0.7 + (profile.traits.planningVsSpontaneity * 0.3) // Dynamic temperature based on traits
      })
    });

    const aiData = await aiResponse.json();
    
    if (!aiResponse.ok) {
        throw new Error(`AI API Error: ${JSON.stringify(aiData)}`);
    }

    const responseText = aiData.choices[0].message.content;

    // 5. Update Short-term Memory (Async, don't block response too much, but KV await is fast)
    const newHistory = [
      ...history,
      { role: "user", content: message, timestamp: Date.now() },
      { role: "assistant", content: responseText, timestamp: Date.now() }
    ];
    // Keep history manageable (e.g., last 20 messages)
    if (newHistory.length > 20) newHistory.shift();
    if (newHistory.length > 20) newHistory.shift();

    await edgeKV.put(`user_${userId}_history`, JSON.stringify(newHistory));

    return new Response(JSON.stringify({ 
      role: 'assistant', 
      content: responseText, 
      timestamp: Date.now() 
    }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.toString() }), { status: 500 });
  }
}

export default {
  fetch(request) {
    return handleRequest(request);
  }
};
