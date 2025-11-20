/**
 * Azure Communication Services Web Dialer
 * Handles voice calling and DTMF functionality
 */

// Global variables
let callAgent;
let deviceManager;
let call;
let callTimer;
let callStartTime;
let currentNumber = '';

// Azure Communication Services objects
const { CallClient, CallAgent, DeviceManager } = window.AzureCommunicationCalling;

// UI Elements
const statusElement = document.getElementById('status');
const phoneDisplay = document.getElementById('phoneDisplay');
const btnCall = document.getElementById('btnCall');
const btnHangup = document.getElementById('btnHangup');
const callControls = document.getElementById('callControls');
const callTimerElement = document.getElementById('callTimer');
const callNumberElement = document.getElementById('callNumber');
const errorMessageElement = document.getElementById('errorMessage');

/**
 * Initialize the calling client
 */
async function initializeCalling() {
    try {
        updateStatus('Connecting...', 'connecting');

        // Get user token from server
        const response = await fetch('/api/token');
        if (!response.ok) {
            throw new Error('Failed to get access token');
        }

        const { token, userId } = await response.json();
        console.log('Received token for user:', userId);

        // Create CallClient
        const callClient = new CallClient();

        // Create token credential
        const tokenCredential = {
            getToken: async () => token
        };

        // Create CallAgent
        callAgent = await callClient.createCallAgent(tokenCredential, {
            displayName: 'Web Dialer User'
        });

        // Set up call agent event handlers
        callAgent.on('callsUpdated', handleCallsUpdated);
        callAgent.on('incomingCall', handleIncomingCall);

        // Get device manager for microphone access
        deviceManager = await callClient.getDeviceManager();
        await deviceManager.askDevicePermission({ audio: true });

        // Get available microphones
        const microphones = await deviceManager.getMicrophones();
        console.log('Available microphones:', microphones.length);

        updateStatus('Ready to call', 'connected');
        btnCall.disabled = false;

        console.log('Calling client initialized successfully');
    } catch (error) {
        console.error('Error initializing calling client:', error);
        showError('Failed to initialize: ' + error.message);
        updateStatus('Connection failed', 'disconnected');
    }
}

/**
 * Dial pad button handler
 */
function dialPad(digit) {
    currentNumber += digit;
    updateDisplay();

    // If in a call, also send as DTMF
    if (call && call.state === 'Connected') {
        sendDTMF(digit);
    }
}

/**
 * Update phone display
 */
function updateDisplay() {
    if (currentNumber) {
        phoneDisplay.textContent = formatPhoneNumber(currentNumber);
        btnCall.disabled = false;
    } else {
        phoneDisplay.textContent = 'Enter number';
        btnCall.disabled = call ? false : true;
    }
}

/**
 * Format phone number for display
 */
function formatPhoneNumber(number) {
    // Add + prefix if not present and number doesn't start with it
    if (number.length > 0 && number[0] !== '+') {
        return '+' + number;
    }
    return number;
}

/**
 * Clear the entered number
 */
function clearNumber() {
    currentNumber = '';
    updateDisplay();
}

/**
 * Make an outbound call
 */
async function makeCall() {
    try {
        if (!callAgent) {
            throw new Error('Call agent not initialized');
        }

        if (!currentNumber) {
            showError('Please enter a phone number');
            return;
        }

        // Format the number (ensure it starts with +)
        const formattedNumber = formatPhoneNumber(currentNumber);

        console.log('Making call to:', formattedNumber);
        updateStatus('Calling...', 'connecting');
        btnCall.disabled = true;

        // Start the call
        call = callAgent.startCall(
            [{ phoneNumber: formattedNumber }],
            {
                alternateCallerId: { phoneNumber: document.getElementById('myPhoneNumber').textContent }
            }
        );

        // Subscribe to call state changes
        call.on('stateChanged', handleCallStateChanged);
        call.on('idChanged', () => {
            console.log('Call ID changed:', call.id);
        });

        console.log('Call initiated:', call.id);
    } catch (error) {
        console.error('Error making call:', error);
        showError('Failed to make call: ' + error.message);
        updateStatus('Call failed', 'disconnected');
        btnCall.disabled = false;
    }
}

/**
 * Hang up the current call
 */
