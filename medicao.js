/* Evento de clique de saida (GA clique_cta e Pixel), extraido em 31/10/2026 do script
   que ficava embutido na pagina inicial, sem mudar a logica. So' faz algo se o GA ou o
   Pixel ja' estiverem carregados, e eles so' carregam depois do "Aceitar"
   (/consentimento.js). Paginas sem medicao (terapia, constelacao) nao carregam este arquivo. */
(function () {
  "use strict";
  /* Marca o clique de saida. O canal sai do HREF, nunca do papel visual:
     em 28/08/2026 um script daqui mirava "a.cta" -- a classe do botao
     preenchido -- e a inversao dos canais o fez reescrever o botao errado.
     Papel visual muda por decisao de conversao; canal nao muda.

     O ouvinte e' delegado no documento, entao le o href NO MOMENTO do clique.
     Isso importa na consulta-inicial, onde outro script reescreve o link do
     WhatsApp com o codigo do anuncio depois que a pagina carrega. */
  function canalDe(href) {
    if (!href) { return "vazio"; }
    if (href.indexOf("wa.me/") > -1) { return "whatsapp"; }
    if (href.indexOf("chat.whatsapp.com") > -1) { return "grupo-whatsapp"; }
    if (href.indexOf("/agendar/") > -1) { return "checkout"; }
    if (href.indexOf("thiagoluz.com.br") > -1) { return "interno"; }
    if (href.indexOf("mailto:") === 0) { return "email"; }
    return "externo";
  }
  /* O pathname nem sempre e' um caminho: num preview local a pagina roda como
     data: URL e o pathname vira o documento inteiro. Sem trava, isso ia para a
     medicao como nome de produto -- lixo que nao da erro, so suja o relatorio.
     Achado testando antes de publicar, em 31/08/2026. */
  var produto = window.location.pathname.replace(/^\/|\/$/g, "") || "hub";
  if (produto.length > 40 || !/^[A-Za-z0-9/_-]*$/.test(produto)) {
    produto = "fora-do-padrao";
  }
  document.addEventListener("click", function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!a) { return; }
    var href = a.getAttribute("href") || "";
    if (href.charAt(0) === "#") { return; }
    var canal = canalDe(href);
    var posicao = a.getAttribute("data-cta") || "cartao";

    /* Cada medidor e' avisado por conta propria. Ate 31/08/2026 havia um
       `if (typeof gtag !== "function") return;` aqui em cima: com ele, o
       Analytics bloqueado -- adblock, rede lenta, consentimento -- levaria o
       Pixel junto, calado. Um medidor que cai nao pode derrubar o outro. */
    if (typeof window.gtag === "function") {
      window.gtag("event", "clique_cta", {
        canal: canal,
        posicao: posicao,
        produto: produto,
        destino: href.slice(0, 120)
      });
    }

    /* No Pixel o nome do evento nao e' livre: a Meta so' otimiza campanha
       sobre os eventos que ela conhece. `Schedule` e' o de marcar horario --
       que e' o que o checkout faz -- e `Contact` e' o de iniciar conversa.
       Link interno NAO vira evento: navegar dentro do site nao e' conversao,
       e contar como se fosse ensinaria o anuncio a buscar quem so' passeia. */
    if (typeof window.fbq === "function") {
      var evento = null;
      if (canal === "checkout") { evento = "Schedule"; }
      else if (canal === "whatsapp" || canal === "grupo-whatsapp") { evento = "Contact"; }
      if (evento) {
        window.fbq("track", evento, { content_name: produto, content_category: posicao });
      }
    }
  }, true);
})();
