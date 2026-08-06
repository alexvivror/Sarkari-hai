/**
 * Sarkari Hai - Main Application JavaScript
 * Puter.js AI Integration for Government Job Portal
 */

// Global state
const App = {
  posts: [],
  categories: [],
  currentTheme: 'light',
  chatHistory: [],
  isProcessing: false,

  // Initialize app
  async init() {
    this.loadTheme();
    this.bindEvents();
    await this.loadPosts();
    this.renderAll();
    this.initTicker();
    this.initDarkMode();
    this.initProxy();
  },

  // Theme management
  loadTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.currentTheme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', this.currentTheme === 'dark');
    this.updateDarkIcon();
  },

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', this.currentTheme === 'dark');
    localStorage.setItem('theme', this.currentTheme);
    this.updateDarkIcon();
  },

  updateDarkIcon() {
    const icon = document.getElementById('darkIcon');
    if (icon) icon.textContent = this.currentTheme === 'dark' ? 'light_mode' : 'dark_mode';
  },

  // Event bindings
  bindEvents() {
    // Dark mode toggle
    const darkToggle = document.getElementById('darkToggle');
    if (darkToggle) darkToggle.addEventListener('click', () => this.toggleTheme());

    // Mobile menu toggle (if needed)
    // Search form
    const searchForm = document.querySelector('.searchbar');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        // Let form submit normally to search.html
      });
    }

    // AI Search input
    const aiSearchInput = document.getElementById('ai-search-input');
    const aiSearchBtn = document.getElementById('ai-search-btn');
    if (aiSearchInput && aiSearchBtn) {
      aiSearchBtn.addEventListener('click', () => this.handleAISearch());
      aiSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleAISearch();
      });
      aiSearchInput.addEventListener('input', (e) => this.showSearchSuggestions(e.target.value));
    }

    // Search suggestions
    document.querySelectorAll('.suggestion').forEach(el => {
      el.addEventListener('click', () => {
        const query = el.dataset.query;
        document.getElementById('ai-search-input').value = query;
        this.handleAISearch();
      });
    });

    // AI Chat dialog
    this.bindChatEvents();

    // Tool dialog
    this.bindToolEvents();

    // Tool buttons in hero
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => this.openTool(btn.dataset.tool));
    });

    // Feature buttons
    document.querySelectorAll('.feature-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', () => this.openTool(btn.dataset.action));
    });

    // Newsletter form
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (e) => this.handleNewsletter(e));
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Back to top button
    this.initBackToTop();

    // Delegate clicks for dynamic elements
    document.addEventListener('click', (e) => {
      // Category cards
      if (e.target.closest('.category-card')) {
        const link = e.target.closest('.category-card').href;
        if (link) window.location.href = link;
      }
      // Job cards
      if (e.target.closest('.job-card')) {
        const link = e.target.closest('.job-card').querySelector('.job-title');
        if (link) window.location.href = link.href;
      }
    });
  },

  // AI Chat Dialog
  bindChatEvents() {
    const chatDialog = document.getElementById('ai-chat-dialog');
    const closeChat = document.getElementById('close-chat');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');

    if (closeChat) closeChat.addEventListener('click', () => chatDialog.close());

    if (chatForm) {
      chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;
        chatInput.value = '';
        await this.sendChatMessage(message);
      });
    }

    // Open chat from hero
    const chatBtn = document.querySelector('[data-tool="chat"]');
    if (chatBtn) {
      chatBtn.addEventListener('click', () => {
        chatDialog.showModal();
        chatInput.focus();
      });
    }
  },

  // Tool Dialog
  bindToolEvents() {
    const toolDialog = document.getElementById('tool-dialog');
    const closeTool = document.getElementById('close-tool');
    if (closeTool) closeTool.addEventListener('click', () => toolDialog.close());

    // Tool-specific forms
    this.bindToolForms();
  },

  bindToolForms() {
    // Resume Builder
    const resumeForm = document.getElementById('resume-form');
    if (resumeForm) {
      resumeForm.addEventListener('submit', (e) => this.handleResumeBuilder(e));
    }

    // Cover Letter
    const coverForm = document.getElementById('cover-letter-form');
    if (coverForm) {
      coverForm.addEventListener('submit', (e) => this.handleCoverLetter(e));
    }

    // Interview Prep
    const interviewForm = document.getElementById('interview-form');
    if (interviewForm) {
      interviewForm.addEventListener('submit', (e) => this.handleInterviewPrep(e));
    }

    // Study Plan
    const studyForm = document.getElementById('study-plan-form');
    if (studyForm) {
      studyForm.addEventListener('submit', (e) => this.handleStudyPlan(e));
    }

    // Job Matcher
    const matcherForm = document.getElementById('job-matcher-form');
    if (matcherForm) {
      matcherForm.addEventListener('submit', (e) => this.handleJobMatcher(e));
    }

    // Cutoff Predictor
    const cutoffForm = document.getElementById('cutoff-form');
    if (cutoffForm) {
      cutoffForm.addEventListener('submit', (e) => this.handleCutoffPredictor(e));
    }
  },

  // Chat handling
  async sendChatMessage(message) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    // Add user message
    this.addChatMessage(message, 'user');

    // Show typing indicator
    const typingId = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = typingId;
    typingDiv.className = 'chat-message assistant';
    typingDiv.innerHTML = `
      <div class="avatar" style="background: var(--primary-soft); color: var(--primary);">
        <span class="material-symbols-outlined">smart_toy</span>
      </div>
      <div class="content"><span class="typing-indicator"><span></span><span></span><span></span></div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      // Call Puter.ai.chat
      const response = await puter.ai.chat(message, {
        model: 'gpt-5.4-nano',
        temperature: 0.7,
        max_tokens: 500
      });

      // Remove typing indicator
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      // Add assistant response
      const responseText = response?.text || response?.content || 'Sorry, I could not generate a response.';
      this.addChatMessage(responseText, 'assistant');

    } catch (error) {
      console.error('Chat error:', error);
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();
      this.addChatMessage('Sorry, I encountered an error. Please try again.', 'assistant');
    } finally {
      this.isProcessing = false;
    }
  },

  addChatMessage(text, role) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `chat-message ${role}`;
    const avatarIcon = role === 'assistant' ? 'smart_toy' : 'person';
    const avatarColor = role === 'assistant' ? 'var(--primary-soft)' : 'var(--surface-2)';
    const avatarColorText = role === 'assistant' ? 'var(--primary)' : 'var(--muted)';

    div.innerHTML = `
      <div class="avatar" style="background: ${avatarColor}; color: ${avatarColorText};">
        <span class="material-symbols-outlined">${role === 'assistant' ? 'smart_toy' : 'person'}</span>
      </div>
      <div class="content">${this.escapeHtml(text)}</div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  // Tool handlers
  openTool(toolName) {
    const dialog = document.getElementById('tool-dialog');
    const titleEl = document.getElementById('tool-title-text');
    const iconEl = document.getElementById('tool-icon');
    const contentEl = document.getElementById('tool-content');

    const tools = {
      chat: { title: 'AI Assistant', icon: 'smart_toy', content: this.getChatToolHTML() },
      resume: { title: 'Resume Builder', icon: 'description', content: this.getResumeBuilderHTML() },
      'cover-letter': { title: 'Cover Letter Generator', icon: 'mail', content: this.getCoverLetterHTML() },
      interview: { title: 'Interview Prep', icon: 'record_voice_over', content: this.getInterviewHTML() },
      'study-plan': { title: 'Study Plan Generator', icon: 'schedule', content: this.getStudyPlanHTML() },
      'job-matcher': { title: 'Job Matcher', icon: 'psychology', content: this.getJobMatcherHTML() },
      cutoff: { title: 'Cutoff Predictor', icon: 'insights', content: this.getCutoffHTML() },
      compare: { title: 'Exam Comparison', icon: 'compare', content: this.getCompareHTML() }
    };

    const tool = tools[toolName] || tools.chat;
    document.getElementById('tool-title-text').textContent = tool.title;
    iconEl.textContent = tool.icon;
    document.getElementById('tool-content').innerHTML = tool.content;
    document.getElementById('tool-dialog').showModal();

    // Re-bind forms after content is inserted
    this.bindToolForms();
  },

  // Tool HTML generators
  getChatToolHTML() {
    return `
      <div class="tool-chat-mini">
        <div id="mini-chat-messages" class="mini-chat-messages"></div>
        <form id="mini-chat-form" class="mini-chat-form">
          <input type="text" id="mini-chat-input" placeholder="Ask me anything..." placeholder="Ask me anything..." autocomplete="off">
          <button type="submit" class="send-btn"><span class="material-symbols-outlined">send</span></button>
        </form>
      </div>
      <script>
        (function() {
          const form = document.getElementById('mini-chat-form');
          const input = document.getElementById('mini-chat-input');
          const container = document.getElementById('mini-chat-messages');
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = input.value.trim();
            if (!msg) return;
            input.value = '';
            const userDiv = document.createElement('div');
            userDiv.className = 'chat-message user';
            userDiv.innerHTML = '<div class="content">' + msg.replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>') + '</div>';
            container.appendChild(userDiv);
            container.scrollTop = container.scrollHeight;
            try {
              const response = await puter.ai.chat(msg, { model: 'gpt-5.4-nano', max_tokens: 300 });
              const respDiv = document.createElement('div');
              respDiv.className = 'chat-message assistant';
              respDiv.innerHTML = '<div class="content">' + (response?.text || response?.content || 'Error') + '</div>';
              container.appendChild(respDiv);
              container.scrollTop = container.scrollHeight;
            } catch (err) {
              console.error(err);
            }
          });
        })();
      </script>
    `;
  },

  getResumeBuilderHTML() {
    return `
      <form id="resume-form" class="tool-form">
        <div class="form-group"><label>Full Name</label><input type="text" name="name" required placeholder="Your full name"></div>
        <div class="form-group"><label>Email</label><input type="email" name="email" required placeholder="your@email.com"></div>
        <div class="form-group"><label>Phone</label><input type="tel" name="phone" placeholder="+91-XXXXXXXXXX"></div>
        <div class="form-group"><label>Target Exam/Post</label><input type="text" name="target" required placeholder="e.g., SSC CGL 2026"></div>
        <div class="form-group"><label>Qualification</label><textarea name="qualification" rows="3" placeholder="Your educational qualifications"></textarea></div>
        <div class="form-group"><label>Experience</label><textarea name="experience" rows="3" placeholder="Work experience, internships, projects"></textarea></div>
        <div class="form-group"><label>Skills</label><textarea name="skills" rows="2" placeholder="Technical skills, languages, certifications"></textarea></div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Generate Resume with AI</button>
          <button type="button" class="btn-ghost" onclick="downloadResume()">Download PDF</button>
        </div>
        <div id="resume-output" class="resume-output" style="display:none;"></div>
      </form>
    `;
  },

  getCoverLetterHTML() {
    return `
      <form id="cover-letter-form" class="tool-form">
        <div class="form-group"><label>Your Name</label><input type="text" name="name" required></div>
        <div class="form-group"><label>Target Post/Organization</label><input type="text" name="target" required placeholder="e.g., SSC CGL 2026"></div>
        <div class="form-group"><label>Key Skills/Experience</label><textarea name="skills" rows="3" required placeholder="Highlight relevant experience..."></textarea></div>
        <div class="form-group"><label>Why this role?</label><textarea name="motivation" rows="3" placeholder="Why are you a good fit?"></textarea></div>
        <button type="submit" class="btn-primary">Generate Cover Letter</button>
        <div id="cover-output" class="tool-output" style="display:none;"></div>
      </form>
    `;
  },

  getInterviewHTML() {
    return `
      <form id="interview-form" class="tool-form">
        <div class="form-group"><label>Target Exam/Post</label><input type="text" name="exam" required placeholder="e.g., SSC CGL 2026, IBPS PO"></div>
        <div class="form-group"><label>Your Profile</label><textarea name="profile" rows="3" placeholder="Qualification, experience, strengths"></textarea></div>
        <div class="form-group"><label>Focus Area</label><select name="focus"><option value="general">General</option><option value="technical">Technical</option><option value="hr">HR/Behavioral</option><option value="current-affairs">Current Affairs</option></select></div>
        <button type="submit" class="btn-primary">Generate Questions</button>
        <div id="interview-output" class="tool-output" style="display:none;"></div>
      </form>
    `;
  },

  getStudyPlanHTML() {
    return `
      <form id="study-plan-form" class="tool-form">
        <div class="form-group"><label>Target Exam</label><input type="text" name="exam" required placeholder="e.g., UPSC CSE 2026"></div>
        <div class="form-group"><label>Exam Date</label><input type="date" name="examDate" required></div>
        <div class="form-group"><label>Hours Available Daily</label><input type="number" name="hours" min="1" max="16" value="6" required></div>
        <div class="form-group"><label>Strong Subjects</label><input type="text" name="strong" placeholder="e.g., Polity, History"></div>
        <div class="form-group"><label>Weak Subjects</label><input type="text" name="weak" placeholder="e.g., Economy, Science"></div>
        <button type="submit" class="btn-primary">Generate Study Plan</button>
        <div id="plan-output" class="tool-output" style="display:none;"></div>
      </form>
    `;
  },

  getJobMatcherHTML() {
    return `
      <form id="job-matcher-form" class="tool-form">
        <div class="form-group"><label>Qualification</label><input type="text" name="qualification" required placeholder="e.g., B.Tech CSE, B.A. History"></div>
        <div class="form-group"><label>Preferred Location</label><input type="text" name="location" placeholder="e.g., Delhi, Maharashtra, All India"></div>
        <div class="form-group"><label>Preferred Category</label><select name="category" required><option value="">Any</option><option value="latest-jobs">Latest Jobs</option><option value="railway">Railway</option><option value="banking">Banking</option><option value="defence">Defence</option><option value="teaching">Teaching</option><option value="ssc">SSC</option><option value="upsc">UPSC</option></select></div>
        <div class="form-group"><label>Experience</label><select name="experience"><option value="fresher">Fresher</option><option value="1-2">1-2 years</option><option value="3-5">3-5 years</option><option value="5+">5+ years</option></select></div>
        <button type="submit" class="btn-primary">Find Matching Jobs</button>
        <div id="matcher-output" class="tool-output" style="display:none;"></div>
      </form>
    `;
  },

  getCutoffHTML() {
    return `
      <form id="cutoff-form" class="tool-form">
        <div class="form-group"><label>Exam</label><input type="text" name="exam" required placeholder="e.g., SSC CGL 2026, UPSC CSE"></div>
        <div class="form-group"><label>Category</label><select name="category" required><option value="">All</option><option value="general">General</option><option value="obc">OBC</option><option value="sc">SC</option><option value="st">ST</option><option value="ews">EWS</option></select></div>
        <div class="form-group"><label>Previous Year Score (if known)</label><input type="number" name="prevScore" placeholder="Optional"></div>
        <button type="submit" class="btn-primary">Predict Cutoff</button>
        <div id="cutoff-output" class="tool-output" style="display:none;"></div>
      </form>
    `;
  },

  getCompareHTML() {
    return `
      <form id="compare-form" class="tool-form">
        <div class="form-group"><label>Exam 1</label><input type="text" name="exam1" required placeholder="e.g., SSC CGL"></div>
        <div class="form-group"><label>Exam 2</label><input type="text" name="exam2" required placeholder="e.g., IBPS PO"></div>
        <button type="submit" class="btn-primary">Compare Exams</button>
        <div id="compare-output" class="tool-output" style="display:none;"></div>
      </form>
    `;
  },

  // Tool form handlers
  async handleResumeBuilder(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const output = document.getElementById('resume-output');
    output.style.display = 'block';
    output.innerHTML = '<div class="loading">Generating resume with AI...</div>';

    try {
      const prompt = `Create a professional ATS-friendly resume for government job application:
Name: ${data.get('name')}
Target: ${data.get('target')}
Qualification: ${data.get('qualification')}
Experience: ${data.get('experience')}
Skills: ${data.get('skills')}

Format as clean markdown with sections: Header, Objective, Education, Experience, Skills, Certifications.`;

      const response = await puter.ai.chat(prompt, { model: 'gpt-5.4-nano', max_tokens: 800 });
      const text = response?.text || response?.content || 'Error generating resume.';
      output.innerHTML = `<div class="tool-output-content">${this.escapeHtml(text).replace(/\n/g, '<br>')}</div>
        <button class="btn-primary" onclick="downloadResume()">Download as Text</button>`;
    } catch (err) {
      console.error(err);
      output.innerHTML = '<div class="error">Failed to generate resume. Please try again.</div>';
    }
  },

  async handleCoverLetter(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const output = document.getElementById('cover-output');
    output.style.display = 'block';
    output.innerHTML = '<div class="loading">Generating...</div>';

    try {
      const prompt = `Write a professional cover letter for government job application:
Name: ${data.get('name')}
Target: ${data.get('target')}
Skills: ${data.get('skills')}
Motivation: ${data.get('motivation')}

Format as formal cover letter for Indian government job application.`;

      const response = await puter.ai.chat(prompt, { model: 'gpt-5.4-nano', max_tokens: 600 });
      const text = response?.text || response?.content || 'Error generating cover letter.';
      document.getElementById('cover-output').innerHTML = `<div class="tool-output-content">${this.escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
    } catch (err) {
      console.error(err);
      output.innerHTML = '<div class="error">Failed to generate.</div>';
    }
  },

  async handleInterviewPrep(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const output = document.getElementById('interview-output');
    output.style.display = 'block';
    output.innerHTML = '<div class="loading">Generating questions...</div>';

    try {
      const prompt = `Generate 10 interview questions for ${data.get('exam')} exam.
Profile: ${data.get('profile')}
Focus: ${data.get('focus')}

Provide: 1) Technical questions 2) Behavioral questions 3) Current affairs questions 4) Tips for each.`;

      const response = await puter.ai.chat(prompt, { model: 'gpt-5.4-nano', max_tokens: 1000 });
      const text = response?.text || response?.content || 'Error generating questions.';
      document.getElementById('interview-output').innerHTML = `<div class="tool-output-content">${this.escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
    } catch (err) {
      console.error(err);
      output.innerHTML = '<div class="error">Failed to generate questions.</div>';
    }
  },

  async handleStudyPlan(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const output = document.getElementById('plan-output');
    output.style.display = 'block';
    output.innerHTML = '<div class="loading">Generating study plan...</div>';

    try {
      const prompt = `Create a detailed study plan for ${data.get('exam')} exam.
Exam date: ${data.get('examDate')}
Daily hours: ${data.get('hours')}
Strong subjects: ${data.get('strong')}
Weak subjects: ${data.get('weak')}

Provide: 1) Weekly schedule 2) Daily hour allocation 3) Subject-wise breakdown 4) Revision strategy 5) Mock test schedule.`;

      const response = await puter.ai.chat(prompt, { model: 'gpt-5.4-nano', max_tokens: 1200 });
      const text = response?.text || response?.content || 'Error generating plan.';
      output.innerHTML = `<div class="tool-output-content">${this.escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
    } catch (err) {
      console.error(err);
      output.innerHTML = '<div class="error">Failed to generate plan.</div>';
    }
  },

  async handleJobMatcher(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const output = document.getElementById('matcher-output');
    output.style.display = 'block';
    output.innerHTML = '<div class="loading">Finding matching jobs...</div>';

    try {
      const prompt = `Find matching government jobs for:
Qualification: ${data.get('qualification')}
Location: ${data.get('location')}
Category: ${data.get('category')}
Experience: ${data.get('experience')}

Return: 5 best matching job types with exam names, eligibility, and typical notification months.`;

      const response = await puter.ai.chat(prompt, { model: 'gpt-5.4-nano', max_tokens: 800 });
      const text = response?.text || response?.content || 'Error finding matches.';
      output.innerHTML = `<div class="tool-output-content">${this.escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
    } catch (err) {
      console.error(err);
      output.innerHTML = '<div class="error">Failed to find matches.</div>';
    }
  },

  async handleCutoffPredictor(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const output = document.getElementById('cutoff-output');
    output.style.display = 'block';
    output.innerHTML = '<div class="loading">Predicting cutoff...</div>';

    try {
      const prompt = `Predict cutoff for ${data.get('exam')} (${data.get('category')} category).
Previous year score: ${data.get('prevScore') || 'Not provided'}

Provide: 1) Expected cutoff range 2) Factors affecting cutoff 3) Preparation target score 4. Trend analysis.`;

      const response = await puter.ai.chat(prompt, { model: 'gpt-5.4-nano', max_tokens: 600 });
      const text = response?.text || response?.content || 'Error predicting cutoff.';
      output.innerHTML = `<div class="tool-output-content">${this.escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
    } catch (err) {
      console.error(err);
      output.innerHTML = '<div class="error">Failed to predict.</div>';
    }
  },

  async handleJobMatcher(e) {
    // alias
    await this.handleJobMatcher(e);
  },

  async handleCutoffPredictor(e) {
    // alias
    await this.handleCutoffPredictor(e);
  },

  // Utility
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Newsletter
  handleNewsletter(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    if (email) {
      alert('Thanks for subscribing! (Demo - integrate with your email service)');
      e.target.reset();
    }
  },

  // Search
  handleAISearch() {
    const input = document.getElementById('ai-search-input');
    const query = input?.value?.trim();
    if (!query) return;
    // Navigate to search page with query
    window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
  },

  showSearchSuggestions(query) {
    const container = document.getElementById('search-suggestions');
    if (!container) return;
    if (query.length < 2) {
      container.style.display = 'none';
      return;
    }
    // Simple static suggestions for demo
    const suggestions = [
      'SSC CGL 2026 eligibility criteria',
      'UPSC 2026 notification date',
      'IBPS PO 2026 exam pattern',
      'RRB NTPC 2026 admit card',
      'SSC CHSL 2026 syllabus',
      'UPSC IAS 2026 preparation strategy'
    ].filter(s => s.toLowerCase().includes(query.toLowerCase()));
    if (suggestions.length) {
      container.innerHTML = suggestions.map(s => `<span class="suggestion" data-query="${s}">${s}</span>`).join('');
      container.style.display = 'flex';
    } else {
      container.style.display = 'none';
    }
  },

  // Rendering
  async loadPosts() {
    try {
      // For demo, use static data. In production, fetch from API or static JSON.
      this.posts = this.getSamplePosts();
      this.categories = this.getCategories();
    } catch (e) {
      console.error('Failed to load posts:', e);
    }
  },

  getSamplePosts() {
    return [
      {
        id: 'aiims-nagpur-2026',
        title: 'AIIMS Nagpur Project Research Scientist III Recruitment 2026 - Apply Online',
        category: 'latest-jobs',
        exam: 'aiims',
        applyEnd: '2026-09-30',
        links: { apply: 'https://www.aiims.edu', official: 'https://www.aiims.edu' },
        vacancies: '3',
        verified: true
      },
      {
        id: 'rrb-je-2026',
        title: 'RRB JE 04/2026 Recruitment 2026 - 4098 Junior Engineer Posts',
        category: 'latest-jobs',
        exam: 'railway',
        applyEnd: '2026-06-22',
        links: { apply: 'https://www.rrbcdg.gov.in', official: 'https://www.indianrailways.gov.in' },
        vacancies: '4098',
        verified: true
      },
      // ... more sample posts
    ];
  },

  getCategories() {
    return [
      { slug: 'latest-jobs', label: 'Latest Jobs', icon: 'work', count: 18 },
      { slug: 'results', label: 'Results', icon: 'fact_check', count: 4 },
      { slug: 'admit-card', label: 'Admit Card', icon: 'badge', count: 1 },
      { slug: 'answer-key', label: 'Answer Key', icon: 'quiz', count: 1 },
      { slug: 'syllabus', label: 'Syllabus', icon: 'menu_book', count: 0 },
      { slug: 'admission', label: 'Admissions', icon: 'school', count: 2 },
      { slug: 'scholarship', label: 'Scholarships', icon: 'school', count: 1 },
      { slug: 'certificate', label: 'Certificates', icon: 'verified_user', count: 1 },
      { slug: 'other', label: 'Other', icon: 'category', count: 1 }
    ];
  },

  renderAll() {
    this.renderCategories();
    this.renderJobs();
    this.renderTools();
    this.renderTicker();
    this.renderPosts();
    this.renderFullCategories();
    this.renderAIFeatures();
    this.renderStats();
  },

  renderCategories() {
    const container = document.getElementById('categories-grid');
    if (!container) return;
    container.innerHTML = this.categories.map(cat => `
      <a href="/${cat.slug}.html" class="category-card">
        <span class="category-icon"><span class="material-symbols-outlined">${cat.icon}</span></span>
        <b>${cat.label}</b>
        <small>${cat.count} posts</small>
      </a>
    `).join('');
  },

  renderFullCategories() {
    const container = document.getElementById('categories-full-grid');
    if (!container) return;
    container.innerHTML = this.categories.map(cat => `
      <a href="/${cat.slug}.html" class="category-card">
        <span class="category-icon"><span class="material-symbols-outlined">${cat.icon}</span></span>
        <b>${cat.label}</b>
        <small>${cat.count} posts</small>
      </a>
    `).join('');
  },

  renderJobs() {
    const container = document.getElementById('jobs-grid');
    if (!container) return;
    container.innerHTML = this.posts.slice(0, 6).map(post => this.renderJobCard(post)).join('');
  },

  renderPosts() {
    const container = document.getElementById('posts-grid');
    if (!container) return;
    container.innerHTML = this.posts.map(post => this.renderPostCard(post)).join('');
  },

  renderJobCard(post) {
    const cat = this.getCategoryInfo(post.category);
    const exam = this.getExamInfo(post.exam);
    return `
      <article class="job-card">
        <div class="job-card-top">
          <span class="job-cat ${post.category}"><span class="material-symbols-outlined">${cat.icon}</span></span>
          <div class="job-card-head">
            <a href="/posts/${post.id}.html" class="job-title">${this.escapeHtml(post.title)}</a>
            <div class="job-sub">${exam.label} · ${cat.label}</div>
            <div class="job-chips">
              ${post.verified ? '<span class="pill verified">✓ Verified</span>' : ''}
              <span class="pill exam">${exam.label}</span>
            </div>
          </div>
        </div>
        <div class="job-card-foot">
          <div class="job-date">
            <span class="jd-label">Last date</span>
            <span class="jd-value primary-date">${this.formatDate(post.applyEnd)}</span>
          </div>
          <div class="job-actions">
            <a class="btn-solid" href="${post.links.apply}" target="_blank" rel="noopener nofollow">Apply</a>
          </div>
        </div>
      </article>
    `;
  },

  renderPostCard(post) {
    return this.renderJobCard(post);
  },

  renderTools() {
    const container = document.getElementById('tools-grid');
    if (!container) return;
    const tools = [
      { id: 'chat', icon: 'smart_toy', title: 'AI Assistant', desc: 'Ask anything about govt jobs' },
      { id: 'resume', icon: 'description', title: 'Resume Builder', desc: 'ATS-friendly govt job resumes' },
      { id: 'cover-letter', icon: 'mail', title: 'Cover Letter', desc: 'Tailored cover letters' },
      { id: 'interview', icon: 'record_voice_over', title: 'Interview Prep', desc: 'Mock questions & answers' },
      { id: 'study-plan', icon: 'schedule', title: 'Study Plan', desc: 'Personalized schedules' },
      { id: 'job-matcher', icon: 'psychology', title: 'Job Matcher', desc: 'Find your ideal govt job' },
      { id: 'cutoff', icon: 'insights', title: 'Cutoff Predictor', desc: 'AI-powered predictions' },
      { id: 'compare', icon: 'compare', title: 'Exam Compare', desc: 'Side-by-side comparison' }
    ];
    document.getElementById('tools-grid').innerHTML = tools.map(t => `
      <button class="tool-mini" data-tool="${t.id}">
        <span class="material-symbols-outlined">${t.icon}</span>
        <div><b>${t.title}</b><small>${t.desc}</small></div>
      </button>
    `).join('');
  },

  renderAIFeatures() {
    // Already in HTML
  },

  renderStats() {
    // Already in HTML
  },

  renderFullCategories() {
    const container = document.getElementById('categories-full-grid');
    if (!container) return;
    container.innerHTML = this.categories.map(cat => `
      <a href="/${cat.slug}.html" class="category-card">
        <span class="category-icon"><span class="material-symbols-outlined">${cat.icon}</span></span>
        <b>${cat.label}</b>
        <small>${cat.count} posts</small>
      </a>
    `).join('');
  },

  renderTicker() {
    const container = document.getElementById('ticker-content');
    if (!container) return;
    const items = [
      { text: 'SSC CGL 2026 Notification Expected Soon', url: '/latest-jobs.html' },
      { text: 'UPSC CSE 2026 Calendar Released', url: '/latest-jobs.html' },
      { text: 'RRB NTPC 2026 Admit Card Released', url: '/admit-card.html' },
      { text: 'IBPS PO 2026 Notification Out', url: '/latest-jobs.html' },
      { text: 'SSC CHSL 2026 Apply Online', url: '/latest-jobs.html' }
    ];
    container.innerHTML = items.map(item => `
      <a href="${item.url}">${item.text}</a>
    `).join('');
  },

  // Utility methods
  getCategoryInfo(slug) {
    const cats = {
      'latest-jobs': { label: 'Latest Jobs', icon: 'work' },
      'results': { label: 'Results', icon: 'fact_check' },
      'admit-card': { label: 'Admit Card', icon: 'badge' },
      'answer-key': { label: 'Answer Key', icon: 'quiz' },
      'syllabus': { label: 'Syllabus', icon: 'menu_book' },
      'admission': { label: 'Admissions', icon: 'school' },
      'scholarship': { label: 'Scholarships', icon: 'school' },
      'certificate': { label: 'Certificates', icon: 'verified_user' },
      'other': { label: 'Other', icon: 'category' }
    };
    return cats[slug] || { label: slug, icon: 'category' };
  },

  getExamInfo(slug) {
    const exams = {
      'aiims': { label: 'AIIMS', icon: 'local_hospital' },
      'railway': { label: 'Railway', icon: 'train' },
      'ssc': { label: 'SSC', icon: 'gavel' },
      'upsc': { label: 'UPSC', icon: 'gavel' },
      'banking': { label: 'Banking', icon: 'account_balance' },
      'defence': { label: 'Defence', icon: 'shield' },
      'teaching': { label: 'Teaching', icon: 'school' },
      'ntpc': { label: 'NTPC', icon: 'bolt' },
      'isro': { label: 'ISRO', icon: 'rocket_launch' },
      'teaching': { label: 'Teaching', icon: 'school' }
    };
    return exams[slug] || { label: slug, icon: 'category' };
  },

  formatDate(dateStr) {
    if (!dateStr || dateStr === '—') return '—';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  },

  initTicker() {
    // CSS animation handles scrolling
  },

  initDarkMode() {
    this.loadTheme();
  },

  initProxy() {
    // Check if proxy is running
    fetch('http://localhost:10808', { method: 'HEAD', mode: 'no-cors' })
      .then(() => console.log('Proxy running'))
      .catch(() => console.log('Proxy not running'));
  },

  initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-top';
    btn.innerHTML = '<span class="material-symbols-outlined">keyboard_arrow_up</span>';
    btn.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      btn.classList.toggle('show', window.scrollY > 300);
    });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  },

  initProxy() {
    // Check proxy status periodically
    setInterval(() => {
      fetch('http://localhost:10808', { method: 'HEAD', mode: 'no-cors' })
        .then(() => console.log('Proxy healthy'))
        .catch(() => console.warn('Proxy may be down'));
    }, 60000);
  },

  // Initialize on DOM ready
  async init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
      return;
    }
    await this.init();
  }
};

// Initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}