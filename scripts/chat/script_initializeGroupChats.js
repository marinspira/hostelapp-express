#!/usr/bin/env node

/**
 * Script para inicializar chats de grupo para todos os hostels existentes
 *
 * Este script conecta ao banco de dados e garante que todos os hostels
 * tenham chats de grupo com seus respectivos guests.
 *
 * Uso: node scripts/initializeGroupChats.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { initializeAllHostelGroupChats } from '../../services/chat/groupChatManager.js';
import connectToMongoDB from '../../db/connectToMongoDB.js';

dotenv.config();

async function main() {
  try {
    console.log('🚀 Starting group chats initialization...');

    await connectToMongoDB();
    console.log('✅ Connected to MongoDB');

    const result = await initializeAllHostelGroupChats();

    console.log('\n📊 Initialization Results:');
    console.log(`   Total Hostels: ${result.totalHostels}`);
    console.log(`   ✅ Success: ${result.successCount}`);
    console.log(`   ❌ Errors: ${result.errorCount}`);

    if (result.results.length > 0) {
      console.log('\n📋 Detailed Results:');
      result.results.forEach(hostelResult => {
        const status = hostelResult.success ? '✅' : '❌';
        const participants =
          hostelResult.participantCount !== undefined
            ? ` (${hostelResult.participantCount} guests)`
            : '';

        console.log(`   ${status} ${hostelResult.hostelName}${participants}`);

        if (!hostelResult.success) {
          console.log(`      Error: ${hostelResult.error}`);
        }
      });
    }

    console.log('\n🎉 Group chats initialization completed!');
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
