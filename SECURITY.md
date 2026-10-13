# Política de Segurança — Open Chat Broadcast

Versão 1.0 — política inicial.

## Objetivo
Proteger contas, salas, mensagens, áudio, vídeo, compartilhamento de tela e infraestrutura contra acesso indevido, abuso e indisponibilidade.

## Contas e sessões
- Em produção, o acesso deve usar HTTPS e sessões assinadas, com validade limitada e cookie HttpOnly.
- Senhas nunca devem aparecer em logs ou respostas.
- Tentativas repetidas de login, cadastro e requisições devem ser limitadas.
- O usuário deve encerrar a sessão ao usar dispositivo compartilhado.

## Salas e permissões
- O servidor deve validar propriedade e participação; a interface não é uma barreira de segurança.
- Somente o proprietário atual pode expulsar, silenciar ou transferir a propriedade.
- Mensagens, mídia e sinalização WebRTC devem permanecer restritas aos participantes autorizados.
- Convites de salas privadas devem ser difíceis de adivinhar e revogáveis.
- Reconexões não podem restaurar permissões revogadas.

## Mensagens e mídia
- Validar tamanho, formato e conteúdo dos eventos recebidos.
- Limitar spam, flood e conexões excessivas.
- Câmera, microfone e captura de tela dependem de ação explícita e das permissões do navegador.
- Não encaminhar conteúdo a usuários que não pertençam à sala.

## Infraestrutura
- Segredos devem ficar em variáveis de ambiente. Em produção, SESSION_SECRET deve ter pelo menos 32 caracteres aleatórios.
- MongoDB deve exigir autenticação e privilégios mínimos.
- CORS e WebSocket devem aceitar somente origens conhecidas em produção.
- Logs não devem conter senhas, cookies, tokens nem conteúdo privado.
- Erros públicos não devem revelar stack traces, consultas ou credenciais.

## Denúncias, bloqueios e retenção
- Denúncias devem ter um canal de contato e processo de análise definidos.
- Bloqueios devem impedir interações conforme a funcionalidade implementada.
- Definir prazos para mensagens, registros e contas, além de processo de exclusão.

## Incidentes
Revogar sessões comprometidas, rotacionar segredos, restringir acessos afetados, corrigir a causa e comunicar pessoas afetadas quando necessário.

## Limitações
Esta política não prova, por si só, que todos os controles estão implementados. A autorização de cada endpoint HTTP e evento WebSocket, o fluxo de denúncias/bloqueios, os prazos de retenção e os testes automatizados precisam ser verificados antes de declarar conformidade total.
