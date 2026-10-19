/* Aviso de medicao do site thiagoluz.com.br -- 19/10/2026.
   Texto: app-protocolos/docs/aviso-cookies-site.md (Escritorio). Nao redigir aqui.

   O que este arquivo garante:
   - Google Analytics, Pixel da Meta e a janela de avaliacoes da Teravy so'
     carregam depois do clique em "Aceitar". Antes da escolha, nada sai.
   - "Recusar" guarda a recusa e nao carrega nada.
   - A escolha fica so' no navegador (localStorage), nunca no servidor.
   - Qualquer elemento [data-cc-abrir] (o link "Mudar minha escolha" do
     rodape) reabre o aviso.
   - Pagina com data-medir="nao" na tag deste script nunca carrega nada e
     nunca abre o aviso sozinha; o link do rodape ainda deixa mudar a escolha,
     que vale para as outras paginas.

   Uso:  <script src="/consentimento.js" defer></script>
         data-tema="preto"  -> paginas da ESTRUTURA (black premium)
         data-medir="nao"   -> Terapia sob Medida, Hipnoterapia e Constelacao
   Sem dependencia externa. */
(function () {
  "use strict";

  var GA_ID = "G-3C6Z7XHLK9";
  var PIXEL_ID = "1267024997190625";
  var CHAVE = "tl-consentimento";

  var FRASE = "Google e Meta recebem dados da sua visita, medem o site e ajudam nossos anúncios a chegar a quem se interessa. Aceitar nos ajuda a acertar.";
  var POLITICA = "/privacidade/#o-site";

  var eu = document.currentScript;
  var tema = (eu && eu.getAttribute("data-tema")) || "";
  var medir = !(eu && eu.getAttribute("data-medir") === "nao");

  /* ---------- escolha guardada ---------- */
  var naMemoria = null; // se o localStorage falhar, vale para esta pagina
  function lerEscolha() {
    try {
      var v = window.localStorage.getItem(CHAVE);
      if (v) {
        var o = JSON.parse(v);
        if (o && (o.escolha === "aceito" || o.escolha === "recusado")) return o.escolha;
      }
    } catch (e) { /* navegador sem storage: cai na memoria */ }
    return naMemoria;
  }
  function gravarEscolha(escolha) {
    naMemoria = escolha;
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify({ escolha: escolha, v: 1 }));
    } catch (e) { /* segue so' na memoria */ }
  }

  /* ---------- o que so' carrega com aceite ---------- */
  var carregado = false;
  function carregarTudo() {
    if (carregado || !medir) return;
    carregado = true;

    // Google Analytics
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(g);

    // Pixel da Meta (o trecho oficial, sem a imagem de reserva <noscript>)
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0";
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", PIXEL_ID);
    window.fbq("track", "PageView");

    // Janelas de terceiro que esperam o aceite: <iframe data-cc-src="...">
    var quadros = document.querySelectorAll("iframe[data-cc-src]");
    for (var i = 0; i < quadros.length; i++) {
      quadros[i].src = quadros[i].getAttribute("data-cc-src");
      quadros[i].removeAttribute("data-cc-src");
    }
    var blocos = document.querySelectorAll("[data-cc-mostrar]");
    for (var j = 0; j < blocos.length; j++) blocos[j].hidden = false;
  }

  // Quem aceitou e depois recusou: apaga os cookies que Google e Meta
  // gravaram neste dominio e recarrega, para nao sobrar script rodando.
  function apagarCookiesDeMedicao() {
    var nomes = document.cookie.split(";").map(function (c) {
      return c.split("=")[0].trim();
    }).filter(function (n) { return /^(_ga|_gid|_gat|_fbp|_fbc)/.test(n); });
    var partes = location.hostname.split(".");
    var dominios = [""];
    for (var i = 0; i < partes.length - 1; i++) {
      dominios.push("; domain=" + partes.slice(i).join("."));
      dominios.push("; domain=." + partes.slice(i).join("."));
    }
    nomes.forEach(function (n) {
      dominios.forEach(function (d) {
        document.cookie = n + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + d;
      });
    });
  }

  /* ---------- o aviso ---------- */
  var CSS =
    ".cc-aviso{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;" +
    "background:#0C1F3D;color:#F7F5EF;border-top:1px solid rgba(247,245,239,.18);" +
    "box-shadow:0 -6px 24px rgba(0,0,0,.28);font-family:inherit;" +
    "padding:.875rem 1rem calc(.875rem + env(safe-area-inset-bottom,0px))}" +
    ".cc-aviso[hidden]{display:none}" +
    ".cc-dentro{max-width:60rem;margin:0 auto;display:flex;flex-direction:column;gap:.75rem}" +
    ".cc-texto p{margin:0;font-size:.875rem;line-height:1.5;color:#F7F5EF}" +
    ".cc-texto a{display:inline-block;margin-top:.25rem;font-size:.8125rem;line-height:1.5;" +
    "color:#F7F5EF;text-decoration:underline;text-underline-offset:3px}" +
    ".cc-botoes{display:flex;gap:.625rem}" +
    ".cc-botoes button{flex:1 1 0;min-width:0;min-height:44px;padding:.625rem 1rem;" +
    "font:inherit;font-size:.9375rem;font-weight:700;line-height:1.2;border-radius:4px;" +
    "cursor:pointer;border:2px solid #D0B96C}" +
    ".cc-aceitar{background:#D0B96C;color:#0C1F3D}" +
    ".cc-aceitar:hover{background:#DCC888;border-color:#DCC888}" +
    ".cc-recusar{background:transparent;color:#F7F5EF}" +
    ".cc-recusar:hover{background:rgba(247,245,239,.08)}" +
    ".cc-aviso a:focus-visible,.cc-botoes button:focus-visible{outline:3px solid #F7F5EF;outline-offset:2px}" +
    /* black premium, nas paginas da ESTRUTURA */
    ".cc-aviso.cc-preto{background:#000;color:#FFF;border-top-color:rgba(158,164,170,.28)}" +
    ".cc-preto .cc-texto p,.cc-preto .cc-texto a,.cc-preto .cc-recusar{color:#FFF}" +
    ".cc-preto .cc-botoes button{border-color:#B99B5F}" +
    ".cc-preto .cc-aceitar{background:#B99B5F;color:#000}" +
    ".cc-preto .cc-aceitar:hover{background:#C9AE78;border-color:#C9AE78}" +
    "@media (min-width:44rem){.cc-dentro{flex-direction:row;align-items:center;gap:1.5rem}" +
    ".cc-texto{flex:1}.cc-botoes button{flex:0 0 8.5rem}}" +
    /* links do rodape: herdam a cor de cada rodape */
    ".cc-rodape{margin:.5rem 0 0;font-size:.8125rem;line-height:1.7}" +
    ".cc-rodape a,.cc-rodape button{display:inline-block;padding:.25rem 0;color:inherit;" +
    "font:inherit;background:none;border:0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}" +
    ".cc-rodape a:focus-visible,.cc-rodape button:focus-visible{outline:2px solid currentColor;outline-offset:2px}";

  var aviso, quemAbriu = null, padOriginal = null;

  function montar() {
    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);

    aviso = document.createElement("section");
    aviso.className = "cc-aviso" + (tema === "preto" ? " cc-preto" : "");
    aviso.setAttribute("role", "region");
    aviso.setAttribute("aria-label", "Aviso de privacidade");
    aviso.hidden = true;

    var dentro = document.createElement("div");
    dentro.className = "cc-dentro";

    var texto = document.createElement("div");
    texto.className = "cc-texto";
    var p = document.createElement("p");
    p.textContent = FRASE;
    var a = document.createElement("a");
    a.href = POLITICA;
    a.textContent = "Política de privacidade";
    texto.appendChild(p);
    texto.appendChild(a);

    var botoes = document.createElement("div");
    botoes.className = "cc-botoes";
    var sim = document.createElement("button");
    sim.type = "button"; sim.className = "cc-aceitar"; sim.textContent = "Aceitar";
    var nao = document.createElement("button");
    nao.type = "button"; nao.className = "cc-recusar"; nao.textContent = "Recusar";
    botoes.appendChild(sim);
    botoes.appendChild(nao);

    dentro.appendChild(texto);
    dentro.appendChild(botoes);
    aviso.appendChild(dentro);
    // Primeiro no DOM: quem navega pelo teclado chega nele antes do resto.
    document.body.insertBefore(aviso, document.body.firstChild);

    sim.addEventListener("click", function () { escolher("aceito"); });
    nao.addEventListener("click", function () { escolher("recusado"); });
    aviso.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && lerEscolha()) fechar();
    });
    window.addEventListener("resize", ajustarEspaco);
  }

  // O aviso nao cobre o fim da pagina: o corpo ganha folga do tamanho dele.
  function ajustarEspaco() {
    if (!aviso || aviso.hidden) return;
    if (padOriginal === null) {
      padOriginal = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
    }
    document.body.style.paddingBottom = (padOriginal + aviso.offsetHeight) + "px";
  }

  function abrir(focar) {
    aviso.hidden = false;
    ajustarEspaco();
    if (focar) aviso.querySelector(".cc-aceitar").focus();
  }

  function fechar() {
    aviso.hidden = true;
    document.body.style.paddingBottom = "";
    if (quemAbriu) { quemAbriu.focus(); quemAbriu = null; }
  }

  function escolher(escolha) {
    var antes = lerEscolha();
    gravarEscolha(escolha);
    fechar();
    if (escolha === "aceito") {
      carregarTudo();
    } else if (antes === "aceito" || carregado) {
      apagarCookiesDeMedicao();
      if (carregado) location.reload();
    }
  }

  function iniciar() {
    montar();

    document.addEventListener("click", function (ev) {
      var alvo = ev.target.closest ? ev.target.closest("[data-cc-abrir]") : null;
      if (!alvo) return;
      ev.preventDefault();
      quemAbriu = alvo;
      abrir(true);
    });

    var escolha = lerEscolha();
    if (escolha === "aceito") carregarTudo();
    else if (!escolha && medir) abrir(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
