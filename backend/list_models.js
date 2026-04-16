// Run this in your backend folder: node list_models.js
require('dotenv').config();

const key = process.env.GEMINI_API_KEY;

if (!key || !key.startsWith('AIza')) {
  console.log('❌ No valid GEMINI_API_KEY found in .env');
  process.exit(1);
}

async function listModels() {
  console.log('Fetching available models for your API key...\n');
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  
  const res  = await fetch(url);
  const data = await res.json();
  
  if (!res.ok) {
    console.log('❌ Error:', data?.error?.message);
    return;
  }
  
  const models = data.models || [];
  console.log(`Found ${models.length} models:\n`);
  
  // Show only generateContent capable ones
  const chatModels = models.filter(m =>
    m.supportedGenerationMethods?.includes('generateContent')
  );
  
  console.log('✅ Models that support generateContent (chat):');
  chatModels.forEach(m => {
    console.log(`  → ${m.name.replace('models/', '')}`);
  });
}

listModels().catch(console.error);