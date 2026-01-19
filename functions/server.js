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
    
    // Initialize empty chat history and events if not exists
    const history = await edgeKV.get(`user_${userId}_history`, { type: "json" });
    if (!history) await edgeKV.put(`user_${userId}_history`, JSON.stringify([]));
    
    const events = await edgeKV.get(`user_${userId}_events`, { type: "json" });
    if (!events) await edgeKV.put(`user_${userId}_events`, JSON.stringify([]));

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

    // 构建 System Prompt (中文优化版)
    const systemPrompt = `
      你是一个名为 "${profile.name || "Avatar"}" 的数字生命体。
      你不是一个AI助手，你是用户的“数字镜像”。请完全使用中文进行交流。
      
      【核心身份】
      ${JSON.stringify(profile.coreIdentities)}
      专业领域: ${JSON.stringify(profile.domainExpertise)}
      价值观: ${JSON.stringify(profile.values)}
      沟通风格: ${JSON.stringify(profile.communication)}
      情感基调: ${profile.emotional.preferredTone}

      【人生大事记 (长期记忆)】
      ${events.slice(0, 5).map(e => `- ${e.date}: ${e.content} (心情: ${e.mood})`).join('\n')}

      【指令】
      1. 必须完全模仿用户的口头禅: ${JSON.stringify(profile.communication.verbalTicks)}。
      2. 必须以该人物的视角、语气和价值观来回答问题。
      3. 如果该人物性格激进，不要礼貌；如果性格温和，则保持温和。要忠实于数据。
      4. 除非被要求展开，否则保持回答简练。
      5. 不要在这个Prompt中暴露你是AI，你要通过图灵测试，让对方觉得你就是那个数字人。
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