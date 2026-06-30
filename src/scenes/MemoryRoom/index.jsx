import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChoiceButton,
  InteractionPanel,
  Portrait,
} from '../../components/PersonaInteractionOverlay';
import {
  getMemoryPersona,
  getMemoryStats,
  saveMemoryPersona,
} from '../../api/claudeBridge';
import { COLORS } from '../../config/constants';

const FONT = '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif';
const INITIAL_LINE = 'Oh, Captain! My Captain! For whom does the memory change?';
const FOLLOWUP_INIT_LINE =
  'The world will little note, nor long remember what we say here.';
const RETURN_LINE = 'Memory, all alone in the moonlight...';
const YURI = {
  id: 'memory-keeper-yuri',
  name: 'Yuri',
  emoji: '◆',
  halfPortraitUrl: '/Yuri.png',
};

const INITIAL_CHOICES = [
  { value: 'EDIT', label: '修改人格' },
  { value: 'STATS', label: '统计人格' },
  { value: 'EXIT', label: '退出' },
];

function useTypewriter(text, runKey, speed = 24) {
  const [visibleText, setVisibleText] = useState('');
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    setVisibleText('');
    setComplete(false);
    if (!text) {
      setComplete(true);
      return undefined;
    }

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisibleText(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
        setComplete(true);
      }
    }, speed);
    return () => window.clearInterval(timer);
  }, [text, runKey, speed]);

  return { visibleText, complete };
}

