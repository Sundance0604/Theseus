import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getArchiveFile, getArchiveList } from '../../api/claudeBridge';
import { cssAssetUrl } from '../../config/assets';
import { COLORS } from '../../config/constants';

const FONT = '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif';
const MONO = '"JetBrains Mono", "Cascadia Mono", Consolas, monospace';
const CARD_ANGLES = [-3, 2.4, -1.7, 4, -2.2, 1.2, -4.2, 2.9, -0.8, 3.3];
const CARD_OFFSETS = [0, 32, -18, 58, 8, -28, 42, -8, 24, -34];

function ArchiveButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '13px 18px',
        color: active ? COLORS.BLACK : COLORS.PAPER,
        background: active ? COLORS.PAPER : COLORS.ANARCHY_BLACK,
        border: `4px solid ${active ? COLORS.ANARCHY_RED : COLORS.PAPER}`,
        boxShadow: `7px 7px 0 ${active ? COLORS.ANARCHY_RED : COLORS.BLACK}`,
        transform: 'skewX(-8deg)',
        cursor: 'pointer',
        fontFamily: FONT,
        fontStyle: 'italic',
        fontWeight: 900,
        fontSize: '18px',
        textAlign: 'left',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ display: 'block', transform: 'skewX(8deg)' }}>
        {children}
      </span>
    </button>
  );
}

function FileCard({ file, index, onOpen }) {
  const [hovered, setHovered] = useState(false);
  const angle = CARD_ANGLES[index % CARD_ANGLES.length];
  const offset = CARD_OFFSETS[index % CARD_OFFSETS.length];
  const pale = index % 7 === 3;
  return (
    <button
      type="button"
      onClick={() => onOpen(file)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        zIndex: hovered ? 900 : 40 - (index % 20),
        width: 'min(720px, 62vw)',
        minHeight: '68px',
        marginTop: index === 0 ? 0 : '-8px',
        marginLeft: `${offset}px`,
        padding: '15px 26px',
        color: hovered ? COLORS.BLACK : (pale ? COLORS.BLACK : COLORS.ANARCHY_RED),
        background: hovered
          ? COLORS.ANARCHY_RED
          : (pale ? COLORS.PAPER : COLORS.ANARCHY_BLACK),
        border: `4px solid ${hovered ? COLORS.BLACK : COLORS.PAPER}`,
        boxShadow: hovered
          ? `12px 12px 0 ${COLORS.BLACK}`
          : `8px 8px 0 ${COLORS.BLACK}`,
        transform: hovered ? 'rotate(0deg) scale(1.035)' : `rotate(${angle}deg)`,
        transformOrigin: '38% 50%',
        cursor: 'pointer',
        fontFamily: FONT,
        fontStyle: 'italic',
        fontWeight: 900,
        textAlign: 'left',
        textTransform: 'uppercase',
        transition: hovered ? 'none' : 'transform .12s, background .12s, color .12s',
        animation: hovered ? 'archiveCardJitter .065s infinite steps(2, end)' : 'none',
      }}
    >
      <span style={{
        display: 'block',
        fontSize: 'clamp(20px, 2vw, 34px)',
        lineHeight: 0.95,
        letterSpacing: '1px',
      }}>
        {file.title}
      </span>
      <span style={{
        display: 'block',
        marginTop: '7px',
        color: hovered ? COLORS.BLACK : COLORS.PAPER,
        fontSize: '12px',
        letterSpacing: '2px',
        opacity: 0.78,
      }}>
        {file.fileName} // {Math.ceil((file.size || 0) / 1024)}KB
      </span>
    </button>
  );
}

