import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Archive,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  GripVertical,
  Moon,
  PanelRightOpen,
  PenLine,
  Plus,
  Save,
  Search,
  Sparkles,
  Sun,
  UserRound,
  X,
} from 'lucide-react';
import './style.css';

const seed = {
  title: '无题长篇',
  author: '亲爸爸',
  dark: true,
  dailyGoal: 2000,
  chapters: [
    {
      id: 'c1',
      title: '第一章 雨停之前',
      text:
        '凌晨两点，他删掉聊天框，又点开下一个。\n\n动作熟练得像超市收银员找零。\n\n头像一张张划过去，名字有些熟，有些已经想不起什么时候加的。聊天记录里散落着几句天气、几张表情包、一些没有下文的晚安。\n\n他忽然发现，自己已经很久没有认真认识一个人了。\n\n认识太慢。\n\n发一句话，等一句回复，再等下一句。中间隔着工作、睡觉、吃饭，隔着对方有没有兴趣，隔着不知道什么时候会熄灭的热情。\n\n还是新的人快。\n\n头像亮起来的时候，心口会轻轻动一下，像有人拿手指弹了一下玻璃杯。',
    },
    {
      id: 'c2',
      title: '第二章 货架',
      text: '手机黑下去以后，屋子里安静得像停电。\n\n他躺在床上，手指还保持着滑动的姿势。\n\n窗外有人骑车经过，链条响了几声，又远了。',
    },
  ],
  notes: [
    {
      id: 'n1',
      text: '雨落在广告牌上的声音像旧电视。',
      chapterId: 'c1',
      ts: Date.now(),
    },
  ],
  chars: [
    { id: 'p1', name: '林川', desc: '28岁。习惯用玩笑遮住不安。最近一次出场：第一章。' },
    { id: 'p2', name: '周弥', desc: '说话很轻，喜欢在别人沉默时看窗外。' },
  ],
  history: [],
};

const uid = () => Math.random().toString(36).slice(2, 9);
const countWords = (value = '') => value.replace(/\s/g, '').length;
const storageKey = 'inkboat.v1';

function loadDoc() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || seed;
  } catch {
    return seed;
  }
}

function saveDoc(doc) {
  localStorage.setItem(storageKey, JSON.stringify(doc));
}

function analyze(text = '') {
  const items = [];
  const watchWords = ['沉默', '忽然', '其实', '真正', '感觉', '像', '不是', '而是'];

  watchWords.forEach((word) => {
    const hit = (text.match(new RegExp(word, 'g')) || []).length;
    if (hit >= 3) {
      items.push({
        type: '重复词',
        msg: `“${word}”出现 ${hit} 次。可以保留最有力的一处，其余尽量换成动作或画面。`,
      });
    }
  });

  const notBut = (text.match(/不是[\s\S]{0,18}而是/g) || []).length;
  if (notBut > 0) {
    items.push({
      type: 'AI味',
      msg: `检测到 ${notBut} 处“不是……而是……”。小说里建议改成动作、场景或物件，不要让作者站出来总结。`,
    });
  }

  const paragraphs = text.split(/\n+/).map((item) => item.trim()).filter(Boolean);
  const shortParagraphs = paragraphs.filter((item) => countWords(item) <= 8).length;
  if (shortParagraphs >= 5) {
    items.push({
      type: '节奏',
      msg: '短段落偏多，适合内心独白；如果整章都这样，读起来会更像散文。',
    });
  }

  if (!items.length) {
    items.push({ type: '状态', msg: '暂时没有明显 AI 腔或高频重复。继续写，别过早打磨。' });
  }

  return items;
}

