# ScreenCord — Vercel

Esta versão é para publicar como site na Vercel.

## Publicação

1. Suba esta pasta para um repositório GitHub.
2. Na Vercel, clique em **Add New → Project**.
3. Importe o repositório.
4. Framework Preset: **Other**.
5. Não precisa de Build Command.
6. Clique em **Deploy**.

A Vercel fornece HTTPS automaticamente.

## Como a transmissão funciona

A página usa WebRTC com PeerJS para conectar o transmissor diretamente ao espectador. A Vercel hospeda a interface; a mídia não é gravada pela Vercel.

A captura de tela usa `getDisplayMedia` com `audio: false`, portanto o site não solicita nem transmite áudio do sistema/Discord.

## Importante

O código da sala é usado como identificador do transmissor. Para um site público grande, o ideal é adicionar autenticação e um serviço de sinalização próprio/gerenciado, além de TURN para redes restritivas.
