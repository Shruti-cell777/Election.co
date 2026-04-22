// Main Application Logic
import './style.css';

// --- State & Setup ---
let isVoiceEnabled = false;
let currentStep = 'initial'; // Flow control
let userData = { name: '', identifier: '' };

// DOM Elements
const elements = {
  chatMessages: document.getElementById('chat-messages'),
  userInput: document.getElementById('user-input'),
  sendBtn: document.getElementById('send-btn'),
  voiceToggle: document.getElementById('voice-toggle'),
  attachBtn: document.getElementById('attach-btn'),
  fileUpload: document.getElementById('file-upload'),
  typingIndicator: document.getElementById('typing-indicator'),
};

// SVG Icons
const icons = {
  bot: `🗳️`,
  user: `👤`
};

// Initialize SpeechSynthesis
const synth = window.speechSynthesis;

// --- Utility Functions ---

function toggleVoice() {
  isVoiceEnabled = !isVoiceEnabled;
  elements.voiceToggle.classList.toggle('active', isVoiceEnabled);
  
  if (isVoiceEnabled) {
    if(synth.speaking) synth.cancel(); // Reset
    speakMessage("Voice assistant activated.");
  } else {
    synth.cancel();
  }
}

function speakMessage(text) {
  if (!isVoiceEnabled || !text) return;
  // Use a slight timeout to let DOM updates happen first
  setTimeout(() => {
    if(synth.speaking) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Optional: Set specific voice/language settings here
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    synth.speak(utterance);
  }, 100);
}

function scrollToBottom() {
  const container = document.querySelector('.chat-container');
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  elements.typingIndicator.classList.remove('hidden');
  scrollToBottom();
}

function hideTyping() {
  elements.typingIndicator.classList.add('hidden');
}

// --- UI Rendering Functions ---

/**
 * Adds a standard text message to the chat
 * @param {string} text - Message content
 * @param {string} sender - 'user' or 'system'
 * @param {number} delay - delay in ms before showing
 */
function addMessage(text, sender = 'system', delay = 0) {
  return new Promise(resolve => {
    if (sender === 'system' && delay > 0) {
      showTyping();
    }
    
    setTimeout(() => {
      if (sender === 'system') hideTyping();
      
      const wrapper = document.createElement('div');
      wrapper.className = `message-wrapper ${sender}`;
      
      const avatarStr = sender === 'system' ? icons.bot : icons.user;
      
      wrapper.innerHTML = `
        <div class="message-avatar">${avatarStr}</div>
        <div class="message-content">
          <div class="message-bubble">${text}</div>
        </div>
      `;
      
      // Insert message
      elements.chatMessages.appendChild(wrapper);
      scrollToBottom();
      
      if (sender === 'system') {
        speakMessage(text);
      }
      
      resolve(wrapper);
    }, delay);
  });
}

/**
 * Appends action chips under a specific message
 * @param {HTMLElement} messageWrapper - The wrapper to append actions to
 * @param {Array<{label: string, action: string}>} actions 
 */
function addActions(messageWrapper, actions) {
  const contentDiv = messageWrapper.querySelector('.message-content');
  const actionContainer = document.createElement('div');
  actionContainer.className = 'action-buttons';
  
  actions.forEach(act => {
    const btn = document.createElement('button');
    btn.className = 'chip-btn';
    btn.textContent = act.label;
    btn.onclick = () => handleAction(act.action, act.label);
    actionContainer.appendChild(btn);
  });
  
  contentDiv.appendChild(actionContainer);
  scrollToBottom();
}

/**
 * Appends a custom HTML card to a message
 */
function addCard(messageWrapper, cardHTML) {
  const contentDiv = messageWrapper.querySelector('.message-content');
  const cardDiv = document.createElement('div');
  cardDiv.innerHTML = cardHTML;
  contentDiv.appendChild(cardDiv);
  scrollToBottom();
}

// --- Specific Card Renderers ---