function FilePile({ files, loading, error, emptyLabel, onOpen }) {
  if (loading) {
    return <div style={noticeStyle}>PULLING FILES FROM THE CABINET...</div>;
  }
  if (error) {
    return <div style={{ ...noticeStyle, background: COLORS.ANARCHY_RED }}>{error}</div>;
  }
  if (!files.length) {
    return <div style={noticeStyle}>{emptyLabel}</div>;
  }
  return (
    <div style={{
      position: 'relative',
      padding: '8px 42px 80px',
    }}>
      {files.map((file, index) => (
        <FileCard
          key={file.id}
          file={file}
          index={index}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

const noticeStyle = {
  display: 'inline-block',
  margin: '60px 0 0 38px',
  padding: '18px 28px',
  color: COLORS.PAPER,
  background: COLORS.ANARCHY_BLACK,
  border: `4px solid ${COLORS.PAPER}`,
  boxShadow: `9px 9px 0 ${COLORS.ANARCHY_RED}`,
  transform: 'skewX(-8deg)',
  fontFamily: FONT,
  fontStyle: 'italic',
  fontWeight: 900,
  fontSize: '20px',
  textTransform: 'uppercase',
};

function DetailOverlay({ file, loading, error, onBack }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 40,
      pointerEvents: 'auto',
    }}>
      <section style={{
        position: 'absolute',
        left: '7vw',
        right: '7vw',
        top: '8vh',
        bottom: '8vh',
        padding: '34px 40px 38px',
        color: COLORS.PAPER,
        background: COLORS.ANARCHY_BLACK,
        border: `7px solid ${COLORS.PAPER}`,
        boxShadow: `12px 12px 0 ${COLORS.BLACK}`,
        clipPath: 'polygon(2% 0, 100% 5%, 96% 100%, 0 94%)',
        animation: 'archiveSlashIn .34s cubic-bezier(.1,.86,.19,1.12) both',
      }}>
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '22px',
          marginBottom: '18px',
          fontFamily: FONT,
          fontStyle: 'italic',
          fontWeight: 900,
          textTransform: 'uppercase',
        }}>
          <div>
            <div style={{ color: COLORS.ANARCHY_RED, fontSize: '14px', letterSpacing: '3px' }}>
              STATE_FILE_VIEW
            </div>
            <h1 style={{
              margin: 0,
              fontSize: 'clamp(28px, 4vw, 64px)',
              lineHeight: 0.88,
            }}>
              {file?.title || 'LOADING ARCHIVE'}
            </h1>
          </div>
          <button
            type="button"
            onClick={onBack}
            style={{
              flexShrink: 0,
              padding: '12px 24px',
              color: COLORS.BLACK,
              background: COLORS.PAPER,
              border: `4px solid ${COLORS.ANARCHY_RED}`,
              boxShadow: `7px 7px 0 ${COLORS.BLACK}`,
              transform: 'skewX(-8deg)',
              cursor: 'pointer',
              fontFamily: FONT,
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: '17px',
            }}
          >
            <span style={{ display: 'block', transform: 'skewX(8deg)' }}>
              ← FILE PILE
            </span>
          </button>
        </header>
        <pre style={{
          boxSizing: 'border-box',
          width: '100%',
          height: 'calc(100% - 104px)',
          margin: 0,
          padding: '30px 34px',
          overflow: 'auto',
          color: COLORS.BLACK,
          background: COLORS.PAPER,
          border: `5px solid ${COLORS.ANARCHY_RED}`,
          borderRadius: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: MONO,
          fontSize: '15px',
          lineHeight: 1.7,
        }}>
          {loading ? 'READING ARCHIVE FILE...' : (error || file?.content || '')}
        </pre>
      </section>
    </div>
  );
}

