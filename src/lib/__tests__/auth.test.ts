import { extrairCredenciaisDoLink, mensagemDeErroDeAuth } from '@/lib/auth';

describe('Mensagem de erro do login, em português', () => {
  it('senha errada', () => {
    expect(mensagemDeErroDeAuth({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe('E-mail ou senha incorretos.');
  });

  it('conta que já existe', () => {
    expect(mensagemDeErroDeAuth({ code: 'user_already_exists' })).toMatch(/Já existe uma conta/);
  });

  it('sem rede (subsolo) diz que o login precisa de internet uma vez', () => {
    expect(mensagemDeErroDeAuth({ name: 'AuthRetryableFetchError', message: 'Failed to fetch' })).toMatch(/Sem conexão/);
    expect(mensagemDeErroDeAuth(new TypeError('Network request failed'))).toMatch(/Sem conexão/);
  });

  it('limite de e-mails do Supabase', () => {
    expect(mensagemDeErroDeAuth({ code: 'over_email_send_rate_limit' })).toMatch(/Espere alguns minutos/);
  });

  it('erro desconhecido não vaza inglês nem stack', () => {
    expect(mensagemDeErroDeAuth({ message: 'Something exploded at line 42' })).toBe('Não deu certo agora. Tente de novo em instantes.');
    expect(mensagemDeErroDeAuth(undefined)).toBe('Não deu certo agora. Tente de novo em instantes.');
  });
});

describe('Link de redefinir senha', () => {
  it('tokens no fragmento (fluxo implícito)', () => {
    expect(extrairCredenciaisDoLink('serie://redefinir-senha#access_token=AAA&refresh_token=RRR&type=recovery&expires_in=3600'))
      .toEqual({ tipo: 'tokens', accessToken: 'AAA', refreshToken: 'RRR' });
  });

  it('código na consulta (fluxo PKCE), inclusive no Expo Go', () => {
    expect(extrairCredenciaisDoLink('exp://192.168.0.10:8081/--/redefinir-senha?code=abc-123'))
      .toEqual({ tipo: 'codigo', codigo: 'abc-123' });
  });

  it('link vencido devolve o erro legível', () => {
    expect(extrairCredenciaisDoLink('http://localhost:8081/redefinir-senha#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'))
      .toEqual({ tipo: 'erro', descricao: 'Email link is invalid or has expired' });
  });

  it('tela aberta à mão, sem nada no link → nulo', () => {
    expect(extrairCredenciaisDoLink('serie://redefinir-senha')).toBeNull();
    expect(extrairCredenciaisDoLink(null)).toBeNull();
  });
});
