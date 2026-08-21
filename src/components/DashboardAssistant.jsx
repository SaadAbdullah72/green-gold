import React, { useMemo, useState } from 'react';

const knowledgeBase = {
  general: [
    'GreenGold OS helps manage smart bin requests, waste collection, field technician assignments, and recycling operations.',
    'The system is built for customer requests, technician dispatch, waste collection routing, and sustainability tracking.',
    'Use the sidebar navigation to move between the main workflows on each dashboard.'
  ],
  user: [
    'Request a smart bin from the Request Smart Bin tab.',
    'Track all submitted requests under My Requests & Status.',
    'Use Technical Team Contacts to reach the assigned crew after approval.',
    'Waste collection requests can be created for site pickups and partner routing.'
  ],
  technician: [
    'Open Assigned Jobs Queue to see jobs assigned to you.',
    'Each active assignment includes a live timer and the accept button before the response deadline expires.',
    'After accepting, visit the site, complete the installation, and mark the work as completed.',
    'Completed jobs are stored under Completed Jobs History for reporting and follow-up.'
  ],
  collector: [
    'The collector dashboard shows the live route and highest-priority pickups.',
    'Use Mark Collected to confirm a pickup, or Flag Contamination if waste quality needs review.',
    'Map pins and urgency labels help you plan the best route for collection.',
    'Check the notes field for site-specific access or waste handling instructions.'
  ],
  management: [
    'Management approves smart bin requests, assigns workers, and tracks status.',
    'Use the approvals tab to review pending requests and assign technical teams.',
    'Logistics assigns collectors to collected waste, while carbon tracking handles verified batch certification.',
    'Factory reports and site ledgers help monitor performance and compliance.'
  ]
};

function buildAssistantReply(query, dashboardName) {
  const cleaned = query.trim();
  if (!cleaned) {
    return 'Ask me anything about GreenGold OS and I will guide you step by step.';
  }

  const q = cleaned.toLowerCase();

  if (/(hello|hi|hey|good morning|good evening)/.test(q)) {
    return `Hello! I’m your GreenGold OS guide for the ${dashboardName} view. Ask me what you need help with.`;
  }

  if (/(request|smart bin|bin request|allotment)/.test(q)) {
    return 'To request a smart bin, open the Request Smart Bin tab, fill in the location, contact details, bin quantity, and placement address, then submit the request. Management will review it and assign the right technician.';
  }

  if (/(my requests|status|track|history)/.test(q)) {
    return 'Use My Requests & Status to see submitted requests, approval status, assigned crew, and any decline reasons or completion updates.';
  }

  if (/(technical|technician|job|accept|assignment|timer)/.test(q)) {
    return 'On the technician dashboard, review the Assigned Jobs Queue, watch the response timer, click Accept Assignment, then complete the install and mark the work complete when finished.';
  }

  if (/(collector|pickup|route|map|collect|flag contamination)/.test(q)) {
    return 'On the collector route dashboard, use the live map to check priority pickups. Mark Collected after pickup and Flag Contamination if the waste needs review.';
  }

  if (/(management|approve|decline|assign worker|logistics|carbon|factory)/.test(q)) {
    return 'Management can approve requests, assign workers, route logistics, certify carbon credits, and monitor active sites and factory reports from the management dashboard.';
  }

  if (/(login|logout|portal|dashboard)/.test(q)) {
    return 'Use the role-based portal login to access the correct dashboard. Each role sees a tailored workspace and navigation suited to their responsibilities.';
  }

  if (/(waste collection|collection request|request collection)/.test(q)) {
    return 'Request Waste Collection lets a user submit a pickup request for waste removal. The request is routed to a collector and appears in logistics tracking.';
  }

  if (/(carbon|credit|certify|mint)/.test(q)) {
    return 'Carbon certification is handled in the management dashboard. Approved batches are reviewed, then certified and minted into the carbon registry for tracking and reporting.';
  }

  if (/(site|compliance|reports|factory)/.test(q)) {
    return 'The management dashboard tracks factory performance, site ledger compliance, and weekly or monthly recycling KPIs for operational insight.';
  }

  const roleHints = knowledgeBase[dashboardName] || knowledgeBase.general;
  return `I can help with GreenGold OS workflows. A few key things in this view are: ${roleHints.join(' ')} If you want, ask me a more specific question like “How do I request a bin?” or “How do I accept a job?”`;
}

