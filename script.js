class ExpenseTracker {
    constructor() {
        this.screenshots = [];
        this.transactions = [];
        this.init();
    }

    init() {
        // DOM elements
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.screenshotsPreview = document.getElementById('screenshotsPreview');
        this.analysisSection = document.getElementById('analysisSection');
        this.loading = document.getElementById('loading');
        this.actions = document.getElementById('actions');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.debugSection = document.getElementById('debugSection');
        this.extractedText = document.getElementById('extractedText');
        this.manualEntry = document.getElementById('manualEntry');
        this.addManualBtn = document.getElementById('addManualBtn');
        this.cancelManualBtn = document.getElementById('cancelManualBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.openaiKeyInput = document.getElementById('openaiKey');
        this.useOpenAICheckbox = document.getElementById('useOpenAI');

        // Load saved settings
        this.loadSettings();

        // Event listeners
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        this.analyzeBtn.addEventListener('click', () => this.analyzeScreenshots());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.addManualBtn.addEventListener('click', () => this.addManualTransaction());
        this.cancelManualBtn.addEventListener('click', () => this.hideManualEntry());
        this.settingsBtn.addEventListener('click', () => this.toggleSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }

    loadSettings() {
        const savedKey = localStorage.getItem('openaiKey');
        const useOpenAI = localStorage.getItem('useOpenAI') === 'true';
        
        if (savedKey) {
            this.openaiKeyInput.value = savedKey;
        }
        this.useOpenAICheckbox.checked = useOpenAI;
    }

    saveSettings() {
        const apiKey = this.openaiKeyInput.value.trim();
        const useOpenAI = this.useOpenAICheckbox.checked;
        
        if (apiKey) {
            localStorage.setItem('openaiKey', apiKey);
        } else {
            localStorage.removeItem('openaiKey');
        }
        
        localStorage.setItem('useOpenAI', useOpenAI);
        
        alert('Settings saved! OpenAI Vision will be used for better accuracy.');
        this.toggleSettings();
    }

    toggleSettings() {
        if (this.settingsPanel.style.display === 'none') {
            this.settingsPanel.style.display = 'block';
        } else {
            this.settingsPanel.style.display = 'none';
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        this.handleFiles(files);
    }

    handleFiles(files) {
        const supportedFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/') || file.type === 'application/pdf'
        );

        supportedFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const screenshot = {
                    id: Date.now() + Math.random(),
                    file: file,
                    dataUrl: e.target.result,
                    isPDF: file.type === 'application/pdf',
                    fileName: file.name
                };
                this.screenshots.push(screenshot);
                this.renderScreenshots();
                this.updateActions();
            };
            reader.readAsDataURL(file);
        });
    }

    renderScreenshots() {
        this.screenshotsPreview.innerHTML = '';
        
        this.screenshots.forEach(screenshot => {
            const div = document.createElement('div');
            div.className = 'screenshot-item';
            
            if (screenshot.isPDF) {
                div.innerHTML = `
                    <div style="height: 150px; display: flex; align-items: center; justify-content: center; background: #f3f4f6;">
                        <div style="text-align: center;">
                            <div style="font-size: 3rem;">📄</div>
                            <div style="font-size: 0.8rem; margin-top: 8px; color: #6b7280;">${screenshot.fileName}</div>
                        </div>
                    </div>
                    <button class="remove-btn" onclick="tracker.removeScreenshot('${screenshot.id}')">×</button>
                `;
            } else {
                div.innerHTML = `
                    <img src="${screenshot.dataUrl}" alt="Screenshot">
                    <button class="remove-btn" onclick="tracker.removeScreenshot('${screenshot.id}')">×</button>
                `;
            }
            
            this.screenshotsPreview.appendChild(div);
        });
    }

    removeScreenshot(id) {
        this.screenshots = this.screenshots.filter(s => s.id !== parseFloat(id));
        this.renderScreenshots();
        this.updateActions();
    }

    updateActions() {
        if (this.screenshots.length > 0) {
            this.actions.style.display = 'flex';
        } else {
            this.actions.style.display = 'none';
            this.analysisSection.style.display = 'none';
        }
    }

    async analyzeScreenshots() {
        if (this.screenshots.length === 0) return;

        this.loading.style.display = 'block';
        this.actions.style.display = 'none';
        this.analysisSection.style.display = 'none';
        this.debugSection.style.display = 'none';
        this.transactions = [];

        let allExtractedText = '';

        try {
            const useOpenAI = localStorage.getItem('useOpenAI') === 'true';
            const openaiKey = localStorage.getItem('openaiKey');

            for (let i = 0; i < this.screenshots.length; i++) {
                const screenshot = this.screenshots[i];
                let text;
                
                if (screenshot.isPDF) {
                    text = await this.extractTextFromPDF(screenshot.dataUrl);
                } else if (useOpenAI && openaiKey) {
                    // Use OpenAI Vision API
                    text = await this.extractTextWithOpenAI(screenshot.dataUrl, openaiKey);
                } else {
                    // Fallback to Tesseract OCR
                    text = await this.extractTextFromImage(screenshot.dataUrl);
                }
                
                allExtractedText += `=== ${screenshot.isPDF ? 'PDF' : 'Screenshot'} ${i + 1} ===\n${text}\n\n`;
                const foundTransactions = this.parseTransactions(text, i + 1);
                this.transactions.push(...foundTransactions);
            }

            // Show extracted text for debugging
            this.extractedText.textContent = allExtractedText;
            this.debugSection.style.display = 'block';

            this.displayResults();
        } catch (error) {
            console.error('Analysis error:', error);
            alert('An error occurred while analyzing screenshots. Please try again.');
        } finally {
            this.loading.style.display = 'none';
            this.actions.style.display = 'flex';
        }
    }

    async extractTextFromImage(imageData) {
        const { data: { text } } = await Tesseract.recognize(
            imageData,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log(`Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );
        return text;
    }

    async extractTextWithOpenAI(imageData, apiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Extract ALL transaction information from this image. For each transaction, provide: date (format: DD MMM YYYY), merchant/person name, amount (with currency symbol), and whether it\'s "Received from" (income) or "Paid to" (expense). List each transaction on a new line in this format: "[Date] [Received from/Paid to] [Name] [Amount]"'
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: imageData
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI extraction error:', error);
            alert('OpenAI API error. Falling back to standard OCR. Please check your API key.');
            // Fallback to Tesseract
            return await this.extractTextFromImage(imageData);
        }
    }

    async extractTextFromPDF(pdfDataUrl) {
        try {
            // Convert data URL to array buffer
            const base64 = pdfDataUrl.split(',')[1];
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Load PDF
            const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
            let fullText = '';

            // Extract text from all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }

            return fullText;
        } catch (error) {
            console.error('PDF extraction error:', error);
            return '';
        }
    }

    parseTransactions(text, screenshotNumber) {
        const transactions = [];
        const lines = text.split('\n');
        
        // Enhanced keywords that indicate spending
        const spendingKeywords = ['paid to', 'payment', 'purchase', 'bought', 'charge', 'debit', 
                                  'you sent', 'you paid', 'withdrawal', 'spent', 
                                  'expense', 'invoice', 'bill', 'checkout', 'order total', 'debited'];
        
        // Enhanced keywords that indicate receiving money - PRIORITIZE THESE
        const receivingKeywords = ['received from', 'you received', 'received', 'deposit', 'deposited', 
                                   'refund', 'credit', 'credited to', 'income', 'salary', 
                                   'payment received', 'transfer from', 'cashback', 'you got', 'incoming'];

        const fullText = text.toLowerCase();
        let processedAmounts = new Set();

        // First, identify transaction blocks by looking for direction keywords
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineLower = line.toLowerCase();
            
            // Extract date from context if present
            let transactionDate = null;
            const datePattern = /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/i;
            const contextForDate = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ');
            const dateMatch = contextForDate.match(datePattern);
            
            if (dateMatch) {
                const months = {jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
                               jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11};
                const day = parseInt(dateMatch[1]);
                const month = months[dateMatch[2].toLowerCase()];
                const year = parseInt(dateMatch[3]);
                transactionDate = new Date(year, month, day);
            }
            
            // Check if this line contains a transaction keyword
            let isReceiving = receivingKeywords.some(keyword => lineLower.includes(keyword));
            let isSpending = spendingKeywords.some(keyword => lineLower.includes(keyword));
            
            if (isReceiving || isSpending) {
                // Look for amount in nearby lines (within next 3 lines)
                const contextLines = lines.slice(i, Math.min(lines.length, i + 4)).join('\n');
                
                // Find amounts in this context
                const amountPattern = /(?:¥|₹|Rs\.?)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
                const matches = [...contextLines.matchAll(amountPattern)];
                
                for (const match of matches) {
                    const amountStr = match[1].replace(/,/g, '');
                    const amount = parseFloat(amountStr);
                    
                    // Skip if this looks like a year (2020-2030 range)
                    if (amount >= 2020 && amount <= 2030) {
                        continue;
                    }
                    
                    // Skip if we've already processed this exact amount at this position
                    const amountKey = `${amount}-${i}`;
                    if (processedAmounts.has(amountKey)) {
                        continue;
                    }
                    
                    if (amount > 0 && amount < 10000000) {
                        processedAmounts.add(amountKey);
                        
                        let type = isReceiving ? 'received' : 'spent';
                        let description = `Transaction from Screenshot ${screenshotNumber}`;
                        
                        // Try to extract merchant/person name
                        const prevLine = i > 0 ? lines[i - 1] : '';
                        const currentLine = lines[i];
                        const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
                        
                        const namePattern = /([A-Z][A-Za-z\s]+(?:[A-Z][A-Za-z\s]*)*)/;
                        const searchText = (prevLine + ' ' + currentLine + ' ' + nextLine).replace(/Received from|Paid to|Credited|Debited/gi, '');
                        const nameMatch = searchText.match(namePattern);
                        
                        let merchantName = '';
                        if (nameMatch && nameMatch[1].trim().length > 0) {
                            merchantName = nameMatch[1].trim();
                            description = type === 'spent' 
                                ? `Payment to ${merchantName}`
                                : `Received from ${merchantName}`;
                        }

                        transactions.push({
                            amount: amount,
                            type: type,
                            description: description,
                            merchant: merchantName,
                            date: transactionDate,
                            screenshot: screenshotNumber,
                            confidence: 'high'
                        });
                    }
                }
            }
        }

        return transactions;
    }

    getQuarter(date) {
        if (!date) return 'Unknown';
        const month = date.getMonth();
        const year = date.getFullYear();
        const quarter = Math.floor(month / 3) + 1;
        return `Q${quarter} ${year}`;
    }

    displayResults() {
        const totalSpent = this.transactions
            .filter(t => t.type === 'spent')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalReceived = this.transactions
            .filter(t => t.type === 'received')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const netBalance = totalReceived - totalSpent;

        // Update summary cards
        document.getElementById('totalSpent').textContent = `$${totalSpent.toFixed(2)}`;
        document.getElementById('totalReceived').textContent = `$${totalReceived.toFixed(2)}`;
        document.getElementById('netBalance').textContent = `$${netBalance.toFixed(2)}`;
        
        // Update balance card color
        const balanceCard = document.querySelector('.balance-card');
        if (netBalance < 0) {
            balanceCard.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
        } else {
            balanceCard.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
        }

        // Quarterly Breakdown
        this.displayQuarterlyBreakdown();
        
        // Financial Insights
        this.displayInsights();

        // Render transactions list
        const transactionsList = document.getElementById('transactionsList');
        transactionsList.innerHTML = '<h3 style="margin-bottom: 20px; color: #1f2937;">All Transactions</h3>';
        
        if (this.transactions.length === 0) {
            transactionsList.innerHTML += '<p style="color: #6b7280; text-align: center; padding: 20px;">No transactions detected.</p>';
        } else {
            this.transactions.forEach((transaction) => {
                const dateStr = transaction.date ? transaction.date.toLocaleDateString() : 'Date unknown';
                const div = document.createElement('div');
                div.className = `transaction-item ${transaction.type}`;
                div.innerHTML = `
                    <div class="transaction-info">
                        <h4>${transaction.description}</h4>
                        <p>${dateStr} • Screenshot #${transaction.screenshot}</p>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'spent' ? '-' : '+'}$${transaction.amount.toFixed(2)}
                    </div>
                `;
                transactionsList.appendChild(div);
            });
        }

        this.analysisSection.style.display = 'block';
        
        // Add manual entry button
        if (!document.getElementById('showManualBtn')) {
            const addManualButton = document.createElement('button');
            addManualButton.id = 'showManualBtn';
            addManualButton.className = 'btn btn-primary';
            addManualButton.textContent = '➕ Add Manual Transaction';
            addManualButton.style.marginTop = '20px';
            addManualButton.onclick = () => this.showManualEntry();
            this.analysisSection.appendChild(addManualButton);
        }
    }

    displayQuarterlyBreakdown() {
        const quarterlySection = document.getElementById('quarterlySection');
        quarterlySection.innerHTML = '<h3 style="margin-bottom: 20px; color: #1f2937;">📊 Quarterly Breakdown</h3>';

        // Group transactions by quarter
        const quarterlyData = {};
        this.transactions.forEach(t => {
            const quarter = this.getQuarter(t.date);
            if (!quarterlyData[quarter]) {
                quarterlyData[quarter] = { spent: 0, received: 0, transactions: [] };
            }
            if (t.type === 'spent') {
                quarterlyData[quarter].spent += t.amount;
            } else {
                quarterlyData[quarter].received += t.amount;
            }
            quarterlyData[quarter].transactions.push(t);
        });

        // Sort quarters
        const sortedQuarters = Object.keys(quarterlyData).sort((a, b) => {
            if (a === 'Unknown') return 1;
            if (b === 'Unknown') return -1;
            return b.localeCompare(a);
        });

        if (sortedQuarters.length === 0) {
            quarterlySection.innerHTML += '<p style="color: #6b7280; text-align: center; padding: 20px;">No dated transactions to show quarterly breakdown.</p>';
            return;
        }

        sortedQuarters.forEach(quarter => {
            const data = quarterlyData[quarter];
            const balance = data.received - data.spent;
            
            const quarterCard = document.createElement('div');
            quarterCard.style.cssText = 'background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea;';
            quarterCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="color: #1f2937; font-size: 1.2rem;">${quarter}</h4>
                    <span style="font-size: 1.3rem; font-weight: bold; color: ${balance >= 0 ? '#10b981' : '#ef4444'};">
                        ${balance >= 0 ? '+' : ''}$${balance.toFixed(2)}
                    </span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 0.9rem;">
                    <div>
                        <span style="color: #6b7280;">Income:</span>
                        <strong style="color: #10b981; margin-left: 8px;">$${data.received.toFixed(2)}</strong>
                    </div>
                    <div>
                        <span style="color: #6b7280;">Expenses:</span>
                        <strong style="color: #ef4444; margin-left: 8px;">$${data.spent.toFixed(2)}</strong>
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <span style="color: #6b7280;">Transactions:</span>
                        <strong style="margin-left: 8px;">${data.transactions.length}</strong>
                    </div>
                </div>
            `;
            quarterlySection.appendChild(quarterCard);
        });
    }

    displayInsights() {
        const insightsSection = document.getElementById('insightsSection');
        insightsSection.innerHTML = '<h3 style="margin-bottom: 20px; color: #1f2937;">💡 Financial Insights</h3>';

        const insightsContainer = document.createElement('div');
        insightsContainer.style.cssText = 'background: #f9fafb; padding: 25px; border-radius: 8px;';

        // Top spending categories
        const spentByMerchant = {};
        const receivedByMerchant = {};
        
        this.transactions.forEach(t => {
            const merchant = t.merchant || 'Other';
            if (t.type === 'spent') {
                spentByMerchant[merchant] = (spentByMerchant[merchant] || 0) + t.amount;
            } else {
                receivedByMerchant[merchant] = (receivedByMerchant[merchant] || 0) + t.amount;
            }
        });

        let insights = [];

        // Top income source
        const topIncome = Object.entries(receivedByMerchant).sort((a, b) => b[1] - a[1])[0];
        if (topIncome) {
            insights.push(`<div style="margin-bottom: 15px;">
                <strong style="color: #10b981;">💰 Top Income Source:</strong> ${topIncome[0]} ($${topIncome[1].toFixed(2)})
            </div>`);
        }

        // Top expense
        const topExpense = Object.entries(spentByMerchant).sort((a, b) => b[1] - a[1])[0];
        if (topExpense) {
            insights.push(`<div style="margin-bottom: 15px;">
                <strong style="color: #ef4444;">💸 Top Expense:</strong> ${topExpense[0]} ($${topExpense[1].toFixed(2)})
            </div>`);
        }

        // Average transaction
        if (this.transactions.length > 0) {
            const avgTransaction = this.transactions.reduce((sum, t) => sum + t.amount, 0) / this.transactions.length;
            insights.push(`<div style="margin-bottom: 15px;">
                <strong style="color: #667eea;">📊 Average Transaction:</strong> $${avgTransaction.toFixed(2)}
            </div>`);
        }

        // Spending vs Income ratio
        const totalSpent = this.transactions.filter(t => t.type === 'spent').reduce((sum, t) => sum + t.amount, 0);
        const totalReceived = this.transactions.filter(t => t.type === 'received').reduce((sum, t) => sum + t.amount, 0);
        
        if (totalReceived > 0) {
            const savingsRate = ((totalReceived - totalSpent) / totalReceived * 100).toFixed(1);
            insights.push(`<div style="margin-bottom: 15px;">
                <strong style="color: #667eea;">💎 Savings Rate:</strong> ${savingsRate}%
                <span style="color: #6b7280; font-size: 0.9rem; margin-left: 8px;">
                    ${savingsRate > 0 ? '(You\'re saving money! 🎉)' : '(Spending more than earning ⚠️)'}
                </span>
            </div>`);
        }

        // Transaction count breakdown
        const spentCount = this.transactions.filter(t => t.type === 'spent').length;
        const receivedCount = this.transactions.filter(t => t.type === 'received').length;
        insights.push(`<div style="margin-bottom: 15px;">
            <strong style="color: #667eea;">📈 Transaction Count:</strong> 
            ${receivedCount} income • ${spentCount} expenses
        </div>`);

        insightsContainer.innerHTML = insights.join('');
        insightsSection.appendChild(insightsContainer);
    }

    showManualEntry() {
        this.manualEntry.style.display = 'block';
        document.getElementById('manualAmount').focus();
    }

    hideManualEntry() {
        this.manualEntry.style.display = 'none';
        document.getElementById('manualAmount').value = '';
        document.getElementById('manualDescription').value = '';
    }

    addManualTransaction() {
        const amount = parseFloat(document.getElementById('manualAmount').value);
        const type = document.getElementById('manualType').value;
        const description = document.getElementById('manualDescription').value || 
                          `Manual ${type === 'received' ? 'Income' : 'Expense'}`;

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        this.transactions.push({
            amount: amount,
            type: type,
            description: description,
            merchant: description.split(' ').slice(-1)[0],
            date: new Date(),
            screenshot: 'Manual',
            confidence: 'manual'
        });

        this.hideManualEntry();
        this.displayResults();
    }

    showManualEntry() {
        this.manualEntry.style.display = 'block';
        document.getElementById('manualAmount').focus();
    }

    hideManualEntry() {
        this.manualEntry.style.display = 'none';
        document.getElementById('manualAmount').value = '';
        document.getElementById('manualDescription').value = '';
    }

    addManualTransaction() {
        const amount = parseFloat(document.getElementById('manualAmount').value);
        const type = document.getElementById('manualType').value;
        const description = document.getElementById('manualDescription').value || 
                          `Manual ${type === 'received' ? 'Income' : 'Expense'}`;

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        this.transactions.push({
            amount: amount,
            type: type,
            description: description,
            screenshot: 'Manual',
            confidence: 'manual'
        });

        this.hideManualEntry();
        this.displayResults();
    }

    clearAll() {
        this.screenshots = [];
        this.transactions = [];
        this.screenshotsPreview.innerHTML = '';
        this.analysisSection.style.display = 'none';
        this.debugSection.style.display = 'none';
        this.manualEntry.style.display = 'none';
        this.actions.style.display = 'none';
        this.fileInput.value = '';
    }
}

// Initialize the tracker
const tracker = new ExpenseTracker();
