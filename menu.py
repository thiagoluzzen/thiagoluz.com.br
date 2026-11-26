#!/usr/bin/env python3
"""Menu do topo de thiagoluz.com.br — a fonte unica (26/11/2026).

Regra dele: pagina nova ou mudada entra no menu de TODAS, sempre.
A lista PAGINAS abaixo e' o unico lugar onde o menu se escreve; as paginas
e o esqueleto do blog (no app) sao gerados a partir dela.

  python3 menu.py              reescreve o menu em todas as paginas (e no blog, se achar o app)
  python3 menu.py --conferir   so confere; sai 1 se alguma pagina estiver fora da lista
                               (o gancho pre-commit do site roda este modo)
  --blog CAMINHO               confere/reescreve tambem o esqueleto do blog do app
                               (app/templates/blog_publico/esqueleto.html). O teste
                               testes/test_blog_menu_igual_ao_site.py do app chama assim,
                               entao app com menu diferente do site nao se publica.

Quem entra: toda pasta com index.html, menos a pagina inicial (abre na foto,
pedido dele) e as paginas que so redirecionam (meta refresh).
Pagina nova: crie a pasta, ponha-a em PAGINAS (se for para aparecer como link)
e rode `python3 menu.py`. Pagina que nao e' link (privacidade, termos) ganha o
menu do mesmo jeito, sem item marcado.
"""
import pathlib
import re
import sys

# (endereco, texto do link) — nesta ordem no menu.
PAGINAS = [
    ("/rota/", "Mentoria ROTA"),
    ("/terapia-sob-medida/", "Terapia sob Medida"),
    ("/grupo-de-constelacao/", "Constelação"),
    ("/grupo-de-estudos/", "Estudos"),
    ("/blog", "Blog"),
]

# Paginas que levam o menu mas NAO viram link nele. Pagina nova que nao esteja
# em PAGINAS nem aqui reprova o --conferir: decidir onde ela fica e' obrigatorio.
FORA_DO_MENU = ["/privacidade/", "/termos/"]

RAIZ = pathlib.Path(__file__).resolve().parent
# Pagina do site e' estatica: o link da propria pagina leva aria-current="page".
# No blog, o «Blog» e' marcado pelo Jinja (page na lista, true num texto).
BLOG_MARCA = "{{ 'page' if na_lista else 'true' }}"

BLOCO = re.compile(r'<header class="menu-topo">.*?</header>', re.S)
TOPO_ANTIGO = re.compile(r'<header class="topo">.*?</header>', re.S)


def menu(atual=None, blog=False):
    itens = []
    for href, texto in PAGINAS:
        marca = ""
        if blog and href == "/blog":
            marca = f' aria-current="{BLOG_MARCA}"'
        elif href == atual:
            marca = ' aria-current="page"'
        itens.append(f'<a href="{href}"{marca}>{texto}</a>')
    return (
        '<header class="menu-topo">\n'
        '  <div class="menu-topo-dentro">\n'
        '    <a class="menu-marca" href="/">Thiago Luz<span class="menu-marca-titulo">'
        'Terapeuta Mentor de Famílias e Casais</span></a>\n'
        f'    <nav aria-label="Páginas do site">{"".join(itens)}</nav>\n'
        '  </div>\n'
        '</header>'
    )


def paginas_do_site():
    for f in sorted(RAIZ.glob("*/index.html")):
        s = f.read_text(encoding="utf-8")
        if 'http-equiv="refresh"' in s:
            continue
        yield f, f"/{f.parent.name}/", s


def esperado_site(s, atual):
    novo, n = BLOCO.subn(menu(atual), s, count=1)
    if n == 0:
        novo, n = TOPO_ANTIGO.subn(menu(atual), s, count=1)
    if n == 0:
        return None
    if 'href="/menu.css"' not in novo:
        if '<link rel="stylesheet" href="/estilo.css">' in novo:
            novo = novo.replace('<link rel="stylesheet" href="/estilo.css">',
                                '<link rel="stylesheet" href="/estilo.css">\n<link rel="stylesheet" href="/menu.css">', 1)
        else:
            novo = novo.replace("</head>", '<link rel="stylesheet" href="/menu.css">\n</head>', 1)
    return novo


def main():
    conferir = "--conferir" in sys.argv
    erros, mudou = [], []

    for f, atual, s in paginas_do_site():
        novo = esperado_site(s, atual)
        nome = f.relative_to(RAIZ)
        if novo is None:
            erros.append(f"{nome}: sem <header class=\"menu-topo\"> nem topo antigo para trocar")
        elif novo != s:
            (erros if conferir else mudou).append(f"{nome}: menu fora da lista")
            if not conferir:
                f.write_text(novo, encoding="utf-8")

    no_menu = {h for h, _ in PAGINAS} | set(FORA_DO_MENU)
    for f, atual, _ in paginas_do_site():
        if atual not in no_menu:
            erros.append(f"{f.relative_to(RAIZ)}: pagina nova fora do menu; ponha {atual} em PAGINAS ou em FORA_DO_MENU")

    inicial = (RAIZ / "index.html").read_text(encoding="utf-8")
    if 'class="menu-topo"' in inicial:
        erros.append("index.html: a pagina inicial nao leva menu (abre na foto)")

    for href, _ in PAGINAS:
        if href != "/blog" and not (RAIZ / href.strip("/") / "index.html").exists():
            erros.append(f"PAGINAS: {href} nao existe no site")

    blog = None
    if "--blog" in sys.argv:
        blog = pathlib.Path(sys.argv[sys.argv.index("--blog") + 1])
        if not blog.exists():
            erros.append(f"--blog {blog}: arquivo nao existe")
            blog = None
    if blog:
        s = blog.read_text(encoding="utf-8")
        novo, n = BLOCO.subn(menu(blog=True), s, count=1)
        if n == 0:
            erros.append(f"{blog}: sem <header class=\"menu-topo\">")
        elif novo != s:
            if conferir:
                erros.append(f"blog ({blog}): menu fora da lista")
            else:
                blog.write_text(novo, encoding="utf-8")
                mudou.append(f"{blog}: menu atualizado — commit e publicacao do app ficam por fazer")
    elif "--blog" not in sys.argv:
        print("aviso: blog nao conferido (passe --blog <app>/app/templates/blog_publico/esqueleto.html)", file=sys.stderr)

    for m in mudou:
        print("mudou:", m)
    for e in erros:
        print("ERRO:", e, file=sys.stderr)
    if erros:
        if conferir:
            print("\nconserto: python3 menu.py (reescreve o menu em todas a partir de PAGINAS)", file=sys.stderr)
        return 1
    print("ok: menu igual em todas" + ("" if mudou or conferir else " (nada mudou)"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
