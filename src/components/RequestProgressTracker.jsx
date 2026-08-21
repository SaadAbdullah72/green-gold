import React from 'react';

const progressStages = {
  customer: [
    { key: 'REQUESTED', label: 'Request created', value: 25 },
    { key: 'ASSIGNED', label: 'Assigned', value: 50 },
    { key: 'IN_PROGRESS', label: 'Technician on site', value: 75 },
    { key: 'COMPLETED', label: 'Completed', value: 100 }
  ],
  technical: [
    { key: 'VIEWED', label: 'Viewed request', value: 25 },
    { key: 'ACCEPTED', label: 'Accepted', value: 50 },
    { key: 'IN_PROGRESS', label: 'Reached destination', value: 75 },
    { key: 'COMPLETED', label: 'Completed work', value: 100 }
  ],
  collection: [
    { key: 'VIEWED', label: 'Viewed request', value: 25 },
    { key: 'ACCEPTED', label: 'Accepted', value: 50 },
    { key: 'AT_SITE', label: 'Reached destination', value: 75 },
    { key: 'COMPLETED', label: 'Completed work', value: 100 }
  ]
};

function getCurrentStageIndex(status, variant) {
  const normalized = String(status || '').toUpperCase();
  const stages = progressStages[variant] || progressStages.technical;

  if (['PENDING', 'SUBMITTED', 'WAITING', 'REQUESTED', 'VIEWED'].includes(normalized)) return 0;
  if (['APPROVED', 'ASSIGNING', 'ASSIGNED', 'ROUTED', 'ACCEPTED'].includes(normalized)) return 1;
  if (['EN_ROUTE', 'AT_SITE', 'IN_PROGRESS', 'WORKING'].includes(normalized)) return 2;
  if (['COMPLETED', 'DONE', 'FINISHED'].includes(normalized)) return 3;

  const exactMatch = stages.findIndex((stage) => normalized === stage.key);
  return exactMatch >= 0 ? exactMatch : 0;
}

export default function RequestProgressTracker({
  status,
  variant = 'technical',
  interactive = false,
  onStageChange,
  compact = false,
  label = 'Progress'
}) {
  const stages = progressStages[variant] || progressStages.technical;
  const currentIndex = getCurrentStageIndex(status, variant);
  const progressPercent = stages[currentIndex].value;

  const handleStageAction = (stageKey) => {
    if (interactive && typeof onStageChange === 'function') {
      onStageChange(stageKey);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? '8px' : '12px' }}>
        <div style={{ fontSize: compact ? '11px' : '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </div>
        <div style={{ fontSize: compact ? '11px' : '12px', fontWeight: 800, color: '#047857' }}>
          {progressPercent}%
        </div>
      </div>

      <div style={{ width: '100%', height: compact ? '8px' : '10px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden', marginBottom: compact ? '10px' : '14px' }}>
        <div
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #10B981 0%, #22C55E 100%)',
            borderRadius: '999px',
            transition: 'width 0.3s ease-in-out', boxShadow: '0 6px 16px rgba(16, 185, 129, 0.25)'
          }}
        />
      </div>

      {interactive ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px' }}>
          {stages.map((stage, index) => {
            const isComplete = index < currentIndex || (index === currentIndex && progressPercent >= stage.value);
            const isCurrent = index === currentIndex;
            const isDisabled = index > currentIndex;

            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => handleStageAction(stage.key)}
                disabled={isDisabled}
                style={{
                  border: '1px solid',
                  borderColor: isComplete ? '#10B981' : isCurrent ? '#0EA5E9' : '#CBD5E1',
                  background: isComplete ? '#ECFDF5' : isCurrent ? '#EFF6FF' : '#F8FAFC',
                  color: isComplete ? '#065F46' : isCurrent ? '#1D4ED8' : '#64748B',
                  borderRadius: '10px',
                  padding: '8px 6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.65 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {stage.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {stages.map((stage, index) => {
            const isActive = index <= currentIndex;
            return (
              <span
                key={stage.key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '5px 8px',
                  borderRadius: '999px',
                  fontSize: '10px',
                  fontWeight: 800,
                  background: isActive ? '#ECFDF5' : '#F1F5F9',
                  color: isActive ? '#065F46' : '#64748B',
                  border: `1px solid ${isActive ? '#A7F3D0' : '#E2E8F0'}`
                }}
              >
                {stage.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
