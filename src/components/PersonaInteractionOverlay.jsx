import React, { useEffect, useMemo, useState } from 'react';
import { COLORS } from '../config/constants';

const FONT = '"Passion One", "Impact", "Bebas Neue", "Arial Black", sans-serif';
const PANEL_SHAPE =
  'polygon(2.5% 4%, 96.5% 0, 100% 17%, 98% 88%, 94% 100%, 5% 96%, 0 80%, 1% 15%)';

export function Portrait({
  src,
  fallback,
  side,
  visible,
  dimmed = false,
  alt,
  delay = '0s',
  zIndex = 5,
}) {
  const isLeft = side === 'left';
  return (
    <div style={{
      position: 'absolute',
      bottom: '-5vh',
      [side]: isLeft ? '-5vw' : '-4vw',
      width: 'min(47vw, 790px)',
      height: '104vh',
      zIndex,
      opacity: visible ? 1 : 0,
      transform: visible
        ? 'translateX(0) scale(1.08)'
        : `translateX(${isLeft ? '-120px' : '120px'}) scale(0.98)`,
      transformOrigin: isLeft ? 'left bottom' : 'right bottom',
      pointerEvents: 'none',
      filter: dimmed
        ? 'brightness(.34) grayscale(.48) drop-shadow(15px 12px 0 rgba(0,0,0,.78))'
        : 'brightness(1) grayscale(0) drop-shadow(15px 12px 0 rgba(0,0,0,.78))',
      transition:
        `opacity .25s ${delay} ease-out, transform .44s ${delay} cubic-bezier(.16,.88,.2,1.08), filter .24s ease-out`,
    }}>
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: isLeft ? 'left bottom' : 'right bottom',
          }}
        />
      ) : (
        <div style={{
          position: 'absolute',
          bottom: '16vh',
          [isLeft ? 'left' : 'right']: '7vw',
          width: '210px',
          height: '210px',
          display: 'grid',
          placeItems: 'center',
          background: COLORS.ANARCHY_BLACK,
          color: COLORS.PAPER,
          border: `7px solid ${COLORS.PAPER}`,
          fontFamily: FONT,
          fontSize: '76px',
          transform: `skewX(${isLeft ? '-8deg' : '8deg'})`,
        }}>
          {fallback}
        </div>
      )}
    </div>
  );
}

export function ChoiceButton({ option, index, selected, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        position: 'relative',
        width: 'min(430px, 35vw)',
        minHeight: '66px',
        padding: '11px 34px 11px 58px',
        border: 'none',
        background: selected ? COLORS.PAPER : COLORS.ANARCHY_BLACK,
        color: selected ? COLORS.BLACK : COLORS.PAPER,
        boxShadow:
          `0 0 0 4px ${selected ? COLORS.ANARCHY_RED : COLORS.PAPER}, 9px 9px 0 ${COLORS.BLACK}`,
        clipPath:
          'polygon(3% 2%, 97% 0, 100% 49%, 95% 84%, 80% 88%, 76% 100%, 1% 91%, 0 30%)',
        transform: `rotate(${index % 2 ? 1.1 : -1.2}deg) skewX(-5deg)`,
        cursor: disabled ? 'wait' : 'pointer',
        textAlign: 'left',
        fontFamily: FONT,
        fontStyle: 'italic',
        textTransform: 'uppercase',
        transition: 'transform .13s, background .13s, color .13s',
      }}
      onMouseEnter={(event) => {
        if (disabled) return;
        event.currentTarget.style.transform =
          'rotate(0deg) skewX(-5deg) scale(1.05)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform =
          `rotate(${index % 2 ? 1.1 : -1.2}deg) skewX(-5deg)`;
      }}
    >
      <span style={{
        position: 'absolute',
        left: '20px',
        top: '10px',
        fontSize: '29px',
        color: COLORS.ANARCHY_RED,
      }}>
        {index + 1}
      </span>
      <span style={{
        display: 'block',
        transform: 'skewX(5deg)',
        fontSize: '22px',
        letterSpacing: '1px',
      }}>
        {option.label}
      </span>
      {option.description && (
        <span style={{
          display: 'block',
          marginTop: '2px',
          transform: 'skewX(5deg)',
          fontFamily: FONT,
          fontStyle: 'italic',
          textTransform: 'none',
          fontSize: '12px',
          lineHeight: 1.15,
          opacity: 0.68,
        }}>
          {option.description}
        </span>
      )}
    </button>
  );
}

