#!/usr/bin/env node
/**
 * Export script: syncs Supabase data to public/data.json
 * Usage: node scripts/export-data.js
 * 
 * Requires env vars:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing env vars: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportData() {
  try {
    console.log('📡 Fetching data from Supabase...');
    
    const [{ data: backlogs, error: blErr }, { data: tasks, error: tkErr }] = await Promise.all([
      supabase.from('backlogs').select('*').order('position'),
      supabase.from('tasks').select('*').order('position'),
    ]);

    if (blErr) throw new Error(`Backlogs query failed: ${blErr.message}`);
    if (tkErr) throw new Error(`Tasks query failed: ${tkErr.message}`);

    const data = {
      backlogs: backlogs || [],
      tasks: tasks || [],
      lastUpdated: new Date().toISOString(),
    };

    const outDir = path.join(process.cwd(), 'public');
    const outFile = path.join(outDir, 'data.json');

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
    console.log(`✅ Exported ${data.backlogs.length} backlogs, ${data.tasks.length} tasks to ${outFile}`);
    console.log(`📅 Last updated: ${data.lastUpdated}`);
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

exportData();
