import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, List, ChevronRight, Menu, X, Calendar } from 'lucide-react';
import { articles } from './data/articles';
import type { Article } from './data/articles';
import { figureHtml } from './figures-data';
import { referencesHtml } from './references';
import { sectionIconSvg } from './section-icons';
import { tokenizeInline } from './lib/inline';
import type { InlineToken } from './lib/inline';
import './App.css';

const BASE = '/kofun-guide';
const SITE_NAME = '古墳の入門ガイド';

type GroupKey = Article['group'];
const GROUP_ORDER: { key: GroupKey; icon: string; description: string }[] = [
  { key: '基礎', icon: 'scroll', description: '古墳とは何か、いつどこに造られたか' },
  { key: 'かたちと構造', icon: 'shapes', description: '前方後円墳などの墳形と、石室の作りの移り変わり' },
  { key: '巨大古墳', icon: 'landmark', description: '仁徳天皇陵古墳と、世界三大墳墓の規模くらべ' },
  { key: '訪ねる', icon: 'map', description: '見学できる古墳と立ち入れない陵墓、訪ね方' },
];

function SectionIcon({ name, size = 24 }: { name: string; size?: number }) {
  return <span className="section-icon" dangerouslySetInnerHTML={{ __html: sectionIconSvg(name, size) }} />;
}

function getCurrentPath(): string {
  if (typeof window === 'undefined') return '/';
  const p = window.location.pathname;
  if (p.startsWith(BASE)) return p.slice(BASE.length) || '/';
  return p;
}

function navigateTo(path: string) {
  const full = BASE + (path.startsWith('/') ? path : '/' + path);
  window.history.pushState({}, '', full);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function slugify(_text: string, index: number): string {
  return `section-${index}`;
}

function renderInline(text: string): ReactNode[] {
  return renderTokens(tokenizeInline(text));
}
function renderTokens(tokens: InlineToken[]): ReactNode[] {
  return tokens.map((tok, i) => {
    if (tok.type === 'text') return <span key={i}>{tok.value}</span>;
    if (tok.type === 'bold') return <strong key={i}>{renderTokens(tok.children)}</strong>;
    const href = tok.href;
    const isInternal = href.startsWith(BASE + '/') || href.startsWith('/kofun-guide/');
    if (isInternal) {
      return (
        <a key={i} href={href} onClick={(e) => { e.preventDefault(); navigateTo(href.replace(BASE, '')); }}>
          {renderTokens(tok.children)}
        </a>
      );
    }
    const isExternal = /^https?:\/\//.test(href);
    return (
      <a key={i} href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}>
        {renderTokens(tok.children)}
      </a>
    );
  });
}