export function InteractionPanel({
  phase,
  persona,
  interaction,
  centralText,
  secondaryText,
  command,
  questionCounter,
  onAdvance,
  promptLabel = 'CLICK TO RESPOND',
}) {
  const isBriefing = phase === 'briefing';
  const isInteractive = isBriefing && Boolean(onAdvance);
  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : -1}
      aria-label={isInteractive ? 'Read interaction and show choices' : undefined}
      onClick={isInteractive ? onAdvance : undefined}
      onKeyDown={isInteractive ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onAdvance();
        }
      } : undefined}
      style={{
        position: 'absolute',
        left: '27vw',
        right: '7vw',
        width: 'auto',
        bottom: '2.5vh',
        zIndex: 6,
        minHeight: '180px',
        opacity: isBriefing ? 1 : 0.34,
        filter: isBriefing ? 'none' : 'grayscale(.65) brightness(.55)',
        transform: 'rotate(-.6deg) scale(0.78)',
        transformOrigin: 'left bottom',
        cursor: isInteractive ? 'pointer' : 'default',
        pointerEvents: isInteractive ? 'auto' : 'none',
        transition: 'opacity .25s, filter .25s',
        outline: 'none',
      }}
    >
      {/* 多边形外框：用实心暖白轮廓避免 clip-path + border 的碎边。 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        clipPath: PANEL_SHAPE,
        background: COLORS.PAPER,
        filter: `drop-shadow(11px 11px 0 ${COLORS.ANARCHY_RED})`,
      }} />
      <div style={{
        position: 'absolute',
        inset: '6px',
        clipPath: PANEL_SHAPE,
        background:
          'linear-gradient(108deg, rgba(28,28,28,.98), rgba(3,3,3,.98) 72%)',
      }} />
      <div style={{
        position: 'absolute',
        inset: '14px 18px',
        clipPath: PANEL_SHAPE,
        opacity: 0.12,
        backgroundImage:
          'repeating-linear-gradient(110deg, transparent 0 31px, rgba(255,255,255,.28) 32px 34px)',
      }} />

      {/* 姓名牌位于裁切多边形之外，因此不会再被左上角截断。 */}
      <div style={{
        position: 'absolute',
        left: '54px',
        top: '-26px',
        zIndex: 3,
        padding: '7px 30px 8px',
        color: COLORS.BLACK,
        background: COLORS.PAPER,
        boxShadow: `6px 6px 0 ${COLORS.BLACK}`,
        clipPath: 'polygon(5% 0, 100% 8%, 94% 100%, 0 88%)',
        fontFamily: FONT,
        fontSize: '16px',
        fontStyle: 'italic',
        fontWeight: 900,
        textTransform: 'uppercase',
        transform: 'rotate(-2deg) skewX(-7deg)',
      }}>
        <span style={{ display: 'block', transform: 'skewX(7deg)' }}>
          {persona?.name || 'THESEUS'}
          <span style={{ marginLeft: '12px', color: COLORS.ANARCHY_RED }}>
            // {interaction.toolName}
          </span>
        </span>
      </div>

      <div style={{
        position: 'relative',
        zIndex: 2,
        padding: '38px 52px 30px',
        color: COLORS.PAPER,
      }}>
        <p style={{
          margin: '0 0 10px',
          fontFamily: FONT,
          fontStyle: 'italic',
          fontWeight: 900,
          fontSize: 'clamp(20px, 1.9vw, 31px)',
          lineHeight: 1.08,
          letterSpacing: '1px',
          textShadow: `3px 3px 0 ${COLORS.BLACK}`,
        }}>
          {centralText}
        </p>
        {secondaryText && (
          <p style={{
            margin: '0 0 12px',
            color: '#bdbdbd',
            fontFamily: FONT,
            fontStyle: 'italic',
            fontSize: '14px',
            lineHeight: 1.2,
          }}>
            {secondaryText}
          </p>
        )}
        {command && (
          <div style={{
            position: 'relative',
            marginTop: '14px',
            padding: '10px 20px 12px 40px',
            overflow: 'hidden',
            color: COLORS.PAPER,
            background: COLORS.BLACK,
            boxShadow: `0 0 0 3px ${COLORS.PAPER}`,
            clipPath:
              'polygon(1% 0, 99% 4%, 100% 80%, 97% 100%, 0 91%)',
            fontFamily: FONT,
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: '17px',
            letterSpacing: '.7px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            <span style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '28px',
              display: 'grid',
              placeItems: 'center',
              color: COLORS.PAPER,
              background: COLORS.ANARCHY_RED,
              fontSize: '22px',
            }}>
              $
            </span>
            {command}
          </div>
        )}
        {questionCounter && (
          <span style={{
            position: 'absolute',
            right: '58px',
            top: '30px',
            color: '#FFD700',
            fontFamily: FONT,
            fontSize: '13px',
          }}>
            {questionCounter}
          </span>
        )}
      </div>

      {isInteractive && (
        <div style={{
          position: 'absolute',
          right: '45px',
          bottom: '20px',
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#FFD700',
          fontFamily: FONT,
          fontStyle: 'italic',
          fontSize: '11px',
          letterSpacing: '2px',
          animation: 'interactionPromptPulse .8s infinite',
        }}>
          {promptLabel}
          <span style={{
            width: 0,
            height: 0,
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderLeft: '12px solid #FFD700',
          }} />
        </div>
      )}
    </div>
  );
}