async function hangupCall() {
    try {
        if (call) {
            console.log('Hanging up call:', call.id);
            await call.hangUp();
        }
    } catch (error) {
        console.error('Error hanging up call:', error);
        showError('Failed to hang up: ' + error.message);
    }
}

/**
 * Handle call state changes
 */
function handleCallStateChanged() {
    console.log('Call state changed to:', call.state);

    switch (call.state) {
        case 'Connected':
            updateStatus('Call connected', 'in-call');
            btnCall.disabled = true;
            btnHangup.disabled = false;
            showCallControls(true);
            startCallTimer();
            callNumberElement.textContent = formatPhoneNumber(currentNumber);
            break;

        case 'Disconnected':
            updateStatus('Call ended', 'connected');
            btnCall.disabled = false;
            btnHangup.disabled = true;
            showCallControls(false);
            stopCallTimer();
            call = null;
            break;

        case 'Ringing':
            updateStatus('Ringing...', 'connecting');
            break;

        case 'Connecting':
            updateStatus('Connecting...', 'connecting');
            break;

        case 'Disconnecting':
            updateStatus('Disconnecting...', 'connecting');
            btnHangup.disabled = true;
            break;

        default:
            console.log('Unknown call state:', call.state);
    }
}

/**
 * Handle incoming calls
 */
function handleIncomingCall(args) {
    console.log('Incoming call from:', args.callerInfo.identifier);

    const incomingCall = args.incomingCall;

    // Auto-answer the call (you can modify this to show a UI prompt)
    updateStatus('Incoming call...', 'connecting');

    // You can implement UI to accept/reject here
    // For now, we'll log it
    console.log('Incoming call received. Call ID:', incomingCall.id);

    // Example: Auto-accept
    // incomingCall.accept().then(() => {
    //     call = incomingCall;
    //     call.on('stateChanged', handleCallStateChanged);
    // });
}

/**
 * Handle calls updated event
 */
function handleCallsUpdated(args) {
    console.log('Calls updated:', args);

    args.added.forEach(call => {
        console.log('Call added:', call.id, 'State:', call.state);
    });

    args.removed.forEach(call => {
        console.log('Call removed:', call.id);
    });
}

/**
 * Send DTMF tone
 */
async function sendDTMF(tone) {
    try {
        if (!call || call.state !== 'Connected') {
            console.log('Cannot send DTMF: no active call');
            return;
        }

        console.log('Sending DTMF tone:', tone);

        // Send the DTMF tone
        await call.sendDtmf(tone);

        // Visual feedback
        const display = document.getElementById('phoneDisplay');
        const originalText = display.textContent;
        display.textContent = `Sent: ${tone}`;
        setTimeout(() => {
            display.textContent = originalText;
        }, 500);

        console.log('DTMF tone sent successfully:', tone);
    } catch (error) {
        console.error('Error sending DTMF:', error);
        showError('Failed to send DTMF tone: ' + error.message);
    }
}

/**
 * Start call timer
 */
function startCallTimer() {
    callStartTime = Date.now();
    callTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        callTimerElement.textContent =
            String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    }, 1000);
}

/**
 * Stop call timer
 */
function stopCallTimer() {
    if (callTimer) {
        clearInterval(callTimer);
        callTimer = null;
    }
    callTimerElement.textContent = '00:00';
}

/**
 * Show/hide call controls
 */
function showCallControls(show) {
    if (show) {
        callControls.classList.add('active');
    } else {
        callControls.classList.remove('active');
    }
}

/**
 * Update status display
 */
function updateStatus(message, type) {
    statusElement.textContent = message;
    statusElement.className = 'status ' + type;
}

/**
 * Show error message
 */
function showError(message) {
    errorMessageElement.textContent = message;
    errorMessageElement.style.display = 'block';
    setTimeout(() => {
        errorMessageElement.style.display = 'none';
    }, 5000);
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Azure Communication Services Web Dialer...');
    initializeCalling();
});

// Keyboard support for dialpad
document.addEventListener('keydown', (event) => {
    const key = event.key;

    // Check if it's a dialpad key
    if (/^[0-9*#]$/.test(key)) {
        dialPad(key);
    } else if (key === 'Backspace') {
        currentNumber = currentNumber.slice(0, -1);
        updateDisplay();
    } else if (key === 'Enter' && !btnCall.disabled) {
        makeCall();
    } else if (key === 'Escape' && !btnHangup.disabled) {
        hangupCall();
    }
});
