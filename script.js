document.addEventListener('DOMContentLoaded', () => {
    // --- LIVE ANALOG CLOCK ---
    const liveClock = {
        elements: {
            clock: document.getElementById('live-clock'),
            hourHand: document.getElementById('clock-hand-hour'),
            minuteHand: document.getElementById('clock-hand-minute'),
            secondHand: document.getElementById('clock-hand-second'),
            digitalText: document.getElementById('digital-clock-text'),
            panel: document.getElementById('clock-panel'),
            panelTime: document.getElementById('panel-time'),
            panelDay: document.getElementById('panel-day'),
            panelDate: document.getElementById('panel-date'),
            panelShift: document.getElementById('panel-shift'),
            panelRemaining: document.getElementById('panel-remaining')
        },

        init() {
            if (!this.elements.clock) return; // Guard

            this.update();
            this.setupEventListeners();

            // Start Loop
            // Using a separate loop for clock to ensure it runs even if stopwatch is paused/stopped
            const loop = () => {
                this.update();
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        },

        setupEventListeners() {
            // Scroll Interaction
            window.addEventListener('scroll', () => this.handleScroll());

            // Click Interaction
            this.elements.clock.addEventListener('click', (e) => {
                // Prevent closing immediately if clicking inside
                e.stopPropagation();
                this.togglePanel();
            });

            // Close panel when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.elements.clock.contains(e.target)) {
                    this.elements.panel.classList.add('hidden');
                    this.elements.panel.classList.remove('visible');
                    this.elements.clock.setAttribute('aria-expanded', 'false');
                }
            });

            // Keydown (Escape to close)
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.elements.panel.classList.add('hidden');
                    this.elements.panel.classList.remove('visible');
                    this.elements.clock.setAttribute('aria-expanded', 'false');
                }
            });
        },

        update() {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();
            const ms = now.getMilliseconds();

            // Rotations
            // Hours: 30deg per hour + 0.5deg per minute
            const hourDeg = ((hours % 12) * 30) + (minutes * 0.5);
            // Minutes: 6deg per minute + 0.1deg per second
            const minuteDeg = (minutes * 6) + (seconds * 0.1);
            // Seconds: 6deg per second (Smooth sweep includes ms)
            const secondDeg = (seconds * 6) + (ms * 0.006);

            this.elements.hourHand.style.transform = `rotate(${hourDeg}deg)`;
            this.elements.minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
            this.elements.secondHand.style.transform = `rotate(${secondDeg}deg)`;

            // Digital Text (Update once per second roughly, but doing every frame is cheap enough here)
            // Format: 2:34 PM
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, '0');
            this.elements.digitalText.textContent = `${displayHours}:${displayMinutes} ${ampm}`;

            // Update Panel if visible
            if (this.elements.panel.classList.contains('visible')) {
                this.updatePanel(now);
            }
        },

        updatePanel(now) {
            // Date string
            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            // Wednesday, January 15, 2025

            this.elements.panelDay.textContent = now.toLocaleDateString('en-US', { weekday: 'long' });
            this.elements.panelDate.textContent = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            this.elements.panelTime.textContent = now.toLocaleTimeString('en-US'); // Includes seconds

            // Shift Logic
            // 6:00 AM – 2:00 PM → "Day Shift (8hr)"
            // 2:00 PM – 10:00 PM → "Evening Shift (8hr)"
            // 10:00 PM – 6:00 AM → "Night Shift (8hr)"

            const currentHour = now.getHours();
            let shiftName = "";
            let shiftEnd = new Date(now);

            if (currentHour >= 6 && currentHour < 14) {
                shiftName = "Day Shift (8hr)";
                shiftEnd.setHours(14, 0, 0, 0);
            } else if (currentHour >= 14 && currentHour < 22) {
                shiftName = "Evening Shift (8hr)";
                shiftEnd.setHours(22, 0, 0, 0);
            } else {
                shiftName = "Night Shift (8hr)";
                // If it's before midnight (e.g. 23:00), end is tomorrow 6am
                // If it's after midnight (e.g. 02:00), end is today 6am
                if (currentHour >= 22) {
                    shiftEnd.setDate(shiftEnd.getDate() + 1);
                    shiftEnd.setHours(6, 0, 0, 0);
                } else {
                    shiftEnd.setHours(6, 0, 0, 0);
                }
            }

            this.elements.panelShift.textContent = shiftName;

            // Remaining Time
            const diffMs = shiftEnd - now;
            if (diffMs > 0) {
                const diffHrs = Math.floor(diffMs / 3600000);
                const diffMins = Math.floor((diffMs % 3600000) / 60000);
                this.elements.panelRemaining.textContent = `${diffHrs}h ${diffMins}m`;
            } else {
                this.elements.panelRemaining.textContent = "Shift Ended";
            }
        },

        togglePanel() {
            const isVisible = this.elements.panel.classList.contains('visible');
            if (isVisible) {
                this.elements.panel.classList.add('hidden');
                this.elements.panel.classList.remove('visible');
                this.elements.clock.setAttribute('aria-expanded', 'false');
            } else {
                this.elements.panel.classList.remove('hidden');
                this.elements.panel.classList.add('visible');
                this.elements.clock.setAttribute('aria-expanded', 'true');
                this.updatePanel(new Date()); // Immediate update
            }
        },

        handleScroll() {
            const scrollY = window.scrollY;
            // logic: 0 to 250px
            // At 0: Fixed top 20px, Left 24px. Size 64px.
            // At 250: Fixed top 12px (center of nav), Left 20px. Size 40px.

            // We use CSS class for the final state, but we can interpolate for smoothness if needed.
            // For simplicity and performance, effectively toggling the class + simple CSS transition
            // matches the requirements well enough, but exact "morphing" usually needs JS calculation
            // if the endpoints aren't compatible with simple class switches.

            // The user req: "Smooth shrink over 200px scroll range".
            // Implementation: We'll set custom properties or use the class. 
            // The class `.scrolled` sets the final state. 
            // Let's toggle it at a threshold, like 50px to start? 

            // Actually, for a *smooth* shrink linked to scroll position (like the hero stopwatch),
            // we should set scale/transform directly.

            if (scrollY > 150) {
                this.elements.clock.classList.add('scrolled');
            } else {
                this.elements.clock.classList.remove('scrolled');
            }
        }
    };
    liveClock.init();

    // --- STOPWATCH LOGIC ---
    const stopwatch = {
        startTime: 0,
        elapsedTime: 0,
        timerInterval: null,
        isRunning: false,
        laps: 0,

        // DOM Elements
        elements: {
            displayMin: document.getElementById('display-min'),
            displaySec: document.getElementById('display-sec'),
            displayMs: document.getElementById('display-ms'),
            secondaryTime: document.getElementById('secondary-time'),
            secondHand: document.getElementById('second-hand'),
            progressRing: document.querySelector('.progress-ring-stroke'),
            // lapCounter removed
            btnStart: document.getElementById('btn-start'),
            btnReset: document.getElementById('btn-reset'),
            btnLap: document.getElementById('btn-lap'),
            iconStart: document.getElementById('icon-start'),
            btnUseTime: document.getElementById('btn-use-time'),
            stickyNav: document.getElementById('sticky-nav'),
            miniTime: document.getElementById('mini-time-display'),
            miniRing: document.querySelector('.mini-stroke'),
            miniBtnStart: document.getElementById('mini-btn-start'),
            miniBtnReset: document.getElementById('mini-btn-reset'),
        },

        init() {
            this.generateTicks();
            this.setupEventListeners();
            this.updateDisplay(0);
        },

        generateTicks() {
            const container = document.getElementById('ticks-container');
            for (let i = 0; i < 60; i++) {
                const tick = document.createElement('div');
                tick.classList.add('tick');
                if (i % 5 === 0) tick.classList.add('major');
                if (i % 15 === 0) tick.classList.add('quarter');
                tick.style.transform = `rotate(${i * 6}deg) translateY(-134px)`; // 142px radius - 8px padding
                container.appendChild(tick);
            }
        },

        setupEventListeners() {
            // Main Controls
            this.elements.btnStart.addEventListener('click', () => this.toggle());
            this.elements.btnReset.addEventListener('click', () => this.reset());
            this.elements.btnLap.addEventListener('click', () => this.lap());
            this.elements.btnUseTime.addEventListener('click', () => this.useTime());

            // Mini Controls
            this.elements.miniBtnStart.addEventListener('click', () => this.toggle());
            this.elements.miniBtnReset.addEventListener('click', () => this.reset());

            // Scroll for Sticky Nav
            window.addEventListener('scroll', () => {
                const scrollY = window.scrollY;
                if (scrollY > 250) {
                    this.elements.stickyNav.classList.add('visible');
                    this.elements.stickyNav.style.transform = 'translateY(0)';
                } else {
                    this.elements.stickyNav.classList.remove('visible');
                    this.elements.stickyNav.style.transform = 'translateY(-100%)';
                }
            });
        },

        toggle() {
            if (this.isRunning) {
                this.pause();
            } else {
                this.start();
            }
        },

        start() {
            if (!this.isRunning) {
                this.startTime = performance.now() - this.elapsedTime;
                this.timerInterval = requestAnimationFrame(this.update.bind(this));
                this.isRunning = true;
                this.updateControls(true);
            }
        },

        pause() {
            if (this.isRunning) {
                cancelAnimationFrame(this.timerInterval);
                this.isRunning = false;
                this.updateControls(false);
            }
        },

        reset() {
            this.pause();
            this.elapsedTime = 0;
            this.updateDisplay(0);
            this.laps = 0;
            // this.elements.lapCounter.textContent = '#00'; // Removed
            this.elements.btnReset.disabled = true;
            this.elements.btnLap.disabled = true;
            this.elements.btnUseTime.classList.add('hidden');

            // Reset Progress Rings
            this.elements.progressRing.style.strokeDashoffset = 917;
            this.elements.miniRing.style.strokeDashoffset = 163;
            this.elements.secondHand.style.transform = `translate(-50%, -100%) rotate(0deg)`;
        },

        lap() {
            this.laps++;
            // this.elements.lapCounter.textContent = `#${this.laps.toString().padStart(2, '0')}`; // Removed
            // Could add lap recording logic here
        },

        update(currentTime) {
            this.elapsedTime = currentTime - this.startTime;
            this.updateDisplay(this.elapsedTime);

            if (this.isRunning) {
                this.timerInterval = requestAnimationFrame(this.update.bind(this));
            }
        },

        updateDisplay(time) {
            // Calculate time components
            const diffInHrs = time / 3600000;
            const hh = Math.floor(diffInHrs);

            const diffInMin = (diffInHrs - hh) * 60;
            const mm = Math.floor(diffInMin);

            const diffInSec = (diffInMin - mm) * 60;
            const ss = Math.floor(diffInSec);

            const diffInMs = (diffInSec - ss) * 100;
            const ms = Math.floor(diffInMs);

            const formattedMM = mm.toString().padStart(2, '0');
            const formattedSS = ss.toString().padStart(2, '0');
            const formattedMS = ms.toString().padStart(2, '0');

            // Update DOM
            this.elements.displayMin.textContent = formattedMM;
            this.elements.displaySec.textContent = formattedSS;
            this.elements.displayMs.textContent = formattedMS;
            this.elements.miniTime.textContent = `${formattedMM}:${formattedSS}`;

            this.elements.secondaryTime.textContent =
                `${hh.toString().padStart(2, '0')}:${formattedMM}:${formattedSS}`;

            // Update Second Hand Rotation (Continuous)
            const totalSeconds = mm * 60 + ss + ms / 100;
            const degrees = totalSeconds * 6; // 6 degrees per second
            this.elements.secondHand.style.transform = `translate(-50%, -100%) rotate(${degrees}deg)`;

            // Update Progress Ring (60s loop)
            // Circumference ~ 917.4
            const progress = (ss + ms / 100) / 60;
            const offset = 917 - (progress * 917);
            this.elements.progressRing.style.strokeDashoffset = offset;

            // Mini Ring
            const miniOffset = 163 - (progress * 163);
            this.elements.miniRing.style.strokeDashoffset = miniOffset;
        },

        updateControls(isRunning) {
            if (isRunning) {
                this.elements.iconStart.classList.replace('fa-play', 'fa-pause');
                this.elements.btnStart.classList.add('paused');
                this.elements.miniBtnStart.innerHTML = '<i class="fa-solid fa-pause"></i>';

                this.elements.btnReset.disabled = false;
                this.elements.btnLap.disabled = false;
                this.elements.btnUseTime.classList.remove('hidden');
            } else {
                this.elements.iconStart.classList.replace('fa-pause', 'fa-play');
                this.elements.btnStart.classList.remove('paused');
                this.elements.miniBtnStart.innerHTML = '<i class="fa-solid fa-play"></i>';
            }
        },

        useTime() {
            // 1. Get current time values
            const mm = parseInt(this.elements.displayMin.textContent);
            const ss = parseInt(this.elements.displaySec.textContent);

            // 2. Create Flying Element
            const timeText = `${this.elements.displayMin.textContent}:${this.elements.displaySec.textContent}`;
            const flyer = document.createElement('div');
            flyer.textContent = timeText;
            flyer.classList.add('flying-value');
            // Make it slightly larger for the main stopwatch
            flyer.style.fontSize = '2rem';
            document.body.appendChild(flyer);

            // 3. Position flyer at current time display (Center of digital time)
            const sourceRect = document.querySelector('.digital-time').getBoundingClientRect();
            flyer.style.top = `${sourceRect.top}px`;
            flyer.style.left = `${sourceRect.left + (sourceRect.width / 2) - 40}px`; // Center align roughly

            // 4. Calculate Target (Inputs)
            // We target the separator of the time inputs
            const targetRow = document.querySelector('.time-inputs-row');
            // Ensure target is visible or at least we know where it is relative to viewport
            // If it's far down, top will be large positive
            const targetRect = targetRow.getBoundingClientRect();

            // 5. Animate Flight
            requestAnimationFrame(() => {
                // Calculate delta
                const deltaX = targetRect.left + (targetRect.width / 2) - sourceRect.left - (sourceRect.width / 2) + 40; // Adjust for centering
                const deltaY = targetRect.top - sourceRect.top;

                flyer.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.4)`; // Scale down to match input size
                flyer.style.opacity = '0';
            });

            // 6. Scroll to inputs (after short delay to separate visual actions slightly)
            setTimeout(() => {
                document.querySelector('.input-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);

            // 7. On Arrival (500ms matches CSS transition)
            setTimeout(() => {
                // Populate Calculator Inputs
                document.getElementById('time-min').value = mm;
                document.getElementById('time-sec').value = ss;

                // Remove Flyer
                flyer.remove();

                // Highlight inputs
                const row = document.querySelector('.time-inputs-row');
                row.style.borderColor = '#63B3ED';
                row.style.boxShadow = '0 0 15px rgba(99, 179, 237, 0.4)';

                // Visual feedback checkmark inside the input temporarily? 
                // Or just flash the border (already doing that).

                setTimeout(() => {
                    row.style.borderColor = '';
                    row.style.boxShadow = '';
                }, 1000);

            }, 500);
        }
    };

    // Initialize Stopwatch
    stopwatch.init();

    // --- DOWNTIME MINI STOPWATCH LOGIC ---
    const downtimeStopwatch = {
        startTime: 0,
        elapsedTime: 0,
        timerInterval: null,
        isRunning: false,

        elements: {
            container: document.getElementById('dt-stopwatch'),
            timeDisplay: document.querySelector('.dt-time'),
            btnToggle: document.querySelector('.dt-btn-toggle'),
            btnReset: document.querySelector('.dt-btn-reset'),
            progressBar: document.querySelector('.dt-progress-bar'),
            btnApply: document.querySelector('.dt-btn-apply'),
            icon: document.querySelector('.dt-icon'),
            inputs: {
                min: document.getElementById('downtime-min'),
                sec: document.getElementById('downtime-sec')
            }
        },

        init() {
            this.setupEventListeners();
        },

        setupEventListeners() {
            this.elements.btnToggle.addEventListener('click', () => this.toggle());
            this.elements.btnReset.addEventListener('click', () => this.reset());
            this.elements.btnApply.addEventListener('click', () => this.applyTime());
        },

        toggle() {
            if (this.isRunning) {
                this.pause();
            } else {
                this.start();
            }
        },

        start() {
            if (!this.isRunning) {
                this.startTime = performance.now() - this.elapsedTime;
                this.timerInterval = requestAnimationFrame(this.update.bind(this));
                this.isRunning = true;

                // UI Updates
                this.elements.container.classList.add('running');
                this.elements.container.classList.remove('paused');
                this.elements.btnToggle.innerHTML = '<i class="fa-solid fa-pause"></i>';
                this.elements.btnToggle.setAttribute('aria-label', 'Pause Downtime Timer');
                this.elements.btnReset.disabled = false;
                this.elements.btnApply.classList.remove('visible'); // Hide apply when running
            }
        },

        pause() {
            if (this.isRunning) {
                cancelAnimationFrame(this.timerInterval);
                this.isRunning = false;

                // UI Updates
                this.elements.container.classList.remove('running');
                this.elements.container.classList.add('paused');
                this.elements.btnToggle.innerHTML = '<i class="fa-solid fa-play"></i>';
                this.elements.btnToggle.setAttribute('aria-label', 'Resume Downtime Timer');

                // Show Apply if time > 0
                if (this.elapsedTime > 0) {
                    this.elements.btnApply.classList.add('visible');
                }
            }
        },

        reset() {
            this.pause();
            this.elapsedTime = 0;
            this.updateDisplay(0);

            // UI Updates
            this.elements.container.classList.remove('running', 'paused');
            this.elements.btnReset.disabled = true;
            this.elements.btnApply.classList.remove('visible');
            this.elements.progressBar.style.width = '0%';

            // Icon Reset
            this.elements.icon.style.animation = 'none';
        },

        update(currentTime) {
            this.elapsedTime = currentTime - this.startTime;
            this.updateDisplay(this.elapsedTime);

            if (this.isRunning) {
                this.timerInterval = requestAnimationFrame(this.update.bind(this));
            }
        },

        updateDisplay(time) {
            const totalSeconds = Math.floor(time / 1000);
            const mm = Math.floor(totalSeconds / 60);
            const ss = totalSeconds % 60;

            const formattedMM = mm.toString().padStart(2, '0');
            const formattedSS = ss.toString().padStart(2, '0');

            this.elements.timeDisplay.textContent = `${formattedMM}:${formattedSS}`;

            // Progress bar (fills every 60s)
            const progress = (this.elapsedTime % 60000) / 60000 * 100;
            this.elements.progressBar.style.width = `${progress}%`;
        },

        applyTime() {
            const timeText = this.elements.timeDisplay.textContent;
            const [mm, ss] = timeText.split(':').map(val => parseInt(val));

            // 1. Create Flying Element
            const flyer = document.createElement('div');
            flyer.textContent = timeText;
            flyer.classList.add('flying-value');
            document.body.appendChild(flyer);

            // Position flyer at current time display
            const rect = this.elements.timeDisplay.getBoundingClientRect();
            flyer.style.top = `${rect.top}px`;
            flyer.style.left = `${rect.left}px`;

            // 2. Animate Flight to Inputs
            // Target: Center of downtime inputs
            const targetMin = this.elements.inputs.min.getBoundingClientRect();
            const targetSec = this.elements.inputs.sec.getBoundingClientRect();

            // Simplified flight: fly to the separator
            const separator = document.querySelector('#downtime-inputs-row .time-separator').getBoundingClientRect();

            requestAnimationFrame(() => {
                flyer.style.transform = `translate(${separator.left - rect.left}px, ${separator.top - rect.top}px) scale(0.5)`;
                flyer.style.opacity = '0';
            });

            // 3. On Arrival (500ms)
            setTimeout(() => {
                // Populate Inputs
                this.elements.inputs.min.value = mm;
                this.elements.inputs.sec.value = ss;

                // Remove Flyer
                flyer.remove();

                // Highlight Inputs
                const row = document.getElementById('downtime-inputs-row');
                row.style.borderColor = '#63B3ED';
                row.style.boxShadow = '0 0 15px rgba(99, 179, 237, 0.4)';

                // Show Checkmark in Stopwatch
                const originalTime = this.elements.timeDisplay.textContent;
                this.elements.timeDisplay.innerHTML = '<span style="color: #48BB78"><i class="fa-solid fa-check"></i></span>';

                setTimeout(() => {
                    row.style.borderColor = '';
                    row.style.boxShadow = '';
                    this.reset(); // Auto reset after apply
                    this.elements.timeDisplay.textContent = '00:00';
                }, 1000);

            }, 500);
        }
    };

    downtimeStopwatch.init();

    // --- EXISTING CALCULATOR LOGIC ---
    // DOM Elements
    const piecesInput = document.getElementById('pieces');

    // Time Inputs (Group 1)
    const timeMinInput = document.getElementById('time-min');
    const timeSecInput = document.getElementById('time-sec');

    // Downtime Inputs (Group 2)
    const downtimeMinInput = document.getElementById('downtime-min');
    const downtimeSecInput = document.getElementById('downtime-sec');
    const downtimeFreqInput = document.getElementById('downtime-freq');

    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultsArea = document.getElementById('results-area');

    // Result Elements (New 6-Card System)
    const resCycleTime = document.getElementById('res-cycle-time');
    const resCycleFormatted = document.getElementById('res-cycle-formatted');

    const res8hrOutput = document.getElementById('res-8hr-output');
    const target8hr = document.getElementById('target-8hr');

    const res11hrOutput = document.getElementById('res-11hr-output');
    const target11hr = document.getElementById('target-11hr');

    const resRateMin = document.getElementById('res-rate-min');
    const resRateHr = document.getElementById('res-rate-hr');

    const resEfficiency = document.getElementById('res-efficiency');

    // Constants
    const SHIFT_8_SEC = 28800; // 8 hours * 3600
    const SHIFT_11_SEC = 39600; // 11 hours * 3600

    function validateInputs() {
        const pieces = parseInt(piecesInput.value) || 0;
        if (pieces <= 0) {
            alert("Please enter a valid number of pieces produced (greater than 0).");
            return false;
        }

        // Check if at least some time is entered
        const min = parseInt(timeMinInput.value) || 0;
        const sec = parseInt(timeSecInput.value) || 0;

        if (min === 0 && sec === 0) {
            alert("Please enter the time taken (Minutes or Seconds).");
            return false;
        }

        return true;
    }

    function calculate() {
        playClickSound(); // Play sound on click
        if (!validateInputs()) return;

        // 1. Calculate Raw Cycle Time
        const pieces = parseInt(piecesInput.value);
        const timeMin = parseInt(timeMinInput.value) || 0;
        const timeSec = parseInt(timeSecInput.value) || 0;

        const totalObservedSeconds = (timeMin * 60) + timeSec;
        const rawCycleTime = totalObservedSeconds / pieces;

        // 2. Calculate Downtime Impact
        const dtMin = parseInt(downtimeMinInput.value) || 0;
        const dtSec = parseInt(downtimeSecInput.value) || 0;
        const dtFreq = parseInt(downtimeFreqInput.value) || 0;

        let downtimeImpactPerPiece = 0;
        if (dtFreq > 0 && (dtMin > 0 || dtSec > 0)) {
            const totalDowntimeSeconds = (dtMin * 60) + dtSec;
            downtimeImpactPerPiece = totalDowntimeSeconds / dtFreq;
        }

        // 3. Effective Cycle Time
        const effectiveCycleTime = rawCycleTime + downtimeImpactPerPiece;

        // 4. Projections
        // Actual output based on effective cycle time (with downtime)
        const output8hr = Math.floor(SHIFT_8_SEC / effectiveCycleTime);
        const output11hr = Math.floor(SHIFT_11_SEC / effectiveCycleTime);

        // Targets (Theoretical Max - based on RAW cycle time without downtime)
        // This shows what COULD be achieved if there were no downtime
        const safeRawCycle = rawCycleTime > 0 ? rawCycleTime : 1;
        const targetOutput8hr = Math.floor(SHIFT_8_SEC / safeRawCycle);
        const targetOutput11hr = Math.floor(SHIFT_11_SEC / safeRawCycle);

        // 4. Update UI

        // Show Results Area first so animations work on visible elements
        resultsArea.classList.remove('hidden');

        // Activate cards for simple CSS animations if any
        document.querySelectorAll('.output-card').forEach(card => card.classList.add('active'));

        // Cycle Time
        animateValue(resCycleTime, 0, rawCycleTime, 1000, 2);
        resCycleFormatted.textContent = `${rawCycleTime.toFixed(2)}s`;

        // 8-Hour Output
        animateValue(res8hrOutput, 0, output8hr, 1200, 0);
        target8hr.textContent = targetOutput8hr.toLocaleString();

        // 11-Hour Output
        animateValue(res11hrOutput, 0, output11hr, 1400, 0);
        target11hr.textContent = targetOutput11hr.toLocaleString();

        // Production Rate
        // If effective cycle time is very high, rate is low.
        const ratePerMin = effectiveCycleTime > 0 ? (60 / effectiveCycleTime) : 0;
        const ratePerHr = effectiveCycleTime > 0 ? (3600 / effectiveCycleTime) : 0;
        animateValue(resRateMin, 0, ratePerMin, 1000, 2);
        resRateHr.textContent = Math.round(ratePerHr).toLocaleString();

        // Efficiency (OEE Estimate: Actual / Theoretical)
        // Efficiency = (Theoretical Max Output / Actual Output) * 100 OR (Raw Cycle / Effective Cycle) * 100
        let efficiency = 0;
        if (effectiveCycleTime > 0) {
            efficiency = (rawCycleTime / effectiveCycleTime) * 100;
        }
        animateValue(resEfficiency, 0, efficiency, 1000, 2);

        // Scroll to results on mobile
        if (window.innerWidth < 600) {
            resultsArea.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function playClickSound() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        try {
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    }

    function animateValue(obj, start, end, duration, decimals = 0) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Easing function (easeOutExpo)
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const currentVal = (easeProgress * (end - start) + start);

            if (decimals === 0) {
                obj.innerHTML = Math.floor(currentVal).toLocaleString();
            } else {
                obj.innerHTML = currentVal.toFixed(decimals);
            }

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function reset() {
        piecesInput.value = '';
        timeMinInput.value = '';
        timeSecInput.value = '';
        downtimeMinInput.value = '';
        downtimeSecInput.value = '';
        downtimeFreqInput.value = '';

        resultsArea.classList.add('hidden');
        document.querySelectorAll('.output-card').forEach(card => card.classList.remove('active'));
    }

    // Event Listeners
    if (calculateBtn) calculateBtn.addEventListener('click', calculate);
    if (resetBtn) resetBtn.addEventListener('click', reset);
});