function getVoterSlipCard(data) {
  const { name, slipNo, booth, time, crowd } = data;
  let crowdDot = 'low';
  if(crowd === 'Medium') crowdDot = 'medium';
  if(crowd === 'High') crowdDot = 'high';

  return `
    <div class="info-card">
      <div class="card-header">
        <div class="card-title">🗳️ Digital Voter Slip</div>
        <div class="status-badge active">Verified</div>
      </div>
      <div class="card-body">
        <div class="info-row">
          <span class="info-label">Elector Name</span>
          <span class="info-value">${name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">EPIC No.</span>
          <span class="info-value">${slipNo}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Polling Station</span>
          <span class="info-value">${booth}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Smart Insight</span>
          <span class="info-value" style="display:flex; flex-direction:column;">
            <span>Best Time: ${time}</span>
            <span class="crowd-indicator">
              <span class="dot ${crowdDot}"></span> Live Crowd: ${crowd}
            </span>
          </span>
        </div>
        <a href="#" class="card-link" onclick="event.preventDefault(); alert('Opening Maps...')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          Navigate to Booth
        </a>
      </div>
    </div>
  `;
}

function getIssueCard(issueType) {
  return `
    <div class="info-card" style="border-color: rgba(245, 158, 11, 0.4);">
      <div class="card-header">
        <div class="card-title" style="color: var(--warning)">⚠️ Action Required</div>
      </div>
      <div class="card-body">
        <p style="font-size: 0.9em; margin-bottom: 8px;">It seems your name is missing from the active electoral roll.</p>
        <div class="info-row">
          <span class="info-label">Resolution Steps:</span>
          <span class="info-value" style="font-size: 0.85em; color: var(--text-secondary);">
            1. Submit Form 6 for New Registration.<br>
            2. Submit Form 8 for Shifting Residence.
          </span>
        </div>
        <a href="#" class="card-link" onclick="event.preventDefault(); alert('Redirecting to Form 6...')">File Form 6 Online ↗</a>
      </div>
    </div>
  `;
}

// --- Workflow Logic ---

async function initChat() {
  const msg = await addMessage("Hi! I am your AI Election Assistant. I can help you check your voter status, fetch your smart digital voter slip, or find polling details.", 'system', 500);
  
  addActions(msg, [
    { label: "Check Voter Status", action: "action_check_status" },
    { label: "Find Polling Booth", action: "action_find_booth" },
    { label: "🔊 Enable Voice Alerts", action: "action_enable_voice" },
    { label: "Outstation/Remote Voting", action: "action_remote" }
  ]);
}

async function handleAction(actionId, labelText) {
  if (labelText) {
    addMessage(labelText, 'user');
  }

  if (actionId === 'action_check_status' || actionId === 'action_find_booth') {
    currentStep = 'awaiting_id';
    await addMessage("Please enter your EPIC (Voter ID) number, Aadhaar number, or upload a photo of your ID using the attachment icon.", 'system', 600);
  } else if (actionId === 'action_enable_voice') {
    isVoiceEnabled = true;
    elements.voiceToggle.classList.add('active');
    setTimeout(() => speakMessage("Voice alerts enabled. I will read important alerts out loud from now on."), 100);
    await addMessage("Voice alerts enabled! I will automatically read important alerts out loud.", 'system', 500);
  } else if (actionId === 'action_play_alert') {
    // Explicit Voice Alert Override
    let tempStatus = isVoiceEnabled;
    isVoiceEnabled = true; // force enable just for this click
    speakMessage(`Alert! You are legally required to cast your vote between 1 PM and 3 PM. Your destination is Government School, Sector 14, Booth 45.`);
    isVoiceEnabled = tempStatus; // restore status
  } else if (actionId === 'action_remote') {
    currentStep = 'initial';
    const msg = await addMessage("For Outstation Voting, you may fill Form 12A for Election Duty Certificate or apply for postal ballot if eligible. Would you like me to guide you through registration transfer?", 'system', 800);
    addActions(msg, [
      { label: "Transfer Registration", action: "action_transfer" },
      { label: "Main Menu", action: "action_main_menu" }
    ]);
  } else if (actionId === 'action_transfer') {
    await addMessage("To transfer your constituency, you will need to file Form 8. Let me know when you are ready to begin.", 'system', 800);
  } else if (actionId === 'action_main_menu') {
    elements.chatMessages.innerHTML = '';
    initChat();
  }
}

