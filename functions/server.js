/**
 * Aliyun ESA Edge Function
 * Handles API requests for EdgePersona
 */

const KV_NAMESPACE = "edge_persona_kv";

// Fallback Key to ensure the app works immediately if ESA Console Env vars fail
const FALLBACK_API_KEY = "sk-26d09fa903034902928ae380a56ecfd3";

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Simple Router
  if (path === '/api/persona' && request.method === 'GET') {
    return await getPersona(request);
  } else if (path === '/api/persona' && request.method === 'POST') {
    return await savePersona(request);
  } else if (path === '/api/chat' && request.method === 'POST') {
    // Pass env to handleChat to access API Key
    return await handleChat(request, env);
  } else if (path === '/api/event' && request.method === 'POST') {
    return await saveEvent(request);
  } else if (path === '/api/reset' && request.method === 'POST') {
     return await resetData(request);
  }

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
    
    let events = await edgeKV.get(`user_${userId}_events`, { type: "json" }) || [];
    const newEvent = { ...event, id: Date.now().toString() };
    events.unshift(newEvent);
    
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

async function handleChat(request, env) {
  try {
    const { userId, message } = await request.json();
    const edgeKV = new EdgeKV({ namespace: KV_NAMESPACE });

    const [profile, history, events] = await Promise.all([
      edgeKV.get(`user_${userId}_profile`, { type: "json" }),
      edgeKV.get(`user_${userId}_history`, { type: "json" }) || [],
      edgeKV.get(`user_${userId}_events`, { type: "json" }) || []
    ]);

    if (!profile) return new Response("Persona not initialized", { status: 400 });

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

    const recentHistory = history.slice(-6);
    const messages = [
      { role: "system", content: systemPrompt },
      ...recentHistory,
      { role: "user", content: message }
    ];

    // FIX: Try to get Key from Env, if failed, use Fallback
    const apiKey = (env && env.DEEPSEEK_API_KEY) ? env.DEEPSEEK_API_KEY : FALLBACK_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server misconfiguration: API Key missing." }), { status: 500 });
    }

    const aiResponse = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-v3",
        messages: messages,
        temperature: 0.7 + (profile.traits.planningVsSpontaneity * 0.3)
      })
    });

    const aiData = await aiResponse.json();
    
    if (!aiResponse.ok) {
        throw new Error(`AI API Error (${aiResponse.status}): ${JSON.stringify(aiData)}`);
    }

    const responseText = aiData.choices?.[0]?.message?.content || "Error: No content generated.";

    const newHistory = [
      ...history,
      { role: "user", content: message, timestamp: Date.now() },
      { role: "assistant", content: responseText, timestamp: Date.now() }
    ];
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
  // ESA Edge Routine Entry Point
  fetch(request, env) {
    return handleRequest(request, env);
  }
};