function AgentList({ personas, action, onSelect }) {
  return (
    <section style={{
      position: 'absolute',
      left: '7vw',
      top: '15vh',
      zIndex: 10,
      width: 'min(760px, 58vw)',
      padding: '28px 34px 34px',
      color: COLORS.PAPER,
      background: COLORS.ANARCHY_BLACK,
      border: `5px solid ${COLORS.PAPER}`,
      boxShadow: `14px 14px 0 ${COLORS.ANARCHY_RED}`,
      transform: 'skewX(-8deg)',
      animation: 'memoryPanelIn .32s cubic-bezier(.16,.88,.2,1.08)',
    }}>
      <div style={{ transform: 'skewX(8deg)' }}>
        <div style={{
          marginBottom: '22px',
          fontFamily: FONT,
          fontStyle: 'italic',
          fontWeight: 900,
          fontSize: 'clamp(24px, 3vw, 46px)',
          textTransform: 'uppercase',
        }}>
          SELECT MEMORY // {action}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: '14px',
        }}>
          {personas.map((persona, index) => (
            <button
              key={persona.id}
              type="button"
              onClick={() => onSelect(persona)}
              style={{
                minHeight: '70px',
                padding: '12px 18px',
                color: COLORS.PAPER,
                background: COLORS.ANARCHY_BLACK,
                border: `3px solid ${COLORS.PAPER}`,
                boxShadow: `6px 6px 0 ${COLORS.BLACK}`,
                transform: 'skewX(-8deg)',
                cursor: 'pointer',
                fontFamily: FONT,
                fontStyle: 'italic',
                fontWeight: 900,
                fontSize: '18px',
                textTransform: 'uppercase',
                textAlign: 'left',
                transition:
                  'transform .18s cubic-bezier(.25,1.5,.5,1), background .12s, color .12s, border-color .12s, box-shadow .12s',
                animationDelay: `${index * 35}ms`,
              }}
              onMouseEnter={(event) => {
                const el = event.currentTarget;
                el.style.background = COLORS.PAPER;
                el.style.color = COLORS.BLACK;
                el.style.borderColor = COLORS.ANARCHY_RED;
                el.style.boxShadow = `9px 9px 0 ${COLORS.ANARCHY_RED}`;
                el.style.transform = 'skewX(-8deg) scale(1.04)';
              }}
              onMouseLeave={(event) => {
                const el = event.currentTarget;
                el.style.background = COLORS.ANARCHY_BLACK;
                el.style.color = COLORS.PAPER;
                el.style.borderColor = COLORS.PAPER;
                el.style.boxShadow = `6px 6px 0 ${COLORS.BLACK}`;
                el.style.transform = 'skewX(-8deg)';
              }}
            >
              <span style={{ display: 'block', transform: 'skewX(8deg)' }}>
                {persona.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function EditPanel({
  persona,
  draft,
  loading,
  error,
  onChange,
  onRequestClose,
}) {
  return (
    <section style={{
      position: 'absolute',
      left: '5vw',
      right: '8vw',
      top: '10vh',
      bottom: '8vh',
      zIndex: 12,
    }}>
      <div style={{
        position: 'absolute',
        inset: '18px -16px -18px 16px',
        background: COLORS.ANARCHY_RED,
        clipPath: 'polygon(2% 3%, 99% 0, 96% 96%, 0 100%)',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: COLORS.PAPER,
        clipPath: 'polygon(0 4%, 98% 0, 100% 94%, 3% 100%)',
      }} />
      <div style={{
        position: 'absolute',
        inset: '7px',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 34px 34px',
        background: COLORS.ANARCHY_BLACK,
        clipPath: 'polygon(0 4%, 98% 0, 100% 94%, 3% 100%)',
      }}>
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: '18px',
          color: COLORS.PAPER,
          fontFamily: FONT,
          fontStyle: 'italic',
          fontWeight: 900,
          textTransform: 'uppercase',
        }}>
          <span style={{ fontSize: 'clamp(22px, 2.6vw, 40px)' }}>
            MEMORY CORE // {persona?.name}
          </span>
          <button
            type="button"
            onClick={onRequestClose}
            disabled={loading}
            style={{
              padding: '10px 24px',
              color: COLORS.PAPER,
              background: COLORS.ANARCHY_RED,
              border: `3px solid ${COLORS.PAPER}`,
              boxShadow: `6px 6px 0 ${COLORS.BLACK}`,
              transform: 'skewX(-8deg)',
              cursor: loading ? 'wait' : 'pointer',
              fontFamily: FONT,
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: '16px',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ display: 'block', transform: 'skewX(8deg)' }}>
              SAVE / EXIT
            </span>
          </button>
        </header>
        {error && (
          <div style={{
            marginBottom: '10px',
            padding: '8px 14px',
            color: COLORS.PAPER,
            background: COLORS.ANARCHY_RED,
            border: `2px solid ${COLORS.PAPER}`,
            fontFamily: FONT,
            fontStyle: 'italic',
          }}>
            {error}
          </div>
        )}
        <textarea
          aria-label={`${persona?.name || ''} persona definition`}
          value={draft}
          onChange={(event) => onChange(event.target.value)}
          disabled={loading}
          spellCheck={false}
          style={{
            boxSizing: 'border-box',
            width: '100%',
            flex: 1,
            minHeight: 0,
            padding: '28px 32px',
            resize: 'none',
            color: COLORS.BLACK,
            background: COLORS.PAPER,
            border: `5px solid ${COLORS.ANARCHY_RED}`,
            borderRadius: 0,
            outline: 'none',
            transform: 'none',
            fontFamily: '"Cascadia Mono", Consolas, monospace',
            fontSize: '15px',
            lineHeight: 1.65,
            tabSize: 2,
            whiteSpace: 'pre-wrap',
          }}
        />
      </div>
    </section>
  );
}

function ConfirmDialog({ saving, error, onConfirm, onCancel }) {
  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'absolute',
      inset: 0,
      zIndex: 30,
      display: 'grid',
      placeItems: 'center',
      background: 'rgba(0,0,0,.85)',
    }}>
      <div style={{
        width: 'min(480px, 78vw)',
        padding: '30px 38px',
        color: COLORS.PAPER,
        background: COLORS.ANARCHY_BLACK,
        border: `5px solid ${COLORS.PAPER}`,
        boxShadow: `12px 12px 0 ${COLORS.ANARCHY_RED}`,
        transform: 'skewX(-8deg)',
      }}>
        <div style={{
          transform: 'skewX(8deg)',
          fontFamily: FONT,
          fontStyle: 'italic',
          fontWeight: 900,
          textTransform: 'uppercase',
        }}>
          <div style={{ fontSize: '30px', marginBottom: '10px' }}>
            修改信息
          </div>
          <div style={{ fontSize: '15px', marginBottom: '22px' }}>
            确认将当前人格定义写回本地工作区？
          </div>
          {error && (
            <div style={{
              marginBottom: '14px',
              padding: '8px 12px',
              background: COLORS.ANARCHY_RED,
              border: `2px solid ${COLORS.PAPER}`,
            }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
            {[
              ['确认', onConfirm],
              ['取消', onCancel],
            ].map(([label, handler]) => (
              <button
                key={label}
                type="button"
                disabled={saving}
                onClick={handler}
                style={{
                  padding: '10px 24px',
                  color: COLORS.PAPER,
                  background: label === '确认'
                    ? COLORS.ANARCHY_RED
                    : COLORS.ANARCHY_BLACK,
                  border: `3px solid ${COLORS.PAPER}`,
                  boxShadow: `5px 5px 0 ${COLORS.BLACK}`,
                  transform: 'skewX(-8deg)',
                  cursor: saving ? 'wait' : 'pointer',
                  fontFamily: FONT,
                  fontStyle: 'italic',
                  fontWeight: 900,
                  fontSize: '17px',
                }}
              >
                <span style={{ display: 'block', transform: 'skewX(8deg)' }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MemoryRoomScene({ personas = [], userProfile, onBack }) {
  const [screen, setScreen] = useState('INIT');
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState(INITIAL_LINE);
  const [streamKey, setStreamKey] = useState(0);
  const [initialChoicesOpen, setInitialChoicesOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const exitTimerRef = useRef(null);

  const isDialogue = ['INIT', 'STATS', 'EPILOGUE'].includes(screen);
  const { visibleText, complete } = useTypewriter(
    isDialogue ? message : '',
    streamKey,
  );

  const interaction = useMemo(() => ({
    toolName: 'MEMORY WARD',
  }), []);

  const resetToInit = ({ followup = false } = {}) => {
    setSelectedAgent(null);
    setCurrentAction(null);
    setDraft('');
    setError('');
    setBusy(false);
    setShowConfirm(false);
    setInitialChoicesOpen(false);
    setMessage(followup ? FOLLOWUP_INIT_LINE : INITIAL_LINE);
    setStreamKey((key) => key + 1);
    setScreen('INIT');
  };

  useEffect(() => {
    if (screen !== 'EDIT_LOADING' || !selectedAgent) return undefined;
    const controller = new AbortController();
    let cancelled = false;
    setBusy(true);
    setError('');
    getMemoryPersona(selectedAgent.id, controller.signal)
      .then((result) => {
        if (cancelled) return;
        setDraft(result.content || '');
        setScreen('EDIT');
      })
      .catch((requestError) => {
        if (!cancelled && requestError.name !== 'AbortError') {
          setError(requestError.message);
          setScreen('EDIT');
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [screen, selectedAgent]);

  useEffect(() => {
    if (screen !== 'STATS_LOADING' || !selectedAgent) return undefined;
    const controller = new AbortController();
    let cancelled = false;
    setError('');
    getMemoryStats(selectedAgent.id, controller.signal)
      .then((stats) => {
        if (cancelled) return;
        setMessage(
          `${selectedAgent.name}'s memory ledger reports `
          + `${stats.conversationCount} dialogue records and `
          + `${stats.meetingCount} meeting records.`,
        );
      })
      .catch((requestError) => {
        if (!cancelled && requestError.name !== 'AbortError') {
          setMessage(`The memory ledger resisted me: ${requestError.message}`);
        }
      })
      .finally(() => {
        if (cancelled) return;
        setStreamKey((key) => key + 1);
        setScreen('STATS');
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [screen, selectedAgent]);

  useEffect(() => () => {
    if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
  }, []);

  const chooseInitial = (option) => {
    if (option.value === 'EXIT') {
      setInitialChoicesOpen(false);
      setScreen('EXITING');
      exitTimerRef.current = window.setTimeout(() => {
        resetToInit();
        onBack?.();
      }, 420);
      return;
    }
    setCurrentAction(option.value);
    setSelectedAgent(null);
    setInitialChoicesOpen(false);
    setScreen('LIST');
  };

  const selectAgent = (persona) => {
    setSelectedAgent(persona);
    setError('');
    setScreen(currentAction === 'EDIT' ? 'EDIT_LOADING' : 'STATS_LOADING');
  };

  const finishEdit = () => {
    setShowConfirm(false);
    setMessage(RETURN_LINE);
    setStreamKey((key) => key + 1);
    setScreen('EPILOGUE');
  };

  const confirmSave = async () => {
    setBusy(true);
    setError('');
    try {
      await saveMemoryPersona(selectedAgent.id, draft);
      finishEdit();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  const canAdvanceDialogue = complete && (
    ['STATS', 'EPILOGUE'].includes(screen) ||
    (screen === 'INIT' && !initialChoicesOpen)
  );
  const advanceDialogue = () => {
    if (!canAdvanceDialogue) return;
    if (screen === 'INIT') {
      setInitialChoicesOpen(true);
      return;
    }
    resetToInit({ followup: true });
  };

  const choiceVisible = screen === 'INIT' && complete && initialChoicesOpen;
  const userVisible = choiceVisible || screen === 'LIST';

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      isolation: 'isolate',
      backgroundColor: COLORS.ANARCHY_BLACK,
      backgroundImage:
        'linear-gradient(rgba(0,0,0,.16), rgba(0,0,0,.16)), url("/memory.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      animation: screen === 'EXITING'
        ? 'memoryExit .42s ease-in forwards'
        : 'memoryEnter .36s ease-out both',
    }}>
      <style>{`
        @keyframes memoryEnter {
          from { opacity: 0; transform: scale(1.035); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes memoryExit {
          to { opacity: 0; transform: scale(.96) rotate(-.5deg); }
        }
        @keyframes memoryPanelIn {
          from { opacity: 0; transform: translateX(-70px) skewX(-8deg); }
          to { opacity: 1; transform: translateX(0) skewX(-8deg); }
        }
        @keyframes memoryPulse {
          0%,100% { opacity: .5; }
          50% { opacity: 1; }
        }
      `}</style>

      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        opacity: 0.15,
        pointerEvents: 'none',
        backgroundImage:
          'repeating-linear-gradient(112deg, transparent 0 38px, rgba(245,240,235,.34) 39px 41px)',
      }} />

      <button
        type="button"
        onClick={() => chooseInitial({ value: 'EXIT' })}
        aria-label="Return to navigation"
        style={{
          position: 'absolute',
          top: '24px',
          right: '32px',
          zIndex: 25,
          padding: '9px 20px',
          color: COLORS.PAPER,
          background: COLORS.ANARCHY_BLACK,
          border: `3px solid ${COLORS.PAPER}`,
          boxShadow: `6px 6px 0 ${COLORS.ANARCHY_RED}`,
          transform: 'skewX(-8deg)',
          cursor: 'pointer',
          fontFamily: FONT,
          fontStyle: 'italic',
          fontWeight: 900,
          textTransform: 'uppercase',
        }}
      >
        <span style={{ display: 'block', transform: 'skewX(8deg)' }}>
          ← NAVIGATION
        </span>
      </button>

      <Portrait
        side="left"
        src={YURI.halfPortraitUrl}
        fallback={YURI.emoji}
        visible={isDialogue}
        dimmed={choiceVisible}
        alt="Yuri"
      />
      <Portrait
        side="right"
        src={userProfile?.halfPortraitUrl}
        fallback="YOU"
        visible={userVisible}
        alt="User"
        zIndex={7}
      />

      {screen === 'LIST' && (
        <AgentList
          personas={personas}
          action={currentAction}
          onSelect={selectAgent}
        />
      )}

      {['EDIT_LOADING', 'EDIT'].includes(screen) && (
        <EditPanel
          persona={selectedAgent}
          draft={draft}
          loading={busy}
          error={error}
          onChange={setDraft}
          onRequestClose={() => setShowConfirm(true)}
        />
      )}

      {isDialogue && (
        <InteractionPanel
          phase={choiceVisible ? 'choice' : 'briefing'}
          persona={YURI}
          interaction={interaction}
          centralText={visibleText}
          onAdvance={canAdvanceDialogue ? advanceDialogue : undefined}
          promptLabel="CLICK TO CONTINUE"
        />
      )}

      <div style={{
        position: 'absolute',
        right: '10vw',
        top: '20vh',
        zIndex: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        opacity: choiceVisible ? 1 : 0,
        transform: choiceVisible ? 'translateX(0)' : 'translateX(90px)',
        transition:
          'opacity .22s .12s, transform .34s .1s cubic-bezier(.2,.9,.2,1.12)',
        pointerEvents: choiceVisible ? 'auto' : 'none',
      }}>
        {INITIAL_CHOICES.map((option, index) => (
          <ChoiceButton
            key={option.value}
            option={option}
            index={index}
            disabled={!choiceVisible}
            onClick={() => chooseInitial(option)}
          />
        ))}
      </div>

      {screen === 'STATS_LOADING' && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          zIndex: 20,
          padding: '12px 24px',
          color: COLORS.PAPER,
          background: COLORS.ANARCHY_BLACK,
          border: `3px solid ${COLORS.PAPER}`,
          boxShadow: `7px 7px 0 ${COLORS.ANARCHY_RED}`,
          transform: 'translate(-50%, -50%) skewX(-8deg)',
          fontFamily: FONT,
          fontStyle: 'italic',
          fontWeight: 900,
          textTransform: 'uppercase',
          animation: 'memoryPulse .7s infinite',
        }}>
          <span style={{ display: 'block', transform: 'skewX(8deg)' }}>
            READING MEMORY LEDGER...
          </span>
        </div>
      )}

      {showConfirm && (
        <ConfirmDialog
          saving={busy}
          error={error}
          onConfirm={confirmSave}
          onCancel={finishEdit}
        />
      )}
    </div>
  );
}