function App() {
  const [doc, setDoc] = useState(loadDoc);
  const [idx, setIdx] = useState(0);
  const [panel, setPanel] = useState('chapters');
  const [focus, setFocus] = useState(true);
  const [query, setQuery] = useState('');
  const [zen, setZen] = useState(false);
  const editorRef = useRef(null);

  const chapter = doc.chapters[idx] || doc.chapters[0];
  const totalWords = countWords(doc.chapters.map((item) => item.text).join(''));
  const chapterWords = countWords(chapter?.text || '');
  const progress = Math.min(100, Math.round((chapterWords / doc.dailyGoal) * 100));
  const tips = useMemo(() => analyze(chapter?.text || ''), [chapter?.text]);

  useEffect(() => saveDoc(doc), [doc]);
  useEffect(() => {
    document.documentElement.dataset.theme = doc.dark ? 'dark' : 'light';
  }, [doc.dark]);

  function updateChapter(patch) {
    setDoc((current) => ({
      ...current,
      chapters: current.chapters.map((item) => (item.id === chapter.id ? { ...item, ...patch } : item)),
    }));
  }

  function addChapter() {
    const next = { id: uid(), title: `第${doc.chapters.length + 1}章`, text: '' };
    setDoc((current) => ({ ...current, chapters: [...current.chapters, next] }));
    setIdx(doc.chapters.length);
  }

  function snapshot() {
    setDoc((current) => ({
      ...current,
      history: [
        { id: uid(), ts: Date.now(), title: chapter.title, text: chapter.text },
        ...current.history,
      ].slice(0, 20),
    }));
  }

  function addNote() {
    const selected = editorRef.current?.value
      ?.slice(editorRef.current.selectionStart, editorRef.current.selectionEnd)
      ?.trim();
    const text = selected || prompt('灵感内容');
    if (!text) return;
    setDoc((current) => ({
      ...current,
      notes: [{ id: uid(), text, chapterId: chapter.id, ts: Date.now() }, ...current.notes],
    }));
  }

  function addChar() {
    const name = prompt('人物名');
    if (!name) return;
    setDoc((current) => ({ ...current, chars: [...current.chars, { id: uid(), name, desc: '待补充' }] }));
  }

  function exportMarkdown() {
    const body = `# ${doc.title}\n\n作者：${doc.author}\n\n` +
      doc.chapters.map((item) => `## ${item.title}\n\n${item.text}`).join('\n\n');
    const blob = new Blob([body], { type: 'text/markdown;charset=utf-8' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${doc.title || 'inkboat'}.md`;
    anchor.click();
  }

  const results = query
    ? doc.chapters.flatMap((item, index) =>
        item.text.includes(query) || item.title.includes(query) ? [{ ...item, index }] : [],
      )
    : [];

  return (
    <div className={zen ? 'app zen' : 'app'}>
      <aside className="phone-frame">
        <header className="topbar">
          <button type="button" onClick={() => setPanel(panel ? '' : 'chapters')} aria-label="切换面板">
            <PanelRightOpen size={18} />
          </button>
          <input value={doc.title} onChange={(event) => setDoc({ ...doc, title: event.target.value })} />
          <button type="button" onClick={() => setDoc({ ...doc, dark: !doc.dark })} aria-label="切换深浅色">
            {doc.dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="editor-wrap">
          <div className="chapterbar">
            <button type="button" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
              <ChevronLeft size={18} />
            </button>
            <input value={chapter.title} onChange={(event) => updateChapter({ title: event.target.value })} />
            <button type="button" disabled={idx >= doc.chapters.length - 1} onClick={() => setIdx(idx + 1)}>
              <ChevronRight size={18} />
            </button>
          </div>
          <textarea
            ref={editorRef}
            className={focus ? 'editor focus' : 'editor'}
            placeholder="开始写。别解释，写场景。"
            value={chapter.text}
            onChange={(event) => updateChapter({ text: event.target.value })}
          />
        </main>

        <footer className="dock">
          <button type="button" onClick={() => setPanel('chapters')}><BookOpen size={19} /><span>章节</span></button>
          <button type="button" onClick={() => setPanel('notes')}><Archive size={19} /><span>灵感</span></button>
          <button type="button" onClick={() => setPanel('chars')}><UserRound size={19} /><span>人物</span></button>
          <button type="button" onClick={() => setPanel('ai')}><Sparkles size={19} /><span>编辑</span></button>
        </footer>
      </aside>

      {panel && (
        <section className="side">
          <div className="side-head">
            <b>{panel === 'chapters' ? '章节' : panel === 'notes' ? '灵感收容所' : panel === 'chars' ? '人物卡' : 'AI 编辑'}</b>
            <button type="button" onClick={() => setPanel('')}><X size={18} /></button>
          </div>

          {panel === 'chapters' && (
            <>
              <div className="stats">
                <div><b>{chapterWords}</b><span>本章字数</span></div>
                <div><b>{totalWords}</b><span>全书字数</span></div>
                <div><b>{progress}%</b><span>今日目标</span></div>
              </div>
              <div className="actions">
                <button type="button" onClick={addChapter}><Plus size={16} />新章</button>
                <button type="button" onClick={snapshot}><Save size={16} />存版本</button>
                <button type="button" onClick={exportMarkdown}><Download size={16} />导出</button>
                <button type="button" onClick={() => setFocus(!focus)}><PenLine size={16} />聚焦</button>
                <button type="button" onClick={() => setZen(!zen)}><Moon size={16} />沉浸</button>
              </div>
              <label className="searchbox">
                <Search size={16} />
                <input placeholder="全文搜索" value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              {results.length > 0 && (
                <div className="list">
                  {results.map((item) => (
                    <button className="row" type="button" onClick={() => setIdx(item.index)} key={item.id}>
                      {item.title}<small>命中搜索</small>
                    </button>
                  ))}
                </div>
              )}
              <div className="list">
                {doc.chapters.map((item, index) => (
                  <button className={index === idx ? 'row active' : 'row'} type="button" onClick={() => setIdx(index)} key={item.id}>
                    <GripVertical size={15} />
                    {item.title}
                    <small>{countWords(item.text)} 字</small>
                  </button>
                ))}
              </div>
            </>
          )}

          {panel === 'notes' && (
            <>
              <div className="actions"><button type="button" onClick={addNote}><Plus size={16} />收一句</button></div>
              <div className="list">
                {doc.notes.map((note) => <article className="card" key={note.id}>{note.text}<small>{new Date(note.ts).toLocaleString()}</small></article>)}
              </div>
            </>
          )}

          {panel === 'chars' && (
            <>
              <div className="actions"><button type="button" onClick={addChar}><Plus size={16} />加人物</button></div>
              <div className="list">
                {doc.chars.map((person) => (
                  <article className="card" key={person.id}>
                    <b>{person.name}</b>
                    <textarea
                      value={person.desc}
                      onChange={(event) => setDoc((current) => ({
                        ...current,
                        chars: current.chars.map((item) => item.id === person.id ? { ...item, desc: event.target.value } : item),
                      }))}
                    />
                  </article>
                ))}
              </div>
            </>
          )}

          {panel === 'ai' && (
            <>
              <p className="hint">AI 不代笔，只挑毛病。先抓 AI 味、重复词和节奏问题。</p>
              <div className="list">
                {tips.map((tip, index) => <article className="card tip" key={index}><b>{tip.type}</b><p>{tip.msg}</p></article>)}
              </div>
              <div className="history-title">版本快照：{doc.history.length} 个</div>
              {doc.history.map((item) => (
                <article className="card history" key={item.id}>
                  <b>{item.title}</b>
                  <small>{new Date(item.ts).toLocaleString()}</small>
                  <button type="button" onClick={() => updateChapter({ title: item.title, text: item.text })}>恢复到当前章</button>
                </article>
              ))}
            </>
          )}
        </section>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