async function processUserInput(input) {
  if (!input.trim()) return;
  
  addMessage(input, 'user');
  elements.userInput.value = '';
  
  if (currentStep === 'awaiting_id') {
    // Simulate Fetching
    const fetchMsg1 = await addMessage("Fetching data from the Electoral Roll...", 'system', 800);
    
    setTimeout(async () => {
      // Logic Hook: We simulate scenarios based on user input length
      if (input.toLowerCase().includes('fail') || input.includes('000')) {
        // Mock Failure case
        const failMsg = await addMessage("We couldn't find an active record matching that ID in the current constituency.", 'system', 500);
        speakMessage("Warning. If your name is not in the electoral roll, you will NOT be able to vote.");
        addCard(failMsg, getIssueCard('missing'));
        
        const followUp = await addMessage("What would you like to do next?", 'system', 1000);
        addActions(followUp, [
           { label: "Try another ID", action: "action_check_status" },
           { label: "Main Menu", action: "action_main_menu" }
        ]);

      } else {
        // Mock Success case
        const nameMock = "Shruti Sharma"; // Placeholder logic 
        userData.name = nameMock;
        
        const alertMsg = `✅ Status Verified! Hello ${nameMock}. \n\n⚠️ VOTING ALERT: You must cast your vote between 1:00 PM and 3:00 PM. \n📍 Destination: Government School, Sector 14, Booth 45. \nOptions to generate your digital slip and view live crowd insights are now available below.`;
        
        const successMsg = await addMessage(alertMsg, 'system', 600);
        
        // Add Voter Slip Card
        addCard(successMsg, getVoterSlipCard({
          name: nameMock,
          slipNo: input.toUpperCase(),
          booth: 'Govt. School, Sec 14, Booth 45',
          time: '1:00 PM - 3:00 PM',
          crowd: 'Low'
        }));

        currentStep = 'options_after_success';
        const nextMsg = await addMessage("Please choose a slip generation or navigation option:", 'system', 1500);
        addActions(nextMsg, [
           { label: "🔊 Play Voice Alert", action: "action_play_alert" },
           { label: "Generate Slip (PDF)", action: "action_download" },
           { label: "Main Menu", action: "action_main_menu" }
        ]);
      }
    }, 1500);
    
  } else if (currentStep === 'options_after_success') {
      await addMessage("Generating PDF...", 'system', 500);
      setTimeout(() => {
        addMessage("Voter slip downloaded successfully! Check your device folders.", 'system', 1000);
      }, 2000);
  } else {
    // Fallback conversational
    await addMessage("I'm sorry, I didn't quite catch that. Could you please select an option from earlier?", 'system', 600);
  }
}

// --- Input Handlers ---

elements.sendBtn.addEventListener('click', () => {
  processUserInput(elements.userInput.value);
});

elements.userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    processUserInput(elements.userInput.value);
  }
});

elements.voiceToggle.addEventListener('click', toggleVoice);

// Document Upload Simulation
elements.attachBtn.addEventListener('click', () => {
  elements.fileUpload.click();
});

elements.fileUpload.addEventListener('change', async (e) => {
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    addMessage(`Uploaded document: ${file.name}`, 'user');
    
    if (currentStep === 'awaiting_id') {
      const msg = await addMessage("Running OCR to extract ID details...", 'system', 1000);
      
      setTimeout(() => {
        addMessage("Extracted successfully. Processing verification...", 'system', 1000);
        // Feed mock data to simulate ID extraction processing
        processUserInput("EPIC1234567"); 
      }, 2000);
    } else {
      addMessage("I've received your document, but I don't need it right now. Let me know what you want to do.", 'system', 1000);
    }
  }
});

// Initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChat);
} else {
  initChat();
}
