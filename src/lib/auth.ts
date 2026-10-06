/**
 * Utilidades do login, como funções puras: a mensagem de erro em português e a leitura do
 * link que chega por e-mail para redefinir a senha.
 */

/** O erro do Supabase Auth (ou de rede) → a frase que a tela mostra. */
export function mensagemDeErroDeAuth(erro: unknown): string {
  const e = (erro ?? {}) as { code?: string; name?: string; message?: string; status?: number };
  const mensagem = (e.message ?? '').toLowerCase();

  // Sem rede: o login precisa da internet UMA vez; depois o app abre offline.
  if (e.name === 'AuthRetryableFetchError' || mensagem.includes('network request failed') || mensagem.includes('failed to fetch')) {
    return 'Sem conexão. Para entrar, o app precisa de internet uma vez.';
  }

  switch (e.code) {
    case 'invalid_credentials':
      return 'E-mail ou senha incorretos.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Já existe uma conta com esse e-mail. Tente entrar.';
    case 'weak_password':
      return 'Senha fraca: use pelo menos 6 caracteres.';
    case 'email_address_invalid':
    case 'validation_failed':
      return 'Confira o e-mail: ele parece inválido.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Muitas tentativas em pouco tempo. Espere alguns minutos e tente de novo.';
    case 'email_not_confirmed':
      return 'Confirme o seu e-mail pelo link que enviamos antes de entrar.';
    case 'same_password':
      return 'A nova senha precisa ser diferente da atual.';
    case 'session_not_found':
    case 'refresh_token_not_found':
      return 'Sua sessão expirou. Entre de novo.';
    case 'otp_expired':
      return 'O link expirou. Peça um novo em "Esqueci minha senha".';
    default:
      break;
  }
  if (mensagem.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (mensagem.includes('already registered')) return 'Já existe uma conta com esse e-mail. Tente entrar.';
  return 'Não deu certo agora. Tente de novo em instantes.';
}

export type CredenciaisDoLink =
  | { tipo: 'tokens'; accessToken: string; refreshToken: string }
  | { tipo: 'codigo'; codigo: string }
  | { tipo: 'erro'; descricao: string };

/**
 * Lê o link de "redefinir senha" que o Supabase manda por e-mail.
 *
 * Ele volta para o app de dois jeitos, conforme o fluxo do Auth: com os tokens no fragmento
 * (`#access_token=…&refresh_token=…&type=recovery`) ou com um código (`?code=…`). Link sem
 * nenhum dos dois devolve nulo — é a tela aberta à mão, não pelo e-mail.
 */
export function extrairCredenciaisDoLink(url: string | null | undefined): CredenciaisDoLink | null {
  if (!url) return null;
  const params = new URLSearchParams();
  const [, depoisDaInterrogacao = ''] = url.split('?');
  const [consulta, fragmentoDaConsulta = ''] = depoisDaInterrogacao.split('#');
  const fragmento = url.includes('#') ? url.slice(url.indexOf('#') + 1) : fragmentoDaConsulta;
  for (const parte of [consulta, fragmento]) {
    new URLSearchParams(parte).forEach((valor, chave) => params.set(chave, valor));
  }

  const erro = params.get('error_description') ?? params.get('error');
  if (erro) return { tipo: 'erro', descricao: erro.replace(/\+/g, ' ') };

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) return { tipo: 'tokens', accessToken, refreshToken };

  const codigo = params.get('code');
  if (codigo) return { tipo: 'codigo', codigo };
  return null;
}