export function PersonaInteractionOverlay({
  interaction,
  persona,
  userProfile,
  onRespond,
}) {
  const [phase, setPhase] = useState('briefing');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [multiSelection, setMultiSelection] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setPhase('briefing');
    setQuestionIndex(0);
    setAnswers({});
    setMultiSelection([]);
    setSubmitting(false);
    setSubmitError('');
  }, [interaction.id]);

  const questions = interaction.questions || [];
  const question = questions[questionIndex] || null;
  const choices = useMemo(() => (
    interaction.kind === 'question'
      ? (question?.options || [])
      : (interaction.choices || [])
  ), [interaction, question]);

  const rawTitle = String(interaction.title || '');
  const toolName = String(interaction.toolName || '');
  const titleIsOnlyToolName =
    rawTitle.trim().toLowerCase() === toolName.trim().toLowerCase();
  const centralText = interaction.kind === 'question'
    ? (question?.question || rawTitle)
    : (
        titleIsOnlyToolName
          ? (interaction.description || '是否允许执行这项操作？')
          : rawTitle
      );
  const secondaryText = (
    interaction.kind !== 'question' &&
    !titleIsOnlyToolName &&
    interaction.description !== centralText
  ) ? interaction.description : '';
  const command = interaction.details?.command;

  const submit = async (payload) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await onRespond({
        interactionId: interaction.id,
        ...payload,
      });
      if (result?.preview) {
        setSubmitting(false);
        setPhase('briefing');
      }
    } catch (error) {
      setSubmitting(false);
      setSubmitError(error.message);
    }
  };

  const moveToNextQuestion = (nextAnswers) => {
    if (questionIndex < questions.length - 1) {
      setAnswers(nextAnswers);
      setQuestionIndex((current) => current + 1);
      setMultiSelection([]);
      setPhase('briefing');
    } else {
      submit({ answers: nextAnswers });
    }
  };

  const choose = (option) => {
    if (submitting || phase !== 'choice') return;
    if (interaction.kind === 'permission') {
      submit({ decision: option.value });
      return;
    }
    if (question.multiSelect) {
      setMultiSelection((current) => (
        current.includes(option.label)
          ? current.filter((label) => label !== option.label)
          : [...current, option.label]
      ));
      return;
    }
    moveToNextQuestion({
      ...answers,
      [question.question]: option.label,
    });
  };

  const confirmMultiSelect = () => {
    if (!multiSelection.length || submitting) return;
    moveToNextQuestion({
      ...answers,
      [question.question]: multiSelection,
    });
  };

  const isChoicePhase = phase === 'choice';
  const questionCounter = (
    question &&
    questions.length > 1
  ) ? `${questionIndex + 1} / ${questions.length}` : '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Claude interaction"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 50% 45%, rgba(212,0,0,.15), rgba(0,0,0,.84) 60%, #000 100%)',
        isolation: 'isolate',
      }}
    >
      <style>{`
        @keyframes interactionNoise {
          0%,100% { transform: translate(0,0); }
          30% { transform: translate(-1px,1px); }
          60% { transform: translate(1px,-1px); }
        }
        @keyframes interactionPromptPulse {
          0%,100% { opacity: .48; transform: translateX(0); }
          50% { opacity: 1; transform: translateX(4px); }
        }
      `}</style>

      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        opacity: isChoicePhase ? 0.12 : 0.2,
        backgroundImage:
          'repeating-linear-gradient(112deg, transparent 0 38px, rgba(255,255,255,.15) 39px 41px)',
        animation: 'interactionNoise .22s infinite',
        transition: 'opacity .25s',
      }} />

      <Portrait
        side="left"
        src={persona?.halfPortraitUrl}
        fallback={persona?.emoji || '◆'}
        visible
        dimmed={isChoicePhase}
        alt={persona?.name || 'AI'}
      />
      <Portrait
        side="right"
        src={userProfile?.halfPortraitUrl}
        fallback="YOU"
        visible={isChoicePhase}
        dimmed={false}
        delay=".1s"
        zIndex={7}
        alt="User"
      />

      <InteractionPanel
        phase={phase}
        persona={persona}
        interaction={interaction}
        centralText={centralText}
        secondaryText={secondaryText}
        command={command}
        questionCounter={questionCounter}
        onAdvance={() => setPhase('choice')}
      />

      <div style={{
        position: 'absolute',
        right: '10vw',
        top: '20vh',
        zIndex: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        opacity: isChoicePhase ? 1 : 0,
        transform: isChoicePhase ? 'translateX(0)' : 'translateX(90px)',
        transition: 'opacity .22s .16s, transform .34s .13s cubic-bezier(.2,.9,.2,1.12)',
        pointerEvents: isChoicePhase ? 'auto' : 'none',
      }}>
        {choices.map((option, index) => (
          <ChoiceButton
            key={option.value || option.label}
            option={option}
            index={index}
            disabled={submitting}
            selected={
              question?.multiSelect &&
              multiSelection.includes(option.label)
            }
            onClick={() => choose(option)}
          />
        ))}
        {question?.multiSelect && (
          <button
            type="button"
            onClick={confirmMultiSelect}
            disabled={!multiSelection.length || submitting}
            style={{
              alignSelf: 'flex-end',
              padding: '10px 29px',
              border: `4px solid ${COLORS.PAPER}`,
              background: multiSelection.length
                ? COLORS.ANARCHY_RED
                : '#333',
              color: COLORS.PAPER,
              fontFamily: FONT,
              fontSize: '17px',
              fontStyle: 'italic',
              cursor: multiSelection.length ? 'pointer' : 'not-allowed',
              transform: 'skewX(-8deg)',
              boxShadow: `6px 6px 0 ${COLORS.BLACK}`,
            }}
          >
            <span style={{ display: 'block', transform: 'skewX(8deg)' }}>
              CONFIRM
            </span>
          </button>
        )}
        {submitting && (
          <div style={{
            alignSelf: 'flex-end',
            padding: '5px 14px',
            color: '#FFD700',
            background: COLORS.BLACK,
            border: '2px solid #FFD700',
            fontFamily: FONT,
            fontStyle: 'italic',
            fontSize: '12px',
            letterSpacing: '1px',
            animation: 'interactionPromptPulse .8s infinite',
          }}>
            RESUMING SESSION...
          </div>
        )}
        {submitError && (
          <div style={{
            maxWidth: '390px',
            padding: '9px 13px',
            color: COLORS.PAPER,
            background: COLORS.ANARCHY_RED,
            border: `3px solid ${COLORS.PAPER}`,
            fontFamily: FONT,
            fontStyle: 'italic',
            fontSize: '13px',
          }}>
            {submitError}
          </div>
        )}
      </div>
    </div>
  );
}