export default function DashboardAssistant({ dashboardName = 'general', accent = '#10B981' }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Hi! I’m the GreenGold guide. I can help you understand this ${dashboardName.toLowerCase()} workspace and walk you through every action.`
    }
  ]);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);

  const dashboardLabel = useMemo(() => {
    if (dashboardName === 'management') return 'Management Dashboard';
    if (dashboardName === 'technician') return 'Technician Dashboard';
    if (dashboardName === 'collector') return 'Collector Dashboard';
    if (dashboardName === 'user') return 'Customer Dashboard';
    return 'GreenGold Dashboard';
  }, [dashboardName]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    const userMessage = { id: String(Date.now()), sender: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setTyping(true);

    window.setTimeout(() => {
      const botReply = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: buildAssistantReply(trimmed, dashboardName)
      };
      setMessages((prev) => [...prev, botReply]);
      setTyping(false);
    }, 600);
  };

  return (
    <>
      <style>{`
        @keyframes greenGoldFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes greenGoldPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 0 16px rgba(16, 185, 129, 0); }
        }

        @keyframes greenGoldChatIn {
          from { opacity: 0; transform: translateY(14px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes greenGoldBlink {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.65); }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '12px'
        }}
      >
        {open && (
          <div
            style={{
              width: '360px',
              maxWidth: 'calc(100vw - 28px)',
              background: 'rgba(255,255,255,0.96)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '22px',
              boxShadow: '0 22px 60px rgba(2, 44, 34, 0.18)',
              overflow: 'hidden',
              backdropFilter: 'blur(12px)',
              animation: 'greenGoldChatIn 0.25s ease-out'
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #064E3B 0%, #0F766E 100%)',
                padding: '14px 16px',
                color: '#F0FDF4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/screen.png" alt="GreenGold assistant" style={{ width: '30px', height: '30px', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>GreenGold Guide</div>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>{dashboardLabel}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  border: 'none',
                  background: 'rgba(255,255,255,0.12)',
                  color: '#F0FDF4',
                  borderRadius: '9px',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 800
                }}
              >
                ×
              </button>
            </div>

            <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '14px 14px 10px', background: '#F8FAFC' }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: '10px'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '82%',
                      background: message.sender === 'user' ? accent : '#FFFFFF',
                      color: message.sender === 'user' ? '#ffffff' : '#0F172A',
                      border: message.sender === 'user' ? 'none' : '1px solid #DDEAE3',
                      borderRadius: message.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      boxShadow: '0 10px 18px rgba(15,23,42,0.04)'
                    }}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {typing && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ background: '#FFFFFF', border: '1px solid #DDEAE3', borderRadius: '16px 16px 16px 4px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accent, display: 'inline-block', animation: 'greenGoldBlink 1s infinite ease-in-out' }} />
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accent, display: 'inline-block', animation: 'greenGoldBlink 1s infinite ease-in-out 0.15s' }} />
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accent, display: 'inline-block', animation: 'greenGoldBlink 1s infinite ease-in-out 0.3s' }} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '12px 12px 14px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSend();
                    }
                  }}
                  placeholder="Ask about GreenGold workflows..."
                  style={{
                    flex: 1,
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    outline: 'none',
                    color: '#0F172A'
                  }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  style={{
                    border: 'none',
                    background: accent,
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '0 14px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          aria-label="Open GreenGold assistant"
          onClick={() => setOpen((prev) => !prev)}
          style={{
            width: '88px',
            height: '88px',
            borderRadius: '50%',
            border: '4px solid rgba(6, 78, 59, 0.9)',
            background: '#ECFDF5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 18px 36px rgba(16, 185, 129, 0.28)',
            animation: 'greenGoldFloat 3s ease-in-out infinite, greenGoldPulse 2.2s ease-in-out infinite',
            padding: 0,
            overflow: 'hidden'
          }}
        >
          <img src="/screen.png" alt="GreenGold assistant mascot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </button>
      </div>
    </>
  );
}
