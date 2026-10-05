import { Platform, Share } from 'react-native';

/**
 * Entrega o CSV do histórico para fora do app, sem lib nova:
 *  - navegador: download de arquivo (Blob + <a download>);
 *  - Android/iOS: a folha de compartilhar do sistema com o texto (manda por e-mail,
 *    salva no Drive, cola numa planilha).
 *
 * ⚠️ O BOM (﻿) só no arquivo baixado: sem ele o Excel abre "Série" como "SÃ©rie".
 * Na folha de compartilhar ele viraria um caractere invisível no começo da mensagem.
 *
 * Devolve `false` quando a pessoa fecha a folha sem compartilhar: no iOS o `Share.share`
 * resolve também no cancelar (`dismissedAction`), e o aviso de "exportado" mentiria.
 * O Android não avisa o cancelamento — lá sempre volta `sharedAction`.
 */
export async function compartilharCsv(csv: string, nomeDoArquivo: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeDoArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  }
  const { action } = await Share.share({ title: nomeDoArquivo, message: csv });
  return action !== Share.dismissedAction;
}