function parseContent(content: string): ReactNode[] {
  const lines = content.split('\n');
  const result: ReactNode[] = [];
  let i = 0;
  let key = 0;
  let h2Index = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === '') { i++; continue; }

    if (trimmed.startsWith('## ')) {
      const text = trimmed.slice(3);
      result.push(<h2 key={key++} id={slugify(text, h2Index++)} className="content-h2">{renderInline(text)}</h2>);
      i++; continue;
    }
    if (trimmed.startsWith('### ')) {
      result.push(<h3 key={key++} className="content-h3">{renderInline(trimmed.slice(4))}</h3>);
      i++; continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const rows = tableLines.map(r => r.split('|').slice(1, -1).map(c => c.trim()));
        const isSep = (r: string[]) => r.every(c => /^[-:]+$/.test(c));
        const header = rows[0];
        const data = rows.slice(1).filter(r => !isSep(r));
        result.push(
          <div key={key++} className="content-table-wrap">
            <table className="content-table">
              <thead><tr>{header.map((c, ci) => <th key={ci}>{renderInline(c)}</th>)}</tr></thead>
              <tbody>
                {data.map((row, ri) => (
                  <tr key={ri}>{row.map((c, ci) => <td key={ci}>{renderInline(c)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      result.push(<ol key={key++} className="content-ol">{items.map((it, idx) => <li key={idx}>{renderInline(it)}</li>)}</ol>);
      continue;
    }

    if (trimmed.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      result.push(<ul key={key++} className="content-ul">{items.map((it, idx) => <li key={idx}>{renderInline(it)}</li>)}</ul>);
      continue;
    }

    if (trimmed.startsWith('💡 ')) { result.push(<p key={key++} className="callout callout-tip">{renderInline(trimmed.slice(2).trim())}</p>); i++; continue; }
    if (trimmed.startsWith('⚠️ ')) { result.push(<p key={key++} className="callout callout-warning">{renderInline(trimmed.slice(2).trim())}</p>); i++; continue; }
    if (trimmed.startsWith('📖 ')) { result.push(<p key={key++} className="callout callout-info">{renderInline(trimmed.slice(2).trim())}</p>); i++; continue; }

    const figMatch = trimmed.match(/^\{\{figure:([a-z0-9-]+)\}\}$/);
    if (figMatch) {
      const html = figureHtml(figMatch[1]);
      if (html) result.push(<div key={key++} dangerouslySetInnerHTML={{ __html: html }} />);
      i++; continue;
    }

    result.push(<p key={key++} className="content-p">{renderInline(trimmed)}</p>);
    i++;
  }
  return result;
}

function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[1]}年${parseInt(m[2], 10)}月${parseInt(m[3], 10)}日`;
}

function Header() {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a href={`${BASE}/`} className="site-brand" onClick={(e) => { e.preventDefault(); navigateTo('/'); setNavOpen(false); }}>
          <svg className="brand-logo" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="64" height="64" rx="12" fill="#9b5440" />
            <g transform="translate(32 33)">
              <path d="M0 -22 A14 14 0 1 1 0 6 L-9 22 L9 22 L0 6" fill="none" stroke="#cdbfa3" strokeWidth="3.2" />
              <circle cx="0" cy="-9" r="12" fill="#e7d8bf" />
              <path d="M0 0 L-8 19 L8 19 Z" fill="#e7d8bf" />
              <circle cx="0" cy="-9" r="7.5" fill="none" stroke="#9b5440" strokeWidth="1.4" opacity="0.6" />
            </g>
          </svg>
          <span>{SITE_NAME}</span>
        </a>
        <button className="nav-toggle" aria-label={navOpen ? 'メニューを閉じる' : 'メニューを開く'} onClick={() => setNavOpen(!navOpen)}>
          {navOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={`site-nav ${navOpen ? 'open' : ''}`} aria-label="メインナビゲーション">
          {articles.map((a) => (
            <a key={a.id} href={`${BASE}/${a.id}/`} onClick={(e) => { e.preventDefault(); navigateTo(`/${a.id}/`); setNavOpen(false); }}>
              <span className="nav-emoji"><SectionIcon name={a.icon} size={18} /></span>
              <span>{a.shortTitle}</span>
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Home() {
  useEffect(() => { document.title = `${SITE_NAME}｜前方後円墳の形・石室の構造・仁徳天皇陵`; window.scrollTo(0, 0); }, []);
  return (
    <>
      <div className="hero">
        <div className="hero-mark" aria-hidden="true">
          <SectionIcon name="landmark" size={40} />
        </div>
        <h1>{SITE_NAME}</h1>
        <p>
          古墳は、土を盛って築かれた古代の墓である。前方後円墳をはじめとする形、石室の構造、古墳時代の流れ、仁徳天皇陵古墳、世界三大墳墓の規模くらべまでを、図解と公的な出典で確かめながらまとめている。
        </p>
      </div>

      {GROUP_ORDER.map((group) => {
        const groupArticles = articles.filter((a) => a.group === group.key);
        if (groupArticles.length === 0) return null;
        return (
          <div key={group.key} className="section-group">
            <div className="section-group-head">
              <h2 className="section-group-label">
                <span className="section-group-emoji" aria-hidden="true"><SectionIcon name={group.icon} size={20} /></span>
                {group.key}
              </h2>
              <p className="section-group-desc">{group.description}</p>
            </div>
            <div className="section-grid">
              {groupArticles.map((a) => (
                <a key={a.id} href={`${BASE}/${a.id}/`} className="section-card" onClick={(e) => { e.preventDefault(); navigateTo(`/${a.id}/`); }}>
                  <div className="section-card-emoji" aria-hidden="true"><SectionIcon name={a.icon} size={26} /></div>
                  <h3 className="section-card-title">{a.shortTitle}</h3>
                  <p className="section-card-desc">{a.description}</p>
                  <span className="section-card-cta">読む →</span>
                </a>
              ))}
            </div>
          </div>
        );
      })}

      <div className="home-trust">
        <h2>このサイトの方針</h2>
        <ul>
          <li><strong>公的な出典で確かめる</strong>：文化庁や堺市、宮内庁、長野県埋蔵文化財センターなどの公開情報をもとにしています。</li>
          <li><strong>本文は自分の言葉で</strong>：出典は事実確認のために参照し、文章は運営者が独自にまとめています。</li>
          <li><strong>未確定は断定しない</strong>：被葬者が確定していない陵墓は両論併記で扱い、数値は調査年と出典を添えます。</li>
        </ul>
      </div>
    </>
  );
}

function TOC({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <nav className="toc">
      <div className="toc-title"><List size={16} /> 目次</div>
      <ol className="toc-list">
        {items.map((it, idx) => <li key={it}><a href={`#${slugify(it, idx)}`}>{it}</a></li>)}
      </ol>
    </nav>
  );
}

function Breadcrumb({ currentTitle }: { currentTitle: string }) {
  return (
    <nav className="breadcrumb" aria-label="パンくずリスト">
      <a href={`${BASE}/`} onClick={(e) => { e.preventDefault(); navigateTo('/'); }}>{SITE_NAME}</a>
      <ChevronRight size={14} className="breadcrumb-sep" aria-hidden="true" />
      <span className="breadcrumb-current">{currentTitle}</span>
    </nav>
  );
}

function ChapterNav({ currentId }: { currentId: string }) {
  const idx = articles.findIndex((a) => a.id === currentId);
  if (idx === -1) return null;
  const prev = idx > 0 ? articles[idx - 1] : null;
  const next = idx < articles.length - 1 ? articles[idx + 1] : null;
  if (!prev && !next) return null;
  return (
    <nav className="chapter-nav" aria-label="記事ナビゲーション">
      {prev ? (
        <a href={`${BASE}/${prev.id}/`} className="chapter-nav-link chapter-nav-prev" onClick={(e) => { e.preventDefault(); navigateTo(`/${prev.id}/`); }}>
          <span className="chapter-nav-label"><ArrowLeft size={14} aria-hidden="true" /> 前の記事</span>
          <span className="chapter-nav-title"><SectionIcon name={prev.icon} size={16} /> {prev.shortTitle}</span>
        </a>
      ) : <span className="chapter-nav-spacer" />}
      {next ? (
        <a href={`${BASE}/${next.id}/`} className="chapter-nav-link chapter-nav-next" onClick={(e) => { e.preventDefault(); navigateTo(`/${next.id}/`); }}>
          <span className="chapter-nav-label">次の記事 <ChevronRight size={14} aria-hidden="true" /></span>
          <span className="chapter-nav-title"><SectionIcon name={next.icon} size={16} /> {next.shortTitle}</span>
        </a>
      ) : <span className="chapter-nav-spacer" />}
    </nav>
  );
}

function RelatedSections({ currentId }: { currentId: string }) {
  const related = articles.filter((a) => a.id !== currentId);
  return (
    <aside className="related-sections" aria-label="ほかの記事">
      <h2>ほかの記事も読む</h2>
      <div className="related-grid">
        {related.map((a) => (
          <a key={a.id} href={`${BASE}/${a.id}/`} className="related-card" onClick={(e) => { e.preventDefault(); navigateTo(`/${a.id}/`); }}>
            <span className="related-emoji" aria-hidden="true"><SectionIcon name={a.icon} size={20} /></span>
            <span className="related-title">{a.shortTitle}</span>
          </a>
        ))}
      </div>
    </aside>
  );
}

function ArticlePage({ article }: { article: Article }) {
  useEffect(() => {
    document.title = `${article.title} | ${SITE_NAME}`;
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      requestAnimationFrame(() => {
        const el = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
        else window.scrollTo(0, 0);
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [article.id, article.title]);

  return (
    <>
      <Breadcrumb currentTitle={article.shortTitle} />
      <article className="section-page">
        <header className="article-header">
          <div className="article-emoji" aria-hidden="true"><SectionIcon name={article.icon} size={32} /></div>
          <h1>{article.title}</h1>
          <div className="article-meta">
            <span className="article-meta-item"><Calendar size={14} /> 最終更新: {formatDate(article.updatedAt)}</span>
          </div>
        </header>
        {article.lead && <p className="lead">{renderInline(article.lead)}</p>}
        <TOC items={article.toc} />
        <div className="section-content">{parseContent(article.content)}</div>
        {article.references && article.references.length > 0 && (
          <div dangerouslySetInnerHTML={{ __html: referencesHtml(article.references) }} />
        )}
        <ChapterNav currentId={article.id} />
        <RelatedSections currentId={article.id} />
        <div className="section-footer">
          <a href={`${BASE}/`} className="back-link" onClick={(e) => { e.preventDefault(); navigateTo('/'); }}>
            <ArrowLeft size={16} /> トップへ戻る
          </a>
        </div>
      </article>
    </>
  );
}

const ABOUT_CONTENT = `本サイト「${SITE_NAME}」は、古墳をはじめて学ぶ人が、墳形や石室の構造、古墳時代の流れ、仁徳天皇陵古墳や世界三大墳墓の規模までをひととおり確かめられるようにまとめたものである。

## 編集と制作の方針

本サイトの内容は、文化庁や堺市、宮内庁、長野県埋蔵文化財センターなどの公開情報を参照し、事実を確認したうえで、運営者が自分の言葉で書いている。出典の文章をそのまま転載することはない。古墳の数などの数値は調査年によって変わるため、年次と出典を添えて示している。

## 陵墓と被葬者の扱い

古墳のなかには、宮内庁が皇室の祖先の墓として治定し管理する陵墓がある。葬られた人物が考古学的には確定していないものも多く、本サイトでは治定と考古学の見方を中立に両論併記し、被葬者を断定しない。立ち入れない陵墓と、見学できる古墳の違いも正確に示すよう努めている。

## お問い合わせ

ご質問や誤りのご指摘は[こちらのGoogleフォーム](https://forms.gle/ccMv7oKwz6ysDHBe6)からお願いします。`;

const PRIVACY_CONTENT = `## アクセス解析

本サイトでは、サイトの利用状況を把握するために Google Analytics を使用しています。Google Analytics はクッキーを利用して匿名のトラフィックデータを収集します。収集される情報は匿名で、個人を特定するものではありません。

## 広告について

本サイトでは Google AdSense などの第三者配信の広告サービスを利用することがあります。広告配信事業者は、ユーザーの興味に応じた広告を表示するためにクッキーを使用することがあります。Cookie を無効にする設定や、Google の広告設定により、パーソナライズ広告を無効にできます。

## 免責事項

本サイトの情報は可能な限り正確を期していますが、その完全性や正確性を保証するものではありません。古墳の年代や被葬者には諸説や未確定のものがあり、数値は調査年で変わります。本サイトの情報を利用したことにより生じた損害について、運営者は一切の責任を負いません。`;

function About() {
  useEffect(() => { document.title = `サイトについて | ${SITE_NAME}`; window.scrollTo(0, 0); }, []);
  return (
    <>
      <Breadcrumb currentTitle="サイトについて" />
      <article className="section-page">
        <h1>サイトについて</h1>
        <div className="section-content">{parseContent(ABOUT_CONTENT)}</div>
      </article>
    </>
  );
}

function Privacy() {
  useEffect(() => { document.title = `プライバシーポリシー | ${SITE_NAME}`; window.scrollTo(0, 0); }, []);
  return (
    <>
      <Breadcrumb currentTitle="プライバシーポリシー" />
      <article className="section-page">
        <h1>プライバシーポリシー</h1>
        <div className="section-content">{parseContent(PRIVACY_CONTENT)}</div>
      </article>
    </>
  );
}

function NotFound() {
  useEffect(() => { document.title = `ページが見つかりません | ${SITE_NAME}`; }, []);
  return (
    <div className="section-page">
      <h1>ページが見つかりません</h1>
      <p>お探しのページは存在しないか、移動した可能性があります。</p>
      <a href={`${BASE}/`} onClick={(e) => { e.preventDefault(); navigateTo('/'); }}>トップへ戻る</a>
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-links">
        <a href={`${BASE}/about/`} onClick={(e) => { e.preventDefault(); navigateTo('/about/'); }}>サイトについて</a>
        <a href={`${BASE}/privacy/`} onClick={(e) => { e.preventDefault(); navigateTo('/privacy/'); }}>プライバシーポリシー</a>
        <a href="https://study-apps.com/editorial-policy/">編集方針</a>
        <a href="https://study-apps.com/">study-apps.com</a>
      </div>
      <div className="site-footer-note">
        本サイトは古墳に関する一般的な情報を、公的な出典をもとに自分の言葉でまとめたものです。年代や被葬者には諸説や未確定のものがあり、数値は調査年で変わります。
      </div>
    </footer>
  );
}

export default function App() {
  const [path, setPath] = useState<string>(getCurrentPath());

  useEffect(() => {
    const handler = () => setPath(getCurrentPath());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const normalized = path.replace(/\/$/, '') || '/';

  let content: ReactNode;
  if (normalized === '/' || normalized === '') {
    content = <Home />;
  } else if (normalized === '/about') {
    content = <About />;
  } else if (normalized === '/privacy') {
    content = <Privacy />;
  } else {
    const id = normalized.replace(/^\//, '');
    const article = articles.find((a) => a.id === id);
    content = article ? <ArticlePage article={article} /> : <NotFound />;
  }

  return (
    <>
      <a href="#main-content" className="skip-link">メインコンテンツへスキップ</a>
      <Header />
      <main id="main-content" className="site-shell" tabIndex={-1}>{content}</main>
      <Footer />
    </>
  );
}