export function ArchiveRoomScene({ personas = [], onBack }) {
  const [mode, setMode] = useState('meetings');
  const [selectedPersonaId, setSelectedPersonaId] = useState(personas[0]?.id || '');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailFile, setDetailFile] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [leavingList, setLeavingList] = useState(false);
  const detailControllerRef = useRef(null);

  const selectedPersona = useMemo(
    () => personas.find((persona) => persona.id === selectedPersonaId) || personas[0],
    [personas, selectedPersonaId],
  );

  useEffect(() => {
    if (!selectedPersonaId && personas[0]?.id) {
      setSelectedPersonaId(personas[0].id);
    }
  }, [personas, selectedPersonaId]);

  useEffect(() => {
    if (mode === 'conversations' && !selectedPersona?.id) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setFiles([]);
    getArchiveList({
      kind: mode,
      personaId: mode === 'conversations' ? selectedPersona.id : '',
      signal: controller.signal,
    })
      .then((result) => setFiles(result.files || []))
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [mode, selectedPersona]);

  useEffect(() => () => {
    detailControllerRef.current?.abort();
  }, []);

  const openFile = (file) => {
    detailControllerRef.current?.abort();
    const controller = new AbortController();
    detailControllerRef.current = controller;
    setLeavingList(true);
    setDetailFile({ ...file, content: '' });
    setDetailLoading(true);
    setDetailError('');
    getArchiveFile({
      kind: mode,
      fileId: file.id,
      personaId: mode === 'conversations' ? selectedPersona?.id : '',
      signal: controller.signal,
    })
      .then((result) => {
        if (detailControllerRef.current === controller) setDetailFile(result);
      })
      .catch((requestError) => {
        if (
          detailControllerRef.current === controller &&
          requestError.name !== 'AbortError'
        ) {
          setDetailError(requestError.message);
        }
      })
      .finally(() => {
        if (detailControllerRef.current !== controller) return;
        detailControllerRef.current = null;
        if (!controller.signal.aborted) setDetailLoading(false);
      });
  };

  const closeFile = () => {
    detailControllerRef.current?.abort();
    detailControllerRef.current = null;
    setDetailFile(null);
    setDetailError('');
    setDetailLoading(false);
    setLeavingList(false);
  };

  const switchToPersona = (personaId) => {
    setMode('conversations');
    setSelectedPersonaId(personaId);
    closeFile();
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      backgroundColor: COLORS.ANARCHY_BLACK,
      backgroundImage:
        `linear-gradient(rgba(0,0,0,.22), rgba(0,0,0,.34)), ${cssAssetUrl('archive.png')}`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      isolation: 'isolate',
    }}>
      <style>{`
        @keyframes archiveCardJitter {
          0% { translate: -2px 1px; }
          25% { translate: 2px -2px; }
          50% { translate: -1px -2px; }
          75% { translate: 2px 2px; }
          100% { translate: -2px 0; }
        }
        @keyframes archiveSlashIn {
          from { opacity: 0; transform: translate(42vw, 38vh) rotate(-12deg) skewX(-8deg); }
          to { opacity: 1; transform: translate(0,0) rotate(0deg) skewX(0deg); }
        }
        @keyframes archiveListOut {
          to { opacity: .1; transform: translate(-28vw, -20vh) rotate(-8deg); filter: blur(2px); }
        }
      `}</style>

      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        opacity: 0.14,
        pointerEvents: 'none',
        backgroundImage:
          'repeating-linear-gradient(118deg, transparent 0 42px, rgba(245,240,235,.4) 43px 46px)',
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 3,
        animation: leavingList ? 'archiveListOut .28s ease-in forwards' : 'none',
      }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            position: 'absolute',
            top: '24px',
            right: '32px',
            zIndex: 12,
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

        <aside style={{
          position: 'absolute',
          left: '34px',
          top: '34px',
          bottom: '38px',
          zIndex: 8,
          width: 'min(310px, 28vw)',
          display: 'flex',
          flexDirection: 'column',
          gap: '13px',
          padding: '24px',
          color: COLORS.PAPER,
          background: 'rgba(0,0,0,.86)',
          border: `5px solid ${COLORS.PAPER}`,
          boxShadow: `12px 12px 0 ${COLORS.BLACK}`,
          transform: 'rotate(-1.5deg)',
        }}>
          <div style={{
            fontFamily: FONT,
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: 'clamp(32px, 4vw, 58px)',
            lineHeight: 0.82,
            color: COLORS.PAPER,
            textTransform: 'uppercase',
          }}>
            ARCHIVE<br />
            <span style={{ color: COLORS.ANARCHY_RED }}>ROOM</span>
          </div>

          <ArchiveButton
            active={mode === 'meetings'}
            onClick={() => {
              setMode('meetings');
              closeFile();
            }}
          >
            All Seminar Files
          </ArchiveButton>

          <div style={{
            marginTop: '8px',
            color: COLORS.ANARCHY_RED,
            fontFamily: FONT,
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: '16px',
            letterSpacing: '2px',
          }}>
            AI DOSSIERS
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '9px',
            overflow: 'auto',
            paddingRight: '6px',
          }}>
            {personas.map((persona) => (
              <ArchiveButton
                key={persona.id}
                active={mode === 'conversations' && selectedPersona?.id === persona.id}
                onClick={() => switchToPersona(persona.id)}
              >
                {persona.name}
              </ArchiveButton>
            ))}
          </div>
        </aside>

        <main style={{
          position: 'absolute',
          left: 'min(390px, 33vw)',
          right: '4vw',
          top: '9vh',
          bottom: '5vh',
          zIndex: 6,
          overflow: 'auto',
          paddingTop: '34px',
        }}>
          <div style={{
            margin: '0 0 28px 28px',
            fontFamily: FONT,
            fontStyle: 'italic',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: COLORS.PAPER,
            textShadow: `5px 5px 0 ${COLORS.BLACK}`,
          }}>
            <div style={{ color: COLORS.ANARCHY_RED, fontSize: '16px', letterSpacing: '3px' }}>
              {mode === 'meetings' ? 'SEMINAR LEDGER' : 'CONVERSATION LEDGER'}
            </div>
            <div style={{ fontSize: 'clamp(38px, 5vw, 86px)', lineHeight: 0.8 }}>
              {mode === 'meetings'
                ? 'SCATTERED MINUTES'
                : `${selectedPersona?.name || 'AI'} FILES`}
            </div>
          </div>

          <FilePile
            files={files}
            loading={loading}
            error={error}
            emptyLabel="NO MARKDOWN FILES FOUND"
            onOpen={openFile}
          />
        </main>
      </div>

      {detailFile && (
        <DetailOverlay
          file={detailFile}
          loading={detailLoading}
          error={detailError}
          onBack={closeFile}
        />
      )}
    </div>
  );
}
