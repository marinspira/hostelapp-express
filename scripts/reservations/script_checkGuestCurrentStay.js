#!/usr/bin/env node

/**
 * Script para verificar se um guest está atualmente hospedado em algum hostel
 *
 * Este script verifica as reservas ativas de um guest para determinar
 * se ele está atualmente em algum hostel.
 *
 * Uso:
 * - node scripts/checkGuestCurrentStay.js --email=guest@example.com
 * - node scripts/checkGuestCurrentStay.js --userId=60d0fe4f5311236168a109ca
 * - node scripts/checkGuestCurrentStay.js --username=guest123
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectToMongoDB from '../../db/connectToMongoDB.js';
import User from '../../src/models/user.model.js';
import Guest from '../../src/models/guest.model.js';
import Reservation from '../../src/models/reservation.model.js';

// Carrega as variáveis de ambiente
dotenv.config();

function parseArguments() {
  const args = process.argv.slice(2);
  const params = {};

  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      params[key] = value;
    }
  });

  return params;
}

function printUsage() {
  console.log(`
📋 Como usar este script:

   node scripts/checkGuestCurrentStay.js --email=guest@example.com
   node scripts/checkGuestCurrentStay.js --userId=60d0fe4f5311236168a109ca
   node scripts/checkGuestCurrentStay.js --username=guest123

📝 Parâmetros:
   --email     Email do usuário guest
   --userId    ID do usuário no MongoDB
   --username  Username do guest

ℹ️  O script verifica se o guest tem alguma reserva ativa no momento atual.
`);
}

async function findGuestUser(params) {
  let user = null;
  let guest = null;

  if (params.email) {
    user = await User.findOne({
      email: params.email,
      role: 'guest',
    });
  } else if (params.userId) {
    if (!mongoose.Types.ObjectId.isValid(params.userId)) {
      throw new Error('ID de usuário inválido');
    }
    user = await User.findById(params.userId);
    if (user && user.role !== 'guest') {
      throw new Error('O usuário encontrado não é um guest');
    }
  } else if (params.username) {
    guest = await Guest.findOne({
      username: params.username,
    }).populate('user');
    user = guest?.user;
  }

  if (!user) {
    throw new Error('Guest não encontrado');
  }

  if (!guest) {
    guest = await Guest.findOne({ user: user._id });
    if (!guest) {
      throw new Error('Perfil de guest não encontrado para este usuário');
    }
  }

  return { user, guest };
}

async function checkCurrentStay(user) {
  const now = new Date();

  // Busca reservas ativas (checkin já passou e checkout ainda não)
  const activeReservations = await Reservation.find({
    user_id_guest: user._id,
    checkin_date: { $lte: now },
    checkout_date: { $gt: now },
    status: { $in: ['walking in', 'in house'] }, // Exclui 'checked out'
  }).populate('hostel_id');

  return activeReservations;
}

async function displayResults(user, guest, activeReservations) {
  console.log('\n🔍 RESULTADO DA VERIFICAÇÃO');
  console.log('═'.repeat(50));

  console.log(`👤 Guest: ${user.name}`);
  console.log(`📧 Email: ${user.email}`);
  console.log(`🏷️  Username: ${guest.username}`);
  console.log(`🆔 User ID: ${user._id}`);

  if (activeReservations.length === 0) {
    console.log('\n❌ GUEST NÃO ESTÁ EM NENHUM HOSTEL');
    console.log('   O guest não possui nenhuma reserva ativa no momento.');
    return false;
  }

  console.log('\n✅ GUEST ESTÁ HOSPEDADO!');
  console.log(`   📊 Total de reservas ativas: ${activeReservations.length}`);

  for (let i = 0; i < activeReservations.length; i++) {
    const reservation = activeReservations[i];
    const hostel = reservation.hostel_id;

    console.log(`\n🏨 Reserva ${i + 1}:`);
    console.log(`   🏢 Hostel: ${hostel?.name || 'Nome não disponível'}`);
    console.log(`   🏠 Quarto: ${reservation.room_number}`);
    console.log(`   🛏️  Cama: ${reservation.bed_number}`);
    console.log(`   📅 Check-in: ${reservation.checkin_date.toLocaleDateString('pt-BR')}`);
    console.log(`   📅 Check-out: ${reservation.checkout_date.toLocaleDateString('pt-BR')}`);
    console.log(`   📊 Status: ${reservation.status}`);

    if (hostel) {
      console.log(
        `   🏛️  Endereço: ${hostel.address?.street}, ${hostel.address?.city}, ${hostel.address?.country}`
      );
      console.log(`   📞 Contato: ${hostel.phone || 'N/A'}`);
      console.log(`   📧 Email: ${hostel.email || 'N/A'}`);
    }
  }

  return true;
}

async function main() {
  try {
    const params = parseArguments();

    if (!params.email && !params.userId && !params.username) {
      console.log('❌ Erro: É necessário fornecer pelo menos um parâmetro de busca.');
      printUsage();
      process.exit(1);
    }

    console.log('🚀 Verificando status de hospedagem do guest...');

    await connectToMongoDB();
    console.log('✅ Conectado ao MongoDB');

    // Busca o guest
    const { user, guest } = await findGuestUser(params);

    // Verifica se está hospedado atualmente
    const activeReservations = await checkCurrentStay(user);

    // Exibe os resultados
    const isCurrentlyStaying = await displayResults(user, guest, activeReservations);

    // Retorna código de saída baseado no resultado
    console.log(
      `\n🎯 CONCLUSÃO: Guest ${isCurrentlyStaying ? 'ESTÁ' : 'NÃO ESTÁ'} hospedado atualmente`
    );

    process.exit(isCurrentlyStaying ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Erro durante a verificação:', error.message);

    if (error.message.includes('não encontrado')) {
      console.log('\n💡 Dicas:');
      console.log('   • Verifique se o email/username/userId está correto');
      console.log('   • Certifique-se de que o usuário existe e tem role "guest"');
      console.log('   • Verifique se o guest tem um perfil criado');
    }

    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Conexão com MongoDB fechada');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
