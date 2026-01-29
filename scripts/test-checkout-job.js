#!/usr/bin/env node

/**
 * Script de teste para o job de checkout automático
 *
 * Este script testa o funcionamento do job de checkout automático
 * executando-o manualmente para verificar se funciona corretamente.
 */

import dotenv from 'dotenv';

import { runAutomaticCheckout } from '../src/jobs/automaticCheckout.job.ts';

dotenv.config();

async function testAutomaticCheckout() {
  console.log('🧪 Testing automatic checkout job...');

  try {
    await runAutomaticCheckout();
    console.log('✅ Test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAutomaticCheckout();
